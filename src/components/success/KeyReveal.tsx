'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Key, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';

interface KeyRevealProps {
  licenseKey: string;
  orderId?: string;
  planType?: string;
  slotsAssigned?: number;
}

export function KeyReveal({ licenseKey, planType, slotsAssigned = 1 }: KeyRevealProps) {
  const [copied, setCopied] = useState(false);
  const hasTriggeredConfetti = useRef(false);

  // Auto-trigger celebratory confetti on page mount
  useEffect(() => {
    if (!hasTriggeredConfetti.current && licenseKey) {
      hasTriggeredConfetti.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.35 },
          colors: ['#38bdf8', '#10b981', '#ffffff', '#818cf8'],
        });
      });
    }
  }, [licenseKey]);

  async function handleCopy(e?: React.MouseEvent) {
    try {
      if (e) triggerParticleBurst(e, 25);
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      toast.success('License key copied to clipboard!', { icon: '🔑' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  const isMultiDevice = slotsAssigned > 1 || (planType && planType.includes('2_device'));

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white font-normal tracking-tight mb-2">
        Your PGSharp License Key
      </h1>
      <p className="text-neutral-400 text-xs sm:text-sm font-sans mb-5">
        Copy your key below and enter it inside the PGSharp app to activate VIP features.
      </p>

      {/* ── Compact Key Vault Box with Integrated Inline Copy ──────────────── */}
      <div className="relative rounded-2xl bg-[#0c1424]/90 backdrop-blur-xl border border-cyan-500/40 p-3 sm:p-4 shadow-[0_0_40px_rgba(6,182,212,0.15)] mb-3 transition-all">
        {/* Top Glow Ambient Flare */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between gap-2 sm:gap-3 bg-black/80 border border-neutral-800/90 hover:border-cyan-500/50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all group">
          {/* Key Emblem */}
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Key size={16} />
          </div>

          {/* Monospace License Key Text */}
          <div
            className="flex-1 font-mono text-cyan-200 font-bold tracking-wider sm:tracking-widest select-all break-all text-left text-xs sm:text-sm md:text-base"
          >
            {licenseKey || 'PGSH-XXXX-XXXX-XXXX-XXXX'}
          </div>

          {/* Integrated 1-Click Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            id="copy-key-btn"
            className={`px-3 sm:px-4 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 shadow-md active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.35)]'
            }`}
            title="Copy Key to Clipboard"
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={3} />
                <span className="hidden xs:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Compact 1-Line Device & Duration Micro-Advisory ────────────────── */}
      <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-400 mb-6">
        <ShieldCheck size={13} className="text-cyan-400" />
        <span>
          Binds to {isMultiDevice ? '2 devices' : '1 device'} upon in-app activation • 30-day validity
        </span>
      </div>
    </div>
  );
}
