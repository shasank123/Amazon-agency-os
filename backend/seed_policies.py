import os
import psycopg2
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 1. Our "Company Policies"
policies = [
    "Refund Policy: We offer a full refund within 30 days of purchase. The item must be unopened.",
    "Shipping Policy: Standard shipping takes 5-7 business days. Expedited shipping is 2 days.",
    "Warranty: All electronics come with a 1-year limited warranty covering manufacturer defects.",
    "Replacement: If an item arrives damaged, we will replace it free of charge if reported within 48 hours."
]

def seed_knowledge_base():
    conn = psycopg2.connect(
        host="localhost", database="agency_os", user="admin", password="admin"
    )
    cur = conn.cursor()
    
    print("--- Seeding Knowledge Base ---")
    
    for policy in policies:
        # 1. Turn Text into Numbers (Vector Embedding)
        response = client.embeddings.create(
            input=policy,
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
        
        # 2. Save to Postgres
        cur.execute(
            "INSERT INTO policies (text, embedding) VALUES (%s, %s)",
            (policy, embedding)
        )
        print(f"Stored: {policy[:30]}...")

    conn.commit()
    cur.close()
    conn.close()
    print("--- Knowledge Base Ready ---")

if __name__ == "__main__":
    seed_knowledge_base()