import time
from app.core.celery_app import celery_app
from app.core.mock_db import MOCK_SELLERS, MOCK_INVENTORY

# --- JEFF'S TASK (The Sales Agent) ---
@celery_app.task(name="app.worker.jeff_task")
def jeff_task(niche: str, min_revenue: int):
    """
    This runs in the BACKGROUND. The user does not wait for this.
    """
    print(f"--- JEFF: Waking up to search for {niche} ---")
    
    # Simulate the heavy lifting (Scraping Amazon)
    time.sleep(5) 
    
    # Filter Mock Data
    matches = [
        s for s in MOCK_SELLERS 
        if niche.lower() in s["niche"].lower() 
        and s["revenue"] >= min_revenue
    ]
    
    results = []
    for m in matches:
        results.append(f"Drafted email for {m['brand']}: 'Saw your {m['pain_point']} issue...'")
    
    print(f"--- JEFF: Found {len(matches)} leads. Going back to sleep. ---")
    return {"status": "COMPLETED", "leads": results}

# --- PENNY'S TASK (The Pricing Agent) ---
@celery_app.task(name="app.worker.penny_task")
def penny_task():
    print("--- PENNY: Checking Competitor Prices ---")
    time.sleep(3) # Simulate API latency
    
    updates = []
    for sku, data in MOCK_INVENTORY.items():
        if data["competitor_price"] < data["price"]:
            updates.append(f"Lowering {sku} to ${data['competitor_price'] - 0.05}")
            
    return {"updates": updates}