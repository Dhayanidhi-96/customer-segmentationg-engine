"""
Main FastAPI Application
Customer Segmentation Engine
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.database import engine, Base

# Import routers
from app.api.v1.routes.customers import router as customers_router
from app.api.v1.routes.segmentation import router as segmentation_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Advanced Customer Segmentation Engine with ML",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    customers_router,
    prefix=f"{settings.API_V1_PREFIX}/customers",
    tags=["Customers"]
)

app.include_router(
    segmentation_router,
    prefix=f"{settings.API_V1_PREFIX}/segmentation",
    tags=["Segmentation"]
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Customer Segmentation Engine API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Execute on application startup"""
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Environment: {settings.ENVIRONMENT}")
    print(f"🔧 Debug mode: {settings.DEBUG}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Execute on application shutdown"""
    print(f"👋 Shutting down {settings.APP_NAME}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )