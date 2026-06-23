'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function SignalBadge({ signal }: { signal: string }) {
  const colors: Record<string, string> = {
    'STRONG BUY': 'bg-green-500 text-white',
    'BUY': 'bg-green-400/20 text-green-400 border border-green-400/30',
    'HOLD': 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30',
    'SELL': 'bg-red-400/20 text-red-400 border border-red-400/30',
    'STRONG SELL': 'bg-red-500 text-white',
  }
  return (
    <span className={`text-sm font-bold px-4 py-2 rounded-full ${colors[signal] || 'bg-gray-800 text-gray-400'}`}>
      {signal}
    </span>
  )
}

const TIMEFRAME_LABELS: Record<string, string> = {
  '1m': '1 Minute',
  '5m': '5 Minutes',
  '15m': '15 Minutes',
  '30m': '30 Minutes',
  '1h': '1 Hour',
  '12h': '12 Hours',
  '1d': '1 Day',
  '1w': '1 Week',
  '1M': '1 Month',
}

const TIMEFRAME_TRADER: Record<string, string> = {
  '1m': 'Scalper',
  '5m': 'Scalper',
  '15m': 'Day Trader',
  '30m': 'Day Trader',
  '1h': 'Swing Trader',
  '12h': 'Swing Trader',
  '1d': 'Position Trader',
  '1w': 'Investor',
  '1M': 'Long-term Investor',
}

function IndicatorRow({ label, value, status }: {
  label: string
  value: string
  status?: 'bullish' | 'bearish' | 'neutral'
}) {
  const color = status === 'bullish' ? 'text-green-400' :
    status === 'bearish' ? 'text-red-400' : 'text-white'
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  )
}

export default function TimeframePage() {
  const router = useRouter()
  const params = useParams()
  const symbol = params.symbol as string
  const timeframe = params.timeframe as string
  const [data, setData] = useState<any>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetchData(token)
  }, [symbol, timeframe])

  const fetchData = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/signals/crypto?live=true`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.data && json.data[symbol] && json.data[symbol][timeframe]) {
        setData(json.data[symbol][timeframe])
      }
    } catch (e) {
      console.error('Failed to fetch', e)
    } finally {
      setLoading(false)
    }
  }

  const generateAiAnalysis = async () => {
    if (!data) return
    setLoadingAi(true)
    setAiAnalysis('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/signals/ai-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol,
          timeframe: TIMEFRAME_LABELS[timeframe] || timeframe,
          indicators: data.indicators,
          signal: data.signal,
          stats: data.stats_24h
        })
      })

      const result = await response.json()
      if (result.analysis) {
        setAiAnalysis(result.analysis)
      } else {
        setAiAnalysis('Failed to generate analysis. Please try again.')
      }
    } catch (e) {
      setAiAnalysis('Connection error. Please try again.')
    } finally {
      setLoadingAi(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-4">No data available for {symbol} {timeframe}</p>
          <Link href={`/signals/crypto/${symbol}`} className="text-blue-400 hover:text-blue-300">
            ← Back to {symbol}
          </Link>
        </div>
      </div>
    )
  }

  const ind = data.indicators || {}
  const stats = data.stats_24h || {}

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          <span>→</span>
          <Link href={`/signals/crypto/${symbol}`} className="hover:text-white transition">
            {symbol.replace('USDT', '')}
          </Link>
          <span>→</span>
          <span className="text-white">{TIMEFRAME_LABELS[timeframe] || timeframe}</span>
        </div>

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {symbol.replace('USDT', '')}/USDT
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-400">{TIMEFRAME_LABELS[timeframe]} Analysis</p>
                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                  {TIMEFRAME_TRADER[timeframe]}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white">
                ${ind.price?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}
              </p>
              <p className={`text-sm font-bold ${stats.price_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.price_change_pct >= 0 ? '+' : ''}{stats.price_change_pct}% (24h)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <SignalBadge signal={data.signal} />
            <p className="text-gray-500 text-xs">
              Analyzed: {new Date(data.analyzed_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Technical Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Momentum */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Momentum Indicators
            </h3>
            <IndicatorRow
              label="RSI (14)"
              value={`${ind.rsi?.toFixed(2)} — ${ind.rsi < 30 ? 'Oversold' : ind.rsi > 70 ? 'Overbought' : 'Neutral'}`}
              status={ind.rsi < 30 ? 'bullish' : ind.rsi > 70 ? 'bearish' : 'neutral'}
            />
            <IndicatorRow
              label="Stochastic RSI"
              value={`${ind.stoch_rsi?.toFixed(2)}`}
              status={ind.stoch_rsi < 20 ? 'bullish' : ind.stoch_rsi > 80 ? 'bearish' : 'neutral'}
            />
            <IndicatorRow
              label="MACD"
              value={`${ind.macd?.toFixed(6)}`}
              status={ind.macd > ind.macd_signal ? 'bullish' : 'bearish'}
            />
            <IndicatorRow
              label="MACD Signal"
              value={`${ind.macd_signal?.toFixed(6)}`}
              status="neutral"
            />
            <IndicatorRow
              label="MACD Histogram"
              value={`${ind.macd_histogram?.toFixed(6)} ${ind.macd_histogram > 0 ? '(Bullish)' : '(Bearish)'}`}
              status={ind.macd_histogram > 0 ? 'bullish' : 'bearish'}
            />
          </div>

          {/* Trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Trend Indicators
            </h3>
            <IndicatorRow
              label="EMA 20"
              value={`${ind.ema20?.toFixed(4)} ${ind.above_ema20 ? '↑ Above' : '↓ Below'}`}
              status={ind.above_ema20 ? 'bullish' : 'bearish'}
            />
            <IndicatorRow
              label="EMA 50"
              value={`${ind.ema50?.toFixed(4)} ${ind.above_ema50 ? '↑ Above' : '↓ Below'}`}
              status={ind.above_ema50 ? 'bullish' : 'bearish'}
            />
            <IndicatorRow
              label="EMA 200"
              value={`${ind.ema200?.toFixed(4)} ${ind.above_ema200 ? '↑ Above' : '↓ Below'}`}
              status={ind.above_ema200 ? 'bullish' : 'bearish'}
            />
            <IndicatorRow
              label="VWAP"
              value={`${ind.vwap?.toFixed(4)} ${ind.above_vwap ? '↑ Above' : '↓ Below'}`}
              status={ind.above_vwap ? 'bullish' : 'bearish'}
            />
          </div>

          {/* Volatility */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Volatility — Bollinger Bands
            </h3>
            <IndicatorRow
              label="Upper Band"
              value={`$${ind.bb_upper?.toFixed(4)}`}
              status={ind.price >= ind.bb_upper ? 'bearish' : 'neutral'}
            />
            <IndicatorRow
              label="Middle Band"
              value={`$${ind.bb_mid?.toFixed(4)}`}
              status="neutral"
            />
            <IndicatorRow
              label="Lower Band"
              value={`$${ind.bb_lower?.toFixed(4)}`}
              status={ind.price <= ind.bb_lower ? 'bullish' : 'neutral'}
            />
            <IndicatorRow
              label="ATR (14)"
              value={`${ind.atr?.toFixed(4)}`}
              status="neutral"
            />
          </div>

          {/* 24h Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              24h Market Stats
            </h3>
            <IndicatorRow
              label="Price Change"
              value={`${stats.price_change_pct >= 0 ? '+' : ''}${stats.price_change_pct}%`}
              status={stats.price_change_pct >= 0 ? 'bullish' : 'bearish'}
            />
            <IndicatorRow
              label="24h High"
              value={`$${stats.high_24h?.toLocaleString()}`}
              status="neutral"
            />
            <IndicatorRow
              label="24h Low"
              value={`$${stats.low_24h?.toLocaleString()}`}
              status="neutral"
            />
            <IndicatorRow
              label="Volume"
              value={`${stats.volume_24h?.toLocaleString()}`}
              status="neutral"
            />
            <IndicatorRow
              label="Trades"
              value={`${stats.trades_24h?.toLocaleString()}`}
              status="neutral"
            />
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                🤖 AI Professional Analysis
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Powered by Claude AI — Best trading analysis in Africa
              </p>
            </div>
            <button
              onClick={generateAiAnalysis}
              disabled={loadingAi}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2"
            >
              {loadingAi ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>🤖 Generate AI Analysis</>
              )}
            </button>
          </div>

          {!aiAnalysis && !loadingAi && (
            <div className="text-center py-12 border border-gray-800 rounded-xl">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-gray-400 text-lg mb-2">AI Analysis Ready</p>
              <p className="text-gray-500 text-sm">
                Click the button above to get a professional AI-powered analysis of {symbol.replace('USDT', '')} on the {TIMEFRAME_LABELS[timeframe]} timeframe
              </p>
            </div>
          )}

          {loadingAi && (
            <div className="text-center py-12 border border-gray-800 rounded-xl">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Claude AI is analyzing the market...</p>
              <p className="text-gray-500 text-sm mt-2">This takes about 10-15 seconds</p>
            </div>
          )}

          {aiAnalysis && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              {aiAnalysis.split('\n').map((line, i) => {
                if (line.startsWith('##') || line.match(/^\d\./)) {
                  return (
                    <h4 key={i} className="text-blue-400 font-bold text-sm mt-4 mb-2">
                      {line.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '')}
                    </h4>
                  )
                }
                if (line.trim() === '') return <br key={i} />
                return (
                  <p key={i} className="text-gray-300 text-sm leading-relaxed">
                    {line}
                  </p>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Link
            href={`/signals/crypto/${symbol}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            ← All Timeframes
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            Dashboard →
          </Link>
        </div>

      </div>
    </div>
  )
}