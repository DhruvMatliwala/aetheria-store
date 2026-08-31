'use client';

import React from 'react';

/**
 * 60fps Vector Animated Pokéball Component
 * Includes authentic wobble, center-button glow pulse, and gold/ivory luxury finish.
 */
export function PokeballLottie({
  size = 100,
  className = '',
  variant = 'gold',
}: {
  size?: number;
  className?: string;
  variant?: 'gold' | 'classic' | 'ultra';
}) {
  const topColor =
    variant === 'gold' ? '#ffbc09' : variant === 'ultra' ? '#1b0b08' : '#ef4444';
  const accentStrip =
    variant === 'ultra' ? '#ffbc09' : variant === 'gold' ? '#ffd053' : '#dc2626';

  return (
    <span
      className={`inline-block select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Animated Pokéball"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full animate-float-idle drop-shadow-[0_0_15px_rgba(255,188,9,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Half Dome */}
        <path
          d="M 5 50 A 45 45 0 0 1 95 50 Z"
          fill={topColor}
          stroke="#1b0b08"
          strokeWidth="5"
        />

        {/* Ultra / Gold Stripes */}
        {variant === 'ultra' && (
          <>
            <path d="M 22 25 Q 35 15 50 15 Q 65 15 78 25" stroke={accentStrip} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 30 35 Q 40 28 50 28 Q 60 28 70 35" stroke={accentStrip} strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Top Highlight Shine */}
        <path
          d="M 20 40 A 35 35 0 0 1 80 40"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.3"
          fill="none"
        />

        {/* Bottom Half Dome */}
        <path
          d="M 5 50 A 45 45 0 0 0 95 50 Z"
          fill="#ece7e0"
          stroke="#1b0b08"
          strokeWidth="5"
        />

        {/* Middle Dividing Band */}
        <rect x="5" y="46" width="90" height="8" fill="#1b0b08" />

        {/* Outer Center Button Ring */}
        <circle cx="50" cy="50" r="14" fill="#1b0b08" />

        {/* Middle Button Ring */}
        <circle cx="50" cy="50" r="10" fill="#ece7e0" stroke="#1b0b08" strokeWidth="2.5" />

        {/* Inner Glowing Button Core */}
        <circle
          cx="50"
          cy="50"
          r="6"
          fill="#ffbc09"
          className="animate-pulse"
        />
        <circle cx="48" cy="48" r="1.8" fill="#ffffff" opacity="0.8" />
      </svg>
    </span>
  );
}

/**
 * Animated Pikachu Runner / Explorer Component
 */
export function PikachuRunner({ className = '' }: { className?: string }) {
  return (
    <div className={`relative select-none pointer-events-none ${className}`}>
      {/* 60fps SVG animated Pikachu Sprite */}
      <svg
        width="90"
        height="90"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-bounce"
        style={{ animationDuration: '0.9s' }}
      >
        {/* Tail (Lightning Bolt) */}
        <path
          d="M25 65 L10 50 L20 45 L12 30 L32 40 L28 50 Z"
          fill="#ffbc09"
          stroke="#78350f"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M22 62 L15 54 L20 50" fill="#78350f" />

        {/* Body */}
        <ellipse cx="55" cy="60" rx="26" ry="22" fill="#ffbc09" stroke="#78350f" strokeWidth="2.5" />

        {/* Back Stripes */}
        <path d="M42 45 Q50 48 58 45" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M40 54 Q50 58 60 54" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Feet */}
        <ellipse cx="40" cy="80" rx="8" ry="5" fill="#ffbc09" stroke="#78350f" strokeWidth="2" />
        <ellipse cx="68" cy="80" rx="8" ry="5" fill="#ffbc09" stroke="#78350f" strokeWidth="2" />

        {/* Head */}
        <circle cx="65" cy="40" r="20" fill="#ffbc09" stroke="#78350f" strokeWidth="2.5" />

        {/* Left Ear */}
        <path d="M52 24 L38 5 L48 18" fill="#ffbc09" stroke="#78350f" strokeWidth="2" />
        <path d="M44 12 L38 5 L48 18 Z" fill="#1b0b08" />

        {/* Right Ear */}
        <path d="M72 22 L88 4 L76 18" fill="#ffbc09" stroke="#78350f" strokeWidth="2" />
        <path d="M82 11 L88 4 L76 18 Z" fill="#1b0b08" />

        {/* Eyes with shining spark */}
        <circle cx="60" cy="36" r="3.5" fill="#1b0b08" />
        <circle cx="59" cy="35" r="1.2" fill="#fff" />
        <circle cx="74" cy="36" r="3.5" fill="#1b0b08" />
        <circle cx="73" cy="35" r="1.2" fill="#fff" />

        {/* Nose */}
        <polygon points="66,41 68,41 67,43" fill="#1b0b08" />

        {/* Cheeks */}
        <circle cx="54" cy="44" r="4.5" fill="#ea580c" />
        <circle cx="78" cy="44" r="4.5" fill="#ea580c" />

        {/* Mouth */}
        <path d="M64 45 Q67 48 70 45" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Arms / Paws */}
        <ellipse cx="62" cy="62" rx="5" ry="4" fill="#ffbc09" stroke="#78350f" strokeWidth="2" />
      </svg>
      {/* Electric Sparkles */}
      <div className="absolute -top-1 -right-1 text-xs text-[#ffd053] animate-ping font-mono">⚡</div>
    </div>
  );
}

/**
 * Animated Gengar Ghost Floating in Dark Scene
 */
export function GengarGhost({ className = '' }: { className?: string }) {
  return (
    <div className={`relative select-none ${className}`}>
      <div className="animate-float-idle" style={{ animationDuration: '4s' }}>
        <svg
          width="110"
          height="110"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_25px_rgba(255,188,9,0.35)]"
        >
          {/* Spikes / Ears */}
          <path d="M25 25 L15 10 L35 22 Z" fill="#240e0b" stroke="#712011" strokeWidth="2" />
          <path d="M75 25 L85 10 L65 22 Z" fill="#240e0b" stroke="#712011" strokeWidth="2" />
          <path d="M45 18 L50 6 L55 18 Z" fill="#240e0b" stroke="#712011" strokeWidth="2" />

          {/* Body */}
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="#1b0b08" stroke="#ffbc09" strokeWidth="2.5" />

          {/* Glowing Red/Amber Eyes */}
          <polygon points="30,42 42,48 33,52" fill="#ffbc09" />
          <polygon points="70,42 58,48 67,52" fill="#ffbc09" />
          <circle cx="37" cy="47" r="1.5" fill="#fff" />
          <circle cx="63" cy="47" r="1.5" fill="#fff" />

          {/* Iconic Big Grin */}
          <path
            d="M26 58 Q50 82 74 58 Q50 64 26 58 Z"
            fill="#fff"
            stroke="#ffbc09"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Teeth lines */}
          <line x1="38" y1="60" x2="40" y2="67" stroke="#1b0b08" strokeWidth="1.5" />
          <line x1="50" y1="61" x2="50" y2="70" stroke="#1b0b08" strokeWidth="1.5" />
          <line x1="62" y1="60" x2="60" y2="67" stroke="#1b0b08" strokeWidth="1.5" />
          <path d="M30 63 Q50 71 70 63" stroke="#1b0b08" strokeWidth="1.5" fill="none" />

          {/* Hands */}
          <path d="M15 52 Q6 58 14 66 Q20 62 20 56" fill="#240e0b" stroke="#ffbc09" strokeWidth="1.5" />
          <path d="M85 52 Q94 58 86 66 Q80 62 80 56" fill="#240e0b" stroke="#ffbc09" strokeWidth="1.5" />
        </svg>
      </div>
      {/* Ghostly Aura */}
      <div className="absolute inset-0 bg-[#ffbc09]/[0.08] rounded-full blur-xl pointer-events-none" />
    </div>
  );
}

/**
 * Animated Charizard Flame Dragon
 */
export function CharizardFlight({ className = '' }: { className?: string }) {
  return (
    <div className={`relative select-none ${className}`}>
      <div className="animate-float-idle" style={{ animationDuration: '3.5s' }}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_25px_rgba(234,88,12,0.4)]"
        >
          {/* Wings */}
          <path d="M40 45 L15 15 L25 40 L8 35 L28 55 Z" fill="#712011" stroke="#ea580c" strokeWidth="2" />
          <path d="M60 45 L85 15 L75 40 L92 35 L72 55 Z" fill="#712011" stroke="#ea580c" strokeWidth="2" />

          {/* Tail with Fire Flame */}
          <path d="M50 75 Q40 85 30 82 Q20 80 15 88" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="14" cy="88" r="6" fill="#ffbc09" className="animate-ping" />
          <circle cx="14" cy="88" r="4" fill="#ef4444" />

          {/* Body */}
          <ellipse cx="50" cy="55" rx="20" ry="24" fill="#ea580c" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="50" cy="58" rx="12" ry="16" fill="#fde68a" opacity="0.9" />

          {/* Head & Horns */}
          <circle cx="50" cy="34" r="14" fill="#ea580c" stroke="#78350f" strokeWidth="2" />
          <path d="M42 26 L34 14 L45 22" fill="#ea580c" stroke="#78350f" strokeWidth="1.5" />
          <path d="M58 26 L66 14 L55 22" fill="#ea580c" stroke="#78350f" strokeWidth="1.5" />

          {/* Eyes */}
          <polygon points="44,30 48,34 44,36" fill="#080403" />
          <polygon points="56,30 52,34 56,36" fill="#080403" />
          <circle cx="46" cy="32" r="1" fill="#fff" />
          <circle cx="54" cy="32" r="1" fill="#fff" />

          {/* Fire breath puff */}
          <path d="M50 42 Q50 50 54 46" stroke="#ffbc09" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
