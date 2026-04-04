"""
Configuration Management
Handles environment variables and application settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Customer Segmentation Engine"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Security
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./segmentation.db"
    
    # ML Model Settings
    MODEL_STORAGE_PATH: str = "models/saved"
    DEFAULT_CLUSTERING_ALGORITHM: str = "kmeans"
    MAX_CLUSTERS: int = 10
    MIN_SAMPLES_PER_CLUSTER: int = 50
    
    # Feature Engineering
    AUTO_FEATURE_ENGINEERING: bool = True
    FEATURE_SELECTION_THRESHOLD: float = 0.05
    
    # AutoML
    OPTUNA_N_TRIALS: int = 50
    OPTUNA_TIMEOUT: int = 1800
    
    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: List[str] = ["csv", "xlsx", "json"]
    
    # Optional Third-Party Services
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROQ_FALLBACK_MODELS: List[str] = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
    ]

    # Optional SMTP settings for campaign sending
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = "noreply@segmentiq.local"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
