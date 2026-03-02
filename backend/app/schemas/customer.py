"""
Customer Pydantic Schemas
Data validation and serialization
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    """Base customer schema"""
    customer_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    recency_days: Optional[float] = None
    frequency: Optional[int] = None
    monetary_value: Optional[float] = None
    avg_order_value: Optional[float] = None
    total_orders: Optional[int] = None
    total_items_purchased: Optional[int] = None
    account_age_days: Optional[int] = None
    email_open_rate: Optional[float] = None
    email_click_rate: Optional[float] = None


class CustomerCreate(CustomerBase):
    """Schema for creating a customer"""
    pass


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    segment_id: Optional[int] = None
    segment_name: Optional[str] = None


class CustomerResponse(CustomerBase):
    """Schema for customer response"""
    id: int
    segment_id: Optional[int] = None
    segment_name: Optional[str] = None
    segment_confidence: Optional[float] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CustomerList(BaseModel):
    """Schema for list of customers"""
    total: int
    customers: list[CustomerResponse]