import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host="localhost", 
        database="agency_os",
        user="admin",
        password="admin"
    )

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Enable Vector (for Sue) - ALREADY DONE
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id SERIAL PRIMARY KEY,
            text TEXT,
            embedding vector(1536)
        );
    """)

    # 2. CREATE ANALYTICS TABLE (For Adam) <--- NEW
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ad_metrics (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            campaign_name TEXT NOT NULL,
            impressions INT DEFAULT 0,
            clicks INT DEFAULT 0,
            spend DECIMAL(10, 2) DEFAULT 0.00,
            sales DECIMAL(10, 2) DEFAULT 0.00
        );
    """)

    # 3. CREATE INVENTORY TABLE (For Ivan) <--- NEW
    cur.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            sku TEXT PRIMARY KEY,
            product_name TEXT NOT NULL,
            current_stock INT NOT NULL,
            reorder_point INT NOT NULL,
            reorder_qty INT NOT NULL,
            supplier_email TEXT NOT NULL,
            unit_cost DECIMAL(10, 2) NOT NULL
        );
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("--- Database Initialized (Policies + Analytics) ---")

if __name__ == "__main__":
    init_db()