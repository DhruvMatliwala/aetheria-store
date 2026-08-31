import { Metadata } from 'next';
import Link from 'next/link';
import { RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { DISCORD_URL, REDDIT_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Refund & Replacement Policy | AETHERIA',
  description: 'Our 24-hour key replacement guarantee and digital goods refund policy.',
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-hero-gradient text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-surface-700/50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🎮</span>
            <span className="text-white font-extrabold text-lg">PGSharp Keys</span>
          </Link>
          <Link
            href="/#plans"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            ← Back to Storefront
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4 max-w-4xl mx-auto">
        <div className="bg-surface-800 border border-surface-600 rounded-3xl p-8 sm:p-12 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-900/60 border border-brand-700/50 flex items-center justify-center text-brand-400">
              <RefreshCw size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Refund & Replacement Policy</h1>
              <p className="text-gray-400 text-xs mt-1">Last Updated: August 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-300 text-sm leading-relaxed border-t border-surface-700 pt-6">
            {/* 24-Hour Guarantee Box */}
            <div className="p-5 bg-emerald-950/40 border border-emerald-700/50 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-base">
                <CheckCircle size={20} />
                <span>24-Hour Key Replacement Guarantee</span>
              </div>
              <p className="text-emerald-200/90 text-xs leading-relaxed">
                If you encounter any genuine issue with key validity or activation upon delivery, we guarantee an immediate replacement key within 24 hours of reporting it to our Discord or Reddit support mod team.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Nature of Digital Goods</h2>
              <p>
                Due to the intangible and irrevocable nature of digital software license keys, once a key has been revealed and successfully activated on an Android device, it cannot be refunded or transferred.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Eligible Replacement Scenarios</h2>
              <p>You are eligible for a replacement key under the following conditions:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2 ml-2">
                <li>Key is reported as invalid or already registered upon immediate delivery.</li>
                <li>Key duration tier received does not match the purchased tier.</li>
                <li>System failure resulted in charge without key delivery.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. Non-Refundable Scenarios</h2>
              <p>Refunds or replacements will not be issued in cases where:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2 ml-2">
                <li>The key was already successfully activated and bound to a device.</li>
                <li>User changes mind after viewing the serial key.</li>
                <li>User attempted to use the key on an unsupported operating system (e.g., iOS without root).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. How to Request a Replacement</h2>
              <p>
                To request a replacement, join our official{' '}
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                  Discord Server
                </a>{' '}
                or reach out on our{' '}
                <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                  Reddit Community
                </a>{' '}
                with your Order ID and payment receipt.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
