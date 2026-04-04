"""
Email dispatch logging model for campaign tracking and deduplication.
"""

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class EmailDispatchLog(Base):
    """Tracks campaign email delivery attempts and statuses."""

    __tablename__ = "email_dispatch_logs"
    __table_args__ = (
        UniqueConstraint("campaign_id", "email", name="uq_campaign_email"),
    )

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(String, index=True, nullable=False)
    customer_id = Column(String, index=True, nullable=True)
    email = Column(String, index=True, nullable=False)
    segment_name = Column(String, nullable=True)

    subject = Column(String, nullable=False)
    body_preview = Column(Text, nullable=True)

    delivery_status = Column(String, index=True, nullable=False)
    provider_message = Column(String, nullable=True)
    is_duplicate = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
