from typing import TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv
from openai import OpenAI
import psycopg2
import os

# Load API Key
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# 1. Define Sue's State (Memory)
class SueState(TypedDict):
    ticket_text: str
    order_status: str
    policy_retrieved: str
    draft_reply: str
    final_reply: str
    status: str


# Helper: RAG Policy Retrieval
def get_relevant_policy(query_text: str) -> str:
    """Search the vector database for relevant policy."""
    try:
        # Embed the user's query
        response = client.embeddings.create(
            input=query_text,
            model="text-embedding-3-small"
        )
        query_embedding = response.data[0].embedding

        # Search DB for nearest neighbor
        conn = psycopg2.connect(
            host="db", database="agency_os", user="admin", password="admin"
        )
        cur = conn.cursor()
        
        cur.execute("""
            SELECT text FROM policies 
            ORDER BY embedding <=> %s::vector 
            LIMIT 1;
        """, (query_embedding,))
        
        result = cur.fetchone()
        conn.close()
        
        if result:
            return result[0]
        return "No specific policy found. Use general customer service guidelines."
        
    except Exception as e:
        print(f"RAG Error: {e}")
        return "System error retrieving policy. Apply standard refund policy."


# 2. Node 1: Draft Reply (RAG + LLM)
def draft_node(state: SueState):
    """Retrieve policy and generate a draft reply."""
    print(f"--- SUE: Processing ticket... ---")
    
    # 1. Retrieve relevant policy (RAG)
    policy = get_relevant_policy(state["ticket_text"])
    print(f"--- SUE: Found Policy -> '{policy[:50]}...' ---")
    
    # 2. Generate reply with LLM
    prompt = f"""
    You are Sue, a Customer Support Agent for an Amazon seller.
    
    Customer Issue: "{state['ticket_text']}"
    Order Status: "{state['order_status']}"
    
    OFFICIAL POLICY: "{policy}"
    
    Instructions:
    - Answer the customer strictly based on the policy above.
    - If the policy allows a refund/replacement, approve it.
    - If the policy denies it (e.g., past 30 days), politely refuse.
    - Be empathetic and professional.
    - Keep response under 100 words.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        draft = response.choices[0].message.content
    except Exception as e:
        draft = f"Error generating reply: {str(e)}"
    
    return {
        "policy_retrieved": policy,
        "draft_reply": draft,
        "status": "WAITING_APPROVAL"
    }


# 3. Node 2: Publish Reply (simulated)
def publish_node(state: SueState):
    """Post the reply to Amazon (simulated)."""
    print("--- SUE: Publishing to Amazon ---")
    
    # Take the final_reply (edited by human) or use draft
    final_text = state.get("final_reply") or state["draft_reply"]
    
    # In production, this would integrate with Amazon API
    print(f"POSTED TO AMAZON: {final_text[:100]}...")
    
    return {"status": "PUBLISHED"}


# 4. Build the Graph
workflow = StateGraph(SueState)

workflow.add_node("draft_node", draft_node)
workflow.add_node("publish_node", publish_node)

# Flow: Start -> Draft -> [PAUSE] -> Publish -> End
workflow.set_entry_point("draft_node")
workflow.add_edge("draft_node", "publish_node")
workflow.add_edge("publish_node", END)

# --- THE MAGIC: Checkpointer & Interrupt ---
# Stop BEFORE publish_node so human can review the reply
checkpointer = MemorySaver()
sue_graph = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["publish_node"]
)
