'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { KeyReveal } from '@/components/success/KeyReveal';
import { ActivationGuide } from '@/components/success/ActivationGuide';
import { OrderPublic } from '@/types/order';
import { DISCORD_URL, REDDIT_URL, TELEGRAM_URL, PLANS } from '@/lib/constants';
import {
  ExternalLink,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  MessageSquare,
  CheckCircle,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderSuccessViewProps {
  initialOrder: OrderPublic;
  orderId: string;
}

export function OrderSuccessView({ initialOrder, orderId }: OrderSuccessViewProps) {
  const [order, setOrder] = useState<OrderPublic>(initialOrder);
  const [status, setStatus] = useState<'paid' | 'capturing' | 'polling' | 'timeout' | 'failed'>(
    initialOrder.payment_status === 'paid' ? 'paid' : 'polling'
  );
  const [progressMessage, setProgressMessage] = useState<string>(
    'Verifying your transaction with the payment rail...'
  );
  const [attempts, setAttempts] = useState(0);
  const [isCheckingManual, setIsCheckingManual] = useState(false);

  const isCapturingRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Confetti Trigger ────────────────────────────────────────────────────────
  function triggerConfetti() {
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.45 },
        colors: ['#38bdf8', '#10b981', '#ffffff', '#818cf8'],
      });
    });
  }

  // ── Polling function ────────────────────────────────────────────────────────
  async function checkOrderStatus(isManual = false) {
    if (isManual) setIsCheckingManual(true);
    try {
      const res = await fetch(`/api/order/${orderId}`);
      if (!res.ok) return;

      const data = (await res.json()) as OrderPublic;
      if (data.payment_status === 'paid' && data.delivered_key) {
        setOrder(data);
        setStatus('paid');
        triggerConfetti();
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (data.payment_status === 'failed') {
        setOrder(data);
        setStatus('failed');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('[order-success] Polling error:', err);
    } finally {
      if (isManual) setIsCheckingManual(false);
    }
  }

  // ── Auto-clear waitlist for this plan upon successful key purchase ──────────
  useEffect(() => {
    if (order.payment_status === 'paid' && order.plan_type && typeof window !== 'undefined') {
      localStorage.removeItem(`restock_requested_${order.plan_type}`);
    }
  }, [order.payment_status, order.plan_type]);

  // ── PayPal Auto-Capture & Polling on Mount ──────────────────────────────────
  useEffect(() => {
    if (order.payment_status === 'paid' && order.delivered_key) {
      setStatus('paid');
      return;
    }

    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const paypalToken = urlParams.get('token');

    // 1. If redirected from PayPal, Auto-Capture Immediately
    if (paypalToken && !isCapturingRef.current && order.payment_status === 'pending') {
      isCapturingRef.current = true;
      setStatus('capturing');
      setProgressMessage('Authorizing and capturing your PayPal transaction...');

      fetch('/api/checkout/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paypalOrderId: paypalToken,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.success && data.order?.delivered_key) {
            setOrder(data.order);
            setStatus('paid');
            triggerConfetti();
            window.history.replaceState({}, '', `/order-success/${orderId}`);
          } else {
            console.warn('[order-success] Capture returned fallback:', data);
            setProgressMessage('Payment received, finalizing key allocation...');
            startPolling();
          }
        })
        .catch((err) => {
          console.error('[order-success] Capture network error:', err);
          setProgressMessage('Payment received, finalizing key allocation...');
          startPolling();
        });

      return;
    }

    // 2. Otherwise start status polling
    startPolling();

    function startPolling() {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      setStatus('polling');
      let currentAttempt = 0;

      pollIntervalRef.current = setInterval(() => {
        currentAttempt += 1;
        setAttempts(currentAttempt);

        if (currentAttempt >= 10) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setStatus('timeout');
          return;
        }

        checkOrderStatus();
      }, 1500);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [orderId]);

  const matchedPlan = PLANS.find((p) => p.id === order.plan_type);

  // ── Render Pending / Capturing State ────────────────────────────────────────
  if (status === 'capturing' || status === 'polling') {
    return (
      <main className="min-h-screen bg-[#080403] text-[#ece7e0] flex items-center justify-center p-4 selection:bg-cyan-500/30">
        <div className="max-w-md w-full text-center bg-neutral-950/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto mb-6 text-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <RefreshCw size={26} className="animate-spin" />
          </div>

          <h1 className="text-2xl font-serif text-white font-normal mb-2">
            {status === 'capturing' ? 'Capturing Transaction' : 'Verifying Payment'}
          </h1>
          <p className="text-neutral-300 text-xs sm:text-sm mb-6 leading-relaxed font-sans">
            {progressMessage}
          </p>

          <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs text-neutral-400 mb-2 font-mono">
            Order #{orderId}
          </div>
          <p className="text-[11px] font-mono text-neutral-500">Attempt {attempts} of 10</p>
        </div>
      </main>
    );
  }

  // ── Render Fallback Timeout State (after 10 attempts) ────────────────────────
  if (status === 'timeout') {
    return (
      <main className="min-h-screen bg-[#080403] text-[#ece7e0] flex items-center justify-center p-4 selection:bg-cyan-500/30">
        <div className="max-w-md w-full text-center bg-neutral-950/90 backdrop-blur-2xl border border-amber-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Clock size={28} />
          </div>

          <h1 className="text-2xl font-serif text-white font-normal mb-2">
            Finalizing Key Allocation...
          </h1>
          <p className="text-neutral-300 text-xs sm:text-sm mb-6 leading-relaxed font-sans">
            Your payment is recorded. If your key does not appear immediately, click below or check your inbox.
          </p>

          <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs text-neutral-400 mb-6 font-mono">
            Order #{orderId}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => checkOrderStatus(true)}
              disabled={isCheckingManual}
              className="w-full py-3 rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className={isCheckingManual ? 'animate-spin' : ''} />
              <span>{isCheckingManual ? 'Checking Status...' : 'Check Status Now'}</span>
            </button>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-mono text-neutral-400 mb-3">Need direct assistance?</p>
              <div className="flex items-center justify-center gap-2">
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-xs font-mono text-white transition-all flex items-center gap-1.5"
                >
                  <MessageSquare size={13} />
                  <span>Discord Profile</span>
                </a>
                <a
                  href={REDDIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#FF4500]/20 hover:bg-[#FF4500]/30 border border-[#FF4500]/40 text-xs font-mono text-white transition-all flex items-center gap-1.5"
                >
                  <MessageSquare size={13} />
                  <span>Reddit Profile</span>
                </a>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/40 text-xs font-mono text-white transition-all flex items-center gap-1.5"
                >
                  <MessageSquare size={13} />
                  <span>Telegram (@sleekfx3)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Render Failed State ─────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <main className="min-h-screen bg-[#080403] text-[#ece7e0] flex items-center justify-center p-4 selection:bg-cyan-500/30">
        <div className="max-w-md w-full text-center bg-neutral-950/90 backdrop-blur-2xl border border-red-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-center justify-center mx-auto mb-6 text-red-400">
            <AlertCircle size={28} />
          </div>

          <h1 className="text-2xl font-serif text-white font-normal mb-2">Transaction Incomplete</h1>
          <p className="text-neutral-300 text-xs sm:text-sm mb-6 leading-relaxed font-sans">
            Your transaction could not be verified or was cancelled. No charge was captured.
          </p>

          <p className="text-xs text-neutral-500 mb-6 font-mono">Order #{orderId}</p>

          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            ← Return to Storefront
          </Link>
        </div>
      </main>
    );
  }

  // ── Render Paid / Key Revealed View ─────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#080403] text-[#ece7e0] selection:bg-cyan-500/30 relative overflow-x-hidden">
      {/* Background Ambient Aura */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 10%, rgba(56, 189, 248, 0.15) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 80%)',
        }}
      />

      {/* Top Header Navigation */}
      <header className="fixed top-5 left-0 right-0 z-40 px-6 md:px-12 flex items-center justify-between pointer-events-none">
        {/* Brand Emblem */}
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-full bg-neutral-950/80 backdrop-blur-xl border border-white/15 hover:border-cyan-500/40 transition-all shadow-lg group"
        >
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
            <Sparkles size={13} />
          </div>
          <span className="text-xs font-serif tracking-[0.2em] text-white font-bold uppercase">
            AETHERIA
          </span>
        </Link>

        {/* Back to Store Button */}
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-950/80 backdrop-blur-xl border border-white/15 hover:border-cyan-400 text-xs font-mono text-neutral-300 hover:text-white transition-all shadow-lg active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Storefront</span>
        </Link>
      </header>

      {/* Main Content Container */}
      <div className="relative z-10 pt-28 pb-20 px-4 max-w-3xl mx-auto">
        {/* Key Reveal Component */}
        <KeyReveal
          licenseKey={order.delivered_key ?? ''}
          orderId={orderId}
          planType={order.plan_type}
          slotsAssigned={order.slots_assigned}
        />

        {/* ── Transaction Receipt Breakdown ─────────────────────────────────── */}
        <div className="mt-6 p-6 rounded-3xl bg-neutral-950/80 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-cyan-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                Transaction Receipt
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle size={13} />
              <span>Paid & Vault Verified</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <p className="text-neutral-500 uppercase tracking-wider text-[10px]">License Plan</p>
              <p className="text-white font-medium mt-1">
                {matchedPlan?.name ?? 'Standard License'}
              </p>
            </div>

            <div>
              <p className="text-neutral-500 uppercase tracking-wider text-[10px]">Device Slots</p>
              <p className="text-white font-medium mt-1">
                {order.slots_assigned ?? (matchedPlan?.device_slots ?? 1)} Device{((order.slots_assigned ?? 1) > 1) ? 's' : ''}
              </p>
            </div>

            <div>
              <p className="text-neutral-500 uppercase tracking-wider text-[10px]">Amount Captured</p>
              <p className="text-cyan-300 font-bold mt-1">
                {order.currency === 'INR' ? `₹${(order.amount / 100).toLocaleString('en-IN')}` : `$${(order.amount / 100).toFixed(2)}`}
              </p>
            </div>

            <div>
              <p className="text-neutral-500 uppercase tracking-wider text-[10px]">Duration</p>
              <p className="text-neutral-300 font-medium mt-1">30 Days Standard</p>
            </div>
          </div>
        </div>

        {/* ── 1-on-1 Direct Support Box ──────────────────────────────────────── */}
        <div className="mt-6 p-6 rounded-3xl bg-neutral-950/80 backdrop-blur-xl border border-cyan-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white font-sans">1-on-1 Trainer Support</h3>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Questions about activation or coords? Reach out directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto">
            {/* Discord */}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-xs font-mono text-white transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Discord Profile</span>
              <ExternalLink size={12} />
            </a>

            {/* Reddit */}
            <a
              href={REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#FF4500]/20 hover:bg-[#FF4500]/30 border border-[#FF4500]/40 text-xs font-mono text-white transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Reddit Profile</span>
              <ExternalLink size={12} />
            </a>

            {/* Telegram */}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/40 text-xs font-mono text-white transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Telegram (@sleekfx3)</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* 4-Step Activation Guide */}
        <ActivationGuide />

        {/* Minimal Footer */}
        <footer className="mt-14 pt-6 border-t border-white/5 text-center text-xs font-mono text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} AETHERIA Vault. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-neutral-300">Terms</Link>
            <Link href="/privacy" className="hover:text-neutral-300">Privacy</Link>
            <Link href="/refund" className="hover:text-neutral-300">Refunds</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
