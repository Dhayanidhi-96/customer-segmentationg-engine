"""
Segmentation Service
Business logic for customer segmentation
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.ml.models.kmeans_model import KMeansSegmenter
from app.config import settings


class SegmentationService:
    """Service for customer segmentation operations"""
    
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(settings.MODEL_STORAGE_PATH, "kmeans_model.pkl")
    
    def load_model(self):
        """Load trained model from disk"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at {self.model_path}")
        
        self.model = KMeansSegmenter.load(self.model_path)
        return self.model
    
    def predict_segment(self, customer_data: Dict) -> Dict:
        """
        Predict segment for a single customer
        
        Args:
            customer_data: Dictionary with customer features
            
        Returns:
            Dictionary with segment prediction and confidence
        """
        if self.model is None:
            self.load_model()
        
        # Extract features
        feature_columns = self.model.feature_names
        features = {col: customer_data.get(col, 0) for col in feature_columns}
        
        # Create DataFrame
        X = pd.DataFrame([features])
        
        # Predict
        labels, distances = self.model.predict(X)
        
        segment_id = int(labels[0])
        confidence = float(1 / (1 + distances[0]))  # Convert distance to confidence
        
        return {
            "segment_id": segment_id,
            "segment_name": f"Segment {segment_id}",
            "confidence": round(confidence, 3)
        }
    
    def predict_batch(self, db: Session, limit: Optional[int] = None) -> Dict:
        """
        Predict segments for all customers in database
        
        Args:
            db: Database session
            limit: Maximum number of customers to process
            
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            self.load_model()
        
        # Get customers
        query = db.query(Customer).filter(Customer.is_active == True)
        if limit:
            query = query.limit(limit)
        
        customers = query.all()
        
        if not customers:
            return {"message": "No customers found", "updated": 0}
        
        # Extract features
        feature_columns = self.model.feature_names
        data = []
        
        for customer in customers:
            features = {col: getattr(customer, col, 0) for col in feature_columns}
            data.append(features)
        
        X = pd.DataFrame(data)
        
        # Predict
        labels, distances = self.model.predict(X)
        
        # Update customers
        updated = 0
        for i, customer in enumerate(customers):
            customer.segment_id = int(labels[i])
            customer.segment_name = f"Segment {labels[i]}"
            customer.segment_confidence = float(1 / (1 + distances[i]))
            updated += 1
        
        db.commit()
        
        return {
            "message": "Batch prediction completed",
            "total_customers": len(customers),
            "updated": updated,
            "segments": {
                f"segment_{i}": int(np.sum(labels == i))
                for i in range(self.model.n_clusters)
            }
        }
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if self.model is None:
            self.load_model()
        
        return {
            "model_name": self.model.get_model_name(),
            "n_clusters": self.model.n_clusters,
            "features": self.model.feature_names,
            "is_trained": self.model.is_trained
        }
    
    def get_segment_profiles(self, db: Session) -> Dict:
        """Get profile statistics for each segment"""
        # Get all customers with segments
        customers = db.query(Customer).filter(
            Customer.is_active == True,
            Customer.segment_id.isnot(None)
        ).all()
        
        if not customers:
            return {"message": "No segmented customers found"}
        
        # Group by segment
        df = pd.DataFrame([{
            'segment_id': c.segment_id,
            'recency_days': c.recency_days,
            'frequency': c.frequency,
            'monetary_value': c.monetary_value,
            'avg_order_value': c.avg_order_value,
            'account_age_days': c.account_age_days
        } for c in customers])
        
        profiles = {}
        for segment_id in df['segment_id'].unique():
            segment_data = df[df['segment_id'] == segment_id]
            
            profiles[f"segment_{int(segment_id)}"] = {
                "segment_id": int(segment_id),
                "size": len(segment_data),
                "percentage": round(len(segment_data) / len(df) * 100, 2),
                "avg_recency": round(segment_data['recency_days'].mean(), 2),
                "avg_frequency": round(segment_data['frequency'].mean(), 2),
                "avg_monetary": round(segment_data['monetary_value'].mean(), 2),
                "total_revenue": round(segment_data['monetary_value'].sum(), 2)
            }
        
        return profiles


# Create singleton instance
segmentation_service = SegmentationService()