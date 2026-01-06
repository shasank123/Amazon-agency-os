import psycopg2

def seed_inventory():
    conn = psycopg2.connect(
        host="localhost", database="agency_os", user="admin", password="admin"
    )
    cur = conn.cursor()
    print("--- Seeding Inventory ---")
    
    cur.execute("TRUNCATE TABLE inventory;")

    # 1. LOW STOCK ITEM (Ivan should trigger)
    cur.execute("""
        INSERT INTO inventory (sku, product_name, current_stock, reorder_point, reorder_qty, supplier_email, unit_cost)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, ("GM-001", "RGB Gaming Mouse", 5, 20, 100, "orders@techsuppliers.cn", 12.50))

    # 2. HEALTHY ITEM (Ivan should sleep)
    cur.execute("""
        INSERT INTO inventory (sku, product_name, current_stock, reorder_point, reorder_qty, supplier_email, unit_cost)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, ("CH-999", "Ergo Office Chair", 50, 10, 20, "sales@furniture-wh.com", 85.00))

    conn.commit()
    conn.close()
    print("--- Inventory Ready ---")

if __name__ == "__main__":
    seed_inventory()