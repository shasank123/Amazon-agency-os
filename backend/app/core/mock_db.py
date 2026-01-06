# backend/app/core/mock_db.py
from datetime import datetime, timedelta

# 1. Simulating the "1 Million Seller" Database (for Jeff)
MOCK_SELLERS = [
    {"id": "s1", "brand": "Mam Baby", "niche": "Baby Care", "revenue": 50000, "email": "ceo@mambaby.com", "pain_point": "No D2C"},
    {"id": "s2", "brand": "Tradgear", "niche": "Tools", "revenue": 120000, "email": "contact@tradgear.com", "pain_point": "Bad Ads"},
    {"id": "s3", "brand": "PetCo Generic", "niche": "Pet Supplies", "revenue": 10000, "email": "info@pet.co", "pain_point": "Low Stock"},
    # ... In a real app, this list is huge.
]

# 2. Simulating User's Inventory (for Penny & Ivan)
MOCK_INVENTORY = {
    "sku_123": {"name": "Blue Dog Toy", "stock": 45, "velocity_per_day": 5, "price": 19.99, "min_price": 18.00, "competitor_price": 19.50},
    "sku_456": {"name": "Chef Knife", "stock": 1200, "velocity_per_day": 2, "price": 45.00, "min_price": 40.00, "competitor_price": 48.00},
}

# 3. Simulating Ad Data (for Adam) - High Spend, Zero Sales = "Bleeding"
MOCK_ADS = [
    {"keyword": "cheap dog toy", "spend": 250.00, "sales": 0.00, "clicks": 500, "status": "ACTIVE"},
    {"keyword": "indestructible dog toy", "spend": 50.00, "sales": 200.00, "clicks": 40, "status": "ACTIVE"},
]

# 4. Simulating Client SOPs (for Sue's RAG)
MOCK_VECTOR_DB = {
    "shipping_damage": "Policy: Apologize immediately. If damage is verified, send a free replacement unit (SKU-REP-01). Do not ask for return.",
    "wrong_color": "Policy: Ask for a photo. If our fault, offer 50% refund or full exchange.",
    "late_delivery": "Policy: Refund shipping costs only. Do not refund product price."
}