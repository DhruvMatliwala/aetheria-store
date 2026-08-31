'use client';

import { ScrollReveal } from '@/components/fx/UIComponents';
import { GengarMaster } from '@/components/fx/PokemonCharacters';

/**
 * VisualBreak — Cinematic breathing section with large GengarMaster illustration and bold editorial typography.
 */
export function VisualBreak() {
  return (
    <section className="relative py-28 sm:py-36 px-5 sm:px-8 overflow-hidden bg-surface-950/80 border-y border-surface-700/60">
      {/* Topographic and ambient glow layers */}
      <div className="absolute inset-0 bg-contour opacity-80" />
      <div className="absolute inset-0 bg-topo-lines opacity-50" />

      {/* Saffron Gold & Terracotta ambient radial lights */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#ffbc09]/[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[500px] h-[350px] bg-[#712011]/[0.3] blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
        {/* Large Cinematic Gengar Character Artwork */}
        <div className="mb-6">
          <GengarMaster />
        </div>

        <ScrollReveal direction="scale">
          <p className="text-xs font-mono text-[#ffbc09] tracking-widest uppercase mb-4 font-bold">
            [ 04 // INSTANT AUTOMATION ]
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#ece7e0] font-display tracking-tight leading-tight">
            Your key activates<br />
            <span className="text-glow">in under 60 seconds.</span>
          </h2>
          <p className="text-[#bfb8ae] text-base sm:text-lg mt-5 max-w-xl mx-auto font-mono leading-relaxed">
            From payment to GPS joystick on your screen. No waiting, zero middlemen, 100% automated key delivery.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
