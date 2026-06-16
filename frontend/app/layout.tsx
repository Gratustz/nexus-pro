import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nexus Pro — Multi-Market Signal Platform',
  description: 'Professional trading signals for Crypto, Forex and Sports',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-gray-800 mt-20 py-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-xs">
                NP
              </div>
              <span className="font-bold text-white">
                Nexus <span className="text-blue-400">Pro</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 Nexus Pro. Professional signals for Crypto, Forex and Sports.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}