import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Shield, Zap } from 'lucide-react';
import { DISCORD_URL, REDDIT_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service | AETHERIA — PGSharp Key Vault',
  description: 'Terms and conditions governing the purchase and automated instant delivery of PGSharp digital license keys.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background Subtle Radial Aura */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%)',
        }}
      />

      {/* Floating Cyber Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-xl border-b border-cyan-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="AETHERIA"
                width={36}
                height={36}
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-sans font-bold text-sm sm:text-base tracking-[0.2em] uppercase">
                AETHERIA
              </span>
              <span className="text-[9px] font-mono text-cyan-400 font-semibold tracking-widest uppercase">
                PGSharp Key Vault
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700 hover:border-cyan-400/60 text-xs font-mono text-neutral-300 hover:text-cyan-300 transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Return to Vault</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="pt-28 sm:pt-36 pb-20 px-4 max-w-4xl mx-auto relative z-10">
        <div className="bg-neutral-950/80 border border-cyan-500/20 backdrop-blur-2xl rounded-3xl p-6 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <FileText size={26} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase mb-1">
                <Zap size={11} className="text-cyan-400" />
                Legal Framework
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Terms of Service</h1>
              <p className="text-neutral-400 text-xs font-mono mt-1">Last Updated: September 2026 • Version 1.8.8</p>
            </div>
          </div>

          <div className="space-y-6 text-neutral-300 text-sm leading-relaxed border-t border-neutral-800/80 pt-6">
            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2 flex items-center gap-2">
                <Shield size={16} />
                1. Overview & Service Scope
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                AETHERIA provides genuine, cryptographically authenticated digital license keys for unlocking standard utility features in the PGSharp Android application. By placing an order through our automated storefront, you agree to be bound by these Terms of Service.
              </p>
            </section>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2">2. Automated Instant Digital Key Delivery</h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                All PGSharp license keys are dispatched electronically and instantly in under 10 seconds upon payment confirmation via UPI, Google Pay, PhonePe, Paytm, Cards, or PayPal. Keys are revealed on screen and sent to the purchaser&apos;s email address. No physical goods are shipped.
              </p>
            </section>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2">3. License Duration & Device Slot Rules</h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Each PGSharp license key provides 30 full days of active utility validity from the date of activation. Keys are bound strictly to the number of Android device slots specified by your purchased plan (1 Device or 2 Devices simultaneously). Keys are non-transferable across unauthorized device limits.
              </p>
            </section>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2">4. Disclaimers & Independent Reseller Status</h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                AETHERIA is an independent third-party distributor and digital key reseller. We are not affiliated with, endorsed by, or partnered with Niantic, Pokémon GO, The Pokémon Company, Nintendo, or PGSharp. All product trademarks belong to their respective owners.
              </p>
            </section>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2">5. Support Channels & Customer Inquiries</h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                For activation help, key verification, or customer inquiries, our team provides 24/7 assistance through our official{' '}
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
                  Discord Server
                </a>{' '}
                and{' '}
                <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
                  Reddit Support
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
