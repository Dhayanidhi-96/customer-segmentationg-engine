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
    ModelInfo
)

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