'use client';

import React, { useState } from 'react';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';

/**
 * HeroPikachuMaster — Large, charismatic, 60fps interactive Pikachu illustration.
 * Perfectly balances the Hero section with vibrant character art.
 */
export function HeroPikachuMaster({ className = '' }: { className?: string }) {
  const [active, setActive] = useState(false);

  function handleClick(e: React.MouseEvent) {
    triggerParticleBurst(e, 35);
    setActive(true);
    setTimeout(() => setActive(false), 700);
  }

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer select-none group ${className}`}
      role="img"
      aria-label="Pikachu companion illustration"
    >
      {/* Radiant Electric Glow Aura */}
      <div className="absolute -inset-10 bg-cyan-500/[0.18] rounded-full blur-[80px] group-hover:bg-cyan-500/[0.3] transition-all duration-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-600/[0.15] rounded-full blur-[60px]" />

      <div
        className={`relative z-10 transition-transform duration-500 ${
          active ? 'scale-110 -rotate-3' : 'group-hover:scale-105 animate-float-idle'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-spring)' }}
      >
        <svg
          width="240"
          height="240"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
        >
          {/* Tail — Lightning Shape */}
          <path
            d="M48 95 L22 75 L38 68 L24 45 L54 58 L48 72 Z"
            fill="url(#pikachu-tail-grad)"
            stroke="#78350f"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Body */}
          <ellipse
            cx="85"
            cy="100"
            rx="42"
            ry="36"
            fill="url(#pikachu-body-grad)"
            stroke="#78350f"
            strokeWidth="3.5"
          />

          {/* Left Foot */}
          <ellipse cx="62" cy="132" rx="12" ry="7" fill="#ffd053" stroke="#78350f" strokeWidth="2.5" />
          {/* Right Foot */}
          <ellipse cx="106" cy="132" rx="12" ry="7" fill="#ffd053" stroke="#78350f" strokeWidth="2.5" />

          {/* Left Ear */}
          <path
            d="M60 48 L35 15 L52 38"
            fill="#ffd053"
            stroke="#78350f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Left Ear Tip (Dark) */}
          <path d="M48 32 L35 15 L43 25 Z" fill="#070b13" />

          {/* Right Ear */}
          <path
            d="M102 46 L132 15 L112 38"
            fill="#ffd053"
            stroke="#78350f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Right Ear Tip (Dark) */}
          <path d="M118 30 L132 15 L124 24 Z" fill="#070b13" />

          {/* Head */}
          <circle
            cx="85"
            cy="68"
            r="32"
            fill="url(#pikachu-body-grad)"
            stroke="#78350f"
            strokeWidth="3.5"
          />

          {/* Left Eye */}
          <circle cx="72" cy="62" r="5.5" fill="#070b13" />
          <circle cx="74" cy="60" r="2" fill="#ffffff" />

          {/* Right Eye */}
          <circle cx="98" cy="62" r="5.5" fill="#070b13" />
          <circle cx="96" cy="60" r="2" fill="#ffffff" />

          {/* Red Cheeks */}
          <circle cx="63" cy="74" r="7" fill="#ef4444" opacity="0.9" />
          <circle cx="107" cy="74" r="7" fill="#ef4444" opacity="0.9" />

          {/* Nose */}
          <polygon points="84,69 86,69 85,71" fill="#070b13" />

          {/* Happy Cat Mouth */}
          <path
            d="M80 74 Q85 78 85 75 Q85 78 90 74"
            stroke="#78350f"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Hands */}
          <ellipse cx="72" cy="98" rx="8" ry="6" fill="#ffd053" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="98" cy="98" rx="8" ry="6" fill="#ffd053" stroke="#78350f" strokeWidth="2" />

          {/* Gradients */}
          <defs>
            <radialGradient id="pikachu-body-grad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffea79" />
              <stop offset="60%" stopColor="#ffd053" />
              <stop offset="85%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <radialGradient id="pikachu-head-grad" cx="45%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#ffea79" />
              <stop offset="60%" stopColor="#ffd053" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <linearGradient id="pikachu-tail-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd053" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Interactive Level / XP Tag Overlay */}
      <div className="absolute -bottom-2 right-4 px-3.5 py-1.5 rounded-xl bg-[#0c1424]/90 border border-cyan-500/60 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[11px] font-mono text-cyan-300 font-bold">AETHERIA // LEVEL 100 ⚡</span>
      </div>
    </div>
  );
}

/**
 * GengarMaster — Large cinematic Gengar illustration with glowing shadow energy.
 */
export function GengarMaster({ className = '' }: { className?: string }) {
  const [reacting, setReacting] = useState(false);

  function handleClick(e: React.MouseEvent) {
    triggerParticleBurst(e, 30);
    setReacting(true);
    setTimeout(() => setReacting(false), 700);
  }

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer select-none group ${className}`}
      role="img"
      aria-label="Gengar illustration"
    >
      <div className="absolute -inset-8 bg-cyan-500/[0.15] rounded-full blur-[70px] group-hover:bg-cyan-500/[0.25] transition-all" />

      <div className={`relative z-10 transition-transform duration-500 ${reacting ? 'scale-110 rotate-3' : 'animate-float-idle'}`}>
        <svg
          width="240"
          height="240"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
        >
          {/* Spikes */}
          <path d="M40 40 L25 15 L55 35 Z" fill="#090e1a" stroke="#16243d" strokeWidth="3" />
          <path d="M120 40 L135 15 L105 35 Z" fill="#090e1a" stroke="#16243d" strokeWidth="3" />
          <path d="M70 30 L80 10 L90 30 Z" fill="#090e1a" stroke="#16243d" strokeWidth="3" />

          {/* Body */}
          <ellipse cx="80" cy="90" rx="58" ry="52" fill="url(#gengar-body)" stroke="#06b6d4" strokeWidth="3.5" />

          {/* Glowing Eyes */}
          <polygon points="50,68 70,78 55,85" fill="#06b6d4" />
          <polygon points="110,68 90,78 105,85" fill="#06b6d4" />
          <circle cx="60" cy="76" r="2.5" fill="#ffffff" />
          <circle cx="100" cy="76" r="2.5" fill="#ffffff" />

          {/* Trademark Gigantic Grin */}
          <path
            d="M42 95 Q80 135 118 95 Q80 105 42 95 Z"
            fill="#ece7e0"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Teeth dividers */}
          <line x1="60" y1="99" x2="63" y2="112" stroke="#070b13" strokeWidth="2.5" />
          <line x1="80" y1="101" x2="80" y2="117" stroke="#070b13" strokeWidth="2.5" />
          <line x1="100" y1="99" x2="97" y2="112" stroke="#070b13" strokeWidth="2.5" />
          <path d="M48 104 Q80 118 112 104" stroke="#070b13" strokeWidth="2" fill="none" />

          {/* Claws / Arms */}
          <path d="M22 85 Q8 95 20 108 Q32 102 30 92" fill="#090e1a" stroke="#06b6d4" strokeWidth="2.5" />
          <path d="M138 85 Q152 95 140 108 Q128 102 130 92" fill="#090e1a" stroke="#06b6d4" strokeWidth="2.5" />

          {/* Short Legs */}
          <ellipse cx="58" cy="138" rx="14" ry="9" fill="#070b13" stroke="#06b6d4" strokeWidth="2.5" />
          <ellipse cx="102" cy="138" rx="14" ry="9" fill="#070b13" stroke="#06b6d4" strokeWidth="2.5" />

          <defs>
            <radialGradient id="gengar-body" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="70%" stopColor="#090e1a" />
              <stop offset="100%" stopColor="#070b13" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
