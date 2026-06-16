import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nexus Pro — Multi-Market Signal Platform',
  description: 'Professional trading signals for Crypto, Forex and Sports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-950 text-white min-h-screen`}
      >
        {/* Navbar */}
        <nav className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                  NP
                </div>
                <span className="font-bold text-xl text-white">
                  Nexus <span className="text-blue-400">Pro</span>
                </span>
              </Link>

              {/* Nav Links */}
              <div className="hidden md:flex items-center gap-8">
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-white text-sm transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="text-gray-300 hover:text-white text-sm transition"
                >
                  Pricing
                </Link>
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center gap-3">
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
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main>{children}</main>

        {/* Footer */}
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
              © 2026 Nexus Pro. Professional signals for Crypto, Forex and
              Sports.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
