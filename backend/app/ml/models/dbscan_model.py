"""
DBSCAN Clustering Model
"""

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from typing import Dict, Tuple
from app.ml.models.base_model import BaseClusteringModel

class DBSCANSegmenter(BaseClusteringModel):
    def __init__(self, eps: float = 1.5, min_samples: int = 15, random_state: int = 42):
        super().__init__(n_clusters=-1, random_state=random_state)
        self.scaler = StandardScaler()
        self.eps = eps
        self.min_samples = min_samples

    def get_model_name(self) -> str:
        return "DBSCAN"

    def preprocess(self, X: pd.DataFrame, fit: bool = True) -> np.ndarray:
        X_clean = X.fillna(X.median())
        if self.feature_names is None:
            self.feature_names = list(X_clean.columns)
        if fit:
            return self.scaler.fit_transform(X_clean)
        return self.scaler.transform(X_clean)

    def train(self, X: pd.DataFrame) -> Dict:
        X_scaled = self.preprocess(X, fit=True)
        self.model = DBSCAN(eps=self.eps, min_samples=self.min_samples)
        labels = self.model.fit_predict(X_scaled)
        
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        self.n_clusters = n_clusters
        self.is_trained = True

        if n_clusters > 1:
            mask = labels != -1
            if len(set(labels[mask])) > 1:
                sil_score = float(silhouette_score(X_scaled[mask], labels[mask]))
                db_score = float(davies_bouldin_score(X_scaled[mask], labels[mask]))
                ch_score = float(calinski_harabasz_score(X_scaled[mask], labels[mask]))
            else:
                sil_score, db_score, ch_score = 0.0, 0.0, 0.0
        else:
            sil_score, db_score, ch_score = 0.0, 0.0, 0.0

        metrics = {
            'silhouette_score': sil_score,
            'davies_bouldin_index': db_score,
            'calinski_harabasz_index': ch_score,
        }

        return {
            'model_name': self.get_model_name(),
            'n_clusters': self.n_clusters,
            'n_samples': len(X),
            'metrics': metrics
        }

    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        raise NotImplementedError("DBSCAN does not natively support predictions on new data.")
