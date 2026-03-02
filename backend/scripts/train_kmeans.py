"""
Train K-Means Model
Script to train and save K-Means clustering model
"""

import sys
import os
import pandas as pd

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.models.kmeans_model import KMeansSegmenter


def main():
    print("\n" + "="*60)
    print("🤖 K-MEANS MODEL TRAINING")
    print("="*60 + "\n")
    
    # Load data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, "../data/synthetic/customers_train.csv")
    
    print(f"📂 Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df)} customers\n")
    
    # Select features for clustering
    feature_columns = [
        'recency_days',
        'frequency', 
        'monetary_value',
        'avg_order_value',
        'total_items_purchased',
        'account_age_days',
        'email_open_rate',
        'email_click_rate'
    ]
    
    print(f"📊 Selected features: {', '.join(feature_columns)}\n")
    X = df[feature_columns]
    
    # Create and train model
    segmenter = KMeansSegmenter(n_clusters=5)
    results = segmenter.train(X, optimize_k=True, max_clusters=8)
    
    # Print segment sizes
    print("\n📊 Segment Distribution:")
    print("-" * 60)
    for segment_name, profile in results['segment_profiles'].items():
        print(f"{segment_name}: {profile['size']} customers ({profile['percentage']:.1f}%)")
    
    # Save model
    model_dir = os.path.join(script_dir, "../models/saved")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "kmeans_model.pkl")
    
    segmenter.save(model_path)
    
    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETE!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()