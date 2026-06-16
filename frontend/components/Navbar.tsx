'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState<{name: string, plan: string} | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      if (stored && token) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {}
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              NP
            </div>
            <span className="font-bold text-xl text-white">
              Nexus <span className="text-blue-400">Pro</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm transition">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white text-sm transition">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-gray-300 text-sm">
                  Hi, {user.name.split(' ')[0]}
                </span>
                <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-medium uppercase">
                  {user.plan}
                </span>
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-white text-sm transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white text-sm transition"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}