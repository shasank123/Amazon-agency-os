import time
from app.core.celery_app import celery_app
from app.core.mock_db import MOCK_SELLERS, MOCK_INVENTORY
from dotenv import load_dotenv
from openai import OpenAI
import os
from duckduckgo_search import DDGS  # <--- The Search Engine

# Load API Key
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- JEFF'S TASK (The Sales Agent) ---
def find_real_prospect(niche: str):
    """
    Searches DuckDuckGo for a real company selling this product.
    Returns: Name, URL, and a snippet of text about them.
    """
    print(f"--- JEFF: Searching DuckDuckGo for '{niche}' brands... ---")
    with DDGS() as ddgs:
        # Search for real brands in this niche (without site restriction)
        query = f"best {niche} brand company"
        results = list(ddgs.text(query, max_results=5))
    
    if results:
        # Find first result with a real company name
        for hit in results:
            title = hit.get('title', '')
            # Skip generic articles
            if any(skip in title.lower() for skip in ['best', 'top 10', 'review', 'vs']):
                continue
            return {
                "name": title.split(' - ')[0].split(' | ')[0][:50],  # Clean up title
                "url": hit['href'],
                "snippet": hit['body'][:200]
            }
        # Use first result if no better match
        top_hit = results[0]
        return {
            "name": top_hit['title'].split(' - ')[0][:50],
            "url": top_hit['href'],
            "snippet": top_hit['body'][:200]
        }
    else:
        return {"name": "Generic Brand", "url": "N/A", "snippet": "No data found"}

@celery_app.task(name="app.worker.jeff_task")
def jeff_task(niche: str, min_revenue: int):
    
    # 1. REAL SEARCH (The Eyes)
    prospect = find_real_prospect(niche)
    
    # 2. REAL THINKING (The Brain)
    print(f"--- JEFF: Found {prospect['name']}. Writing email... ---")
    
    prompt = f"""
    You are a sales expert. Write a cold email to the brand "{prospect['name']}".
    They sell products in the "{niche}" space.
    I found this about them: "{prospect['snippet']}".
    
    Pitch our Amazon Agency. Keep it under 100 words. 
    Mention we noticed their listing at {prospect['url']}.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # or gpt-3.5-turbo
            messages=[{"role": "user", "content": prompt}]
        )
        email_content = response.choices[0].message.content
    except Exception as e:
        email_content = f"Error: {str(e)}"

    return {
        "status": "COMPLETED",
        "leads": [
            f"Brand: {prospect['name']}",
            f"URL: {prospect['url']}",
            f"Email Draft: {email_content}"
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