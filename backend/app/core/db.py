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
    
    # 1. Enable the Vector Extension
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    # 2. Create the Policies Table
    # We use 1536 dimensions because that's what OpenAI's embedding model uses.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id SERIAL PRIMARY KEY,
            text TEXT,
            embedding vector(1536)
        );
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("--- Database Initialized with Vector Support ---")

if __name__ == "__main__":
    init_db()