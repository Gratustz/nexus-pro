import pandas as pd
import requests
import logging
from datetime import datetime
from ta.momentum import RSIIndicator
from ta.trend import EMAIndicator, MACD
from ta.volatility import BollingerBands
from core.config import settings

logger = logging.getLogger(__name__)

# --- Forex pairs to analyze ---
PAIRS = [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "USD/CHF",
    "AUD/USD",
    "USD/CAD",
    "NZD/USD",
    "EUR/GBP",
    "EUR/JPY",
    "GBP/JPY",
]

# --- Timeframes ---
TIMEFRAMES = {
    "1h":  "60min",
    "4h":  "240min",
    "1d":  "daily",
}


class ForexEngine:

    def __init__(self):
        self.api_key = settings.ALPHA_VANTAGE_API_KEY
        self.base_url = "https://www.alphavantage.co/query"
        self.results = {}

    # --- Fetch OHLCV data from Alpha Vantage ---
    def fetch_data(self, pair: str, interval: str) -> pd.DataFrame:
        try:
            from_symbol, to_symbol = pair.split("/")

            if interval == "daily":
                params = {
                    "function": "FX_DAILY",
                    "from_symbol": from_symbol,
                    "to_symbol": to_symbol,
                    "outputsize": "compact",
                    "apikey": self.api_key
                }
                time_key = "Time Series FX (Daily)"
            else:
                params = {
                    "function": "FX_INTRADAY",
                    "from_symbol": from_symbol,
                    "to_symbol": to_symbol,
                    "interval": interval,
                    "outputsize": "compact",
                    "apikey": self.api_key
                }
                time_key = f"Time Series FX ({interval})"

            response = requests.get(
                self.base_url, params=params, timeout=15
            )
            data = response.json()

            if time_key not in data:
                logger.warning(f"No data for {pair} {interval}")
                return None

            df = pd.DataFrame(data[time_key]).T
            df.columns = ["open", "high", "low", "close"]
            df = df.astype(float)
            df.index = pd.to_datetime(df.index)
            df = df.sort_index()

            return df

        except Exception as e:
            logger.error(f"Error fetching forex data {pair} {interval}: {e}")
            return None

    # --- Calculate indicators ---
    def calculate_indicators(self, df: pd.DataFrame) -> dict:
        try:
            close = df["close"]
            high = df["high"]
            low = df["low"]

            # RSI
            rsi = RSIIndicator(close=close, window=14)
            rsi_value = round(rsi.rsi().iloc[-1], 2)

            # EMA 200
            ema200 = EMAIndicator(close=close, window=min(200, len(close)-1))
            ema200_value = round(ema200.ema_indicator().iloc[-1], 5)

            # EMA 50
            ema50 = EMAIndicator(close=close, window=min(50, len(close)-1))
            ema50_value = round(ema50.ema_indicator().iloc[-1], 5)

            # Bollinger Bands
            bb = BollingerBands(close=close, window=20, window_dev=2)
            bb_upper = round(bb.bollinger_hband().iloc[-1], 5)
            bb_lower = round(bb.bollinger_lband().iloc[-1], 5)
            bb_mid = round(bb.bollinger_mavg().iloc[-1], 5)

            # MACD
            macd = MACD(close=close)
            macd_value = round(macd.macd().iloc[-1], 5)
            macd_signal_val = round(macd.macd_signal().iloc[-1], 5)

            # Current price
            current_price = round(close.iloc[-1], 5)

            # Trend bias
            if current_price > ema200_value and current_price > ema50_value:
                trend = "Bullish"
            elif current_price < ema200_value and current_price < ema50_value:
                trend = "Bearish"
            else:
                trend = "Neutral"

            # Overbought / Oversold
            if rsi_value > 70:
                ob_os = "Overbought"
            elif rsi_value < 30:
                ob_os = "Oversold"
            else:
                ob_os = "Neutral"

            return {
                "price": current_price,
                "rsi": rsi_value,
                "ema50": ema50_value,
                "ema200": ema200_value,
                "bb_upper": bb_upper,
                "bb_mid": bb_mid,
                "bb_lower": bb_lower,
                "macd": macd_value,
                "macd_signal": macd_signal_val,
                "trend": trend,
                "ob_os": ob_os,
                "above_ema200": current_price > ema200_value,
            }

        except Exception as e:
            logger.error(f"Error calculating forex indicators: {e}")
            return {}

    # --- Generate signal ---
    def generate_signal(self, indicators: dict) -> str:
        score = 0

        rsi = indicators.get("rsi", 50)
        trend = indicators.get("trend", "Neutral")
        ob_os = indicators.get("ob_os", "Neutral")
        macd = indicators.get("macd", 0)
        macd_signal = indicators.get("macd_signal", 0)
        price = indicators.get("price", 0)
        bb_lower = indicators.get("bb_lower", 0)
        bb_upper = indicators.get("bb_upper", 0)

        # Trend
        if trend == "Bullish":
            score += 2
        elif trend == "Bearish":
            score -= 2

        # RSI
        if ob_os == "Oversold":
            score += 2
        elif ob_os == "Overbought":
            score -= 2

        # MACD
        if macd > macd_signal:
            score += 1
        else:
            score -= 1

        # Bollinger Bands
        if price <= bb_lower:
            score += 2
        elif price >= bb_upper:
            score -= 2

        # Final signal
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

    # --- Run full analysis ---
    async def run(self) -> dict:
        results = {}

        for pair in PAIRS:
            pair_data = {}

            for tf_name, tf_value in TIMEFRAMES.items():
                df = self.fetch_data(pair, tf_value)

                if df is not None and len(df) > 30:
                    indicators = self.calculate_indicators(df)
                    signal = self.generate_signal(indicators)

                    pair_data[tf_name] = {
                        "signal": signal,
                        "indicators": indicators,
                        "analyzed_at": datetime.utcnow().isoformat()
                    }

            results[pair] = pair_data
            logger.info(f"Analyzed {pair} across {len(pair_data)} timeframes")

        self.results = results
        return results