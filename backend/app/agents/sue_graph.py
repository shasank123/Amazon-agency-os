from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# 1. Define the "Brain's" Short-Term Memory
class AgentState(TypedDict):
    review_text: str
    draft: str
    final_response: str
    status: str

# 2. Node 1: The Writer (Sue)
def draft_reply(state: AgentState):
    print("--- SUE: Drafting Reply ---")
    # In reality, you'd call LLM here. We use mock logic for speed.
    bad_review = state["review_text"]
    generated_draft = f"I am sorry about: '{bad_review}'. We will fix it immediately."
    
    return {"draft": generated_draft, "status": "WAITING_APPROVAL"}

# 3. Node 2: The Publisher (The Action)
def publish_reply(state: AgentState):
    print("--- SUE: Publishing to Amazon ---")
    # This node only runs AFTER human approval
    # We take the 'final_response' (which might be edited by human)
    final_text = state.get("final_response") or state["draft"]
    
    print(f"POSTING TO AMAZON: {final_text}")
    return {"status": "PUBLISHED"}

# 4. Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("draft_node", draft_reply)
workflow.add_node("publish_node", publish_reply)

# Flow: Start -> Draft -> Publish -> End
workflow.set_entry_point("draft_node")
workflow.add_edge("draft_node", "publish_node")
workflow.add_edge("publish_node", END)

# --- THE MAGIC: Checkpointer & Interrupt ---
# We tell LangGraph: "Stop BEFORE running 'publish_node'"
checkpointer = MemorySaver()
sue_graph = workflow.compile(
    checkpointer=checkpointer, 
    interrupt_before=["publish_node"]
)

