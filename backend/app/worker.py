import time
from app.core.celery_app import celery_app
from app.core.mock_db import MOCK_SELLERS, MOCK_INVENTORY
from dotenv import load_dotenv
from openai import OpenAI
import os

# Load API Key
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- JEFF'S TASK (The Sales Agent) ---
@celery_app.task(name="app.worker.jeff_task")
def jeff_task(niche: str, min_revenue: int):
    """
    Jeff's Job:
    1. 'Search' for leads (Simulated)
    2. Use LLM to write a personalized email for that niche.
    """
    print(f"--- JEFF: Searching for {niche} companies with ${min_revenue}+ revenue ---")
    
    # 1. Simulate finding a specific company based on the niche
    company_name = f"Best {niche.capitalize()} Co."
    
    # 2. Call OpenAI to write the email
    print("--- JEFF: Found company. Generating email with AI... ---")
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are Jeff, a top-tier B2B Sales Agent."},
                {"role": "user", "content": f"Write a short, punchy cold email to {company_name} who sells {niche}. Mention their revenue is impressive (over ${min_revenue}). Pitch our 'Amazon Growth Agency'."}
            ]
        )
        email_content = response.choices[0].message.content
    except Exception as e:
        email_content = f"Error generating email: {str(e)}"

    # 3. Return the result
    return {
        "status": "COMPLETED",
        "leads": [
            f"Company: {company_name}",
            f"Draft: {email_content}"
        ]
    }

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