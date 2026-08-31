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
      <div className="absolute -inset-10 bg-[#ffbc09]/[0.18] rounded-full blur-[80px] group-hover:bg-[#ffbc09]/[0.3] transition-all duration-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#ea580c]/[0.15] rounded-full blur-[60px]" />

      <div
        className={`relative z-10 transition-transform duration-500 ${
          active ? 'scale-110 -rotate-3' : 'group-hover:scale-105 animate-float-idle'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-spring)' }}
      >
        <svg
          width="320"
          height="320"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
        >
          {/* Lightning Tail */}
          <path
            d="M50 135 L20 105 L38 95 L22 65 L60 85 L52 105 L72 120 Z"
            fill="url(#pikachu-tail-grad)"
            stroke="#5c2409"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M45 130 L32 115 L40 108" fill="#5c2409" />

          {/* Left Ear */}
          <path d="M85 55 L55 12 L78 40" fill="#ffd053" stroke="#5c2409" strokeWidth="3" />
          <path d="M68 25 L55 12 L78 40 Z" fill="#1b0b08" />

          {/* Right Ear */}
          <path d="M135 52 L172 10 L145 42" fill="#ffd053" stroke="#5c2409" strokeWidth="3" />
          <path d="M158 24 L172 10 L145 42 Z" fill="#1b0b08" />

          {/* Chubby Body */}
          <ellipse cx="115" cy="125" rx="55" ry="48" fill="url(#pikachu-body-grad)" stroke="#5c2409" strokeWidth="3.5" />

          {/* Back Stripes */}
          <path d="M92 95 Q108 102 125 95" stroke="#5c2409" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M88 114 Q108 122 128 114" stroke="#5c2409" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* Left Foot */}
          <ellipse cx="85" cy="168" rx="18" ry="10" fill="#ffd053" stroke="#5c2409" strokeWidth="3" />
          {/* Right Foot */}
          <ellipse cx="145" cy="168" rx="18" ry="10" fill="#ffd053" stroke="#5c2409" strokeWidth="3" />

          {/* Big Cute Head */}
          <circle cx="115" cy="80" r="44" fill="url(#pikachu-head-grad)" stroke="#5c2409" strokeWidth="3.5" />

          {/* Expressive Big Eyes */}
          <circle cx="98" cy="74" r="8" fill="#140806" />
          <circle cx="96" cy="71" r="3.2" fill="#ffffff" />
          <circle cx="102" cy="77" r="1.5" fill="#ffffff" />

          <circle cx="132" cy="74" r="8" fill="#140806" />
          <circle cx="130" cy="71" r="3.2" fill="#ffffff" />
          <circle cx="136" cy="77" r="1.5" fill="#ffffff" />

          {/* Tiny Nose */}
          <polygon points="113,84 117,84 115,87" fill="#140806" />

          {/* Glowing Red/Amber Cheeks */}
          <circle cx="85" cy="92" r="10" fill="#ea580c" className="animate-pulse" />
          <circle cx="83" cy="90" r="3" fill="#ffd053" opacity="0.6" />
          <circle cx="145" cy="92" r="10" fill="#ea580c" className="animate-pulse" />
          <circle cx="143" cy="90" r="3" fill="#ffd053" opacity="0.6" />

          {/* Cute Open Mouth */}
          <path
            d="M107 92 Q115 99 123 92 Q115 106 107 92 Z"
            fill="#b91c1c"
            stroke="#5c2409"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M110 98 Q115 95 120 98 Q115 104 110 98" fill="#f87171" />

          {/* Cute Paws resting on belly */}
          <ellipse cx="100" cy="130" rx="10" ry="7" fill="#ffd053" stroke="#5c2409" strokeWidth="2.5" />
          <ellipse cx="130" cy="130" rx="10" ry="7" fill="#ffd053" stroke="#5c2409" strokeWidth="2.5" />

          <defs>
            <radialGradient id="pikachu-head-grad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="30%" stopColor="#ffd053" />
              <stop offset="85%" stopColor="#ffbc09" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <radialGradient id="pikachu-body-grad" cx="40%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#ffd053" />
              <stop offset="60%" stopColor="#ffbc09" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
            <linearGradient id="pikachu-tail-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd053" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Interactive Level / XP Tag Overlay */}
      <div className="absolute -bottom-2 right-4 px-3.5 py-1.5 rounded-xl bg-surface-900/90 border border-[#ffbc09]/60 backdrop-blur-md shadow-glow-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
        <span className="text-[11px] font-mono text-[#ece7e0] font-bold">PIKACHU // LVL 100 ⚡</span>
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
      <div className="absolute -inset-8 bg-[#ffbc09]/[0.15] rounded-full blur-[70px] group-hover:bg-[#ffbc09]/[0.25] transition-all" />

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
          <path d="M40 40 L25 15 L55 35 Z" fill="#240e0b" stroke="#712011" strokeWidth="3" />
          <path d="M120 40 L135 15 L105 35 Z" fill="#240e0b" stroke="#712011" strokeWidth="3" />
          <path d="M70 30 L80 10 L90 30 Z" fill="#240e0b" stroke="#712011" strokeWidth="3" />

          {/* Body */}
          <ellipse cx="80" cy="90" rx="58" ry="52" fill="url(#gengar-body)" stroke="#ffbc09" strokeWidth="3.5" />

          {/* Glowing Eyes */}
          <polygon points="50,68 70,78 55,85" fill="#ffbc09" />
          <polygon points="110,68 90,78 105,85" fill="#ffbc09" />
          <circle cx="60" cy="76" r="2.5" fill="#ffffff" />
          <circle cx="100" cy="76" r="2.5" fill="#ffffff" />

          {/* Trademark Gigantic Grin */}
          <path
            d="M42 95 Q80 135 118 95 Q80 105 42 95 Z"
            fill="#ece7e0"
            stroke="#ffbc09"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Teeth dividers */}
          <line x1="60" y1="99" x2="63" y2="112" stroke="#1b0b08" strokeWidth="2.5" />
          <line x1="80" y1="101" x2="80" y2="117" stroke="#1b0b08" strokeWidth="2.5" />
          <line x1="100" y1="99" x2="97" y2="112" stroke="#1b0b08" strokeWidth="2.5" />
          <path d="M48 104 Q80 118 112 104" stroke="#1b0b08" strokeWidth="2" fill="none" />

          {/* Claws / Arms */}
          <path d="M22 85 Q8 95 20 108 Q32 102 30 92" fill="#240e0b" stroke="#ffbc09" strokeWidth="2.5" />
          <path d="M138 85 Q152 95 140 108 Q128 102 130 92" fill="#240e0b" stroke="#ffbc09" strokeWidth="2.5" />

          {/* Short Legs */}
          <ellipse cx="58" cy="138" rx="14" ry="9" fill="#1b0b08" stroke="#ffbc09" strokeWidth="2.5" />
          <ellipse cx="102" cy="138" rx="14" ry="9" fill="#1b0b08" stroke="#ffbc09" strokeWidth="2.5" />

          <defs>
            <radialGradient id="gengar-body" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#240e0b" />
              <stop offset="70%" stopColor="#140806" />
              <stop offset="100%" stopColor="#080403" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
