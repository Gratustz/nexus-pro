from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from core.config import settings
import logging
import time

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# --- Global signal cache ---
signal_cache = {
    "crypto": {},
    "forex": {},
    "sports": {},
    "crypto_updated_at": 0,
    "forex_updated_at": 0,
    "sports_updated_at": 0,
}

CACHE_TTL = 20  # seconds


def is_cache_valid(market: str) -> bool:
    updated_at = signal_cache.get(f"{market}_updated_at", 0)
    return (time.time() - updated_at) < CACHE_TTL


def get_cached(market: str) -> dict:
    return signal_cache.get(market, {})


def set_cached(market: str, data: dict):
    signal_cache[market] = data
    signal_cache[f"{market}_updated_at"] = time.time()


async def run_crypto_engine():
    try:
        logger.info("Running Crypto Engine...")
        from engines.crypto_engine import CryptoEngine
        engine = CryptoEngine()
        result = await engine.run()
        set_cached("crypto", result)
        logger.info(f"Crypto Engine completed: {len(result)} symbols cached")
    except Exception as e:
        logger.error(f"Crypto Engine error: {e}")


async def run_forex_engine():
    try:
        logger.info("Running Forex Engine...")
        from engines.forex_engine import ForexEngine
        engine = ForexEngine()
        result = await engine.run()
        set_cached("forex", result)
        logger.info(f"Forex Engine completed: {len(result)} pairs cached")
    except Exception as e:
        logger.error(f"Forex Engine error: {e}")


async def run_sports_engine():
    try:
        logger.info("Running Sports Engine...")
        from engines.sports_engine import SportsEngine
        engine = SportsEngine()
        result = await engine.run()
        set_cached("sports", result)
        logger.info(f"Sports Engine completed: {len(result)} matches cached")
    except Exception as e:
        logger.error(f"Sports Engine error: {e}")


def start_scheduler():
    scheduler.add_job(
        run_crypto_engine,
        trigger=IntervalTrigger(seconds=settings.CRYPTO_INTERVAL_SECONDS),
        id="crypto_engine",
        name="Crypto Analysis Engine",
        replace_existing=True
    )
    scheduler.add_job(
        run_forex_engine,
        trigger=IntervalTrigger(seconds=settings.FOREX_INTERVAL_SECONDS),
        id="forex_engine",
        name="Forex Analysis Engine",
        replace_existing=True
    )
    scheduler.add_job(
        run_sports_engine,
        trigger=IntervalTrigger(seconds=settings.SPORTS_INTERVAL_SECONDS),
        id="sports_engine",
        name="Sports Analysis Engine",
        replace_existing=True
    )
    scheduler.start()
    logger.info("All engines scheduled and running.")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped.")