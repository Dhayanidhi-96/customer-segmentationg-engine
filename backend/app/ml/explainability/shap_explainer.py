"""
SHAP Explainability Module
Generates feature importance explanations for K-Means predictions.
"""

import numpy as np
import pandas as pd
from app.services.segmentation_service import segmentation_service

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

class ShapExplainer:
    def __init__(self):
        self.explainer = None
        self.is_initialized = False
        
    def initialize(self):
        if self.is_initialized:
            return
            
        if segmentation_service.model is None:
            segmentation_service.load_model()
            
        self.kmeans_model = segmentation_service.model.model
        self.scaler = segmentation_service.model.scaler
        self.feature_names = segmentation_service.model.feature_names
        
        if SHAP_AVAILABLE:
            background_data = self.kmeans_model.cluster_centers_
            def predict_distances(X_scaled):
                return self.kmeans_model.transform(X_scaled)
            self.explainer = shap.KernelExplainer(predict_distances, background_data)
            
        self.is_initialized = True
        
    def explain_prediction(self, customer_data: dict) -> dict:
        if not self.is_initialized:
            self.initialize()
            
        features = {col: customer_data.get(col, 0) for col in self.feature_names}
        X = pd.DataFrame([features])
        X_scaled = self.scaler.transform(X).astype(np.float64)
        
        labels, distances = segmentation_service.model.predict(X)
        assigned_cluster = int(labels[0])
        
        explanation = []
        base_value = 0.0
        
        if SHAP_AVAILABLE and self.explainer:
            try:
                # Calculate SHAP values for the distances (nsamples short to guarantee speed)
                shap_values_list = self.explainer.shap_values(X_scaled, nsamples=50, silent=True)
                # Kernel explainer returns a list over outputs (clusters)
                cluster_shaps = shap_values_list[assigned_cluster][0] 
                
                # In distance space, a negative SHAP value pulls the distance DOWN (meaning closer to cluster)
                # We invert it so POSITIVE contribution means "pushed TOWARD this segment"
                contributions = -1.0 * cluster_shaps
                base_value = float(self.explainer.expected_value[assigned_cluster])
                
                for i, feature_name in enumerate(self.feature_names):
                    explanation.append({
                        "feature": feature_name,
                        "value": float(X.iloc[0, i]),
                        "contribution": float(contributions[i])
                    })
            except Exception as e:
                # Fallback purely to feature distances if SHAP crashes
                return self._fallback_explanation(X, X_scaled, assigned_cluster)
        else:
            return self._fallback_explanation(X, X_scaled, assigned_cluster)
            
        # Sort by absolute contribution (most important feature first)
        explanation.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return {
            "target_cluster": assigned_cluster,
            "base_value": base_value,
            "feature_explanations": explanation
        }

    def _fallback_explanation(self, X, X_scaled, assigned_cluster):
        """Fallback explanation based purely on distance components if shap is unavailable"""
        center = self.kmeans_model.cluster_centers_[assigned_cluster]
        
        explanation = []
        for i, feature_name in enumerate(self.feature_names):
            explanation.append({
                "feature": feature_name,
                "value": float(X.iloc[0, i]),
                # Negative value means distance is large, so less contribution.
                "contribution": -float(abs(X_scaled[0][i] - center[i]))
            })
            
        explanation.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return {
            "target_cluster": assigned_cluster,
            "base_value": 0.0,
            "feature_explanations": explanation
        }

shap_explainer = ShapExplainer()
