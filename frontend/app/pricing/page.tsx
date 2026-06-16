'use client';

import { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    color: 'border-gray-700',
    badge: '',
    features: [
      { text: 'BTC + ETH signals only', included: true },
      { text: 'Basic technical analysis', included: true },
      { text: '1 hour signal delay', included: true },
      { text: 'AI signal summaries', included: false },
      { text: 'Forex signals', included: false },
      { text: 'Sports predictions', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaStyle:
      'border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white',
    href: '/auth/register',
  },
  {
    name: 'Pro',
    monthly: 29,
    yearly: 290,
    color: 'border-blue-500',
    badge: 'Most Popular',
    features: [
      { text: 'All 5 crypto symbols', included: true },
      { text: 'Full technical analysis', included: true },
      { text: 'Real time signals', included: true },
      { text: 'AI signal summaries', included: true },
      { text: 'Forex signals — 10 pairs', included: true },
      { text: 'Sports predictions', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Pro',
    ctaStyle: 'bg-blue-500 hover:bg-blue-600 text-white',
    href: '/auth/register',
  },
  {
    name: 'Elite',
    monthly: 79,
    yearly: 790,
    color: 'border-purple-500',
    badge: 'Best Value',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Sports predictions EPL', included: true },
      { text: 'Poisson match analysis', included: true },
      { text: 'Correct score predictions', included: true },
      { text: 'Fair odds calculator', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to features', included: true },
    ],
    cta: 'Start Elite',
    ctaStyle: 'bg-purple-500 hover:bg-purple-600 text-white',
    href: '/auth/register',
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Start free and upgrade when you are ready. No hidden fees, cancel
            anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                !yearly
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                yearly
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-gray-900 border-2 ${plan.color} rounded-2xl p-8 relative flex flex-col`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`text-xs font-bold px-4 py-1 rounded-full ${
                      plan.name === 'Pro'
                        ? 'bg-blue-500 text-white'
                        : 'bg-purple-500 text-white'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${yearly ? plan.yearly : plan.monthly}
                  </span>
                  {plan.monthly > 0 && (
                    <span className="text-gray-400 mb-1">
                      /{yearly ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                {yearly && plan.monthly > 0 && (
                  <p className="text-green-400 text-sm mt-1">
                    Save ${plan.monthly * 12 - plan.yearly} per year
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-green-400' : 'text-gray-600'
                      }`}
                    >
                      {feature.included ? '✓' : '✗'}
                    </span>
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={`w-full py-3 rounded-xl font-semibold text-center transition ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel your subscription at any time with no questions asked. You keep access until the end of your billing period.',
              },
              {
                q: 'How accurate are the signals?',
                a: 'Our signals combine technical indicators with AI analysis for maximum accuracy. Past performance is not a guarantee of future results.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, M-Pesa, and bank transfers. More payment options coming soon.',
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes. Upgrade at any time and your new plan activates immediately. Downgrade takes effect at the next billing cycle.',
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6"
              >
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
