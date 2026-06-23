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
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors[signal] || 'bg-gray-800 text-gray-400'}`}>
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

export default function SymbolPage() {
  const router = useRouter()
  const params = useParams()
  const symbol = params.symbol as string
  const [data, setData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetchData(token)

    const interval = setInterval(() => {
      const t = localStorage.getItem('token')
      if (t) fetchData(t)
    }, 60000)

    return () => clearInterval(interval)
  }, [symbol])

  const fetchData = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/signals/crypto?live=true`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.data && json.data[symbol]) {
        setData(json.data[symbol])
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error('Failed to fetch', e)
    } finally {
      setLoading(false)
    }
  }

  const getOverallSignal = () => {
    const scores: Record<string, number> = {
      'STRONG BUY': 2, 'BUY': 1, 'HOLD': 0, 'SELL': -1, 'STRONG SELL': -2
    }
    const tfs = Object.values(data)
    if (tfs.length === 0) return 'HOLD'
    const total = tfs.reduce((sum: number, tf: any) => sum + (scores[tf.signal] || 0), 0)
    const avg = total / tfs.length
    if (avg >= 1.5) return 'STRONG BUY'
    if (avg >= 0.5) return 'BUY'
    if (avg <= -1.5) return 'STRONG SELL'
    if (avg <= -0.5) return 'SELL'
    return 'HOLD'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading {symbol} analysis...</p>
        </div>
      </div>
    )
  }

  const latest = data['1m'] || data['1h'] || Object.values(data)[0] as any
  const price = latest?.indicators?.price || 0
  const stats = latest?.stats_24h || {}
  const overallSignal = getOverallSignal()

  const signalCounts = {
    bullish: Object.values(data).filter((tf: any) => ['BUY', 'STRONG BUY'].includes(tf.signal)).length,
    bearish: Object.values(data).filter((tf: any) => ['SELL', 'STRONG SELL'].includes(tf.signal)).length,
    neutral: Object.values(data).filter((tf: any) => tf.signal === 'HOLD').length,
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Back Button */}
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition w-fit">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-2xl font-bold text-orange-400">
                {symbol.replace('USDT', '')[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{symbol.replace('USDT', '')}/USDT</h1>
                <p className="text-gray-400 text-lg">${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</p>
              </div>
            </div>
            <div className="text-right">
              <SignalBadge signal={overallSignal} />
              <p className="text-gray-500 text-xs mt-2">Overall Signal</p>
            </div>
          </div>

          {/* 24h Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">24h Change</p>
              <p className={`font-bold text-lg ${stats.price_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.price_change_pct >= 0 ? '+' : ''}{stats.price_change_pct}%
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">24h High</p>
              <p className="text-white font-bold">${stats.high_24h?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">24h Low</p>
              <p className="text-white font-bold">${stats.low_24h?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">Volume</p>
              <p className="text-white font-bold">{stats.volume_24h?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">Trades</p>
              <p className="text-white font-bold">{stats.trades_24h?.toLocaleString()}</p>
            </div>
          </div>

          {/* Signal Summary */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-green-400 text-2xl font-bold">{signalCounts.bullish}</p>
              <p className="text-green-400 text-xs">Bullish Timeframes</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
              <p className="text-yellow-400 text-2xl font-bold">{signalCounts.neutral}</p>
              <p className="text-yellow-400 text-xs">Neutral Timeframes</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-red-400 text-2xl font-bold">{signalCounts.bearish}</p>
              <p className="text-red-400 text-xs">Bearish Timeframes</p>
            </div>
          </div>
        </div>

        {/* Timeframe Cards */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Select Timeframe for Full Analysis</h2>
          {lastUpdated && (
            <p className="text-gray-500 text-xs">Updated {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TIMEFRAME_LABELS).map(([tf, label]) => {
            const tfData = data[tf]
            if (!tfData) return null
            const ind = tfData.indicators || {}

            return (
              <Link
                key={tf}
                href={`/signals/crypto/${symbol}/${tf}`}
                className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-5 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="bg-gray-800 text-white text-sm font-bold px-3 py-1 rounded-lg">{tf}</span>
                    <p className="text-gray-400 text-xs mt-1">{label}</p>
                  </div>
                  <SignalBadge signal={tfData.signal} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 mb-1">RSI</p>
                    <p className={`font-bold ${ind.rsi < 30 ? 'text-green-400' : ind.rsi > 70 ? 'text-red-400' : 'text-white'}`}>
                      {ind.rsi?.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 mb-1">MACD</p>
                    <p className={`font-bold ${ind.macd > ind.macd_signal ? 'text-green-400' : 'text-red-400'}`}>
                      {ind.macd?.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 mb-1">EMA200</p>
                    <p className={`font-bold ${ind.above_ema200 ? 'text-green-400' : 'text-red-400'}`}>
                      {ind.above_ema200 ? 'Above ↑' : 'Below ↓'}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 mb-1">VWAP</p>
                    <p className={`font-bold ${ind.above_vwap ? 'text-green-400' : 'text-red-400'}`}>
                      {ind.above_vwap ? 'Above ↑' : 'Below ↓'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 group-hover:text-blue-400 transition">
                  <span>Click for full analysis</span>
                  <span>→</span>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}