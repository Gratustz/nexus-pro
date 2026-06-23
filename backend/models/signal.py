from sqlalchemy import Column, String, Float, DateTime, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from core.database import Base
import uuid
import enum


# --- Market type enum ---
class MarketType(str, enum.Enum):
    CRYPTO = "crypto"
    FOREX = "forex"
    SPORTS = "sports"


# --- Signal direction enum ---
class SignalDirection(str, enum.Enum):
    STRONG_BUY = "STRONG BUY"
    BUY = "BUY"
    HOLD = "HOLD"
    SELL = "SELL"
    STRONG_SELL = "STRONG SELL"


# --- Signal model ---
class Signal(Base):
    __tablename__ = "signals"

    # --- Identity ---
    id = Column(
        String(36),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # --- Market info ---
    market = Column(
        Enum(MarketType),
        nullable=False,
        index=True
    )
    symbol = Column(
        String,
        nullable=False,
        index=True
    )

    # --- Signal details ---
    direction = Column(
        Enum(SignalDirection),
        nullable=False
    )
    summary = Column(String, nullable=False)
    confidence = Column(Float, nullable=True)

    # --- Price info ---
    entry_price = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)

    # --- Raw indicator data ---
    indicators = Column(JSON, nullable=True)

    # --- AI generated summary ---
    ai_summary = Column(String, nullable=True)

    # --- Timeframe ---
    timeframe = Column(String, nullable=True)

    # --- Timestamps ---
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )
    expires_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    def __repr__(self):
        return f"<Signal {self.market} {self.symbol} — {self.direction}>"