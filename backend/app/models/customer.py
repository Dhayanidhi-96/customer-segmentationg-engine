"""
Customer Database Model
SQLAlchemy ORM model for customer data
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class Customer(Base):
    """Customer model for storing customer information and features"""
    
    __tablename__ = "customers"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    
    # Basic Information
    name = Column(String, nullable=True)
    email = Column(String, index=True, nullable=True)
    phone = Column(String, nullable=True)
    
    # Demographics
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # RFM Features (Recency, Frequency, Monetary)
    recency_days = Column(Float, nullable=True)
    frequency = Column(Integer, nullable=True)
    monetary_value = Column(Float, nullable=True)
    
    # Behavioral Features
    avg_order_value = Column(Float, nullable=True)
    total_orders = Column(Integer, nullable=True)
    total_items_purchased = Column(Integer, nullable=True)
    
    # Engagement Features
    account_age_days = Column(Integer, nullable=True)
    email_open_rate = Column(Float, nullable=True)
    email_click_rate = Column(Float, nullable=True)
    
    # Segmentation Results
    segment_id = Column(Integer, nullable=True, index=True)
    segment_name = Column(String, nullable=True)
    segment_confidence = Column(Float, nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Customer(id={self.id}, customer_id={self.customer_id})>"