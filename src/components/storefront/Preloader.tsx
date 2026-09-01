'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { useAmbientAudio } from '@/context/AmbientAudioContext';

interface PreloaderProps {
  onComplete?: () => void;
}

const BRAND_CHARS = ['A', 'E', 'T', 'H', 'E', 'R', 'I', 'A'];

export function Preloader({ onComplete }: PreloaderProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING NEURAL PROTOCOL...');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const { togglePlay, isPlaying } = useAmbientAudio();

  const handleInteraction = () => {
    // Attempt audio unlock on touch
    if (!isPlaying) {
      togglePlay();
    }
  };

  useEffect(() => {
    // Check if user has already seen the preloader in this session
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('hasSeenIntro');
      if (hasSeen === 'true') {
        setShouldRender(false);
        if (onComplete) onComplete();
        return;
      }
    }

    if (!containerRef.current) return;

    // Lock body scrolling while preloader is active
    document.body.style.overflow = 'hidden';

    // Simulate steady background asset prebuffering progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 40 && next < 75) {
          setStatusText('BUFFERING 1440P CINEMATIC RUNWAY...');
        } else if (next >= 75 && next < 95) {
          setStatusText('SYNCING ENCRYPTED LICENSE VAULT...');
        } else if (next >= 95) {
          setStatusText('ALL SYSTEMS OPERATIONAL (100%)');
        }
        return Math.min(100, next);
      });
    }, 120);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem('hasSeenIntro', 'true');
          document.body.style.overflow = '';
          setShouldRender(false);
          if (onComplete) onComplete();
        },
      });

      // ── Initial State Setup ────────────────────────────────────────────────
      gsap.set(logoRef.current, {
        scale: 0.8,
        opacity: 0,
        filter: 'drop-shadow(0 0 0px rgba(6,182,212,0))',
      });
      gsap.set('.preloader-char', {
        y: 25,
        opacity: 0,
      });
      gsap.set(subtitleRef.current, {
        opacity: 0,
        y: 10,
      });
      gsap.set(lineRef.current, {
        scaleX: 0,
        transformOrigin: 'center center',
      });

      // ── Phase 1: Brand Mark Glow & Scale (0.0s – 0.8s) ─────────────────────
      tl.to(
        logoRef.current,
        {
          scale: 1,
          opacity: 1,
          filter: 'drop-shadow(0 0 28px rgba(6,182,212,0.9))',
          duration: 0.8,
          ease: 'power3.out',
        },
        0.0
      );

      // ── Phase 2: Staggered Brand Text & Subtitle Reveal (0.4s – 1.4s) ──────
      tl.to(
        '.preloader-char',
        {
          y: 0,
          opacity: 1,
          stagger: 0.05,
          duration: 0.7,
          ease: 'power3.out',
        },
        0.4
      );

      tl.to(
        subtitleRef.current,
        {
          opacity: 0.9,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        0.8
      );

      tl.to(
        lineRef.current,
        {
          scaleX: 1,
          duration: 1.6,
          ease: 'power1.inOut',
        },
        0.8
      );

      // ── Hold for Extended Dramatic Asset Preloading (1.8s – 2.8s) ──────────
      tl.to({}, { duration: 1.0 });

      // ── Phase 3: Smooth Exit Shutter Transition (2.8s – 3.6s) ───────────────
      tl.to(
        contentRef.current,
        {
          scale: 1.06,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
        },
        'exit'
      );

      tl.to(
        containerRef.current,
        {
          yPercent: -100,
          duration: 0.8,
          ease: 'power4.inOut',
        },
        'exit+=0.1'
      );
    }, containerRef);

    return () => {
      clearInterval(progressInterval);
      document.body.style.overflow = '';
      ctx.revert();
    };
  }, [shouldRender, onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black pointer-events-auto select-none will-change-transform transform-gpu overflow-hidden cursor-pointer"
    >
      {/* Background Subtle Radial Aura */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(6, 182, 212, 0.18) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 80%)',
        }}
      />

      {/* Center Cinematic Brand Content */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 will-change-transform transform-gpu"
      >
        {/* Glowing Frosted Emblem Badge */}
        <div
          ref={logoRef}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-neutral-950 border border-cyan-400/50 backdrop-blur-2xl flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(6,182,212,0.45)] opacity-0 will-change-transform transform-gpu"
        >
          <Image
            src="/logo.png"
            alt="AETHERIA"
            width={44}
            height={44}
            priority
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]"
          />
        </div>

        {/* Character-Split Brand Wordmark */}
        <div className="overflow-hidden mb-2">
          <div className="flex items-center justify-center tracking-[0.25em] sm:tracking-[0.3em]">
            {BRAND_CHARS.map((char, index) => (
              <span
                key={index}
                className="preloader-char inline-block text-xl sm:text-2xl md:text-3xl font-bold font-sans text-white uppercase opacity-0 will-change-transform transform-gpu"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Status Tag & Percentage */}
        <div ref={subtitleRef} className="opacity-0 mb-4 flex flex-col items-center gap-1">
          <p className="text-[9px] sm:text-[11px] font-mono text-cyan-400 font-medium tracking-[0.25em] sm:tracking-[0.35em] uppercase">
            {statusText}
          </p>
          <span className="text-[10px] sm:text-xs font-mono text-neutral-400">
            [{progress}%]
          </span>
        </div>

        {/* Cyber Progress Pulse Line */}
        <div className="w-32 sm:w-44 h-[2px] bg-neutral-900 rounded-full overflow-hidden">
          <div
            ref={lineRef}
            className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.9)] will-change-transform transform-gpu"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </div>
  );
}
