'use client';

import { useState } from 'react';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';

/**
 * CreatureSilhouette — Companion creature in Cyberpunk Cyan & Obsidian theme.
 * Original artwork with subtle float physics + interactive particle burst.
 */
export function CreatureSilhouette({ className = '' }: { className?: string }) {
  const [reacting, setReacting] = useState(false);

  function handleClick(e: React.MouseEvent) {
    if (reacting) return;
    triggerParticleBurst(e, 20);
    setReacting(true);
    setTimeout(() => setReacting(false), 600);
  }

  return (
    <div
      className={`relative cursor-pointer select-none ${className}`}
      onClick={handleClick}
      role="img"
      aria-label="Companion silhouette"
    >
      <div
        className={`transition-transform duration-500 ${
          reacting ? 'scale-110 -rotate-6' : 'animate-float-idle'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-spring)' }}
      >
        {/* Original creature silhouette in Electric Cyan & Obsidian tones */}
        <svg
          width="130"
          height="130"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
        >
          {/* Body */}
          <ellipse cx="60" cy="65" rx="28" ry="24" fill="url(#creature-body-cyan)" />
          {/* Head */}
          <circle cx="60" cy="38" r="18" fill="url(#creature-head-cyan)" />
          {/* Eyes */}
          <circle cx="53" cy="35" r="3.5" fill="#fff" opacity="0.95" />
          <circle cx="67" cy="35" r="3.5" fill="#fff" opacity="0.95" />
          <circle cx="54" cy="35.5" r="1.8" fill="#070b13" />
          <circle cx="68" cy="35.5" r="1.8" fill="#070b13" />
          {/* Eye shine */}
          <circle cx="55" cy="34" r="0.8" fill="#fff" />
          <circle cx="69" cy="34" r="0.8" fill="#fff" />
          {/* Mouth — subtle smile */}
          <path d="M55 42 Q60 46 65 42" stroke="#0e7490" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* Ears/horns with glowing cyan tip */}
          <path d="M45 28 L42 16 L50 25" fill="url(#creature-horn-cyan)" />
          <path d="M75 28 L78 16 L70 25" fill="url(#creature-horn-cyan)" />
          {/* Wings in electric cyan */}
          <path d="M32 55 Q20 40 28 50 Q24 48 32 58" fill="#06b6d4" opacity="0.6" />
          <path d="M88 55 Q100 40 92 50 Q96 48 88 58" fill="#06b6d4" opacity="0.6" />
          {/* Tail */}
          <path d="M60 88 Q50 95 42 92 Q38 90 35 95" stroke="url(#creature-body-cyan)" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Belly highlight */}
          <ellipse cx="60" cy="70" rx="16" ry="12" fill="#cffafe" opacity="0.25" />

          <defs>
            <radialGradient id="creature-body-cyan" cx="0.5" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </radialGradient>
            <radialGradient id="creature-head-cyan" cx="0.5" cy="0.4" r="0.6">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </radialGradient>
            <linearGradient id="creature-horn-cyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Ambient cyan glow underneath */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-cyan-500/25 blur-xl animate-pulse" />
    </div>
  );
}
