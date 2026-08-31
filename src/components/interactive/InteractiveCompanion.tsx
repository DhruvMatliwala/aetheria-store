'use client';

import React, { useState } from 'react';
import { Sparkles, X, MessageSquare, Zap } from 'lucide-react';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';

const TIPS = [
  '⚡ Hotspot: Zaragoza, Spain has 50+ lured PokéStops clustered together!',
  '⚡ Speed Tip: Set joystick to 9.3 km/h to hatch eggs at maximum speed.',
  '⚡ 100% IV: Teleport to coordinates before the spawn timer hits zero.',
  '⚡ Quick Catch: Skip catching animations to catch Pokémon 3x faster.',
  '⚡ Safety: Always respect cooldown times after teleporting across cities!',
];

export function InteractiveCompanion() {
  const [tipIdx, setTipIdx] = useState(0);
  const [showTip, setShowTip] = useState(true);
  const [wobbling, setWobbling] = useState(false);

  function handleClick(e: React.MouseEvent) {
    triggerParticleBurst(e, 24);
    setWobbling(true);
    setTipIdx((prev) => (prev + 1) % TIPS.length);
    setShowTip(true);
    setTimeout(() => setWobbling(false), 800);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
      {/* Speech Bubble Tip */}
      {showTip && (
        <div className="relative max-w-xs p-3.5 rounded-2xl bg-surface-900 border border-[#ffbc09]/50 shadow-depth text-xs text-[#ece7e0] font-mono leading-relaxed animate-slide-up backdrop-blur-md">
          <button
            onClick={() => setShowTip(false)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-[#ffbc09] transition-colors"
            aria-label="Close tip"
          >
            <X size={12} />
          </button>
          <div className="flex items-start gap-2 pr-4">
            <Sparkles size={14} className="text-[#ffbc09] flex-shrink-0 mt-0.5" />
            <p>{TIPS[tipIdx]}</p>
          </div>
          <div className="mt-2 text-[10px] text-[#ffbc09] font-bold uppercase tracking-wider flex items-center gap-1">
            <Zap size={10} />
            <span>Click Pokéball for next tip</span>
          </div>
        </div>
      )}

      {/* Floating Animated Pokéball */}
      <button
        type="button"
        onClick={handleClick}
        className={`relative group cursor-pointer transition-transform duration-300 ${
          wobbling ? 'scale-125 rotate-12' : 'hover:scale-110'
        }`}
        aria-label="Interactive Companion"
      >
        <div className="absolute -inset-2 rounded-full bg-[#ffbc09]/20 blur-lg group-hover:bg-[#ffbc09]/40 transition-all" />
        <div className="relative w-14 h-14 rounded-full bg-surface-950 border-2 border-[#ffbc09] flex items-center justify-center shadow-glow-sm">
          <PokeballLottie size={46} />
        </div>
      </button>
    </div>
  );
}
