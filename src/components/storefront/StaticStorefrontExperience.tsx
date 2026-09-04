'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Zap,
  Sparkles,
  Check,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Lock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { Plan } from '@/types/plan';
import { PLANS, DISCORD_URL, TELEGRAM_URL, REDDIT_URL } from '@/lib/constants';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';
import { cn } from '@/lib/utils';

interface StaticStorefrontExperienceProps {
  stockCounts?: Record<string, number>;
  onBuyClick: (plan: Plan) => void;
  onNotifyClick: (plan: Plan) => void;
  waitlistedPlans?: Record<string, boolean>;
}

const FAQS = [
  {
    q: 'What are these keys used for?',
    a: 'These are official 30-day activation keys for the PGSharp Standard Edition Android app. Entering your key inside PGSharp unlocks VIP features including joystick teleportation, auto-walking, quick catch, 100% IV feeds, and shiny scanner.',
  },
  {
    q: 'How fast do I receive my PGSharp license key?',
    a: 'Delivery is instantaneous! As soon as your UPI or PayPal transfer is verified (in 2 to 3 seconds), your key appears right on screen with a 1-tap copy button and is dispatched to your email.',
  },
  {
    q: 'How do device slots work across 1-Device and 2-Device plans?',
    a: 'The 1 Device Plan (₹180 / $1.99) activates 1 Android phone for 30 days. The 2 Devices Plan (₹350 / $3.50) allows up to 2 Android phones simultaneously. Keys bind to device hardware for the 30-day duration.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'For India (INR): Direct UPI QR (Google Pay, PhonePe, Paytm, BHIM, CRED). For International (USD): PayPal (PayPal balance or debit/credit cards).',
  },
  {
    q: 'How do I activate the key in PGSharp?',
    a: 'Download the PGSharp APK, open Pokémon GO, tap the on-screen PGSharp star/settings icon ➔ Settings ➔ Activate, paste your key, and tap OK. VIP features unlock instantly!',
  },
];

export function StaticStorefrontExperience({
  stockCounts,
  onBuyClick,
  onNotifyClick,
  waitlistedPlans = {},
}: StaticStorefrontExperienceProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const scrollToPricing = () => {
    const el = document.getElementById('pricing-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050811] text-[#ece7e0] overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* ── Fixed Static 4K Cyberpunk Background Layer ─────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Cyberpunk Tokyo Night"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40 brightness-75 contrast-125"
        />
        {/* Radial Dark Vignettes & Cyan Glows */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050811]/90 via-[#050811]/70 to-[#050811]/95" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 50% 15%, rgba(6,182,212,0.18) 0%, rgba(16,185,129,0.08) 35%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Page Content Container ─────────────────────────────────────────── */}
      <div className="relative z-10">
        {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
        <section className="min-h-[85vh] sm:min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-28 pb-16 max-w-5xl mx-auto">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-6 shadow-[0_0_20px_rgba(6,182,212,0.25)] animate-pulse">
            <Sparkles size={13} className="text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider">Official PGSharp Standard Keys</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 font-bold">In Stock</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-white mb-6 leading-[1.08]">
            BREAK <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">EVERY LIMIT.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-sans leading-relaxed mb-8">
            Instant digital key delivery for Pokémon GO. Precision GPS joystick, teleportation, 100% IV radar feed, and quick-catch automation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-12">
            <button
              type="button"
              onClick={scrollToPricing}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap size={16} className="fill-black" />
              <span>Get Standard Key</span>
            </button>
            <button
              type="button"
              onClick={scrollToPricing}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-surface-900/80 hover:bg-surface-800 text-gray-300 hover:text-white border border-white/15 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span>View Pricing (From ₹180)</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Trust Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl pt-6 border-t border-white/10 text-xs font-mono text-gray-400">
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black/40 border border-white/5">
              <Zap size={13} className="text-emerald-400" />
              <span>2-3s Auto-Unlock</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black/40 border border-white/5">
              <ShieldCheck size={13} className="text-cyan-400" />
              <span>Vault Verified</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black/40 border border-white/5">
              <CheckCircle size={13} className="text-teal-400" />
              <span>30 Days Standard</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black/40 border border-white/5">
              <Lock size={13} className="text-cyan-400" />
              <span>UPI & PayPal</span>
            </div>
          </div>
        </section>

        {/* ── 2. Pricing Section ────────────────────────────────────────────── */}
        <section id="pricing-section" className="py-20 px-4 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 font-semibold mb-2">
              AFFORDABLE DIGITAL LICENSES
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white font-bold tracking-tight mb-3">
              Select Your Access Level
            </h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">
              Direct P2P checkout with zero bank limits. License key unlocks on-screen immediately upon transfer.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => {
              const stock = stockCounts ? stockCounts[plan.id] : undefined;
              const inStock = stock === undefined ? true : stock > 0;
              const isWaitlisted = waitlistedPlans[plan.id] || false;
              const isPopular = plan.badge === 'Popular';

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300',
                    isPopular
                      ? 'bg-[#050811]/85 backdrop-blur-xl border-2 border-cyan-400/60 shadow-[0_12px_45px_rgba(6,182,212,0.25)]'
                      : 'bg-[#050811]/75 sm:bg-[#050811]/80 backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 hover:bg-[#050811]/85 shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
                  )}
                >
                  {/* Top Badge */}
                  {plan.discount_badge && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-black text-[10px] font-display font-black uppercase tracking-wider shadow-md">
                      {plan.discount_badge}
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white font-display">{plan.name}</h3>
                        <p className="text-xs font-display text-cyan-400 mt-0.5">{plan.duration} Access</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-display text-gray-300">
                        {plan.device_slots} Device{plan.device_slots > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-6 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white font-display">
                        ₹{(plan.price_inr / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-display text-gray-400">
                        / ${(plan.price_usd / 100).toFixed(2)} USD
                      </span>
                      {plan.original_price_inr && (
                        <span className="text-xs font-display text-gray-500 line-through ml-1">
                          ₹{plan.original_price_inr / 100}
                        </span>
                      )}
                    </div>

                    {/* Stock Status Indicator */}
                    <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between text-xs font-display">
                      <span className="text-gray-400">Availability:</span>
                      {inStock ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{stock !== undefined ? `${stock} in Vault` : 'In Stock'}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>Temporarily Reserved</span>
                        </span>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2.5 mb-8 text-xs font-display text-gray-300">
                      {plan.features.map((feat: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div>
                    {inStock ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          triggerParticleBurst(e, 20);
                          onBuyClick(plan);
                        }}
                        className={cn(
                          'w-full py-3.5 px-6 rounded-xl font-bold font-display text-xs uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg',
                          isPopular
                            ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black shadow-[0_0_25px_rgba(6,182,212,0.35)]'
                            : 'bg-white hover:bg-cyan-400 text-black hover:text-black shadow-md'
                        )}
                      >
                        <Zap size={14} className={isPopular ? 'fill-black' : ''} />
                        <span>BUY KEY NOW</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNotifyClick(plan)}
                        disabled={isWaitlisted}
                        className="w-full py-3.5 px-6 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold font-display text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <span>{isWaitlisted ? 'Waitlist Joined ✓' : 'Notify on Restock'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Features Showcase ─────────────────────────────────────────── */}
        <section className="py-16 px-4 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 font-semibold mb-2">
              POWERFUL CAPABILITIES
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight">
              Standard Edition VIP Arsenal
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4">
                <Zap size={20} />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-serif">GPS Joystick & Teleport</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Teleport anywhere globally with custom walking speeds and simulated real-route pacing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4">
                <Sparkles size={20} />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-serif">100% IV Live Feed</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Real-time radar feeds showing active hundos, shundos, and rare global spawns.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4">
                <CheckCircle size={20} />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-serif">Quick Catch & Enhanced Throw</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Skip catch animations and guarantee excellent curveball throws on every encounter.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 mb-4">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-serif">Instant Auto-Unlock</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pure P2P payment flow that unlocks your key in 2-3 seconds without bank gateway errors.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. Frequently Asked Questions ───────────────────────────────── */}
        <section className="py-16 px-4 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold tracking-tight mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-xs font-mono text-gray-400">Everything you need to know about keys & activation</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-neutral-950/80 border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-white hover:text-cyan-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Direct 24/7 Community Support ────────────────────────────── */}
        <section className="py-12 px-4 max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-surface-900/80 to-emerald-950/40 border border-cyan-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-white font-serif mb-1">Need Direct Trainer Assistance?</h3>
              <p className="text-xs text-gray-300">
                Join our Discord community or chat with us on Telegram anytime.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg"
              >
                <span>Discord</span>
                <ExternalLink size={12} />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1C88BD] text-white text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg"
              >
                <span>Telegram</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </section>

        {/* ── 6. Minimal Footer ───────────────────────────────────────────── */}
        <footer className="py-10 px-4 border-t border-white/10 text-xs font-mono text-gray-500 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>© {new Date().getFullYear()} AETHERIA Vault. Official Standard Keys.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/refund" className="hover:text-gray-300 transition-colors">Refunds</Link>
            <Link href="/my-keys" className="text-cyan-400 hover:text-cyan-300 transition-colors">Find My Keys</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
