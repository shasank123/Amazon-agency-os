from typing import TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv
from openai import OpenAI
from duckduckgo_search import DDGS
import os

# Load API Key
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# 1. Define Jeff's State (Memory)
class JeffState(TypedDict):
    niche: str
    min_revenue: int
    prospect_name: str
    prospect_url: str
    prospect_snippet: str
    email_draft: str
    final_email: str
    status: str


# 2. Node 1: Search for Prospects
def search_node(state: JeffState):
    """Search DuckDuckGo for real companies in the niche."""
    print(f"--- JEFF: Searching for '{state['niche']}' brands... ---")
    
    try:
        with DDGS() as ddgs:
            query = f"best {state['niche']} brand company"
            results = list(ddgs.text(query, max_results=5))
        
        if results:
            # Find first result with a real company name
            for hit in results:
                title = hit.get('title', '')
                # Skip generic articles
                if any(skip in title.lower() for skip in ['best', 'top 10', 'review', 'vs']):
                    continue
                return {
                    "prospect_name": title.split(' - ')[0].split(' | ')[0][:50],
                    "prospect_url": hit['href'],
                    "prospect_snippet": hit['body'][:200],
                    "status": "PROSPECT_FOUND"
                }
            # Use first result if no better match
            top_hit = results[0]
            return {
                "prospect_name": top_hit['title'].split(' - ')[0][:50],
                "prospect_url": top_hit['href'],
                "prospect_snippet": top_hit['body'][:200],
                "status": "PROSPECT_FOUND"
            }
    except Exception as e:
        print(f"Search error: {e}")
    
    return {
        "prospect_name": "Generic Brand",
        "prospect_url": "N/A",
        "prospect_snippet": "No data found",
        "status": "PROSPECT_FOUND"
    }


# 3. Node 2: Draft Cold Email with LLM
def draft_node(state: JeffState):
    """Generate a cold email using OpenAI."""
    print(f"--- JEFF: Drafting email to {state['prospect_name']}... ---")
    
    prompt = f"""
    You are a sales expert. Write a cold email to the brand "{state['prospect_name']}".
    They sell products in the "{state['niche']}" space.
    I found this about them: "{state['prospect_snippet']}".
    
    Pitch our Amazon Agency. Keep it under 100 words. 
    Mention we noticed their listing at {state['prospect_url']}.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        email_content = response.choices[0].message.content
    except Exception as e:
        email_content = f"Error generating email: {str(e)}"
    
    return {
        "email_draft": email_content,
        "status": "WAITING_APPROVAL"
    }


# 4. Node 3: Send Email (simulated)
def send_node(state: JeffState):
    """Mark email as sent (simulated action)."""
    print(f"--- JEFF: Sending email to {state['prospect_name']}... ---")
    
    # Take the final_email (edited by human) or use draft
    final_text = state.get("final_email") or state["email_draft"]
    
    # In production, this would integrate with email API
    print(f"EMAIL SENT: {final_text[:100]}...")
    
    return {"status": "SENT"}


# 5. Build the Graph
workflow = StateGraph(JeffState)

workflow.add_node("search_node", search_node)
workflow.add_node("draft_node", draft_node)
workflow.add_node("send_node", send_node)

# Flow: Start -> Search -> Draft -> [PAUSE] -> Send -> End
workflow.set_entry_point("search_node")
workflow.add_edge("search_node", "draft_node")
workflow.add_edge("draft_node", "send_node")
workflow.add_edge("send_node", END)

# --- THE MAGIC: Checkpointer & Interrupt ---
# Stop BEFORE send_node so human can review the email
checkpointer = MemorySaver()
jeff_graph = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["send_node"]
)
