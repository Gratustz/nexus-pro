import pandas as pd
import numpy as np
import requests
import logging
from datetime import datetime
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.trend import EMAIndicator, MACD
from ta.volatility import BollingerBands, AverageTrueRange
from core.config import settings

logger = logging.getLogger(__name__)

SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"]

TIMEFRAMES = {
    "1m":  "1m",
    "5m":  "5m",
    "15m": "15m",
    "30m": "30m",
    "1h":  "1h",
    "12h": "12h",
    "1d":  "1d",
    "1w":  "1w",
    "1M":  "1M",
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
            response = requests.get(url, params=params, timeout=15)
            data = response.json()

            if isinstance(data, dict) and data.get("code"):
                logger.error(f"Binance error for {symbol} {interval}: {data}")
                return None

            if not isinstance(data, list) or len(data) == 0:
                logger.warning(f"No data for {symbol} {interval}")
                return None

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

    def get_current_price(self, symbol: str) -> float:
        try:
            url = f"{self.base_url}/ticker/price"
            params = {"symbol": symbol}
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            return float(data.get("price", 0))
        except Exception as e:
            logger.error(f"Error getting price for {symbol}: {e}")
            return 0.0

    def get_24hr_stats(self, symbol: str) -> dict:
        try:
            url = f"{self.base_url}/ticker/24hr"
            params = {"symbol": symbol}
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            return {
                "price_change_pct": round(
                    float(data.get("priceChangePercent", 0)), 2
                ),
                "high_24h": round(float(data.get("highPrice", 0)), 4),
                "low_24h": round(float(data.get("lowPrice", 0)), 4),
                "volume_24h": round(float(data.get("volume", 0)), 2),
                "trades_24h": int(data.get("count", 0)),
            }
        except Exception as e:
            logger.error(f"Error getting 24hr stats for {symbol}: {e}")
            return {}

    def calculate_indicators(self, df: pd.DataFrame) -> dict:
        try:
            close = df["close"]
            high = df["high"]
            low = df["low"]
            volume = df["volume"]

            rsi = RSIIndicator(close=close, window=14)
            rsi_value = round(float(rsi.rsi().iloc[-1]), 2)

            stoch = StochasticOscillator(
                high=high, low=low, close=close, window=14
            )
            stoch_value = round(float(stoch.stoch().iloc[-1]), 2)

            ema200 = EMAIndicator(close=close, window=min(200, len(close)-1))
            ema200_value = round(float(ema200.ema_indicator().iloc[-1]), 6)

            ema50 = EMAIndicator(close=close, window=min(50, len(close)-1))
            ema50_value = round(float(ema50.ema_indicator().iloc[-1]), 6)

            ema20 = EMAIndicator(close=close, window=min(20, len(close)-1))
            ema20_value = round(float(ema20.ema_indicator().iloc[-1]), 6)

            bb = BollingerBands(close=close, window=20, window_dev=2)
            bb_upper = round(float(bb.bollinger_hband().iloc[-1]), 6)
            bb_lower = round(float(bb.bollinger_lband().iloc[-1]), 6)
            bb_mid = round(float(bb.bollinger_mavg().iloc[-1]), 6)

            atr = AverageTrueRange(high=high, low=low, close=close, window=14)
            atr_value = round(float(atr.average_true_range().iloc[-1]), 6)

            macd = MACD(close=close)
            macd_value = round(float(macd.macd().iloc[-1]), 6)
            macd_signal = round(float(macd.macd_signal().iloc[-1]), 6)
            macd_hist = round(float(macd.macd_diff().iloc[-1]), 6)

            vwap = round(
                float(
                    (close * volume).cumsum().iloc[-1] /
                    volume.cumsum().iloc[-1]
                ), 6
            )

            current_price = round(float(close.iloc[-1]), 6)

            return {
                "price": current_price,
                "rsi": rsi_value,
                "stoch_rsi": stoch_value,
                "ema20": ema20_value,
                "ema50": ema50_value,
                "ema200": ema200_value,
                "bb_upper": bb_upper,
                "bb_mid": bb_mid,
                "bb_lower": bb_lower,
                "atr": atr_value,
                "macd": macd_value,
                "macd_signal": macd_signal,
                "macd_histogram": macd_hist,
                "vwap": vwap,
                "above_ema20": current_price > ema20_value,
                "above_ema50": current_price > ema50_value,
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
        ema20 = indicators.get("ema20", 0)
        bb_lower = indicators.get("bb_lower", 0)
        bb_upper = indicators.get("bb_upper", 0)
        macd = indicators.get("macd", 0)
        macd_signal = indicators.get("macd_signal", 0)
        macd_hist = indicators.get("macd_histogram", 0)
        above_vwap = indicators.get("above_vwap", False)

        if rsi < 25:
            score += 3
        elif rsi < 35:
            score += 2
        elif rsi < 45:
            score += 1
        elif rsi > 75:
            score -= 3
        elif rsi > 65:
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

        if price > ema20:
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

        if macd_hist > 0:
            score += 1
        else:
            score -= 1

        if above_vwap:
            score += 1
        else:
            score -= 1

        if score >= 7:
            return "STRONG BUY"
        elif score >= 3:
            return "BUY"
        elif score <= -7:
            return "STRONG SELL"
        elif score <= -3:
            return "SELL"
        else:
            return "HOLD"

    async def run(self) -> dict:
        results = {}

        for symbol in SYMBOLS:
            symbol_data = {}

            current_price = self.get_current_price(symbol)
            stats_24h = self.get_24hr_stats(symbol)

            for tf_name, tf_value in TIMEFRAMES.items():
                limit = 200 if tf_name in [
                    "1m", "5m", "15m", "30m"
                ] else 100

                df = self.fetch_klines(symbol, tf_value, limit)

                if df is not None and len(df) > 50:
                    indicators = self.calculate_indicators(df)
                    signal = self.generate_signal(indicators)

                    if current_price > 0:
                        indicators["price"] = current_price

                    symbol_data[tf_name] = {
                        "signal": signal,
                        "indicators": indicators,
                        "stats_24h": stats_24h,
                        "analyzed_at": datetime.utcnow().isoformat()
                    }

            results[symbol] = symbol_data
            logger.info(
                f"✅ Analyzed {symbol} — "
                f"Price: ${current_price} — "
                f"Timeframes: {len(symbol_data)}"
            )

        self.results = results
        return results