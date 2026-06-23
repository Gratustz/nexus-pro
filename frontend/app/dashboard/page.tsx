'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// --- Signal Badge ---
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

// --- Overall Signal from all timeframes ---
function getOverallSignal(timeframes: Record<string, any>): string {
  const scores: Record<string, number> = {
    'STRONG BUY': 2, 'BUY': 1, 'HOLD': 0, 'SELL': -1, 'STRONG SELL': -2
  }
  const tfs = Object.values(timeframes)
  if (tfs.length === 0) return 'HOLD'
  const total = tfs.reduce((sum: number, tf: any) => sum + (scores[tf.signal] || 0), 0)
  const avg = total / tfs.length
  if (avg >= 1.5) return 'STRONG BUY'
  if (avg >= 0.5) return 'BUY'
  if (avg <= -1.5) return 'STRONG SELL'
  if (avg <= -0.5) return 'SELL'
  return 'HOLD'
}

// --- Crypto Analysis Card ---
function CryptoCard({ symbol, data }: { symbol: string, data: Record<string, any> }) {
  const [expanded, setExpanded] = useState(false)
  const overallSignal = getOverallSignal(data)
  const timeframes = ['1m', '5m', '15m', '30m', '1h', '12h', '1d', '1w', '1M']
  const latest = data['1m'] || data['1h'] || Object.values(data)[0] as any
  const price = latest?.indicators?.price || 0
  const stats = latest?.stats_24h || {}

  const signalCounts = {
    bullish: Object.values(data).filter((tf: any) => ['BUY', 'STRONG BUY'].includes(tf.signal)).length,
    bearish: Object.values(data).filter((tf: any) => ['SELL', 'STRONG SELL'].includes(tf.signal)).length,
    neutral: Object.values(data).filter((tf: any) => tf.signal === 'HOLD').length,
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition">
      {/* Header */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-lg font-bold text-orange-400">
              {symbol.replace('USDT', '')[0]}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{symbol.replace('USDT', '')}/USDT</p>
              <p className="text-gray-400 text-sm">${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</p>
            </div>
          </div>
          <SignalBadge signal={overallSignal} />
        </div>

        {/* 24h Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-gray-500 mb-1">24h Change</p>
            <p className={`font-bold ${stats.price_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.price_change_pct >= 0 ? '+' : ''}{stats.price_change_pct}%
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-gray-500 mb-1">24h High</p>
            <p className="text-white font-bold">${stats.high_24h?.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-gray-500 mb-1">24h Low</p>
            <p className="text-white font-bold">${stats.low_24h?.toLocaleString()}</p>
          </div>
        </div>

        {/* Signal Summary */}
        <div className="flex gap-2">
          <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
            <p className="text-green-400 text-xs font-bold">{signalCounts.bullish} Bullish</p>
          </div>
          <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
            <p className="text-yellow-400 text-xs font-bold">{signalCounts.neutral} Neutral</p>
          </div>
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
            <p className="text-red-400 text-xs font-bold">{signalCounts.bearish} Bearish</p>
          </div>
        </div>
      </div>

      {/* Timeframe Grid */}
      <div className="p-4">
        <div className="grid grid-cols-9 gap-1 mb-3">
          {timeframes.map(tf => {
            const tfData = data[tf]
            if (!tfData) return (
              <div key={tf} className="bg-gray-800/50 rounded-lg p-1 text-center opacity-40">
                <p className="text-gray-600 text-xs">{tf}</p>
                <p className="text-gray-600 text-xs">—</p>
              </div>
            )
            const sig = tfData.signal
            const bgColor = sig === 'STRONG BUY' ? 'bg-green-500/30 border-green-500/50' :
              sig === 'BUY' ? 'bg-green-500/15 border-green-500/30' :
              sig === 'SELL' ? 'bg-red-500/15 border-red-500/30' :
              sig === 'STRONG SELL' ? 'bg-red-500/30 border-red-500/50' :
              'bg-yellow-500/10 border-yellow-500/20'
            const textColor = sig === 'STRONG BUY' || sig === 'BUY' ? 'text-green-400' :
              sig === 'SELL' || sig === 'STRONG SELL' ? 'text-red-400' : 'text-yellow-400'

            return (
              <div key={tf} className={`border rounded-lg p-1 text-center ${bgColor}`}>
                <p className="text-gray-400 text-xs mb-0.5">{tf}</p>
                <p className={`text-xs font-bold ${textColor}`} style={{fontSize: '9px'}}>
                  {sig === 'STRONG BUY' ? 'S.BUY' :
                   sig === 'STRONG SELL' ? 'S.SELL' : sig}
                </p>
              </div>
            )
          })}
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-gray-400 hover:text-white py-1 transition flex items-center justify-center gap-1"
        >
          {expanded ? '▲ Hide Analysis' : '▼ Full Professional Analysis'}
        </button>
      </div>

      {/* Full Analysis — Expanded */}
      {expanded && (
        <div className="border-t border-gray-800 p-4">
          <p className="text-white font-bold text-sm mb-4">📊 Full Technical Analysis</p>

          {timeframes.map(tf => {
            const tfData = data[tf]
            if (!tfData) return null
            const ind = tfData.indicators || {}

            return (
              <div key={tf} className="mb-4 bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-lg font-bold">{tf}</span>
                    <span className="text-gray-400 text-xs">
                      {tf === '1m' ? '1 Minute' :
                       tf === '5m' ? '5 Minutes' :
                       tf === '15m' ? '15 Minutes' :
                       tf === '30m' ? '30 Minutes' :
                       tf === '1h' ? '1 Hour' :
                       tf === '12h' ? '12 Hours' :
                       tf === '1d' ? '1 Day' :
                       tf === '1w' ? '1 Week' : '1 Month'}
                    </span>
                  </div>
                  <SignalBadge signal={tfData.signal} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Momentum */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2 font-medium">MOMENTUM</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">RSI (14)</span>
                        <span className={`font-bold ${ind.rsi < 30 ? 'text-green-400' : ind.rsi > 70 ? 'text-red-400' : 'text-white'}`}>
                          {ind.rsi?.toFixed(2)}
                          <span className="text-gray-500 ml-1">
                            {ind.rsi < 30 ? '(Oversold)' : ind.rsi > 70 ? '(Overbought)' : '(Neutral)'}
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Stoch RSI</span>
                        <span className="text-white font-bold">{ind.stoch_rsi?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">MACD</span>
                        <span className={`font-bold ${ind.macd > ind.macd_signal ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.macd?.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">MACD Signal</span>
                        <span className="text-white font-bold">{ind.macd_signal?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">MACD Histogram</span>
                        <span className={`font-bold ${ind.macd_histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.macd_histogram?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trend */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2 font-medium">TREND</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">EMA 20</span>
                        <span className={`font-bold ${ind.above_ema20 ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.ema20?.toFixed(4)} {ind.above_ema20 ? '↑' : '↓'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">EMA 50</span>
                        <span className={`font-bold ${ind.above_ema50 ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.ema50?.toFixed(4)} {ind.above_ema50 ? '↑' : '↓'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">EMA 200</span>
                        <span className={`font-bold ${ind.above_ema200 ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.ema200?.toFixed(4)} {ind.above_ema200 ? '↑' : '↓'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">VWAP</span>
                        <span className={`font-bold ${ind.above_vwap ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.vwap?.toFixed(4)} {ind.above_vwap ? '↑' : '↓'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Volatility */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2 font-medium">VOLATILITY</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">BB Upper</span>
                        <span className="text-white font-bold">{ind.bb_upper?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">BB Middle</span>
                        <span className="text-white font-bold">{ind.bb_mid?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">BB Lower</span>
                        <span className="text-white font-bold">{ind.bb_lower?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">ATR (14)</span>
                        <span className="text-white font-bold">{ind.atr?.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Action */}
                  <div>
                    <p className="text-gray-500 text-xs mb-2 font-medium">PRICE ACTION</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Price</span>
                        <span className="text-white font-bold">${ind.price?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Above EMA20</span>
                        <span className={`font-bold ${ind.above_ema20 ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.above_ema20 ? 'YES ✓' : 'NO ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Above EMA50</span>
                        <span className={`font-bold ${ind.above_ema50 ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.above_ema50 ? 'YES ✓' : 'NO ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Above EMA200</span>
                        <span className={`font-bold ${ind.above_ema200 ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.above_ema200 ? 'YES ✓' : 'NO ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Above VWAP</span>
                        <span className={`font-bold ${ind.above_vwap ? 'text-green-400' : 'text-red-400'}`}>
                          {ind.above_vwap ? 'YES ✓' : 'NO ✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analyzed At */}
                <p className="text-gray-600 text-xs mt-3">
                  Analyzed: {new Date(tfData.analyzed_at).toLocaleTimeString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Main Dashboard ---
export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{name: string, plan: string} | null>(null)
  const [activeTab, setActiveTab] = useState('crypto')
  const [cryptoData, setCryptoData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (!token || !stored) {
      router.push('/auth/login')
      return
    }
    setUser(JSON.parse(stored))
    fetchSignals(token)

    // Auto refresh every 60 seconds
    const interval = setInterval(() => {
      const t = localStorage.getItem('token')
      if (t) fetchSignals(t)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const fetchSignals = async (token: string) => {
    try {
      setRefreshing(true)
      const res = await fetch(`${API_URL}/signals/crypto?live=true`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.data) {
        setCryptoData(data.data)
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error('Failed to fetch signals', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading live signals...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'crypto', label: '₿ Crypto' },
    { id: 'forex', label: '💱 Forex' },
    { id: 'sports', label: '⚽ Sports' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-400 mt-1">
              Professional grade signals across all markets
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-gray-500 text-xs">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={() => {
                const token = localStorage.getItem('token')
                if (token) fetchSignals(token)
              }}
              disabled={refreshing}
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-sm px-4 py-2 rounded-lg transition"
            >
              {refreshing ? '⟳ Updating...' : '⟳ Refresh'}
            </button>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Crypto Signals', value: `${Object.keys(cryptoData).length * 9}`, sub: `${Object.keys(cryptoData).length} symbols × 9 timeframes` },
            { label: 'Forex Signals', value: '30', sub: '10 pairs × 3 timeframes' },
            { label: 'Match Predictions', value: '12', sub: 'EPL fixtures' },
            { label: 'Your Plan', value: user?.plan?.toUpperCase() || 'FREE', sub: 'Active subscription' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Plan Notice */}
        {user?.plan === 'free' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-blue-400 font-medium text-sm">You are on the Free plan</p>
              <p className="text-gray-400 text-xs mt-1">Upgrade to Pro for Forex signals, AI summaries and more symbols</p>
            </div>
            <Link href="/pricing" className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
              Upgrade
            </Link>
          </div>
        )}

        {/* Crypto Tab */}
        {activeTab === 'crypto' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Crypto Signals — 9 Timeframes
              </h2>
              <p className="text-gray-500 text-xs">Click any card to expand full analysis</p>
            </div>
            {Object.keys(cryptoData).length === 0 ? (
              <div className="text-center py-16">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading live crypto signals...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(cryptoData).map(([symbol, data]) => (
                  <CryptoCard key={symbol} symbol={symbol} data={data as Record<string, any>} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Forex Tab */}
        {activeTab === 'forex' && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💱</p>
            <p className="text-white font-bold text-xl mb-2">Forex Signals</p>
            <p className="text-gray-400 mb-6">Available on Pro and Elite plans</p>
            <Link href="/pricing" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition">
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* Sports Tab */}
        {activeTab === 'sports' && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">⚽</p>
            <p className="text-white font-bold text-xl mb-2">Sports Predictions</p>
            <p className="text-gray-400 mb-6">Available on Elite plan only</p>
            <Link href="/pricing" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition">
              Upgrade to Elite
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}