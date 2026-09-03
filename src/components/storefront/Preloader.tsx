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
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasSeenIntro') !== 'true';
    }
    return true;
  });
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('CONNECTING TO SECURE VAULT...');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const { togglePlay, isPlaying } = useAmbientAudio();

  const dismissPreloader = () => {
    sessionStorage.setItem('hasSeenIntro', 'true');
    document.body.style.overflow = '';
    setShouldRender(false);
    if (onComplete) onComplete();
  };

  const handleInteraction = () => {
    if (!isPlaying) {
      togglePlay();
    }
    dismissPreloader();
  };

  useEffect(() => {
    if (!shouldRender) {
      document.body.style.overflow = '';
      return;
    }

    // Hard safety timeout: Dismiss preloader after 1.8s guaranteed so black screen can never hang
    const safetyTimer = setTimeout(() => {
      dismissPreloader();
    }, 1800);

    // Lock body scrolling while preloader is active
    document.body.style.overflow = 'hidden';

    // Fast simulated progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 15) + 10;
        if (next >= 40 && next < 75) {
          setStatusText('SYNCING PGSHARP LICENSE PIPELINE...');
        } else if (next >= 75) {
          setStatusText('ALL SYSTEMS OPERATIONAL');
        }
        return Math.min(100, next);
      });
    }, 80);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          dismissPreloader();
        },
      });

      // ── Initial State Setup ────────────────────────────────────────────────
      gsap.set(logoRef.current, {
        scale: 0.9,
        opacity: 0,
      });
      gsap.set('.preloader-char', {
        y: 15,
        opacity: 0,
      });
      gsap.set(subtitleRef.current, {
        opacity: 0,
        y: 5,
      });
      gsap.set(lineRef.current, {
        scaleX: 0,
        transformOrigin: 'center center',
      });

      // Fast reveal
      tl.to(
        logoRef.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
        },
        0.0
      );

      tl.to(
        '.preloader-char',
        {
          y: 0,
          opacity: 1,
          stagger: 0.03,
          duration: 0.4,
          ease: 'power3.out',
        },
        0.2
      );

      tl.to(
        subtitleRef.current,
        {
          opacity: 0.95,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
        },
        0.3
      );

      tl.to(
        lineRef.current,
        {
          scaleX: 1,
          duration: 0.7,
          ease: 'power1.inOut',
        },
        0.3
      );

      // Snappy Exit Shutter Transition
      tl.to(
        contentRef.current,
        {
          scale: 1.04,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        },
        '+=0.2'
      );

      tl.to(
        containerRef.current,
        {
          yPercent: -100,
          duration: 0.5,
          ease: 'power4.inOut',
        },
        '-=0.1'
      );
    }, containerRef);

    return () => {
      clearTimeout(safetyTimer);
      clearInterval(progressInterval);
      document.body.style.overflow = '';
      ctx.revert();
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black pointer-events-auto select-none will-change-transform transform-gpu overflow-hidden cursor-pointer"
    >
      {/* Center Cinematic Brand Content */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 will-change-transform transform-gpu"
      >
        {/* Holographic Floating Emblem */}
        <div
          ref={logoRef}
          className="relative flex items-center justify-center mb-6 opacity-0 will-change-transform transform-gpu"
        >
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="AETHERIA"
              width={240}
              height={240}
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Character-Split Brand Wordmark */}
        <div className="overflow-hidden mb-1">
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

        {/* Permanent PGSharp Key Vault Sub-Tagline */}
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[9px] sm:text-[10px] font-mono tracking-[0.22em] uppercase shadow-[0_0_15px_rgba(6,182,212,0.25)] mb-3">
          <span className="text-cyan-400">⚡</span>
          <span>PGSHARP KEY VAULT</span>
          <span className="text-cyan-400">⚡</span>
        </div>

        {/* Dynamic Status Tag & Single Clean Percentage */}
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
