from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- APP ---
    APP_NAME: str = "Nexus Pro"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "nexuspro-secret-change-this-in-production"

    # --- DATABASE ---
    DATABASE_URL: str = "sqlite:///./nexuspro.db"

    # --- JWT ---
    JWT_SECRET_KEY: str = "nexuspro-jwt-secret-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # --- BINANCE ---
    BINANCE_API_KEY: str = "your_binance_api_key_here"
    BINANCE_SECRET_KEY: str = "your_binance_secret_key_here"

    # --- ALPHA VANTAGE ---
    ALPHA_VANTAGE_API_KEY: str = "your_alpha_vantage_api_key_here"

    # --- ANTHROPIC AI ---
    ANTHROPIC_API_KEY: str = "your_anthropic_api_key_here"

    # --- CORS ---
    FRONTEND_URL: str = "http://localhost:3000"

    # --- SCHEDULER ---
    CRYPTO_INTERVAL_SECONDS: int = 60
    FOREX_INTERVAL_SECONDS: int = 300
    SPORTS_INTERVAL_SECONDS: int = 1800

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()