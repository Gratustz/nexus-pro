from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from routers.auth import get_current_user
from models.user import User, PlanType
from models.signal import Signal, MarketType
from engines.crypto_engine import CryptoEngine
from engines.forex_engine import ForexEngine
from engines.sports_engine import SportsEngine
from engines.ai_signal import AISignal
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/signals", tags=["Signals"])


# --- Plan access control ---
def check_plan_access(user: User, required_plan: PlanType):
    plan_hierarchy = {
        PlanType.FREE: 0,
        PlanType.PRO: 1,
        PlanType.ELITE: 2
    }

    user_level = plan_hierarchy.get(user.plan, 0)
    required_level = plan_hierarchy.get(required_plan, 0)

    if user_level < required_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This feature requires {required_plan} plan or higher"
        )


# --- Get latest signals from DB ---
def get_latest_signals(db: Session, market: MarketType, limit: int = 20):
    return db.query(Signal).filter(
        Signal.market == market
    ).order_by(
        Signal.created_at.desc()
    ).limit(limit).all()


# --- CRYPTO SIGNALS ---
@router.get("/crypto")
async def get_crypto_signals(
    live: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Free users get limited symbols
        if current_user.plan == PlanType.FREE:
            allowed_symbols = ["BTCUSDT", "ETHUSDT"]
        elif current_user.plan == PlanType.PRO:
            allowed_symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]
        else:
            allowed_symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"]

        if live:
            # Run live analysis
            engine = CryptoEngine()
            results = await engine.run()

            # Add AI summaries for PRO and ELITE
            if current_user.plan != PlanType.FREE:
                ai = AISignal()
                results = await ai.enrich_crypto_signals(results)

            # Filter by plan
            filtered = {
                k: v for k, v in results.items()
                if k in allowed_symbols
            }

            return {
                "market": "crypto",
                "plan": current_user.plan,
                "data": filtered
            }

        # Return cached signals from DB
        signals = get_latest_signals(db, MarketType.CRYPTO)

        return {
            "market": "crypto",
            "plan": current_user.plan,
            "data": [
                {
                    "id": str(s.id),
                    "symbol": s.symbol,
                    "direction": s.direction,
                    "summary": s.summary,
                    "ai_summary": s.ai_summary,
                    "entry_price": s.entry_price,
                    "take_profit": s.take_profit,
                    "stop_loss": s.stop_loss,
                    "timeframe": s.timeframe,
                    "confidence": s.confidence,
                    "indicators": s.indicators,
                    "created_at": s.created_at
                }
                for s in signals
                if s.symbol in allowed_symbols
            ]
        }

    except Exception as e:
        logger.error(f"Crypto signals error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching crypto signals"
        )


# --- FOREX SIGNALS ---
@router.get("/forex")
async def get_forex_signals(
    live: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Forex is PRO and above only
    check_plan_access(current_user, PlanType.PRO)

    try:
        if live:
            engine = ForexEngine()
            results = await engine.run()

            # Add AI summaries for ELITE
            if current_user.plan == PlanType.ELITE:
                ai = AISignal()
                results = await ai.enrich_forex_signals(results)

            return {
                "market": "forex",
                "plan": current_user.plan,
                "data": results
            }

        # Return cached signals from DB
        signals = get_latest_signals(db, MarketType.FOREX)

        return {
            "market": "forex",
            "plan": current_user.plan,
            "data": [
                {
                    "id": str(s.id),
                    "symbol": s.symbol,
                    "direction": s.direction,
                    "summary": s.summary,
                    "ai_summary": s.ai_summary,
                    "entry_price": s.entry_price,
                    "timeframe": s.timeframe,
                    "confidence": s.confidence,
                    "indicators": s.indicators,
                    "created_at": s.created_at
                }
                for s in signals
            ]
        }

    except Exception as e:
        logger.error(f"Forex signals error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching forex signals"
        )


# --- SPORTS SIGNALS ---
@router.get("/sports")
async def get_sports_signals(
    live: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Sports is ELITE only
    check_plan_access(current_user, PlanType.ELITE)

    try:
        if live:
            engine = SportsEngine()
            results = await engine.run()

            # Always add AI for ELITE
            ai = AISignal()
            results = await ai.enrich_sports_signals(results)

            return {
                "market": "sports",
                "plan": current_user.plan,
                "data": results
            }

        # Return cached signals from DB
        signals = get_latest_signals(db, MarketType.SPORTS)

        return {
            "market": "sports",
            "plan": current_user.plan,
            "data": [
                {
                    "id": str(s.id),
                    "symbol": s.symbol,
                    "direction": s.direction,
                    "summary": s.summary,
                    "ai_summary": s.ai_summary,
                    "confidence": s.confidence,
                    "indicators": s.indicators,
                    "created_at": s.created_at
                }
                for s in signals
            ]
        }

    except Exception as e:
        logger.error(f"Sports signals error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching sports signals"
        )
    # --- AI Analysis endpoint ---
@router.post("/ai-analysis")
async def get_ai_analysis(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    try:
        from engines.ai_signal import AISignal
        ai = AISignal()

        symbol = request.get("symbol", "")
        timeframe = request.get("timeframe", "")
        indicators = request.get("indicators", {})
        signal = request.get("signal", "HOLD")
        stats = request.get("stats", {})

        prompt = f"""You are Nexus Pro — the best crypto trading analyst in Africa and the world.

Analyze {symbol.replace('USDT', '')}/USDT on the {timeframe} timeframe.

Current Signal: {signal}

Technical Indicators:
- Price: ${indicators.get('price')}
- RSI (14): {indicators.get('rsi')} {'(Oversold)' if indicators.get('rsi', 50) < 30 else '(Overbought)' if indicators.get('rsi', 50) > 70 else '(Neutral)'}
- Stochastic RSI: {indicators.get('stoch_rsi')}
- EMA 20: {indicators.get('ema20')} — Price is {'ABOVE' if indicators.get('above_ema20') else 'BELOW'}
- EMA 50: {indicators.get('ema50')} — Price is {'ABOVE' if indicators.get('above_ema50') else 'BELOW'}
- EMA 200: {indicators.get('ema200')} — Price is {'ABOVE' if indicators.get('above_ema200') else 'BELOW'}
- MACD: {indicators.get('macd')}
- MACD Signal: {indicators.get('macd_signal')}
- MACD Histogram: {indicators.get('macd_histogram')} {'(Bullish)' if indicators.get('macd_histogram', 0) > 0 else '(Bearish)'}
- Bollinger Upper: {indicators.get('bb_upper')}
- Bollinger Mid: {indicators.get('bb_mid')}
- Bollinger Lower: {indicators.get('bb_lower')}
- ATR: {indicators.get('atr')}
- VWAP: {indicators.get('vwap')} — Price is {'ABOVE' if indicators.get('above_vwap') else 'BELOW'}
- 24h Change: {stats.get('price_change_pct')}%
- 24h High: ${stats.get('high_24h')}
- 24h Low: ${stats.get('low_24h')}
- Volume: {stats.get('volume_24h')}

Provide a comprehensive professional trading analysis with:

1. SIGNAL SUMMARY — State the signal clearly and why
2. TECHNICAL ANALYSIS — Explain what the indicators are saying
3. KEY LEVELS — Identify support and resistance levels
4. TRADE SETUP — Entry point, Stop Loss and Take Profit levels
5. RISK ASSESSMENT — Risk level (Low/Medium/High) and explanation
6. MARKET CONTEXT — What is happening in the broader market
7. RECOMMENDATION — Clear actionable advice for a trader

Write like the best trader in Africa — clear, confident, professional and actionable."""

        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )

        return {"analysis": message.content[0].text}

    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )