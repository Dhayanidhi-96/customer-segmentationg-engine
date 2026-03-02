"""
Segmentation Pydantic Schemas
"""

from pydantic import BaseModel
from typing import Dict, List, Optional


class PredictionRequest(BaseModel):
    """Request schema for single prediction"""
    recency_days: float
    frequency: int
    monetary_value: float
    avg_order_value: float
    total_items_purchased: int
    account_age_days: int
    email_open_rate: float
    email_click_rate: float


class PredictionResponse(BaseModel):
    """Response schema for prediction"""
    segment_id: int
    segment_name: str
    confidence: float


class BatchPredictionResponse(BaseModel):
    """Response schema for batch prediction"""
    message: str
    total_customers: int
    updated: int
    segments: Dict[str, int]


class ModelInfo(BaseModel):
    """Model information schema"""
    model_name: str
    n_clusters: int
    features: List[str]
    is_trained: bool


class SegmentProfile(BaseModel):
    """Segment profile schema"""
    segment_id: int
    size: int
    percentage: float
    avg_recency: float
    avg_frequency: float
    avg_monetary: float
    total_revenue: float