from sqlalchemy import Column, String, Boolean, DateTime, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid
import enum


# --- Payment status enum ---
class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    FAILED = "failed"


# --- Billing cycle enum ---
class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


# --- Subscription model ---
class Subscription(Base):
    __tablename__ = "subscriptions"

    # --- Identity ---
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # --- Link to user ---
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # --- Plan details ---
    plan_name = Column(String, nullable=False)
    billing_cycle = Column(
        Enum(BillingCycle),
        default=BillingCycle.MONTHLY,
        nullable=False
    )
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")

    # --- Payment ---
    payment_status = Column(
        Enum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False
    )
    payment_reference = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)

    # --- Dates ---
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # --- Auto renew ---
    auto_renew = Column(Boolean, default=True)

    # --- Timestamps ---
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    # --- Relationship ---
    user = relationship("User", backref="subscriptions")

    def __repr__(self):
        return f"<Subscription {self.plan_name} — {self.payment_status}>"