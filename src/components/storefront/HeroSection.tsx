'use client';

import { TerrainScene, AmbientParticles } from '@/components/fx/TerrainScene';
import { HeroPikachuMaster } from '@/components/fx/PokemonCharacters';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Saffron World topographic background */}
      <TerrainScene />
      <AmbientParticles />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-32 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column — Editorial Hero Typography & Value Props */}
          <div className="lg:col-span-7 space-y-7">
            {/* System Status Pill with Animated Pokéball */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface-900/90 border border-surface-700 backdrop-blur-md shadow-depth">
              <PokeballLottie size={20} />
              <span className="text-xs font-mono text-[#ffbc09] font-bold tracking-wider uppercase">
                [ SYS // AUTOMATED DISPATCH ACTIVE ]
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] font-display">
              <span className="text-[#ece7e0]">Unlock</span>
              <br />
              <span className="text-glow">the Map.</span>
            </h1>

            {/* Subtext */}
            <p className="text-[#bfb8ae] text-base sm:text-lg max-w-xl leading-relaxed">
              Official PGSharp Standard license keys dispatched in seconds. GPS joystick, instant teleport, 100% IV scanner feed — automated delivery starting from ₹180.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#plans"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#ffbc09] hover:bg-[#ffd053] text-[#080403] font-black text-sm uppercase tracking-wider transition-all btn-press shadow-glow-gold"
              >
                <PokeballLottie size={20} />
                <span>View License Keys</span>
              </a>
              <a
                href="#journey"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-surface-600 hover:border-[#ffbc09]/60 text-[#ece7e0] hover:text-[#ffbc09] text-xs font-mono uppercase tracking-wider transition-all bg-surface-900/50 backdrop-blur-sm"
              >
                <span>How It Works</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M8 3v10M4 9l4 4 4-4"/>
                </svg>
              </a>
            </div>

            {/* Trust micro-badges */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffbc09]" />
                Instant on-screen reveal
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffbc09]" />
                UPI & PayPal accepted
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffbc09]" />
                Encrypted key storage
              </span>
            </div>
          </div>

          {/* Right Column — Large Hero Pikachu Art & Coordinate HUD */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
            <div className="relative">
              <HeroPikachuMaster />

              {/* Coordinate HUD */}
              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-900 border border-surface-700 backdrop-blur-md shadow-depth">
                <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-glow-breathe" />
                <span className="text-[11px] font-mono text-[#ece7e0] font-bold">
                  COORD // 37.7749° N, 122.4194° W
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Seamless bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-surface-950 to-transparent pointer-events-none" />
    </section>
  );
}
