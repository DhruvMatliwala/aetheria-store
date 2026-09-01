import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, CheckCircle, Shield, AlertCircle, HelpCircle } from 'lucide-react';
import { DISCORD_URL, REDDIT_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Refund & Replacement Policy | AETHERIA — PGSharp Key Vault',
  description: 'Our 24-hour key replacement guarantee and digital goods refund policy.',
};

export default function RefundPage() {
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
              <RefreshCw size={26} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase mb-1">
                <Shield size={11} className="text-cyan-400" />
                Customer Assurance
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Refund & Replacement Policy</h1>
              <p className="text-neutral-400 text-xs font-mono mt-1">Last Updated: September 2026 • Version 1.8.8</p>
            </div>
          </div>

          <div className="space-y-6 text-neutral-300 text-sm leading-relaxed border-t border-neutral-800/80 pt-6">
            {/* 24-Hour Guarantee Box */}
            <div className="p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-sm sm:text-base">
                <CheckCircle size={18} />
                <span>100% Valid Key Replacement Guarantee</span>
              </div>
              <p className="text-emerald-200/90 text-xs sm:text-sm leading-relaxed">
                If you encounter any genuine issue with key validity or activation upon delivery, we guarantee an immediate replacement key within 24 hours of reporting it to our dedicated support team on Discord or Reddit.
              </p>
            </div>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                1. Nature of Digital Goods
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Due to the intangible and irrevocable nature of digital software keys, once a key has been revealed on screen and successfully activated on an Android device, it cannot be refunded or revoked.
              </p>
            </section>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2">2. Eligible Replacement Scenarios</h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                You are entitled to an immediate replacement key under the following conditions:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-neutral-400 text-xs sm:text-sm mt-3 ml-1">
                <li>Key is reported as invalid or already registered upon delivery.</li>
                <li>Key duration received does not match the purchased tier (e.g. 30 days).</li>
                <li>System or gateway failure resulted in charge without key reveal.</li>
              </ul>
            </section>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2">3. Non-Refundable Scenarios</h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Refunds or replacements will not be issued in cases where:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-neutral-400 text-xs sm:text-sm mt-3 ml-1">
                <li>The key was already successfully activated and bound to your device.</li>
                <li>User changes mind after viewing the serial key.</li>
                <li>User attempted to use the key on an unsupported device outside standard PGSharp requirements.</li>
              </ul>
            </section>

            <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-5">
              <h2 className="text-base font-bold text-cyan-300 mb-2 flex items-center gap-2">
                <HelpCircle size={16} />
                4. How to Request a Replacement
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                To request a replacement, reach out on our official{' '}
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
                  Discord Server
                </a>{' '}
                or{' '}
                <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-medium">
                  Reddit Support
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
