'use client';

import React from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';
import { Plan } from '@/types/plan';
import {
  TELEGRAM_URL,
  DISCORD_URL,
  REDDIT_URL,
  TELEGRAM_VOUCHES_URL,
} from '@/lib/constants';

interface DirectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
}

export function DirectOrderModal({ isOpen, onClose, plan }: DirectOrderModalProps) {
  if (!isOpen || !plan) return null;

  const isDuo = plan.device_slots === 2;
  const devicesLabel = isDuo ? '2 Devices' : '1 Device';
  const priceInr = isDuo ? '₹300' : '₹160';
  const priceUsd = isDuo ? '$3.60 USD' : '$2.00 USD';

  const orderText = `Hey Dhruv, I want to buy a PGSharp Standard key for ${devicesLabel} (30 Days). I will pay with: UPI (${priceInr}) / PayPal (${priceUsd}). Please share payment details.`;

  // Pre-filled dynamic links
  const telegramTarget = `https://t.me/sleekfx3?text=${encodeURIComponent(orderText)}`;
  const discordTarget = DISCORD_URL;
  const redditSubject = `PGSharp Key Order (${devicesLabel})`;
  const redditTarget = `https://www.reddit.com/message/compose/?to=dhruv_emperor&subject=${encodeURIComponent(
    redditSubject
  )}&message=${encodeURIComponent(orderText)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Direct Order"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#080d1a]/95 border border-cyan-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0c1424]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold tracking-widest text-cyan-400 uppercase font-mono">
              DIRECT ORDER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Selected Plan Summary Banner */}
          <div className="p-3.5 rounded-xl bg-[#0c1629] border border-cyan-400/20 flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-sm sm:text-base">
                {plan.name} (30 Days)
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400 font-mono">
                {devicesLabel} Access
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-cyan-400 font-mono">
                {priceInr}
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400 font-mono">
                {priceUsd}
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="text-xs sm:text-sm text-neutral-300 font-medium">
            Select a platform to message directly for key:
          </div>

          {/* Social Platform Action Buttons */}
          <div className="space-y-2.5">
            {/* Telegram */}
            <a
              href={telegramTarget}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 hover:border-[#229ED9] text-white font-semibold text-sm transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#229ED9] fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                <span>Telegram</span>
              </div>
              <ExternalLink size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
            </a>

            {/* Discord */}
            <a
              href={discordTarget}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 hover:border-[#5865F2] text-white font-semibold text-sm transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#5865F2] fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Discord</span>
              </div>
              <ExternalLink size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
            </a>

            {/* Reddit */}
            <a
              href={redditTarget}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border border-[#FF4500]/30 hover:border-[#FF4500] text-white font-semibold text-sm transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#FF4500] fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
                <span>Reddit</span>
              </div>
              <ExternalLink size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
            </a>
          </div>

          {/* Reassurance Footer */}
          <div className="pt-3 border-t border-white/10 space-y-2 text-[11px] sm:text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
              <span>Accepted: UPI & PayPal • 100% Replacement Warranty</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Customer Vouches:</span>
              <a
                href={TELEGRAM_VOUCHES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
              >
                <span>t.me/AetheriaVouches</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
