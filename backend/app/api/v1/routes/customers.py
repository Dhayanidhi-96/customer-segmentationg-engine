"""
Customer API Routes
CRUD operations for customers
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerResponse, CustomerList, CustomerCreate, CustomerUpdate

router = APIRouter()


@router.get("/", response_model=CustomerList)
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    segment_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of customers with pagination
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **segment_id**: Filter by segment ID (optional)
    """
    query = db.query(Customer)
    
    # Filter by segment if provided
    if segment_id is not None:
        query = query.filter(Customer.segment_id == segment_id)
    
    # Get total count
    total = query.count()
    
    # Get customers with pagination
    customers = query.offset(skip).limit(limit).all()
    
    return CustomerList(total=total, customers=customers)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    """
    Get a specific customer by customer_id
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer


@router.get("/id/{id}", response_model=CustomerResponse)
def get_customer_by_id(id: int, db: Session = Depends(get_db)):
    """
    Get a specific customer by database ID
    """
    customer = db.query(Customer).filter(Customer.id == id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer


@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """
    Create a new customer
    """
    # Check if customer_id already exists
    existing = db.query(Customer).filter(Customer.customer_id == customer.customer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer ID already exists")
    
    # Create new customer
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return db_customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a customer
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update fields
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    """
    Delete a customer (soft delete - sets is_active to False)
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Soft delete
    customer.is_active = False
    db.commit()
    
    return {"message": "Customer deleted successfully", "customer_id": customer_id}


@router.get("/stats/overview")
def get_customer_stats(db: Session = Depends(get_db)):
    """
    Get overview statistics of customers
    """
    from sqlalchemy import func
    
    total_customers = db.query(Customer).filter(Customer.is_active == True).count()
    
    # Calculate aggregates
    stats = db.query(
        func.avg(Customer.recency_days).label('avg_recency'),
        func.avg(Customer.frequency).label('avg_frequency'),
        func.avg(Customer.monetary_value).label('avg_monetary'),
        func.sum(Customer.monetary_value).label('total_revenue')
    ).filter(Customer.is_active == True).first()
    
    return {
        "total_customers": total_customers,
        "avg_recency_days": round(stats.avg_recency, 2) if stats.avg_recency else 0,
        "avg_frequency": round(stats.avg_frequency, 2) if stats.avg_frequency else 0,
        "avg_monetary_value": round(stats.avg_monetary, 2) if stats.avg_monetary else 0,
        "total_revenue": round(stats.total_revenue, 2) if stats.total_revenue else 0
    }