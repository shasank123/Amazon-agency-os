from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time
import random
from app.agents.sue_graph import sue_graph
from app.agents.jeff_graph import jeff_graph

# Import the tasks
from app.worker import jeff_task, penny_task, sue_task, adam_task, ivan_task, lisa_task
from celery.result import AsyncResult

# Import Mock Data
from app.core.mock_db import MOCK_SELLERS, MOCK_INVENTORY, MOCK_ADS, MOCK_VECTOR_DB

app = FastAPI(title="Amazon Agency OS - Production Sim")

# --- 1. JEFF (Sales Agent) ---
class CampaignRequest(BaseModel):
    niche: str
    min_revenue: int

@app.post("/agents/jeff/start-campaign")
def jeff_start_campaign(req: CampaignRequest):
    """
    True Event-Driven: We dispatch the task and return ID immediately.
    """
    # 1. Dispatch to Redis
    task = jeff_task.delay(req.niche, req.min_revenue)
    
    # 2. Return the Ticket ID instantly
    return {
        "agent": "Jeff",
        "status": "queued",
        "task_id": task.id,
        "message": "Jeff has started scraping. Check status with /tasks/{task_id}"
    }

@app.get("/tasks/{task_id}")
def get_status(task_id: str):
    """
    Polling Endpoint: Frontend calls this every 3 seconds to check progress.
    """
    task_result = AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result
    }
    
# --- 2. PENNY (Pricing Agent) ---
@app.get("/agents/penny/repricing-log")
def penny_optimize_prices():
    """
    Simulates Penny checking all SKUs against competitors.
    """
    logs = []
    for sku, data in MOCK_INVENTORY.items():
        current = data["price"]
        comp = data["competitor_price"]
        floor = data["min_price"]
        
        # Logic: Beat competitor by 5 cents, but respect floor
        if comp < current:
            new_target = comp - 0.05
            if new_target >= floor:
                logs.append({
                    "sku": sku,
                    "action": "DECREASE_PRICE",
                    "old_price": current,
                    "new_price": round(new_target, 2),
                    "reason": "Competitor dropped price."
                })
            else:
                logs.append({
                    "sku": sku,
                    "action": "HOLD",
                    "reason": "Competitor below Min Price (Profit Protection)."
                })
    
    return {"agent": "Penny", "optimization_events": logs}

# --- 2b. PENNY ASYNC (Pricing Analysis with LLM) ---
class PricingRequest(BaseModel):
    product: str
    price: float
    cost: float
    competitor_price: float

@app.post("/agents/penny/analyze")
def penny_analyze_pricing(req: PricingRequest):
    """
    Async pricing analysis with margin calculation and LLM strategy.
    """
    task = penny_task.delay(req.product, req.price, req.cost, req.competitor_price)
    return {
        "agent": "Penny",
        "status": "queued",
        "task_id": task.id,
        "message": "Penny is analyzing pricing. Check status with /tasks/{task_id}"
    }


# --- REQUEST MODEL (Add this with your other models) ---
class AdRequest(BaseModel):
    campaign_name: str

# --- 3. ADAM (Real Ads Agent) ---
@app.post("/agents/adam/optimize")
async def start_adam(request: AdRequest):
    # Triggers the worker task that checks SQL DB & uses LLM
    task = adam_task.delay(request.campaign_name)
    return {"agent": "Adam", "task_id": task.id, "status": "optimizing"}

# --- 4. SUE (Reputation Agent - RAG) ---
class ReviewRequest(BaseModel):
    review_text: str
    stars: int

@app.post("/agents/sue/draft-reply")
def sue_draft_reply(req: ReviewRequest):
    """
    Simulates RAG: Search Vector DB -> Retrieve Policy -> Draft.
    """
    # 1. Simple Keyword Search to simulate "Vector Retrieval"
    retrieved_policy = "Generic Customer Service Policy"
    
    if "damage" in req.review_text.lower() or "broken" in req.review_text.lower():
        retrieved_policy = MOCK_VECTOR_DB["shipping_damage"]
    elif "color" in req.review_text.lower():
        retrieved_policy = MOCK_VECTOR_DB["wrong_color"]
        
    # 2. Generate Draft (Simulating LLM)
    draft = f"Draft based on [{retrieved_policy}]: Hello! I am sorry to hear about this issue. per our policy, we have processed a solution for you."
    
    return {
        "agent": "Sue",
        "intent_detected": "Product Issue",
        "policy_used": retrieved_policy,
        "draft_reply": draft,
        "human_approval_required": True
    }

# --- 4b. SUE ASYNC (RAG-Powered Support) ---
class TicketRequest(BaseModel):
    ticket_text: str
    order_status: str

@app.post("/agents/sue/handle-ticket")
def sue_handle_ticket(req: TicketRequest):
    """
    Async RAG-powered ticket handling with policy retrieval.
    """
    task = sue_task.delay(req.ticket_text, req.order_status)
    return {
        "agent": "Sue",
        "status": "queued",
        "task_id": task.id,
        "message": "Sue is retrieving policy and drafting response. Check status with /tasks/{task_id}"
    }

# --- REQUEST MODEL ---
class InventoryRequest(BaseModel):
    sku: str

# --- 5. IVAN (Inventory Agent) ---
@app.post("/agents/ivan/check-stock")
async def start_ivan(request: InventoryRequest):
    task = ivan_task.delay(request.sku)
    return {"agent": "Ivan", "task_id": task.id, "status": "checking_inventory"}

# --- REQUEST MODEL ---
class SeoRequest(BaseModel):
    url: str
    keyword: str

# --- 6. LISA (SEO Agent) ---
@app.post("/agents/lisa/audit")
async def start_lisa(request: SeoRequest):
    task = lisa_task.delay(request.url, request.keyword)
    return {"agent": "Lisa", "task_id": task.id, "status": "auditing_site"}

# We use global variables to simulate "User Session" for the demo
# In production, these "thread_id"s come from the Frontend (User ID)
JEFF_THREAD_CONFIG = {"configurable": {"thread_id": "jeff_session_123"}}
SUE_THREAD_CONFIG = {"configurable": {"thread_id": "sue_session_123"}}

# =============================================================================
# JEFF HITL (Human-in-the-Loop) ENDPOINTS
# =============================================================================

class JeffWorkflowRequest(BaseModel):
    niche: str
    min_revenue: int

class JeffApproveRequest(BaseModel):
    edited_email: str

@app.post("/agents/jeff/start-workflow")
def jeff_start_workflow(req: JeffWorkflowRequest):
    """
    Step 1: Start Jeff's workflow. He will search for prospects, draft an email, then STOP.
    Human reviews the email before it's "sent".
    """
    initial_state = {
        "niche": req.niche,
        "min_revenue": req.min_revenue,
        "prospect_name": "",
        "prospect_url": "",
        "prospect_snippet": "",
        "email_draft": "",
        "final_email": "",
        "status": "START"
    }
    
    # Run until the interruption point (before send_node)
    for event in jeff_graph.stream(initial_state, JEFF_THREAD_CONFIG):
        pass
    
    # Fetch the current "Frozen" state
    current_state = jeff_graph.get_state(JEFF_THREAD_CONFIG).values
    
    return {
        "agent": "Jeff",
        "status": "PENDING_APPROVAL",
        "prospect": {
            "name": current_state.get("prospect_name", ""),
            "url": current_state.get("prospect_url", ""),
            "snippet": current_state.get("prospect_snippet", "")
        },
        "email_draft": current_state.get("email_draft", ""),
        "message": "Jeff has drafted an email. Review and approve to send."
    }

@app.post("/agents/jeff/approve")
def jeff_approve(req: JeffApproveRequest):
    """
    Step 2: Human approves (or edits) the email. Resume and "send".
    """
    # A. Update the state with the Human's edits
    jeff_graph.update_state(
        JEFF_THREAD_CONFIG,
        {"final_email": req.edited_email}
    )
    
    # B. Resume the graph (triggers send_node)
    for event in jeff_graph.stream(None, JEFF_THREAD_CONFIG):
        pass
    
    final_state = jeff_graph.get_state(JEFF_THREAD_CONFIG).values
    
    return {
        "agent": "Jeff",
        "status": final_state.get("status", "SENT"),
        "final_email": final_state.get("final_email") or final_state.get("email_draft"),
        "message": "Email has been sent!"
    }

@app.post("/agents/jeff/reject")
def jeff_reject():
    """
    Human rejects the email. Reset the workflow.
    """
    return {
        "agent": "Jeff",
        "status": "REJECTED",
        "message": "Email draft was rejected. Start a new campaign when ready."
    }

# =============================================================================
# SUE HITL (Human-in-the-Loop) ENDPOINTS
# =============================================================================

class SueWorkflowRequest(BaseModel):
    ticket_text: str
    order_status: str

class SueApproveRequest(BaseModel):
    edited_reply: str

@app.post("/agents/sue/start-workflow")
def sue_start_workflow(req: SueWorkflowRequest):
    """
    Step 1: Start Sue's workflow. She retrieves policy, drafts a reply, then STOPS.
    Human reviews the reply before it's "published".
    """
    initial_state = {
        "ticket_text": req.ticket_text,
        "order_status": req.order_status,
        "policy_retrieved": "",
        "draft_reply": "",
        "final_reply": "",
        "status": "START"
    }
    
    # Run until the interruption point (before publish_node)
    for event in sue_graph.stream(initial_state, SUE_THREAD_CONFIG):
        pass
    
    # Fetch the current "Frozen" state
    current_state = sue_graph.get_state(SUE_THREAD_CONFIG).values
    
    return {
        "agent": "Sue",
        "status": "PENDING_APPROVAL",
        "policy_retrieved": current_state.get("policy_retrieved", ""),
        "draft_reply": current_state.get("draft_reply", ""),
        "message": "Sue has drafted a reply. Review and approve to publish."
    }

@app.post("/agents/sue/approve")
def sue_approve(req: SueApproveRequest):
    """
    Step 2: Human approves (or edits) the reply. Resume and "publish".
    """
    # A. Update the state with the Human's edits
    sue_graph.update_state(
        SUE_THREAD_CONFIG,
        {"final_reply": req.edited_reply}
    )
    
    # B. Resume the graph (triggers publish_node)
    for event in sue_graph.stream(None, SUE_THREAD_CONFIG):
        pass
    
    final_state = sue_graph.get_state(SUE_THREAD_CONFIG).values
    
    return {
        "agent": "Sue",
        "status": final_state.get("status", "PUBLISHED"),
        "final_reply": final_state.get("final_reply") or final_state.get("draft_reply"),
        "message": "Reply has been published to Amazon!"
    }

@app.post("/agents/sue/reject")
def sue_reject():
    """
    Human rejects the reply. Reset the workflow.
    """
    return {
        "agent": "Sue",
        "status": "REJECTED",
        "message": "Reply draft was rejected. Handle a new ticket when ready."
    }