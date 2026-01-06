import psycopg2
import random
from datetime import datetime, timedelta

def seed_analytics():
    conn = psycopg2.connect(
        host="localhost", database="agency_os", user="admin", password="admin"
    )
    cur = conn.cursor()
    
    print("--- Seeding Ad Analytics ---")
    
    # Clear old data so we don't duplicate
    cur.execute("TRUNCATE TABLE ad_metrics;")

    campaigns = ["Gaming Mouse - Exact", "Office Chair - Broad", "Headphones - Auto"]
    
    # Generate data for the last 30 days
    for day in range(30):
        date = datetime.now() - timedelta(days=30 - day)
        
        for camp in campaigns:
            clicks = random.randint(10, 100)
            cpc = random.uniform(0.50, 2.50)
            spend = clicks * cpc
            
            # Randomize performance: "Gaming Mouse" performs bad (High ACOS)
            if "Gaming Mouse" in camp:
                sales = spend * 0.8  # Losing money (ROAS < 1)
            else:
                sales = spend * 3.0  # Making money (ROAS > 3)

            cur.execute("""
                INSERT INTO ad_metrics (date, campaign_name, clicks, spend, sales)
                VALUES (%s, %s, %s, %s, %s)
            """, (date, camp, clicks, spend, sales))

    conn.commit()
    cur.close()
    conn.close()
    print("--- Analytics Data Ready for Adam ---")

if __name__ == "__main__":
    seed_analytics()