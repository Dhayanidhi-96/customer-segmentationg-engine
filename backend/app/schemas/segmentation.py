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


class FeatureExplanation(BaseModel):
    """Individual feature contribution to SHAP score"""
    feature: str
    value: float
    contribution: float


class ExplanationResponse(BaseModel):
    """Full SHAP explanation response"""
    target_cluster: int
    base_value: float
    feature_explanations: List[FeatureExplanation]


class ModelComparisonItem(BaseModel):
    """Single model metrics for comparison lab"""
    model_name: str
    silhouette_score: float
    davies_bouldin: float
    calinski_harabasz: float
    n_clusters: int
    training_time_ms: float

class ModelComparisonResponse(BaseModel):
    """Full model comparison lab response"""
    sample_size: int
    models: List[ModelComparisonItem]


class EmailGenerationResponse(BaseModel):
    """Email generation response from Generative AI"""
    subject: str
    body: str
    is_simulated: bool


class AIChatRequest(BaseModel):
    """Request payload for AI analyst chat."""
    message: str


class AIChatResponse(BaseModel):
    """Response payload for AI analyst chat."""
    answer: str
    used_groq: bool
    fallback_reason: Optional[str] = None


class DiscountCampaignRequest(BaseModel):
    """Request for sending discount campaigns to segmented customers."""
    segment_name: Optional[str] = None
    discount_percent: float = 10.0
    discount_code: Optional[str] = None
    campaign_id: Optional[str] = None
    limit: Optional[int] = None
    dry_run: bool = False
    force_resend: bool = False


class CampaignDispatchLogItem(BaseModel):
    """Individual campaign dispatch log line."""
    campaign_id: str
    customer_id: Optional[str]
    email: str
    segment_name: Optional[str]
    delivery_status: str
    is_duplicate: bool
    provider_message: Optional[str]
    created_at: Optional[str]


class DiscountCampaignResponse(BaseModel):
    """Outcome of a discount campaign send operation."""
    campaign_id: str
    target_segment: str
    total_candidates: int
    valid_emails: int
    sent: int
    simulated: int
    skipped_duplicates: int
    failed: int


class CampaignStatusResponse(BaseModel):
    """Status summary and recent logs for campaign/email checks."""
    campaign_id: Optional[str]
    email: Optional[str]
    total_logs: int
    sent: int
    simulated: int
    skipped_duplicates: int
    failed: int
    items: List[CampaignDispatchLogItem]