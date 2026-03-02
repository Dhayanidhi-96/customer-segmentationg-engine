"""
Initialize Database
Creates all tables in the database
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.customer import Customer

def init_database():
    """Initialize database by creating all tables"""
    print("Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database tables created successfully!")
    print(f"Database location: {engine.url}")

if __name__ == "__main__":
    init_database()