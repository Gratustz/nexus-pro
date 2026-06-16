import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-blue-400 text-sm font-medium">
            Live signals — Crypto · Forex · Sports
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Trade Smarter with
          <span className="text-blue-400"> AI-Powered</span>
          <br />
          Signals
        </h1>

        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10">
          Nexus Pro combines Technical and Fundamental Analysis across Crypto,
          Forex and Sports to deliver professional grade signals in real time.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/auth/register"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
          >
            Start Free Today
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Markets Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Three Markets. One Platform.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Crypto */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">₿</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Crypto</h3>
            <p className="text-gray-400 mb-6">
              Live signals for BTC, ETH, SOL, BNB and XRP across 6 timeframes
              with RSI, VWAP, EMA200 and Bollinger Bands.
            </p>
            <div className="flex flex-wrap gap-2">
              {['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].map((coin) => (
                <span
                  key={coin}
                  className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full"
                >
                  {coin}
                </span>
              ))}
            </div>
          </div>

          {/* Forex */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">💱</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Forex</h3>
            <p className="text-gray-400 mb-6">
              Major and minor currency pairs analyzed with trend bias, EMA200,
              RSI and Bollinger Bands across multiple timeframes.
            </p>
            <div className="flex flex-wrap gap-2">
              {['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'].map((pair) => (
                <span
                  key={pair}
                  className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full"
                >
                  {pair}
                </span>
              ))}
            </div>
          </div>

          {/* Sports */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">⚽</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Sports</h3>
            <p className="text-gray-400 mb-6">
              EPL match predictions using Poisson probability models, xG
              analysis, news sentiment and correct score predictions.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Match Winner', 'Correct Score', 'Fair Odds', 'xG'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Nexus Pro?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: '🤖',
              title: 'AI Powered',
              desc: 'Claude AI generates natural language signal summaries for every trade',
            },
            {
              icon: '⚡',
              title: 'Real Time',
              desc: 'Crypto signals update every 60 seconds. Never miss a move.',
            },
            {
              icon: '📊',
              title: 'Multi Timeframe',
              desc: 'From 1 minute to daily — see the full picture across all timeframes',
            },
            {
              icon: '🎯',
              title: 'High Accuracy',
              desc: 'Technical and fundamental analysis combined for maximum confidence',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Trade Smarter?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join Nexus Pro today and get access to professional grade signals
            across Crypto, Forex and Sports.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/register"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
            >
              Start Free — No Credit Card
            </Link>
            <Link
              href="/pricing"
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 
