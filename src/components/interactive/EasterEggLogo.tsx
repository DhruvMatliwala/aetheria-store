'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { triggerParticleBurst } from './ParticleBurst';

export function EasterEggLogo() {
  const [clickCount, setClickCount] = useState(0);
  const [showReward, setShowReward] = useState(false);

  function handleLogoClick(e: React.MouseEvent) {
    const next = clickCount + 1;
    setClickCount(next);

    if (next % 5 === 0) {
      triggerParticleBurst(e, 32);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2400);
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <Link
        href="/"
        onClick={handleLogoClick}
        className="flex items-center gap-3 group transition-transform active:scale-95"
      >
        {/* Sleek Frosted Glass Badge with Logo */}
        <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.2)] overflow-hidden transition-transform duration-300 group-hover:scale-105">
          <Image
            src="/logo.png"
            alt="AETHERIA"
            width={26}
            height={26}
            className="w-5 h-5 object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
          />
        </div>

        {/* Brand Name + Secondary Label */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif tracking-[0.25em] text-sm md:text-base text-white uppercase font-normal group-hover:text-cyan-300 transition-colors">
            AETHERIA
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest ml-1 font-semibold uppercase">
            VAULT
          </span>
        </div>
      </Link>

      {/* Secret +100 XP Reward Toast (Cyber-Cyan Theme) */}
      {showReward && (
        <div className="absolute top-11 left-0 z-50 animate-slide-up flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded-full shadow-lg border border-cyan-400/40 backdrop-blur-md pointer-events-none">
          <Sparkles size={12} className="animate-spin text-cyan-400" />
          <span>+100 XP VAULT SYNCED! ⚡</span>
        </div>
      )}
    </div>
  );
}
