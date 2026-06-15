import asyncio
import pandas as pd
import numpy as np
import requests
import websockets
import json
import logging
from datetime import datetime
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import EMAIndicator, MACD
from ta.volatility import BollingerBands, AverageTrueRange
from core.config import settings

logger = logging.getLogger(__name__)

# --- Symbols to analyze ---
SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"]

# --- Timeframes ---
TIMEFRAMES = {
    "1m":  "1m",
    "5m":  "5m",
    "15m": "15m",
    "1h":  "1h",
    "4h":  "4h",
    "1d":  "1d",
}


class CryptoEngine:

    def __init__(self):
        self.base_url = "https://api.binance.com/api/v3"
        self.results = {}

    def fetch_klines(self, symbol: str, interval: str, limit: int = 200):
        try:
            url = f"{self.base_url}/klines"
            params = {
                "symbol": symbol,
                "interval": interval,
                "limit": limit
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            df = pd.DataFrame(data, columns=[
                "timestamp", "open", "high", "low", "close", "volume",
                "close_time", "quote_volume", "trades",
                "taker_buy_base", "taker_buy_quote", "ignore"
            ])

            df["close"] = pd.to_numeric(df["close"])
            df["high"] = pd.to_numeric(df["high"])
            df["low"] = pd.to_numeric(df["low"])
            df["open"] = pd.to_numeric(df["open"])
            df["volume"] = pd.to_numeric(df["volume"])
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")

            return df

        except Exception as e:
            logger.error(f"Error fetching klines for {symbol} {interval}: {e}")
            return None

    def calculate_indicators(self, df: pd.DataFrame) -> dict:
        try:
            close = df["close"]
            high = df["high"]
            low = df["low"]
            volume = df["volume"]

            # RSI
            rsi = RSIIndicator(close=close, window=14)
            rsi_value = round(rsi.rsi().iloc[-1], 2)

            # Stochastic RSI
            stoch = StochasticOscillator(
                high=high, low=low, close=close, window=14
            )
            stoch_value = round(stoch.stoch().iloc[-1], 2)

            # EMA 200
            ema200 = EMAIndicator(close=close, window=200)
            ema200_value = round(ema200.ema_indicator().iloc[-1], 4)

            # EMA 50
            ema50 = EMAIndicator(close=close, window=50)
            ema50_value = round(ema50.ema_indicator().iloc[-1], 4)

            # Bollinger Bands
            bb = BollingerBands(close=close, window=20, window_dev=2)
            bb_upper = round(bb.bollinger_hband().iloc[-1], 4)
            bb_lower = round(bb.bollinger_lband().iloc[-1], 4)
            bb_mid = round(bb.bollinger_mavg().iloc[-1], 4)

            # ATR
            atr = AverageTrueRange(high=high, low=low, close=close, window=14)
            atr_value = round(atr.average_true_range().iloc[-1], 4)

            # MACD
            macd = MACD(close=close)
            macd_value = round(macd.macd().iloc[-1], 4)
            macd_signal = round(macd.macd_signal().iloc[-1], 4)

            # VWAP
            vwap = round(
                (close * volume).cumsum() / volume.cumsum(), 4
            ).iloc[-1]

            # Current price
            current_price = round(close.iloc[-1], 4)

            return {
                "price": current_price,
                "rsi": rsi_value,
                "stoch_rsi": stoch_value,
                "ema50": ema50_value,
                "ema200": ema200_value,
                "bb_upper": bb_upper,
                "bb_mid": bb_mid,
                "bb_lower": bb_lower,
                "atr": atr_value,
                "macd": macd_value,
                "macd_signal": macd_signal,
                "vwap": vwap,
                "above_ema200": current_price > ema200_value,
                "above_vwap": current_price > vwap,
            }

        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return {}

    def generate_signal(self, indicators: dict) -> str:
        score = 0

        rsi = indicators.get("rsi", 50)
        price = indicators.get("price", 0)
        ema200 = indicators.get("ema200", 0)
        ema50 = indicators.get("ema50", 0)
        bb_lower = indicators.get("bb_lower", 0)
        bb_upper = indicators.get("bb_upper", 0)
        macd = indicators.get("macd", 0)
        macd_signal = indicators.get("macd_signal", 0)
        above_vwap = indicators.get("above_vwap", False)

        if rsi < 30:
            score += 2
        elif rsi < 45:
            score += 1
        elif rsi > 70:
            score -= 2
        elif rsi > 55:
            score -= 1

        if price > ema200:
            score += 2
        else:
            score -= 2

        if price > ema50:
            score += 1
        else:
            score -= 1

        if price <= bb_lower:
            score += 2
        elif price >= bb_upper:
            score -= 2

        if macd > macd_signal:
            score += 1
        else:
            score -= 1

        if above_vwap:
            score += 1
        else:
            score -= 1

        if score >= 5:
            return "STRONG BUY"
        elif score >= 2:
            return "BUY"
        elif score <= -5:
            return "STRONG SELL"
        elif score <= -2:
            return "SELL"
        else:
            return "HOLD"

    async def run(self) -> dict:
        results = {}

        for symbol in SYMBOLS:
            symbol_data = {}

            for tf_name, tf_value in TIMEFRAMES.items():
                df = self.fetch_klines(symbol, tf_value)

                if df is not None and len(df) > 50:
                    indicators = self.calculate_indicators(df)
                    signal = self.generate_signal(indicators)

                    symbol_data[tf_name] = {
                        "signal": signal,
                        "indicators": indicators,
                        "analyzed_at": datetime.utcnow().isoformat()
                    }

            results[symbol] = symbol_data
            logger.info(
                f"Analyzed {symbol} across {len(symbol_data)} timeframes"
            )

        self.results = results
        return results