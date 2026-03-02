"""
Base Model Class
Abstract base class for all clustering models
"""

from abc import ABC, abstractmethod
import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional
import joblib


class BaseClusteringModel(ABC):
    """
    Abstract base class for clustering models
    """
    
    def __init__(self, n_clusters: int = 5, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.is_trained = False
        
    @abstractmethod
    def train(self, X: pd.DataFrame) -> Dict:
        """Train the model"""
        pass
    
    @abstractmethod
    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Predict cluster labels"""
        pass
    
    @abstractmethod
    def get_model_name(self) -> str:
        """Return model name"""
        pass
    
    def save(self, filepath: str):
        """Save model to disk"""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'n_clusters': self.n_clusters,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"✅ Model saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str):
        """Load model from disk"""
        model_data = joblib.load(filepath)
        instance = cls(n_clusters=model_data['n_clusters'])
        instance.model = model_data['model']
        instance.scaler = model_data['scaler']
        instance.feature_names = model_data['feature_names']
        instance.is_trained = model_data['is_trained']
        print(f"✅ Model loaded from {filepath}")
        return instance