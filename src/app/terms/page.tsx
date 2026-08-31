import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, FileText, ArrowRight } from 'lucide-react';
import { DISCORD_URL, REDDIT_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service | AETHERIA',
  description: 'Terms and conditions governing the purchase and delivery of digital license keys.',
};

export default function TermsPage() {
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
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Terms of Service</h1>
              <p className="text-gray-400 text-xs mt-1">Last Updated: August 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-300 text-sm leading-relaxed border-t border-surface-700 pt-6">
            <section>
              <h2 className="text-lg font-bold text-white mb-2">1. Overview & Service Scope</h2>
              <p>
                This website provides digital license keys for unlocking standard utility features in the PGSharp Android software application. By placing an order, you agree to be bound by these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">2. Digital Product Delivery</h2>
              <p>
                All license keys are delivered electronically immediately upon confirmation of payment via Razorpay or PayPal. Keys are shown directly on the order confirmation screen and sent via email. No physical goods are shipped.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">3. License Duration & Device Slot Rules</h2>
              <p>
                Each license key provides 30 days of active utility validity from the date of activation. Keys are bound strictly to the number of Android device slots specified by your purchased plan (1, 2, or 3 devices). Keys are non-transferable across different devices once activated.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">4. Disclaimers & Independent Distributor</h2>
              <p>
                This service is an independent third-party distributor of software license keys. We are not affiliated with, endorsed by, or partnered with Niantic, Pokémon GO, The Pokémon Company, or Nintendo. Use of third-party modification utilities is at the user&apos;s sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-2">5. Community Support & Inquiries</h2>
              <p>
                Support is provided through our official{' '}
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                  Discord Server
                </a>{' '}
                and{' '}
                <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                  Reddit Community
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
