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
from core.config import settings
import anthropic
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


# --- CRYPTO SIGNALS ---
@router.get("/crypto")
async def get_crypto_signals(
    live: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        from core.scheduler import get_cached, is_cache_valid, set_cached

        # Use cache if valid and not forced live
        if not live and is_cache_valid("crypto"):
            results = get_cached("crypto")
            logger.info(f"Serving crypto from cache — {len(results)} symbols")
        else:
            # Fetch fresh data
            logger.info("Fetching fresh crypto data...")
            engine = CryptoEngine()
            results = await engine.run()
            set_cached("crypto", results)

        # Filter by plan
        if current_user.plan == PlanType.FREE:
            allowed = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"]
        elif current_user.plan == PlanType.PRO:
            allowed = list(results.keys())[:20]
        else:
            allowed = list(results.keys())

        filtered = {k: v for k, v in results.items() if k in allowed}

        return {
            "market": "crypto",
            "plan": current_user.plan,
            "cached": not live and is_cache_valid("crypto"),
            "data": filtered
        }

    except Exception as e:
        logger.error(f"Crypto signals error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching crypto signals: {str(e)}"
        )


# --- FOREX SIGNALS ---
@router.get("/forex")
async def get_forex_signals(
    live: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_plan_access(current_user, PlanType.PRO)

    try:
        from core.scheduler import get_cached, is_cache_valid, set_cached

        if not live and is_cache_valid("forex"):
            results = get_cached("forex")
        else:
            engine = ForexEngine()
            results = await engine.run()
            set_cached("forex", results)

        return {
            "market": "forex",
            "plan": current_user.plan,
            "cached": not live and is_cache_valid("forex"),
            "data": results
        }

    except Exception as e:
        logger.error(f"Forex signals error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching forex signals: {str(e)}"
        )


# --- SPORTS SIGNALS ---
@router.get("/sports")
async def get_sports_signals(
    live: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_plan_access(current_user, PlanType.ELITE)

    try:
        from core.scheduler import get_cached, is_cache_valid, set_cached

        if not live and is_cache_valid("sports"):
            results = get_cached("sports")
        else:
            engine = SportsEngine()
            results = await engine.run()
            set_cached("sports", results)

        return {
            "market": "sports",
            "plan": current_user.plan,
            "cached": not live and is_cache_valid("sports"),
            "data": results
        }

    except Exception as e:
        logger.error(f"Sports signals error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sports signals: {str(e)}"
        )


# --- AI ANALYSIS ---
@router.post("/ai-analysis")
async def get_ai_analysis(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    try:
        symbol = request.get("symbol", "")
        timeframe = request.get("timeframe", "")
        indicators = request.get("indicators", {})
        signal = request.get("signal", "HOLD")
        stats = request.get("stats", {})
        extra_context = request.get("extra_context", "")

        prompt = f"""You are Nexus Pro — the best crypto trading analyst in Africa and the world.

Analyze {symbol.replace('USDT', '')}/USDT on the {timeframe} timeframe.

Current Signal: {signal}

Technical Indicators:
- Price: ${indicators.get('price')}
- RSI (14): {indicators.get('rsi')} {'(Oversold)' if float(indicators.get('rsi', 50)) < 30 else '(Overbought)' if float(indicators.get('rsi', 50)) > 70 else '(Neutral)'}
- Stochastic RSI: {indicators.get('stoch_rsi')}
- EMA 20: {indicators.get('ema20')} — Price is {'ABOVE' if indicators.get('above_ema20') else 'BELOW'}
- EMA 50: {indicators.get('ema50')} — Price is {'ABOVE' if indicators.get('above_ema50') else 'BELOW'}
- EMA 200: {indicators.get('ema200')} — Price is {'ABOVE' if indicators.get('above_ema200') else 'BELOW'}
- MACD: {indicators.get('macd')}
- MACD Signal: {indicators.get('macd_signal')}
- MACD Histogram: {indicators.get('macd_histogram')} {'(Bullish)' if float(indicators.get('macd_histogram', 0)) > 0 else '(Bearish)'}
- BB Upper: {indicators.get('bb_upper')}
- BB Mid: {indicators.get('bb_mid')}
- BB Lower: {indicators.get('bb_lower')}
- ATR: {indicators.get('atr')}
- VWAP: {indicators.get('vwap')} — Price is {'ABOVE' if indicators.get('above_vwap') else 'BELOW'}
- 24h Change: {stats.get('price_change_pct')}%
- 24h High: ${stats.get('high_24h')}
- 24h Low: ${stats.get('low_24h')}
- Volume: {stats.get('volume_24h')}

{extra_context}

Provide a comprehensive professional trading analysis:

1. SIGNAL SUMMARY — State the signal clearly and why
2. TECHNICAL ANALYSIS — Explain what the indicators are saying
3. KEY LEVELS — Support and resistance levels
4. TRADE SETUP — Entry point, Stop Loss and Take Profit
5. RISK ASSESSMENT — Risk level and explanation
6. MARKET CONTEXT — Broader market context
7. RECOMMENDATION — Clear actionable advice

Write like the best trader in Africa — clear, confident, professional."""

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