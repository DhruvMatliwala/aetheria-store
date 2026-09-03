'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Eye, EyeOff, Key, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';
import { cn } from '@/lib/utils';

interface KeyRevealProps {
  licenseKey: string;
  orderId: string;
  planType?: string;
  slotsAssigned?: number;
}

export function KeyReveal({ licenseKey, orderId, planType, slotsAssigned = 1 }: KeyRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderCopied, setOrderCopied] = useState(false);
  const hasTriggeredConfetti = useRef(false);

  // Fire celebratory confetti on first reveal
  useEffect(() => {
    if (revealed && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.45 },
          colors: ['#38bdf8', '#10b981', '#ffffff', '#818cf8'],
        });
      });
    }
  }, [revealed]);

  async function handleCopy(e?: React.MouseEvent) {
    try {
      if (e) triggerParticleBurst(e, 25);
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      toast.success('License key copied to clipboard!', { icon: '🔑' });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  async function handleCopyOrderId() {
    try {
      await navigator.clipboard.writeText(orderId);
      setOrderCopied(true);
      toast.success('Order ID copied!', { icon: '📋' });
      setTimeout(() => setOrderCopied(false), 2500);
    } catch {
      // ignore
    }
  }

  const isMultiDevice = slotsAssigned > 1 || (planType && planType.includes('2_device'));

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── Top Success Header Badge ────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse-slow" />
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-neutral-900/90 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 font-semibold">
            ORDER CONFIRMED
          </span>
          <span className="w-4 h-px bg-white/20" />
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            ● VERIFIED DELIVERY
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white font-normal tracking-tight mb-3">
          Your Key is Ready.
        </h1>
        <p className="text-neutral-300/90 text-sm sm:text-base max-w-lg mx-auto font-sans leading-relaxed">
          Your 30-day PGSharp Standard license key has been unlocked and delivered. A backup copy has also been sent to your email.
        </p>

        {/* Clickable Order ID Pill */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/80 border border-white/10 hover:border-cyan-500/40 text-xs font-mono text-neutral-400 hover:text-cyan-300 transition-all shadow-md group"
            title="Click to copy Order ID"
          >
            <span>Order #{orderId}</span>
            {orderCopied ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} className="text-neutral-500 group-hover:text-cyan-400 transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* ── Holographic Obsidian Key Vault Card ─────────────────────────────── */}
      <div className="relative rounded-3xl bg-neutral-950/85 backdrop-blur-2xl border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(56,189,248,0.15)] mb-6 transition-all">
        {/* Top Glow Ambient Flare */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Key size={15} className="text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-semibold">
              STANDARD LICENSE KEY
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono uppercase tracking-wider">
            {isMultiDevice ? '2 Device Slots' : '1 Device Slot'} • 30 Days
          </span>
        </div>

        {/* License Key Box with Reveal Overlay */}
        <div className="relative group">
          <div
            className="bg-black/80 border border-neutral-800 group-hover:border-cyan-500/40 rounded-2xl px-5 py-5 sm:py-6 font-mono text-center text-white font-bold tracking-widest cursor-pointer transition-all duration-300 shadow-inner"
            style={{
              fontSize: 'clamp(14px, 3.5vw, 20px)',
              letterSpacing: '0.15em',
              filter: revealed ? 'none' : 'blur(8px)',
              userSelect: revealed ? 'text' : 'none',
            }}
            onClick={() => !revealed && setRevealed(true)}
          >
            {licenseKey || 'PGSH-XXXX-XXXX-XXXX-XXXX'}
          </div>

          {/* Click to Reveal Button Overlay */}
          {!revealed && (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/40 hover:bg-black/30 backdrop-blur-[2px] text-white transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform shadow-lg">
                <Eye size={20} />
              </div>
              <span className="text-xs font-mono font-medium tracking-wider text-cyan-200">
                CLICK TO REVEAL KEY
              </span>
            </button>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <button
            type="button"
            onClick={(e) => {
              if (!revealed) setRevealed(true);
              handleCopy(e);
            }}
            className="flex-1 py-3.5 px-6 rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black font-semibold text-xs sm:text-sm font-sans tracking-wide transition-all duration-200 shadow-[0_0_25px_rgba(56,189,248,0.25)] active:scale-95 flex items-center justify-center gap-2"
            id="copy-key-btn"
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={3} className="text-emerald-950" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy License Key</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="py-3 px-5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-xs font-mono transition-all flex items-center justify-center gap-2"
            id="toggle-reveal-btn"
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{revealed ? 'Hide' : 'Reveal'}</span>
          </button>
        </div>
      </div>

      {/* ── Device Binding Advisory ─────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 text-left mb-6 shadow-md">
        <AlertTriangle size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs font-sans text-cyan-200/90 leading-relaxed">
          <strong className="text-cyan-300 font-semibold">Important Hardware Binding:</strong> Once entered in PGSharp, this key binds to your device ({isMultiDevice ? 'up to 2 devices' : '1 device'}) for the 30-day duration. Keep your key saved in a safe location.
        </div>
      </div>
    </div>
  );
}
