"""
Load CSV Data into Database
Loads synthetic customer data into the database
"""

import sys
import os
import pandas as pd

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.customer import Customer


def load_csv_to_database(csv_path: str):
    """
    Load customer data from CSV into database
    
    Args:
        csv_path: Path to the CSV file
    """
    print(f"📂 Loading data from: {csv_path}")
    
    # Read CSV
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df)} records from CSV")
    
    # Remove true_segment column if it exists (it's only for validation)
    if 'true_segment' in df.columns:
        df = df.drop('true_segment', axis=1)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Clear existing data (optional - comment out if you want to keep old data)
        print("🗑️  Clearing existing data...")
        db.query(Customer).delete()
        db.commit()
        
        # Insert data in batches
        batch_size = 500
        total_inserted = 0
        
        print(f"💾 Inserting data in batches of {batch_size}...")
        
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i+batch_size]
            
            # Convert batch to list of Customer objects
            customers = []
            for _, row in batch.iterrows():
                customer = Customer(
                    customer_id=row['customer_id'],
                    name=row.get('name'),
                    email=row.get('email'),
                    phone=row.get('phone'),
                    age=int(row['age']) if pd.notna(row.get('age')) else None,
                    gender=row.get('gender'),
                    city=row.get('city'),
                    country=row.get('country'),
                    recency_days=float(row['recency_days']) if pd.notna(row.get('recency_days')) else None,
                    frequency=int(row['frequency']) if pd.notna(row.get('frequency')) else None,
                    monetary_value=float(row['monetary_value']) if pd.notna(row.get('monetary_value')) else None,
                    avg_order_value=float(row['avg_order_value']) if pd.notna(row.get('avg_order_value')) else None,
                    total_orders=int(row['total_orders']) if pd.notna(row.get('total_orders')) else None,
                    total_items_purchased=int(row['total_items_purchased']) if pd.notna(row.get('total_items_purchased')) else None,
                    account_age_days=int(row['account_age_days']) if pd.notna(row.get('account_age_days')) else None,
                    email_open_rate=float(row['email_open_rate']) if pd.notna(row.get('email_open_rate')) else None,
                    email_click_rate=float(row['email_click_rate']) if pd.notna(row.get('email_click_rate')) else None,
                    is_active=True
                )
                customers.append(customer)
            
            # Bulk insert
            db.bulk_save_objects(customers)
            db.commit()
            
            total_inserted += len(customers)
            print(f"  ✓ Inserted {total_inserted}/{len(df)} records...")
        
        print(f"\n✅ Successfully loaded {total_inserted} customers into database!")
        
        # Verify
        count = db.query(Customer).count()
        print(f"📊 Total customers in database: {count}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Path to the CSV file
    csv_file = "../data/synthetic/customers_train.csv"
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, csv_file)
    
    print("\n" + "="*60)
    print("📥 LOADING DATA INTO DATABASE")
    print("="*60 + "\n")
    
    load_csv_to_database(csv_path)
    
    print("\n" + "="*60)
    print("✅ DATA LOADING COMPLETE!")
    print("="*60 + "\n")
    