from sqlalchemy import Column, String, Boolean, DateTime, Float, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
import uuid
import enum


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    FAILED = "failed"


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    user_id = Column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    plan_name = Column(String, nullable=False)
    billing_cycle = Column(
        Enum(BillingCycle),
        default=BillingCycle.MONTHLY,
        nullable=False
    )
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    payment_status = Column(
        Enum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False
    )
    payment_reference = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
    user = relationship("User", backref="subscriptions")

    def __repr__(self):
        return f"<Subscription {self.plan_name} — {self.payment_status}>"