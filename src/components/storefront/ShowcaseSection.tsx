'use client';

import { useState } from 'react';
import { Smartphone, Zap, Sparkles, Star } from 'lucide-react';
import { DeviceFrame, ScrollReveal } from '@/components/fx/UIComponents';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';

function RouteIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function CrosshairIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

const FEATURES = [
  {
    id: 'joystick',
    title: 'GPS Virtual Joystick',
    tag: 'NAVIGATION',
    icon: Smartphone,
    demo: {
      heading: 'Joystick Navigation',
      details: 'Walk, run, or drive anywhere with an on-screen joystick. Customize speeds from 9.3 km/h to 60 km/h.',
      visual: 'joystick',
    },
  },
  {
    id: 'teleport',
    title: 'Instant Teleport & Cooldown',
    tag: 'WORLDWIDE',
    icon: Zap,
    demo: {
      heading: 'Instant Teleport',
      details: 'Jump to any GPS coordinate worldwide. Built-in cooldown timer prevents softbans automatically.',
      visual: 'teleport',
    },
  },
  {
    id: 'iv-scanner',
    title: 'Live 100% IV Spawn Radar',
    tag: 'CATCH 100% IV',
    icon: Star,
    demo: {
      heading: 'IV Scanner Feed',
      details: 'Real-time global feed of wild 100% IV spawns with coordinates, despawn timers, and filters.',
      visual: 'scanner',
    },
  },
  {
    id: 'auto-walk',
    title: 'GPX Route Auto-Walk',
    tag: 'AUTOMATION',
    icon: RouteIcon,
    demo: {
      heading: 'GPX Route Auto-Walk',
      details: 'Import GPX routes for hands-free auto-walking along dense PokéStop corridors and egg hatching.',
      visual: 'autowalk',
    },
  },
  {
    id: 'throw',
    title: 'Enhanced Curve Throw',
    tag: '100% EXCELLENT',
    icon: CrosshairIcon,
    demo: {
      heading: 'Perfect Throws',
      details: '100% guaranteed excellent curve balls on every throw. Maximizes catch XP & capture rates.',
      visual: 'throw',
    },
  },
  {
    id: 'quick-catch',
    title: 'Speed Quick Catch',
    tag: 'EVENT READY',
    icon: Sparkles,
    demo: {
      heading: 'Speed Catch',
      details: 'Skip long catching animations entirely. Catch Pokémon 3x faster during Community Days & Raids.',
      visual: 'quickcatch',
    },
  },
];

function FeatureDemoVisual({ visual }: { visual: string }) {
  const visuals: Record<string, React.ReactNode> = {
    joystick: (
      <div className="flex flex-col items-center justify-between h-full gap-4 p-6">
        {/* Map area in Cyan styling */}
        <div className="w-full flex-1 rounded-xl bg-[#090e1a] bg-dot-field relative overflow-hidden border border-[#16243d]">
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#0c1424]/90 text-[10px] font-mono text-cyan-400 border border-[#16243d]">
            37.7749° N, 122.4194° W
          </div>
          {/* GPS trail in Cyan */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <path d="M100 180 Q80 140 90 100 Q100 60 130 50" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 3" fill="none" opacity="0.7" />
            <circle cx="130" cy="50" r="5" fill="#06b6d4" />
          </svg>
          {/* Wild Pokemon Spawns on radar */}
          <div className="absolute top-10 right-8 animate-bounce">
            <PokeballLottie size={24} />
          </div>
        </div>

        {/* Interactive Joystick */}
        <div className="relative w-22 h-22 rounded-full border-2 border-[#16243d] flex items-center justify-center bg-[#070b13] shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="w-9 h-9 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] animate-pulse" />
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">▲</div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">▼</div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400">◀</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400">▶</div>
        </div>
        <p className="text-[11px] font-mono text-slate-400">SPEED // 9.3 km/h (EGG HATCHING)</p>
      </div>
    ),
    teleport: (
      <div className="flex flex-col items-center justify-between h-full gap-3 p-6">
        <div className="w-full flex-1 rounded-xl bg-[#090e1a] bg-topo-lines relative overflow-hidden flex items-center justify-center border border-[#16243d]">
          <div className="text-center space-y-2 relative z-10">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">[ TELEPORT TARGET ]</div>
            <div className="text-base font-black text-white font-display">Zaragoza, Spain</div>
            <div className="text-xs font-mono text-cyan-300">41.6488° N, 0.8891° W</div>
            <div className="mt-4 w-11 h-11 mx-auto rounded-full border-2 border-cyan-500/60 flex items-center justify-center bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Zap size={18} className="text-cyan-400" />
            </div>
          </div>
          {/* Pulse effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full border border-cyan-400/30 animate-waypoint-pulse" />
          </div>
        </div>

        <div className="w-full p-3 rounded-xl bg-[#0c1424] border border-[#16243d] text-center">
          <p className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider">⏱ COOLDOWN // 00:00 (SAFE TO CATCH)</p>
        </div>
      </div>
    ),
    scanner: (
      <div className="flex flex-col h-full gap-2.5 p-5">
        <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest mb-1 flex items-center justify-between">
          <span>[ 100% IV LIVE FEED ]</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>
        {[
          { name: 'Gible', iv: '100% IV', dist: '1.2km', time: '14:32' },
          { name: 'Deino', iv: '100% IV', dist: '3.8km', time: '11:05' },
          { name: 'Axew', iv: '100% IV', dist: '0.4km', time: '23:17' },
          { name: 'Larvitar', iv: '100% IV', dist: '5.1km', time: '08:41' },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#090e1a] border border-[#16243d]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-700/40 flex items-center justify-center">
                <Star size={13} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white font-display">{p.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{p.dist} away</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-bold text-cyan-400">{p.iv}</p>
              <p className="text-[10px] font-mono text-slate-500">{p.time} left</p>
            </div>
          </div>
        ))}
      </div>
    ),
    autowalk: (
      <div className="flex flex-col items-center justify-between h-full gap-3 p-6">
        <div className="w-full flex-1 rounded-xl bg-[#090e1a] bg-dot-field relative overflow-hidden border border-[#16243d]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <path d="M30 170 Q50 130 80 120 Q120 105 140 80 Q160 55 180 30" stroke="#06b6d4" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Walking dot */}
            <circle r="6" fill="#06b6d4">
              <animateMotion dur="4s" repeatCount="indefinite" path="M30 170 Q50 130 80 120 Q120 105 140 80 Q160 55 180 30" />
            </circle>
            {/* PokéStop markers */}
            <circle cx="80" cy="120" r="4" fill="#38bdf8" />
            <circle cx="140" cy="80" r="4" fill="#38bdf8" />
          </svg>
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[#0c1424]/90 text-[10px] font-mono text-cyan-400 border border-[#16243d]">
            GPX CORRIDOR ACTIVE
          </div>
        </div>
        <p className="text-[11px] font-mono text-slate-400">AUTO-WALK // 9.3 km/h · 2.4 km COMPLETED</p>
      </div>
    ),
    throw: (
      <div className="flex flex-col items-center justify-between h-full gap-4 p-6">
        <div className="relative my-auto">
          <div className="w-28 h-28 rounded-full border-2 border-cyan-500/40 flex items-center justify-center animate-spin-slow">
            <div className="w-20 h-20 rounded-full border-2 border-cyan-500/60 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-400 flex items-center justify-center">
                <CrosshairIcon size={16} className="text-cyan-400" />
              </div>
            </div>
          </div>
          <div className="absolute -top-3 -right-3 px-2.5 py-1 rounded-md bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[10px] font-mono font-black uppercase shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            EXCELLENT
          </div>
          {/* Animated Pokeball in throw arc */}
          <div className="absolute -bottom-4 -right-4 animate-bounce">
            <PokeballLottie size={44} />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-white font-display">100% Curve Hit Rate</p>
          <p className="text-xs font-mono text-slate-400">Auto-curve + 1.7x catch multiplier</p>
        </div>
      </div>
    ),
    quickcatch: (
      <div className="flex flex-col items-center justify-between h-full gap-3 p-6">
        <div className="space-y-2.5 w-full my-auto">
          {['Catch #1 — Wild Gible', 'Catch #2 — Wild Deino', 'Catch #3 — Shiny Axew'].map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#090e1a] border border-[#16243d]">
              <PokeballLottie size={24} />
              <span className="text-xs text-white font-mono flex-1">{c}</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">0.{3 + i}s</span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-[#0c1424] border border-[#16243d] text-center w-full">
          <p className="text-xs font-bold text-cyan-300 font-display">⚡ 3x Speed Catching</p>
          <p className="text-[10px] font-mono text-slate-400">Encounter animation skip active</p>
        </div>
      </div>
    ),
  };

  return <>{visuals[visual] || null}</>;
}

export function ShowcaseSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = FEATURES[activeIdx];

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 relative overflow-hidden" id="features">
      {/* Ambient Cyan glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/[0.05] blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <div className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                <PokeballLottie size={16} />
                <span>[ 03 // GAMEPLAY HUD & ENGINE ]</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#ece7e0] font-display tracking-tight">
                Everything you need.<br />
                <span className="text-glow">Already built in.</span>
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-sm font-mono leading-relaxed">
              Explore the full suite of PGSharp features live. Select a tool below to see it simulated.
            </p>
          </div>
        </ScrollReveal>

        {/* 2-Column Balanced Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column — 6 Feature Cards */}
          <div className="lg:col-span-6 space-y-3">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              const isActive = i === activeIdx;

              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border ${
                    isActive
                      ? 'bg-[#0c1424] border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-[1.02]'
                      : 'bg-[#090e1a]/40 hover:bg-[#0c1424]/80 border-[#16243d]'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 text-slate-400 border-[#16243d]'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm sm:text-base font-bold transition-colors font-display ${isActive ? 'text-cyan-400' : 'text-[#ece7e0]'}`}>
                        {feat.title}
                      </p>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed font-mono ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {feat.demo.details}
                    </p>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column — Large Interactive Device Simulation Frame */}
          <div className="lg:col-span-6 flex justify-center">
            <ScrollReveal direction="scale">
              <DeviceFrame className="w-72 sm:w-80 shadow-depth-lg">
                <FeatureDemoVisual visual={active.demo.visual} />
              </DeviceFrame>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
