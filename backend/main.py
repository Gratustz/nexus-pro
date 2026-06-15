from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from core.config import settings
from core.database import init_db
from core.scheduler import start_scheduler, stop_scheduler
from routers import auth, signals, users, subscriptions

# --- Logging setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s"
)
logger = logging.getLogger(__name__)


# --- Startup and shutdown ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Nexus Pro API...")
    init_db()
    logger.info("Database tables created")
    start_scheduler()
    logger.info("Engines scheduler started")
    yield
    # Shutdown
    stop_scheduler()
    logger.info("Nexus Pro API shut down")


# --- Create FastAPI app ---
app = FastAPI(
    title="Nexus Pro API",
    description="Multi-market signal platform for Crypto, Forex and Sports",
    version="1.0.0",
    lifespan=lifespan
)


# --- CORS middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Include all routers ---
app.include_router(auth.router)
app.include_router(signals.router)
app.include_router(users.router)
app.include_router(subscriptions.router)


# --- Root endpoint ---
@app.get("/")
def root():
    return {
        "name": "Nexus Pro API",
        "version": "1.0.0",
        "status": "running",
        "markets": ["crypto", "forex", "sports"],
        "docs": "/docs"
    }


# --- Health check ---
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV
    }