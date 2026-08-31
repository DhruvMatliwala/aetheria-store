'use client';

import React, { useState } from 'react';
import { triggerParticleBurst } from './ParticleBurst';

interface PokeballOrbProps {
  size?: number;
  className?: string;
}

export function PokeballOrb({ size = 80, className = '' }: PokeballOrbProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  function handleClick(e: React.MouseEvent) {
    setIsSpinning(true);
    triggerParticleBurst(e, 28);
    setTimeout(() => setIsSpinning(false), 700);
  }

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer select-none group transition-transform duration-300 hover:scale-110 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
      title="Click to release catch particles!"
    >
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 rounded-full bg-brand-500/30 blur-xl group-hover:bg-cyan-400/40 transition-colors" />

      {/* SVG Poké Ball Artwork */}
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full relative z-10 transition-transform duration-500 ease-out ${
          isSpinning ? 'rotate-[360deg] scale-105' : 'group-hover:rotate-12'
        }`}
      >
        <defs>
          <linearGradient id="topDomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="botDomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1e38" />
            <stop offset="100%" stopColor="#0f0f20" />
          </linearGradient>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </radialGradient>
        </defs>

        {/* Outer Shadow Ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="2" />

        {/* Top Half (Violet Dome) */}
        <path d="M 4 50 A 46 46 0 0 1 96 50 Z" fill="url(#topDomeGrad)" />

        {/* Bottom Half (Dark Dome) */}
        <path d="M 4 50 A 46 46 0 0 0 96 50 Z" fill="url(#botDomeGrad)" />

        {/* Center Black Seam */}
        <line x1="4" y1="50" x2="96" y2="50" stroke="#06060c" strokeWidth="8" />

        {/* Outer Center Ring */}
        <circle cx="50" cy="50" r="16" fill="#06060c" />
        <circle cx="50" cy="50" r="12" fill="#15152d" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

        {/* Core Glowing Button */}
        <circle
          cx="50"
          cy="50"
          r="7"
          fill="url(#centerGlow)"
          className="group-hover:animate-pulse"
        />
      </svg>
    </div>
  );
}
