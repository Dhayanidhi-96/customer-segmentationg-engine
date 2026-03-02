"""
Synthetic Customer Data Generator
Generates realistic e-commerce customer data for testing and development
"""

import pandas as pd
import numpy as np
from faker import Faker
import random
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)


def generate_synthetic_customers(n_customers=5000):
    """
    Generate synthetic customer data with realistic distributions
    
    Args:
        n_customers: Number of customers to generate
        
    Returns:
        pandas DataFrame with customer data
    """
    
    print(f"🔄 Generating {n_customers} synthetic customers...")
    
    customers = []
    
    # Define customer segments for realistic distribution
    segments = {
        'Champions': {
            'prob': 0.15, 
            'recency': (0, 30), 
            'frequency': (10, 50), 
            'monetary': (1000, 5000)
        },
        'Loyal': {
            'prob': 0.20, 
            'recency': (0, 60), 
            'frequency': (5, 15), 
            'monetary': (500, 2000)
        },
        'Potential': {
            'prob': 0.15, 
            'recency': (30, 90), 
            'frequency': (3, 8), 
            'monetary': (300, 1000)
        },
        'At Risk': {
            'prob': 0.20, 
            'recency': (90, 180), 
            'frequency': (5, 15), 
            'monetary': (500, 2000)
        },
        'Hibernating': {
            'prob': 0.20, 
            'recency': (180, 365), 
            'frequency': (2, 5), 
            'monetary': (100, 500)
        },
        'Lost': {
            'prob': 0.10, 
            'recency': (365, 730), 
            'frequency': (1, 3), 
            'monetary': (50, 200)
        }
    }
    
    for i in range(n_customers):
        # Select segment based on probability
        segment_name = np.random.choice(
            list(segments.keys()),
            p=[s['prob'] for s in segments.values()]
        )
        segment_config = segments[segment_name]
        
        # Generate basic information
        gender = random.choice(['Male', 'Female', 'Other'])
        age = int(np.random.normal(35, 12))
        age = max(18, min(80, age))
        
        # Generate RFM values based on segment
        recency_days = round(random.uniform(*segment_config['recency']), 2)
        frequency = random.randint(*segment_config['frequency'])
        monetary_value = round(random.uniform(*segment_config['monetary']), 2)
        
        # Calculate derived features
        avg_order_value = round(monetary_value / frequency if frequency > 0 else 0, 2)
        total_items_purchased = int(frequency * random.uniform(1.5, 4))
        
        # Account age
        if segment_name in ['Champions', 'Loyal']:
            account_age_days = int(random.uniform(365, 1095))
        elif segment_name in ['At Risk', 'Hibernating']:
            account_age_days = int(random.uniform(180, 730))
        else:
            account_age_days = int(random.uniform(30, 365))
        
        # Engagement metrics
        if segment_name in ['Champions', 'Loyal']:
            email_open_rate = round(random.uniform(0.4, 0.8), 3)
            email_click_rate = round(random.uniform(0.1, 0.3), 3)
        elif segment_name in ['Potential']:
            email_open_rate = round(random.uniform(0.3, 0.5), 3)
            email_click_rate = round(random.uniform(0.05, 0.15), 3)
        else:
            email_open_rate = round(random.uniform(0.1, 0.3), 3)
            email_click_rate = round(random.uniform(0.01, 0.08), 3)
        
        # Create customer record
        customer = {
            'customer_id': f'CUST_{i+1:06d}',
            'name': fake.name(),
            'email': fake.email(),
            'phone': fake.phone_number(),
            'age': age,
            'gender': gender,
            'city': fake.city(),
            'country': fake.country(),
            'recency_days': recency_days,
            'frequency': frequency,
            'monetary_value': monetary_value,
            'avg_order_value': avg_order_value,
            'total_orders': frequency,
            'total_items_purchased': total_items_purchased,
            'account_age_days': account_age_days,
            'email_open_rate': email_open_rate,
            'email_click_rate': email_click_rate,
            'true_segment': segment_name
        }
        
        customers.append(customer)
        
        if (i + 1) % 1000 == 0:
            print(f"  ✓ Generated {i + 1}/{n_customers} customers...")
    
    df = pd.DataFrame(customers)
    
    print(f"\n✅ Generated {len(df)} customers successfully!")
    print(f"\n📊 Segment distribution:")
    print(df['true_segment'].value_counts().sort_index())
    
    return df


def save_data(df, output_dir='../data/synthetic'):
    """Save generated data to CSV files"""
    
    # Get absolute path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, output_dir)
    os.makedirs(output_path, exist_ok=True)
    
    # Save full dataset
    full_path = os.path.join(output_path, 'customers_full.csv')
    df.to_csv(full_path, index=False)
    print(f"\n💾 Saved full dataset to: {full_path}")
    
    # Save training data (remove true_segment column)
    train_df = df.drop('true_segment', axis=1)
    train_path = os.path.join(output_path, 'customers_train.csv')
    train_df.to_csv(train_path, index=False)
    print(f"💾 Saved training dataset to: {train_path}")
    
    # Save sample for quick testing
    sample_df = df.sample(n=min(1000, len(df)), random_state=42)
    sample_path = os.path.join(output_path, 'customers_sample.csv')
    sample_df.to_csv(sample_path, index=False)
    print(f"💾 Saved sample dataset to: {sample_path}")
    
    # Print statistics
    print("\n" + "="*60)
    print("📈 DATASET STATISTICS")
    print("="*60)
    print(f"Total customers: {len(df)}")
    print(f"\nFeature columns: {len(df.columns)}")
    print(f"Columns: {', '.join(df.columns.tolist())}")
    print("\n📊 Numeric features summary:")
    print(df[['recency_days', 'frequency', 'monetary_value', 'age']].describe())


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 SYNTHETIC DATA GENERATION")
    print("="*60 + "\n")
    
    # Generate data
    df = generate_synthetic_customers(n_customers=5000)
    
    # Save data
    save_data(df)
    
    print("\n" + "="*60)
    print("✅ DATA GENERATION COMPLETE!")
    print("="*60 + "\n")