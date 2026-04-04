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
from app.ml.models.gmm_model import GMMSegmenter


# ── Business-meaningful segment name mapping ──────────────────────────────────
# Assigned at batch-prediction time based on the segment's RFM centroid profile.
# Champions:   High Frequency + High Monetary + Low Recency (recently bought a lot)
# Loyal:       High Frequency, moderate monetary
# At-Risk:     Haven't bought in a long time
# New Customers: Low frequency but recently joined
# Hibernating: Low on all dimensions

def _assign_segment_name(segment_id: int, avg_recency: float, avg_frequency: float, avg_monetary: float) -> str:
    """Assign a meaningful business label to a cluster based on its RFM profile."""
    HIGH_FREQ = 15
    HIGH_MON  = 1500
    LOW_REC   = 30   # days (lower = more recent = better)
    HIGH_REC  = 120  # days (higher = churning)

    if avg_frequency >= HIGH_FREQ and avg_monetary >= HIGH_MON and avg_recency <= LOW_REC:
        return "Champions"
    elif avg_frequency >= HIGH_FREQ and avg_monetary >= HIGH_MON:
        return "Loyal Customers"
    elif avg_recency >= HIGH_REC and avg_frequency <= 5:
        return "Hibernating"
    elif avg_recency >= HIGH_REC:
        return "At-Risk Customers"
    elif avg_frequency <= 3 and avg_recency <= LOW_REC:
        return "New Customers"
    elif avg_monetary >= HIGH_MON:
        return "High-Value Prospects"
    else:
        return f"Segment {segment_id}"


class SegmentationService:
    """Service for customer segmentation operations"""
    
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(settings.MODEL_STORAGE_PATH, "gmm_model.pkl")
        self._segment_name_cache: Dict[int, str] = {}
    
    def load_model(self):
        """Load trained model from disk"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at {self.model_path}")
        
        self.model = GMMSegmenter.load(self.model_path)
        return self.model
    
    def predict_segment(self, customer_data: Dict) -> Dict:
        """Predict segment for a single customer"""
        if self.model is None:
            self.load_model()
        
        feature_columns = self.model.feature_names
        features = {col: customer_data.get(col, 0) for col in feature_columns}
        X = pd.DataFrame([features])
        
        labels, distances = self.model.predict(X)
        segment_id = int(labels[0])
        confidence = float(1 / (1 + distances[0]))
        
        # Use cached name if available
        segment_name = self._segment_name_cache.get(segment_id, f"Segment {segment_id}")
        
        return {
            "segment_id": segment_id,
            "segment_name": segment_name,
            "confidence": round(confidence, 3)
        }
    
    def predict_batch(self, db: Session, limit: Optional[int] = None) -> Dict:
        """Predict segments for all customers in database"""
        if self.model is None:
            self.load_model()
        
        query = db.query(Customer).filter(Customer.is_active == True)
        if limit:
            query = query.limit(limit)
        
        customers = query.all()
        
        if not customers:
            return {"message": "No customers found", "updated": 0}
        
        feature_columns = self.model.feature_names
        data = [{col: getattr(customer, col, 0) for col in feature_columns} for customer in customers]
        X = pd.DataFrame(data)
        
        labels, distances = self.model.predict(X)
        
        # ── Build RFM profile per cluster to assign meaningful names ──────────
        df_temp = X.copy()
        df_temp['_label'] = labels
        segment_names: Dict[int, str] = {}
        for seg_id in np.unique(labels):
            grp = df_temp[df_temp['_label'] == seg_id]
            name = _assign_segment_name(
                int(seg_id),
                float(grp['recency_days'].mean()),
                float(grp['frequency'].mean()),
                float(grp['monetary_value'].mean()),
            )
            segment_names[int(seg_id)] = name
        
        # Cache for future single predictions
        self._segment_name_cache.update(segment_names)
        
        # Update customers optimally via Bulk Update Mappings
        updated = 0
        updates = []
        for i, customer in enumerate(customers):
            seg_id = int(labels[i])
            updates.append({
                "customer_id": customer.customer_id,
                "segment_id": seg_id,
                "segment_name": segment_names.get(seg_id, f"Segment {seg_id}"),
                "segment_confidence": round(float(1 / (1 + distances[i])), 3)
            })
            updated += 1
            
        db.bulk_update_mappings(Customer, updates)
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
            try:
                self.load_model()
            except FileNotFoundError:
                return {
                    "model_name": "No Deployed Model ❌",
                    "n_clusters": 0,
                    "features": [],
                    "is_trained": False
                }
        
        return {
            "model_name": self.model.get_model_name(),
            "n_clusters": self.model.n_clusters,
            "features": self.model.feature_names,
            "is_trained": self.model.is_trained
        }
    
    def retrain_model(self, db: Session) -> Dict:
        """
        Dynamically trigger AutoML via Silhouette Score optimization,
        retrain K-Means, and deploy the new model to production.
        """
        import time
        start_time = time.time()
        
        # 1. Gather all active customer data
        customers = db.query(Customer).filter(Customer.is_active == True).all()
        if len(customers) < 50:
            return {"error": "Not enough data to retrain safely. Need at least 50 customers."}
            
        # 2. Extract strictly numeric KPI features
        feature_columns = ['recency_days', 'frequency', 'monetary_value', 'avg_order_value', 'total_items_purchased', 'account_age_days']
        data = [{col: getattr(customer, col, 0) for col in feature_columns} for customer in customers]
        X = pd.DataFrame(data)
        
        # 3. Instantiate a fresh GMM model
        print("🚀 [MLOps] Triggering Live Retraining pipeline for Gaussian Mixture Models...")
        new_model = GMMSegmenter(n_clusters=6)
        results = new_model.train(X)
        
        # 4. Save the new model to disk (Deploy to Prod)
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        new_model.save(self.model_path)
        
        # 5. Bring the new Champion model into RAM
        self.model = new_model
        
        # 6. Re-run batch prediction so DB labels match new clusters
        batch_results = self.predict_batch(db)
        
        return {
            "message": "AutoML Retraining completely successful. Champion model deployed.",
            "optimization_metrics": {
                "silhouette_score": round(results['metrics']['silhouette_score'], 3),
                "n_clusters_chosen": results['n_clusters']
            },
            "training_time_seconds": round(time.time() - start_time, 2),
            "updated_customers": batch_results.get("updated", 0)
        }
    
    def get_segment_profiles(self, db: Session) -> Dict:
        """Get profile statistics for each segment"""
        customers = db.query(Customer).filter(
            Customer.is_active == True,
            Customer.segment_id.isnot(None)
        ).all()
        
        if not customers:
            return {"message": "No segmented customers found"}
        
        df = pd.DataFrame([{
            'segment_id': c.segment_id,
            'segment_name': c.segment_name or f"Segment {c.segment_id}",
            'recency_days': c.recency_days or 0,
            'frequency': c.frequency or 0,
            'monetary_value': c.monetary_value or 0,
            'avg_order_value': c.avg_order_value or 0,
            'account_age_days': c.account_age_days or 0,
        } for c in customers])
        
        profiles = {}
        for segment_id in df['segment_id'].unique():
            segment_data = df[df['segment_id'] == segment_id]
            seg_name = segment_data['segment_name'].iloc[0]
            
            profiles[f"segment_{int(segment_id)}"] = {
                "segment_id": int(segment_id),
                "segment_name": seg_name,
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

