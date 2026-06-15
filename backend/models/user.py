from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from core.database import Base
import uuid
import enum


# --- Subscription plan enum ---
class PlanType(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ELITE = "elite"


# --- User model ---
class User(Base):
    __tablename__ = "users"

    # --- Identity ---
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)

    # --- Status ---
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    # --- Subscription ---
    plan = Column(
        Enum(PlanType),
        default=PlanType.FREE,
        nullable=False
    )

    # --- Timestamps ---
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    def __repr__(self):
        return f"<User {self.email} — {self.plan}>"