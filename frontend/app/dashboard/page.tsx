'use client';

import { useState } from 'react';
import Link from 'next/link';

// --- Signal Badge ---
function SignalBadge({ signal }: { signal: string }) {
  const colors: Record<string, string> = {
    'STRONG BUY': 'bg-green-500/20 text-green-400 border-green-500/30',
    BUY: 'bg-green-500/10 text-green-500 border-green-500/20',
    HOLD: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    SELL: 'bg-red-500/10 text-red-400 border-red-500/20',
    'STRONG SELL': 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`border text-xs font-bold px-3 py-1 rounded-full ${
        colors[signal] || 'bg-gray-800 text-gray-400 border-gray-700'
      }`}
    >
      {signal}
    </span>
  );
}

// --- Crypto Card ---
function CryptoCard({ symbol }: { symbol: string }) {
  const signals = ['STRONG BUY', 'BUY', 'HOLD', 'SELL', 'STRONG SELL'];
  const signal = signals[Math.floor(Math.random() * signals.length)];
  const price =
    symbol === 'BTCUSDT'
      ? '67,234.50'
      : symbol === 'ETHUSDT'
      ? '3,456.20'
      : symbol === 'SOLUSDT'
      ? '145.30'
      : symbol === 'BNBUSDT'
      ? '412.80'
      : '0.5823';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-bold">{symbol.replace('USDT', '')}</p>
          <p className="text-gray-400 text-sm">${price}</p>
        </div>
        <SignalBadge signal={signal} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {['1h', '4h', '1d'].map((tf) => (
          <div key={tf} className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-gray-500 mb-1">{tf}</p>
            <p className="text-white font-medium">BUY</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Forex Card ---
function ForexCard({ pair }: { pair: string }) {
  const signals = ['BUY', 'SELL', 'HOLD', 'STRONG BUY'];
  const signal = signals[Math.floor(Math.random() * signals.length)];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-bold">{pair}</p>
        <SignalBadge signal={signal} />
      </div>
      <div className="flex gap-3 text-xs text-gray-400">
        <span>RSI: 42.3</span>
        <span>EMA200: ↑</span>
        <span>Trend: Bullish</span>
      </div>
    </div>
  );
}

// --- Sports Card ---
function SportsCard({ match }: { match: string }) {
  const [home, away] = match.split(' vs ');
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-bold text-sm">{match}</p>
        <SignalBadge signal="BUY" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
        <div className="bg-gray-800 rounded-lg p-2">
          <p className="text-gray-400 mb-1">{home} Win</p>
          <p className="text-green-400 font-bold">62%</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2">
          <p className="text-gray-400 mb-1">Draw</p>
          <p className="text-yellow-400 font-bold">22%</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-2">
          <p className="text-gray-400 mb-1">{away} Win</p>
          <p className="text-red-400 font-bold">16%</p>
        </div>
      </div>
      <p className="text-gray-500 text-xs">
        Top score: 2-0 (18.3%) · 2-1 (14.2%)
      </p>
    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('crypto');

  const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
  const forexPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD'];
  const matches = [
    'Arsenal vs Chelsea',
    'Man City vs Liverpool',
    'Spurs vs Man Utd',
  ];

  const tabs = [
    { id: 'crypto', label: '₿ Crypto' },
    { id: 'forex', label: '💱 Forex' },
    { id: 'sports', label: '⚽ Sports' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Live signals across all markets
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Live</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Crypto Signals',
              value: '30',
              sub: '5 symbols × 6 timeframes',
            },
            {
              label: 'Forex Signals',
              value: '30',
              sub: '10 pairs × 3 timeframes',
            },
            { label: 'Match Predictions', value: '12', sub: 'EPL fixtures' },
            { label: 'Accuracy', value: '78%', sub: 'Last 30 days' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Plan Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-blue-400 font-medium text-sm">
              You are on the Free plan
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Upgrade to Pro for Forex signals and AI summaries
            </p>
          </div>
          <Link
            href="/pricing"
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
          >
            Upgrade
          </Link>
        </div>

        {/* Signal Cards */}
        {activeTab === 'crypto' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">
              Crypto Signals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cryptoSymbols.map((symbol) => (
                <CryptoCard key={symbol} symbol={symbol} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'forex' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Forex Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forexPairs.map((pair) => (
                <ForexCard key={pair} pair={pair} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sports' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">
              Sports Predictions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <SportsCard key={match} match={match} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
