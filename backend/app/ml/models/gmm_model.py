"""
Gaussian Mixture Model (GMM)
"""

import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from typing import Dict, Tuple
from app.ml.models.base_model import BaseClusteringModel

class GMMSegmenter(BaseClusteringModel):
    def __init__(self, n_clusters: int = 5, random_state: int = 42):
        super().__init__(n_clusters=n_clusters, random_state=random_state)
        self.scaler = StandardScaler()

    def get_model_name(self) -> str:
        return "Gaussian Mixture Model"

    def preprocess(self, X: pd.DataFrame, fit: bool = True) -> np.ndarray:
        X_clean = X.fillna(X.median())
        if self.feature_names is None:
            self.feature_names = list(X_clean.columns)
        if fit:
            return self.scaler.fit_transform(X_clean)
        return self.scaler.transform(X_clean)

    def train(self, X: pd.DataFrame) -> Dict:
        X_scaled = self.preprocess(X, fit=True)
        self.model = GaussianMixture(n_components=self.n_clusters, random_state=self.random_state)
        self.model.fit(X_scaled)
        labels = self.model.predict(X_scaled)
        
        self.is_trained = True

        metrics = {
            'silhouette_score': float(silhouette_score(X_scaled, labels)),
            'davies_bouldin_index': float(davies_bouldin_score(X_scaled, labels)),
            'calinski_harabasz_index': float(calinski_harabasz_score(X_scaled, labels)),
        }

        return {
            'model_name': self.get_model_name(),
            'n_clusters': self.n_clusters,
            'n_samples': len(X),
            'metrics': metrics
        }

    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        X_scaled = self.preprocess(X, fit=False)
        labels = self.model.predict(X_scaled)
        
        probs = self.model.predict_proba(X_scaled)
        max_probs = np.max(probs, axis=1)
        distances = 1.0 - max_probs 
        return labels, distances
