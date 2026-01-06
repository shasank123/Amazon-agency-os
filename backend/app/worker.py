import time
from app.core.celery_app import celery_app
from app.core.mock_db import MOCK_SELLERS, MOCK_INVENTORY
from dotenv import load_dotenv
from openai import OpenAI
import os
from duckduckgo_search import DDGS  # <--- The Search Engine
import psycopg2

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

# --- AGENT 2: PENNY (Pricing & Profit) ---
@celery_app.task(name="app.worker.penny_task")
def penny_task(product: str, price: float, cost: float, competitor_price: float):
    print(f"--- PENNY: Analyzing {product} (Price: ${price}, Cost: ${cost}) ---")
    
    # 1. HARD LOGIC (Math doesn't hallucinate)
    margin = ((price - cost) / price) * 100
    undercut_by_competitor = competitor_price < price
    
    # 2. EDGE CASE HANDLING
    flags = []
    if margin < 15:
        flags.append("CRITICAL: Low Margin")
    if margin < 0:
        flags.append("EMERGENCY: Selling at Loss")
    if undercut_by_competitor:
        diff = price - competitor_price
        flags.append(f"Competitor is ${diff:.2f} cheaper")

    # 3. STRATEGIC THINKING (LLM)
    prompt = f"""
    You are Penny, a ruthless Profit Analyst. 
    Product: {product}. 
    Our Price: ${price}. Cost: ${cost}. Competitor Price: ${competitor_price}.
    Current Margin: {margin:.1f}%.
    Flags: {', '.join(flags)}.

    Decide a pricing strategy (Raise, Lower, or Hold). 
    If margin is low, suggest cost-cutting. 
    If competitor is cheaper, explain why we are premium or suggest a discount.
    Keep it strictly under 50 words.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        strategy = response.choices[0].message.content
    except Exception as e:
        strategy = f"Error generating strategy: {str(e)}"

    return {
        "status": "COMPLETED",
        "analysis": {
            "margin": f"{margin:.1f}%",
            "flags": flags,
            "strategy": strategy
        }
    }

# --- HELPER: RAG RETRIEVAL ---
def get_relevant_policy(query_text: str):
    try:
        # 1. Embed the user's query
        response = client.embeddings.create(
            input=query_text,
            model="text-embedding-3-small"
        )
        query_embedding = response.data[0].embedding

        # 2. Search DB for "Nearest Neighbor"
        # Connect to 'db' (service name) because this runs INSIDE Docker
        conn = psycopg2.connect(
            host="db", database="agency_os", user="admin", password="admin"
        )
        cur = conn.cursor()
        
        # The <=> operator finds the closest vector (cosine similarity)
        cur.execute("""
            SELECT text FROM policies 
            ORDER BY embedding <=> %s::vector 
            LIMIT 1;
        """, (query_embedding,))
        
        result = cur.fetchone()
        conn.close()
        
        if result:
            return result[0]
        return "No specific policy found."
        
    except Exception as e:
        print(f"RAG Error: {e}")
        return "System Error retrieving policy."

# --- AGENT 3: SUE (RAG-Enabled Support) ---
@celery_app.task(name="app.worker.sue_task")
def sue_task(ticket_text: str, order_status: str):
    print(f"--- SUE: Handling Ticket. Status: {order_status} ---")
    
    # 1. RETRIEVE KNOWLEDGE (RAG)
    policy_context = get_relevant_policy(ticket_text)
    print(f"--- SUE: Found Policy -> '{policy_context}' ---")

    # 2. GENERATE ANSWER (LLM)
    prompt = f"""
    You are Sue, a Customer Support Agent.
    
    Customer Issue: "{ticket_text}"
    Order Status: "{order_status}"
    
    OFFICIAL POLICY: "{policy_context}"
    
    Instructions:
    - Answer the customer strictly based on the policy above.
    - If the policy allows a refund/replacement, approve it.
    - If the policy denies it (e.g., past 30 days), politely refuse.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        reply = response.choices[0].message.content
    except Exception as e:
        reply = "System Error."

    return {
        "status": "COMPLETED",
        "response": {
            "reply": reply,
            "policy_used": policy_context
        }
    }

# --- AGENT 4: ADAM (Advertising Manager) ---
@celery_app.task(name="app.worker.adam_task")
def adam_task(campaign_name: str):
    print(f"--- ADAM: Analyzing Campaign '{campaign_name}' ---")
    
    # 1. FETCH DATA (The Analytics DB)
    conn = psycopg2.connect(
        host="db", database="agency_os", user="admin", password="admin"
    )
    cur = conn.cursor()
    
    # Get last 7 days metrics
    cur.execute("""
        SELECT SUM(spend), SUM(sales), SUM(clicks) 
        FROM ad_metrics 
        WHERE campaign_name = %s 
        AND date > NOW() - INTERVAL '7 days';
    """, (campaign_name,))
    
    row = cur.fetchone()
    conn.close()
    
    if not row or row[0] is None:
        return {"status": "FAILED", "error": "No data found for this campaign."}

    total_spend, total_sales, total_clicks = row
    # Handle Division by Zero
    acos = (total_spend / total_sales * 100) if total_sales > 0 else 0
    roas = (total_sales / total_spend) if total_spend > 0 else 0
    cpc = (total_spend / total_clicks) if total_clicks > 0 else 0

    # 2. DECISION LOGIC (The Brain)
    action = "HOLD"
    if acos > 40:
        action = "DECREASE BID (High ACOS)"
    elif roas > 4:
        action = "INCREASE BID (High ROAS)"
    
    # 3. REPORT GENERATION (LLM)
    prompt = f"""
    You are Adam, a PPC Ad Manager.
    Campaign: "{campaign_name}"
    Last 7 Days Data:
    - Spend: ${total_spend:.2f}
    - Sales: ${total_sales:.2f}
    - ACOS: {acos:.1f}% (Target is < 30%)
    - ROAS: {roas:.2f}x
    
    Based on this, explain why you decided to: {action}.
    Be analytical and professional. Max 50 words.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        reasoning = response.choices[0].message.content
    except:
        reasoning = "Analysis complete."

    return {
        "status": "COMPLETED",
        "report": {
            "spend": f"${total_spend:.2f}",
            "sales": f"${total_sales:.2f}",
            "acos": f"{acos:.1f}%",
            "decision": action,
            "reasoning": reasoning
        }
    }