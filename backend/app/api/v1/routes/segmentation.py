"""
Segmentation API Routes
Endpoints for customer segmentation predictions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.services.segmentation_service import segmentation_service
from app.schemas.segmentation import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionResponse,
    ModelInfo,
    ExplanationResponse,
    ModelComparisonResponse,
    EmailGenerationResponse,
    AIChatRequest,
    AIChatResponse,
    DiscountCampaignRequest,
    DiscountCampaignResponse,
    CampaignStatusResponse,
)
from app.services.ai_chat_service import ai_chat_service
from app.services.email_generation_service import email_generator

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict_segment(request: PredictionRequest):
    """
    Predict segment for a single customer based on features
    
    Provide customer features and get segment prediction with confidence score
    """
    try:
        result = segmentation_service.predict_segment(request.model_dump())
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/predict-batch", response_model=BatchPredictionResponse)
def predict_batch(
    limit: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Predict segments for all customers in database
    
    Updates all customer records with their predicted segments
    """
    try:
        result = segmentation_service.predict_batch(db, limit)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@router.post("/retrain")
def retrain_model(db: Session = Depends(get_db)):
    """
    Trigger AutoML to dynamically optimize, retrain, and deploy 
    a newly calibrated champion K-Means model for production.
    """
    try:
        from app.services.segmentation_service import segmentation_service
        result = segmentation_service.retrain_model(db)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")


@router.get("/model-info", response_model=ModelInfo)
def get_model_info():
    """
    Get information about the loaded segmentation model
    """
    try:
        return segmentation_service.get_model_info()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/segment-profiles")
def get_segment_profiles(db: Session = Depends(get_db)):
    """
    Get profile statistics for each segment
    
    Returns detailed statistics about customers in each segment
    """
    try:
        return segmentation_service.get_segment_profiles(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/explain/{customer_id}", response_model=ExplanationResponse)
def explain_customer_segment(customer_id: str, db: Session = Depends(get_db)):
    """
    Get SHAP explanation for a customer's segmentation
    """
    from app.models.customer import Customer
    customer = db.query(Customer).filter(Customer.customer_id == customer_id, Customer.is_active == True).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    try:
        from app.ml.explainability.shap_explainer import shap_explainer
        
        # Extract features
        from app.services.segmentation_service import segmentation_service
        if segmentation_service.model is None:
            segmentation_service.load_model()
            
        feature_columns = segmentation_service.model.feature_names
        customer_data = {col: getattr(customer, col, 0) for col in feature_columns}
        
        result = shap_explainer.explain_prediction(customer_data)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation error: {str(e)}")


@router.get("/compare-models", response_model=ModelComparisonResponse)
def compare_models(db: Session = Depends(get_db)):
    """
    Run a live comparison of KMeans, DBSCAN, and GMM algorithms.
    """
    import time
    import pandas as pd
    from app.models.customer import Customer
    from app.ml.models.kmeans_model import KMeansSegmenter
    from app.ml.models.dbscan_model import DBSCANSegmenter
    from app.ml.models.gmm_model import GMMSegmenter
    
    customers = db.query(Customer).filter(Customer.is_active == True).limit(2000).all()
    if not customers:
        raise HTTPException(status_code=400, detail="No data available for testing")
        
    feature_columns = ['recency_days', 'frequency', 'monetary_value', 'avg_order_value', 'total_items_purchased', 'account_age_days', 'email_open_rate', 'email_click_rate']
    
    data = [{col: getattr(c, col, 0) for col in feature_columns} for c in customers]
    X = pd.DataFrame(data)
    results = []
    
    # 1. K-Means
    start = time.time()
    from app.config import settings
    kmeans = KMeansSegmenter(n_clusters=settings.MAX_CLUSTERS)
    k_res = kmeans.train(X, optimize_k=True, max_clusters=settings.MAX_CLUSTERS)
    k_time = (time.time() - start) * 1000
    results.append({
        "model_name": "K-Means",
        "silhouette_score": k_res['metrics']['silhouette_score'],
        "davies_bouldin": k_res['metrics']['davies_bouldin_index'],
        "calinski_harabasz": k_res['metrics']['calinski_harabasz_index'],
        "n_clusters": k_res['n_clusters'],
        "training_time_ms": k_time
    })
    
    # 2. GMM
    start = time.time()
    gmm = GMMSegmenter(n_clusters=6)
    gmm_res = gmm.train(X)
    gmm_time = (time.time() - start) * 1000
    results.append({
        "model_name": "Gaussian Mixture Model (GMM)",
        "silhouette_score": gmm_res['metrics']['silhouette_score'],
        "davies_bouldin": gmm_res['metrics']['davies_bouldin_index'],
        "calinski_harabasz": gmm_res['metrics']['calinski_harabasz_index'],
        "n_clusters": gmm_res['n_clusters'],
        "training_time_ms": gmm_time
    })
    
    # 3. DBSCAN
    start = time.time()
    dbscan = DBSCANSegmenter(eps=1.2, min_samples=10)
    db_res = dbscan.train(X)
    db_time = (time.time() - start) * 1000
    results.append({
        "model_name": "DBSCAN",
        "silhouette_score": db_res['metrics']['silhouette_score'],
        "davies_bouldin": db_res['metrics']['davies_bouldin_index'],
        "calinski_harabasz": db_res['metrics']['calinski_harabasz_index'],
        "n_clusters": db_res['n_clusters'],
        "training_time_ms": db_time
    })
    
    return {
        "sample_size": len(X),
        "models": results
    }


@router.get("/generate-email/{customer_id}", response_model=EmailGenerationResponse)
def generate_customer_email(customer_id: str, db: Session = Depends(get_db)):
    """
    Generate a personalized marketing email for the customer using Generative AI (or simulated fallback)
    """
    from app.models.customer import Customer
    customer = db.query(Customer).filter(Customer.customer_id == customer_id, Customer.is_active == True).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    try:
        return email_generator.generate_email(customer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email generation error: {str(e)}")


@router.post("/ai-chat", response_model=AIChatResponse)
def chat_with_ai_analyst(payload: AIChatRequest, db: Session = Depends(get_db)):
    """
    Chat with AI analyst about segmentation and campaign insights.
    Uses Groq when configured, otherwise local fallback.
    """
    try:
        return ai_chat_service.ask(db, payload.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")


@router.post("/campaigns/discount/send", response_model=DiscountCampaignResponse)
def send_discount_campaign(payload: DiscountCampaignRequest, db: Session = Depends(get_db)):
    """
    Send or simulate discount campaign to segmented customers.
    Handles duplicate emails and records send status logs.
    """
    try:
        return email_generator.send_discount_campaign(
            db=db,
            segment_name=payload.segment_name,
            discount_percent=payload.discount_percent,
            discount_code=payload.discount_code,
            campaign_id=payload.campaign_id,
            limit=payload.limit,
            dry_run=payload.dry_run,
            force_resend=payload.force_resend,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Campaign send error: {str(e)}")


@router.get("/campaigns/status", response_model=CampaignStatusResponse)
def get_campaign_status(
    campaign_id: Optional[str] = None,
    email: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Check campaign send status by campaign ID and/or recipient email.
    """
    try:
        return email_generator.get_campaign_status(db=db, campaign_id=campaign_id, email=email, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Campaign status error: {str(e)}")