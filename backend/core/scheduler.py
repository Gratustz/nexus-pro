from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from core.config import settings
import logging

logger = logging.getLogger(__name__)

# --- Create scheduler instance ---
scheduler = AsyncIOScheduler()


# --- Crypto job ---
async def run_crypto_engine():
    try:
        logger.info("Running Crypto Engine...")
        from engines.crypto_engine import CryptoEngine
        engine = CryptoEngine()
        result = await engine.run()
        logger.info(f"Crypto Engine completed: {result}")
    except Exception as e:
        logger.error(f"Crypto Engine error: {e}")


# --- Forex job ---
async def run_forex_engine():
    try:
        logger.info("Running Forex Engine...")
        from engines.forex_engine import ForexEngine
        engine = ForexEngine()
        result = await engine.run()
        logger.info(f"Forex Engine completed: {result}")
    except Exception as e:
        logger.error(f"Forex Engine error: {e}")


# --- Sports job ---
async def run_sports_engine():
    try:
        logger.info("Running Sports Engine...")
        from engines.sports_engine import SportsEngine
        engine = SportsEngine()
        result = await engine.run()
        logger.info(f"Sports Engine completed: {result}")
    except Exception as e:
        logger.error(f"Sports Engine error: {e}")


# --- Start all scheduled jobs ---
def start_scheduler():
    # Crypto — every 60 seconds
    scheduler.add_job(
        run_crypto_engine,
        trigger=IntervalTrigger(
            seconds=settings.CRYPTO_INTERVAL_SECONDS
        ),
        id="crypto_engine",
        name="Crypto Analysis Engine",
        replace_existing=True
    )

    # Forex — every 5 minutes
    scheduler.add_job(
        run_forex_engine,
        trigger=IntervalTrigger(
            seconds=settings.FOREX_INTERVAL_SECONDS
        ),
        id="forex_engine",
        name="Forex Analysis Engine",
        replace_existing=True
    )

    # Sports — every 30 minutes
    scheduler.add_job(
        run_sports_engine,
        trigger=IntervalTrigger(
            seconds=settings.SPORTS_INTERVAL_SECONDS
        ),
        id="sports_engine",
        name="Sports Analysis Engine",
        replace_existing=True
    )

    scheduler.start()
    logger.info("All engines scheduled and running.")


# --- Stop scheduler ---
def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped.")