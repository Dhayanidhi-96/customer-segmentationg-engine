"""
K-Means Clustering Model
Implementation of K-Means for customer segmentation
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from typing import Dict, Tuple
from app.ml.models.base_model import BaseClusteringModel


class KMeansSegmenter(BaseClusteringModel):
    """
    K-Means Clustering for Customer Segmentation
    """
    
    def __init__(self, n_clusters: int = 5, random_state: int = 42):
        super().__init__(n_clusters, random_state)
        self.scaler = StandardScaler()
    
    def get_model_name(self) -> str:
        return "K-Means"
    
    def find_optimal_clusters(self, X: pd.DataFrame, max_clusters: int = 10) -> int:
        """
        Find optimal number of clusters using silhouette score
        """
        print("🔍 Finding optimal number of clusters...")
        
        X_scaled = self.scaler.fit_transform(X)
        silhouette_scores = []
        
        K_range = range(2, max_clusters + 1)
        
        for k in K_range:
            kmeans = KMeans(n_clusters=k, random_state=self.random_state, n_init=10)
            labels = kmeans.fit_predict(X_scaled)
            score = silhouette_score(X_scaled, labels)
            silhouette_scores.append(score)
            print(f"  k={k}: silhouette_score={score:.3f}")
        
        optimal_k = K_range[np.argmax(silhouette_scores)]
        print(f"✅ Optimal number of clusters: {optimal_k}")
        
        return optimal_k
    
    def preprocess(self, X: pd.DataFrame, fit: bool = True) -> np.ndarray:
        """
        Preprocess features
        """
        # Handle missing values
        X_clean = X.fillna(X.median())
        
        # Store feature names
        if self.feature_names is None:
            self.feature_names = list(X_clean.columns)
        
        # Scale features
        if fit:
            X_scaled = self.scaler.fit_transform(X_clean)
        else:
            X_scaled = self.scaler.transform(X_clean)
        
        return X_scaled
    
    def train(self, X: pd.DataFrame, optimize_k: bool = False, max_clusters: int = 10) -> Dict:
        """
        Train K-Means model
        """
        print(f"\n{'='*60}")
        print(f"🤖 Training K-Means with {len(X)} samples...")
        print(f"{'='*60}\n")
        
        # Preprocess data
        X_scaled = self.preprocess(X, fit=True)
        
        # Find optimal k if requested
        if optimize_k:
            self.n_clusters = self.find_optimal_clusters(X, max_clusters)
        
        # Train model
        print(f"\n🔄 Training K-Means with {self.n_clusters} clusters...")
        self.model = KMeans(
            n_clusters=self.n_clusters,
            random_state=self.random_state,
            n_init=10,
            max_iter=300
        )
        
        labels = self.model.fit_predict(X_scaled)
        
        # Calculate metrics
        metrics = self._calculate_metrics(X_scaled, labels)
        
        # Create segment profiles
        segment_profiles = self._create_segment_profiles(X, labels)
        
        self.is_trained = True
        
        print(f"\n{'='*60}")
        print("✅ TRAINING COMPLETE!")
        print(f"{'='*60}")
        print(f"Silhouette Score: {metrics['silhouette_score']:.3f}")
        print(f"Davies-Bouldin Index: {metrics['davies_bouldin_index']:.3f}")
        print(f"Calinski-Harabasz Index: {metrics['calinski_harabasz_index']:.1f}")
        print(f"{'='*60}\n")
        
        results = {
            'model_name': self.get_model_name(),
            'n_clusters': self.n_clusters,
            'n_samples': len(X),
            'labels': labels.tolist(),
            'metrics': metrics,
            'segment_profiles': segment_profiles,
            'feature_names': self.feature_names
        }
        
        return results
    
    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict cluster labels for new data
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        X_scaled = self.preprocess(X, fit=False)
        labels = self.model.predict(X_scaled)
        
        # Calculate distances to cluster centers
        distances = self.model.transform(X_scaled)
        min_distances = np.min(distances, axis=1)
        
        return labels, min_distances
    
    def _calculate_metrics(self, X: np.ndarray, labels: np.ndarray) -> Dict:
        """Calculate clustering performance metrics"""
        metrics = {
            'silhouette_score': float(silhouette_score(X, labels)),
            'davies_bouldin_index': float(davies_bouldin_score(X, labels)),
            'calinski_harabasz_index': float(calinski_harabasz_score(X, labels)),
            'inertia': float(self.model.inertia_)
        }
        return metrics
    
    def _create_segment_profiles(self, X: pd.DataFrame, labels: np.ndarray) -> Dict:
        """
        Create detailed profiles for each segment
        """
        profiles = {}
        
        for cluster_id in range(self.n_clusters):
            mask = labels == cluster_id
            cluster_data = X[mask]
            
            profile = {
                'cluster_id': int(cluster_id),
                'size': int(mask.sum()),
                'percentage': float(mask.sum() / len(X) * 100),
                'statistics': {}
            }
            
            # Calculate feature statistics
            for feature in self.feature_names:
                if feature in cluster_data.columns:
                    profile['statistics'][feature] = {
                        'mean': float(cluster_data[feature].mean()),
                        'median': float(cluster_data[feature].median()),
                        'std': float(cluster_data[feature].std()),
                        'min': float(cluster_data[feature].min()),
                        'max': float(cluster_data[feature].max())
                    }
            
            profiles[f'segment_{cluster_id}'] = profile
        
        return profiles