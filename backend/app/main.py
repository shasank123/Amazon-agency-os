from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time
import random
from app.agents.sue_graph import sue_graph

# Import the tasks
from app.worker import jeff_task, penny_task, sue_task, adam_task
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

# --- 5. IVAN (Inventory Agent) ---
@app.get("/agents/ivan/forecast")
def ivan_forecast_stock():
    """
    Simulates Ivan predicting stockouts.
    """
    alerts = []
    lead_time_days = 15 # Time to ship from China
    
    for sku, data in MOCK_INVENTORY.items():
        days_left = data["stock"] / data["velocity_per_day"]
        
        if days_left < lead_time_days:
            alerts.append({
                "sku": sku,
                "status": "CRITICAL",
                "days_remaining": days_left,
                "action": "GENERATE_PO",
                "quantity_to_order": 1000 # Simplified logic
            })
            
    return {"agent": "Ivan", "stock_alerts": alerts}

# --- 6. LISA (SEO Agent) ---
@app.get("/agents/lisa/audit-listing/{sku}")
def lisa_audit_listing(sku: str):
    """
    Simulates Lisa comparing your title to competitors.
    """
    if sku not in MOCK_INVENTORY:
        raise HTTPException(status_code=404, detail="SKU not found")
        
    product = MOCK_INVENTORY[sku]
    # Fake competitor data
    competitor_keywords = ["Indestructible", "Chew Proof", "Puppy Safe"]
    
    missing = [kw for kw in competitor_keywords if kw.lower() not in product["name"].lower()]
    
    return {
        "agent": "Lisa",
        "current_title": product["name"],
        "missing_keywords": missing,
        "optimized_title": f"{product['name']} - {' '.join(missing)}"
    }

# We use a global variable to simulate "User Session" for the demo
# In production, this "thread_id" comes from the Frontend (User ID)
THREAD_CONFIG = {"configurable": {"thread_id": "review_123"}}

@app.post("/agents/sue/start-workflow")
def start_review_process(review: str):
    """
    Step 1: Start the graph. It will run 'draft_node' and then STOP.
    """
    initial_state = {"review_text": review, "draft": "", "final_response": "", "status": "START"}
    
    # Run until the interruption point
    for event in sue_graph.stream(initial_state, THREAD_CONFIG):
        pass
    
    # Fetch the current "Frozen" state
    current_state = sue_graph.get_state(THREAD_CONFIG).values
    
    return {
        "status": "PAUSED_FOR_HUMAN",
        "draft": current_state["draft"],
        "message": "Sue has drafted a reply. Please call /approve to publish."
    }

@app.post("/agents/sue/approve")
def approve_reply(edited_text: str):
    """
    Step 2: Human approves (or edits). We update state and RESUME.
    """
    # A. Update the state with the Human's edits
    sue_graph.update_state(
        THREAD_CONFIG, 
        {"final_response": edited_text} # Injecting human edit
    )
    
    # B. Resume the graph (It triggers 'publish_node' now)
    # We pass None because we are just resuming execution
    for event in sue_graph.stream(None, THREAD_CONFIG):
        pass
        
    final_state = sue_graph.get_state(THREAD_CONFIG).values
    
    return {
        "status": final_state["status"], # Should be "PUBLISHED"
        "final_output": final_state.get("final_response")
    }