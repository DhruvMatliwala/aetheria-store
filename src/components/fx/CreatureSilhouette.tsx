'use client';

import { useState } from 'react';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';

/**
 * CreatureSilhouette — Companion creature in Saffron Gold & Obsidian theme.
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
        {/* Original creature silhouette in Saffron Gold luxury tones */}
        <svg
          width="130"
          height="130"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_25px_rgba(255,188,9,0.35)]"
        >
          {/* Body */}
          <ellipse cx="60" cy="65" rx="28" ry="24" fill="url(#creature-body-gold)" />
          {/* Head */}
          <circle cx="60" cy="38" r="18" fill="url(#creature-head-gold)" />
          {/* Eyes */}
          <circle cx="53" cy="35" r="3.5" fill="#fff" opacity="0.95" />
          <circle cx="67" cy="35" r="3.5" fill="#fff" opacity="0.95" />
          <circle cx="54" cy="35.5" r="1.8" fill="#1b0b08" />
          <circle cx="68" cy="35.5" r="1.8" fill="#1b0b08" />
          {/* Eye shine */}
          <circle cx="55" cy="34" r="0.8" fill="#fff" />
          <circle cx="69" cy="34" r="0.8" fill="#fff" />
          {/* Mouth — subtle golden smile */}
          <path d="M55 42 Q60 46 65 42" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* Ears/horns with glowing gold tip */}
          <path d="M45 28 L42 16 L50 25" fill="url(#creature-horn-gold)" />
          <path d="M75 28 L78 16 L70 25" fill="url(#creature-horn-gold)" />
          {/* Wings in warm gold */}
          <path d="M32 55 Q20 40 28 50 Q24 48 32 58" fill="#ffbc09" opacity="0.6" />
          <path d="M88 55 Q100 40 92 50 Q96 48 88 58" fill="#ffbc09" opacity="0.6" />
          {/* Tail */}
          <path d="M60 88 Q50 95 42 92 Q38 90 35 95" stroke="url(#creature-body-gold)" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Belly highlight */}
          <ellipse cx="60" cy="70" rx="16" ry="12" fill="#fffbeb" opacity="0.25" />

          <defs>
            <radialGradient id="creature-body-gold" cx="0.5" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#ffd053" />
              <stop offset="60%" stopColor="#ffbc09" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
            <radialGradient id="creature-head-gold" cx="0.5" cy="0.4" r="0.6">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#ffd053" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <linearGradient id="creature-horn-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="100%" stopColor="#ffbc09" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Ambient gold glow underneath */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-[#ffbc09]/25 blur-xl animate-glow-breathe" />
    </div>
  );
}
