import anthropic
import json
import logging
from datetime import datetime
from core.config import settings

logger = logging.getLogger(__name__)

# --- Initialize Anthropic client ---
client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


class AISignal:

    def __init__(self):
        self.model = "claude-sonnet-4-6"

    # --- Generate crypto signal summary ---
    async def analyze_crypto(
        self,
        symbol: str,
        timeframe: str,
        indicators: dict,
        signal: str
    ) -> str:
        try:
            prompt = f"""
You are Nexus Pro, an elite crypto trading signal analyst.

Analyze the following data for {symbol} on the {timeframe} timeframe
and generate a professional trading signal summary.

Current Signal: {signal}

Indicators:
- Price: {indicators.get('price')}
- RSI: {indicators.get('rsi')}
- Stoch RSI: {indicators.get('stoch_rsi')}
- EMA 50: {indicators.get('ema50')}
- EMA 200: {indicators.get('ema200')}
- Above EMA200: {indicators.get('above_ema200')}
- Bollinger Upper: {indicators.get('bb_upper')}
- Bollinger Mid: {indicators.get('bb_mid')}
- Bollinger Lower: {indicators.get('bb_lower')}
- MACD: {indicators.get('macd')}
- MACD Signal: {indicators.get('macd_signal')}
- VWAP: {indicators.get('vwap')}
- ATR: {indicators.get('atr')}
- Above VWAP: {indicators.get('above_vwap')}

Write a concise 2-3 sentence professional signal summary.
Include the signal direction, key reasons, and confidence level.
Format: Start with the signal in caps, then explanation.
Example: "STRONG BUY — BTC is trading above EMA200 and VWAP with RSI at 42
indicating room to run. MACD crossover confirms bullish momentum.
Confidence: High"
"""

            message = client.messages.create(
                model=self.model,
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )

            return message.content[0].text

        except Exception as e:
            logger.error(f"AI crypto signal error: {e}")
            return f"{signal} — Technical analysis based signal for {symbol}"

    # --- Generate forex signal summary ---
    async def analyze_forex(
        self,
        pair: str,
        timeframe: str,
        indicators: dict,
        signal: str
    ) -> str:
        try:
            prompt = f"""
You are Nexus Pro, an elite forex trading signal analyst.

Analyze the following data for {pair} on the {timeframe} timeframe
and generate a professional trading signal summary.

Current Signal: {signal}

Indicators:
- Price: {indicators.get('price')}
- RSI: {indicators.get('rsi')}
- EMA 50: {indicators.get('ema50')}
- EMA 200: {indicators.get('ema200')}
- Trend: {indicators.get('trend')}
- Overbought/Oversold: {indicators.get('ob_os')}
- Bollinger Upper: {indicators.get('bb_upper')}
- Bollinger Lower: {indicators.get('bb_lower')}
- MACD: {indicators.get('macd')}
- MACD Signal: {indicators.get('macd_signal')}
- Above EMA200: {indicators.get('above_ema200')}

Write a concise 2-3 sentence professional signal summary.
Include the signal direction, key reasons, and confidence level.
Format: Start with the signal in caps, then explanation.
Example: "BUY — EUR/USD is in a bullish trend above EMA200 with RSI at 38
showing oversold conditions. Bollinger Band squeeze suggests breakout incoming.
Confidence: Medium"
"""

            message = client.messages.create(
                model=self.model,
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )

            return message.content[0].text

        except Exception as e:
            logger.error(f"AI forex signal error: {e}")
            return f"{signal} — Technical analysis based signal for {pair}"

    # --- Generate sports signal summary ---
    async def analyze_sports(
        self,
        match: str,
        prediction: dict
    ) -> str:
        try:
            prompt = f"""
You are Nexus Pro, an elite sports betting analyst.

Analyze the following match prediction data and generate
a professional betting signal summary.

Match: {match}
Signal: {prediction.get('signal')}

Statistics:
- Home Team: {prediction.get('home_team')}
- Away Team: {prediction.get('away_team')}
- Home xG: {prediction.get('home_xg')}
- Away xG: {prediction.get('away_xg')}
- Home Win %: {prediction.get('home_win_pct')}%
- Draw %: {prediction.get('draw_pct')}%
- Away Win %: {prediction.get('away_win_pct')}%
- Home Odds: {prediction.get('home_odds')}
- Draw Odds: {prediction.get('draw_odds')}
- Away Odds: {prediction.get('away_odds')}
- Top Correct Scores: {prediction.get('correct_scores')}
- Home News Sentiment: {prediction.get('home_sentiment')}
- Away News Sentiment: {prediction.get('away_sentiment')}

Write a concise 2-3 sentence professional betting signal summary.
Include the recommended bet, key statistics, and confidence level.
Format: Start with the signal in caps, then explanation.
Example: "HOME WIN — Arsenal show superior xG of 2.1 vs 0.8 with
65% win probability. No major injury concerns based on latest news.
Confidence: High — Recommended bet: Arsenal Win or Arsenal/Draw Double Chance"
"""

            message = client.messages.create(
                model=self.model,
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )

            return message.content[0].text

        except Exception as e:
            logger.error(f"AI sports signal error: {e}")
            return f"{prediction.get('signal')} — Statistical analysis for {match}"

    # --- Enrich all crypto results with AI ---
    async def enrich_crypto_signals(self, crypto_results: dict) -> dict:
        enriched = {}

        for symbol, timeframes in crypto_results.items():
            enriched[symbol] = {}
            for tf, data in timeframes.items():
                ai_summary = await self.analyze_crypto(
                    symbol=symbol,
                    timeframe=tf,
                    indicators=data.get("indicators", {}),
                    signal=data.get("signal", "HOLD")
                )
                enriched[symbol][tf] = {
                    **data,
                    "ai_summary": ai_summary
                }

        return enriched

    # --- Enrich all forex results with AI ---
    async def enrich_forex_signals(self, forex_results: dict) -> dict:
        enriched = {}

        for pair, timeframes in forex_results.items():
            enriched[pair] = {}
            for tf, data in timeframes.items():
                ai_summary = await self.analyze_forex(
                    pair=pair,
                    timeframe=tf,
                    indicators=data.get("indicators", {}),
                    signal=data.get("signal", "HOLD")
                )
                enriched[pair][tf] = {
                    **data,
                    "ai_summary": ai_summary
                }

        return enriched

    # --- Enrich all sports results with AI ---
    async def enrich_sports_signals(self, sports_results: dict) -> dict:
        enriched = {}

        for match, prediction in sports_results.items():
            ai_summary = await self.analyze_sports(
                match=match,
                prediction=prediction
            )
            enriched[match] = {
                **prediction,
                "ai_summary": ai_summary
            }

        return enriched