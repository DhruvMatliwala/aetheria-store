'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Shield,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Bell,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Plan } from '@/types/plan';
import { PLANS, DISCORD_URL, REDDIT_URL, TELEGRAM_URL } from '@/lib/constants';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';
import { AmbientMistParticles } from '@/components/interactive/AmbientMistParticles';
import { cn } from '@/lib/utils';

// Register ScrollTrigger once on client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// 3 Core Scene Videos (Scene 1: Mewtwo Awakening, Scene 2: Shibuya, Scene 3: Charizard vs Greninja)
const SCENE_VIDEOS = [
  { id: 'scene1', src: '/videos/scene5.mp4', fallbackSrc: '/videos/Scene5.mp4' },
  { id: 'scene2', src: '/videos/Scene2.mp4', fallbackSrc: '/videos/scene2.mp4' },
  { id: 'scene3', src: '/videos/Scene3.mp4', fallbackSrc: '/videos/scene3.mp4' },
];

// Scene Metadata for Bottom-Left Docked Overlays
const SCENE_OVERLAYS = [
  {
    idx: '01 / 03',
    subtitle: 'AWAKEN ACCESS',
    title: 'Break every limit.',
    description: 'Standard Android license keys dispatched in under 10 seconds. Zero delay.',
    badges: ['Instant Dispatch', '30-Day License', 'Android Standard 🔑'],
    showCta: true,
  },
  {
    idx: '02 / 03',
    subtitle: 'GLOBAL EXPEDITION',
    title: 'Roam anywhere.',
    description: 'Precision GPS joystick and route patrol across Tokyo, Zaragoza, and worldwide.',
    badges: ['GPS Joystick', 'Auto-Walk', 'Cooldown Radar'],
    showCta: false,
  },
  {
    idx: '03 / 03',
    subtitle: 'COMBAT SHOWDOWN',
    title: 'Master every raid.',
    description: 'Live 100% IV scanner feed and official 30-day Standard Android licenses. Instant delivery.',
    badges: ['100% IV Feed', 'Raid Radar', 'Instant Dispatch'],
    showCta: false,
  },
];

// FAQ items for Scene 3 Drawer
const FAQS = [
  {
    q: 'How fast do I receive my PGSharp license key?',
    a: 'Delivery is 100% automated and instant. As soon as your payment completes on UPI or PayPal, your key is revealed directly on your screen and dispatched to your email in under 10 seconds.',
  },
  {
    q: 'How do device slots work across 1-Device and 2-Device plans?',
    a: '1 Device Plan (₹180 / $1.99) activates 1 Android device for 30 days. 2 Devices Plan (₹340 / $3.99) activates up to 2 Android devices simultaneously. Keys bind to hardware for the 30-day duration.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'India (INR): UPI (GPay, PhonePe, Paytm, BHIM, CRED), NetBanking, and Cards via Razorpay. International (USD): PayPal Balance, Debit/Credit Cards, and Pay in 4.',
  },
  {
    q: 'How do I activate my license key in PGSharp?',
    a: 'Download the PGSharp APK from pgsharp.com, log into Pokémon GO, tap the star/settings icon → Activate, and paste your key. Features unlock immediately.',
  },
  {
    q: 'Where can I reach out for assistance or questions?',
    a: 'Reach out directly on Discord or Reddit for instant 1-on-1 assistance.',
  },
];

interface DissolveSceneVideoProps {
  src: string;
  fallbackSrc?: string;
  isActive: boolean;
  preload?: 'auto' | 'metadata';
}

/**
 * Dual-Player Optical Dissolve Video Loop Engine
 * Seamlessly dissolves between the end frame and start frame over 700ms with zero hard cut.
 */
function DissolveSceneVideo({ src, fallbackSrc, isActive, preload = 'auto' }: DissolveSceneVideoProps) {
  const vidARef = useRef<HTMLVideoElement>(null);
  const vidBRef = useRef<HTMLVideoElement>(null);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');

  // Play / Pause handling based on active scene status
  useEffect(() => {
    const vidA = vidARef.current;
    const vidB = vidBRef.current;
    if (!vidA || !vidB) return;

    if (isActive) {
      if (activePlayer === 'A') {
        if (vidA.paused) vidA.play().catch(() => {});
        if (!vidB.paused) vidB.pause();
      } else {
        if (vidB.paused) vidB.play().catch(() => {});
        if (!vidA.paused) vidA.pause();
      }
    } else {
      if (!vidA.paused) vidA.pause();
      if (!vidB.paused) vidB.pause();
    }
  }, [isActive, activePlayer]);

  // Native onTimeUpdate handlers (eliminates heavy 60fps requestAnimationFrame polling loops)
  const handleTimeUpdateA = () => {
    if (!isActive || activePlayer !== 'A') return;
    const vidA = vidARef.current;
    const vidB = vidBRef.current;
    if (vidA && vidB && vidA.duration && vidA.currentTime >= vidA.duration - 0.35) {
      vidB.currentTime = 0;
      vidB.play().catch(() => {});
      setActivePlayer('B');
    }
  };

  const handleTimeUpdateB = () => {
    if (!isActive || activePlayer !== 'B') return;
    const vidA = vidARef.current;
    const vidB = vidBRef.current;
    if (vidA && vidB && vidB.duration && vidB.currentTime >= vidB.duration - 0.35) {
      vidA.currentTime = 0;
      vidA.play().catch(() => {});
      setActivePlayer('A');
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      {/* Player A */}
      <video
        ref={vidARef}
        muted
        playsInline
        autoPlay={isActive && activePlayer === 'A'}
        disablePictureInPicture
        disableRemotePlayback
        preload={preload}
        onTimeUpdate={handleTimeUpdateA}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform transform-gpu transition-opacity duration-300 ease-in-out"
        style={{
          opacity: activePlayer === 'A' ? 1 : 0,
          zIndex: activePlayer === 'A' ? 2 : 1,
        }}
      >
        <source src={src} type="video/mp4" />
        {fallbackSrc && <source src={fallbackSrc} type="video/mp4" />}
      </video>

      {/* Player B (Dissolve Receiver) */}
      <video
        ref={vidBRef}
        muted
        playsInline
        autoPlay={isActive && activePlayer === 'B'}
        disablePictureInPicture
        disableRemotePlayback
        preload={preload}
        onTimeUpdate={handleTimeUpdateB}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform transform-gpu transition-opacity duration-300 ease-in-out"
        style={{
          opacity: activePlayer === 'B' ? 1 : 0,
          zIndex: activePlayer === 'B' ? 2 : 1,
        }}
      >
        <source src={src} type="video/mp4" />
        {fallbackSrc && <source src={fallbackSrc} type="video/mp4" />}
      </video>
    </div>
  );
}

interface CinematicScrollProps {
  stockCounts?: Record<string, number>;
  onBuyClick?: (plan: Plan) => void;
  onNotifyClick?: (plan: Plan) => void;
  waitlistedPlans?: Record<string, boolean>;
}

export function CinematicScrollExperience({
  stockCounts = {},
  onBuyClick,
  onNotifyClick,
  waitlistedPlans = {},
}: CinematicScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneLayersRef = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pricingRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);

  // Update active scene for GPU video decoding management with exact React bailout guard
  const handleScrollProgress = useCallback((progress: number) => {
    let newIdx = 0;
    if (progress < 0.28) {
      newIdx = 0;
    } else if (progress >= 0.28 && progress <= 0.62) {
      newIdx = 1;
    } else {
      newIdx = 2;
    }
    setActiveSceneIdx((prev) => (prev !== newIdx ? newIdx : prev));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial Entry Reveal Animation for Scene 1 (Page Load)
      gsap.set('.hud-tag-0', { opacity: 0, y: -12 });
      gsap.set('.hud-title-0', { opacity: 0, y: 40 });
      gsap.set('.hud-desc-0', { opacity: 0, x: -20 });
      gsap.set('.hud-badge-0', { opacity: 0, scale: 0.9, x: -15 });
      gsap.set('.hud-cta-0', { opacity: 0, scale: 0.95 });

      const hasSeenIntro = typeof window !== 'undefined' && sessionStorage.getItem('hasSeenIntro') === 'true';
      const introDelay = hasSeenIntro ? 0.3 : 1.8;

      const introTl = gsap.timeline({
        delay: introDelay,
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          gsap.set(['.hud-tag-0', '.hud-title-0', '.hud-desc-0', '.hud-badge-0', '.hud-cta-0'], {
            clearProps: 'transform',
          });
        },
      });
      introTl
        .to('.hud-tag-0', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.0)
        .to('.hud-title-0', { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.2)
        .to('.hud-desc-0', { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, 0.5)
        .to(
          '.hud-badge-0',
          { opacity: 1, scale: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)' },
          0.7
        )
        .to('.hud-cta-0', { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.9);

      // 2. Set initial off-screen states for Scene 2 & Scene 3 HUD elements
      gsap.set(sceneLayersRef.current[0], { opacity: 1 });
      sceneLayersRef.current.slice(1).forEach((v) => gsap.set(v, { opacity: 0 }));

      gsap.set(overlayRefs.current[0], { opacity: 1, y: 0, pointerEvents: 'auto' });
      overlayRefs.current.slice(1).forEach((o) => gsap.set(o, { opacity: 0, y: 35, pointerEvents: 'none' }));

      gsap.set(['.hud-tag-1', '.hud-desc-1', '.hud-tag-2', '.hud-desc-2'], { opacity: 0, x: -30 });
      gsap.set(['.hud-title-1', '.hud-title-2'], { opacity: 0, x: -50 });
      gsap.set(['.hud-badge-1', '.hud-badge-2'], { opacity: 0, x: -20 });
      gsap.set(pricingRef.current, { opacity: 0, y: 60, pointerEvents: 'none' });

      // 3. Master Pinned Timeline across 3 scenes (550vh runway)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          preventOverlaps: true,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`;
            }
            handleScrollProgress(self.progress);
          },
        },
      });

      // Build 3-Scene Scrubbed Timeline Sequence
      tl
        // ── Scene 1: Mewtwo Cryo-Awakening Hold ──
        .to({}, { duration: 2 })

        // ── Transition: Scene 1 Leaves -> Scene 2 Enters ──
        .to(overlayRefs.current[0], { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in', pointerEvents: 'none' }, 't1')
        .to(sceneLayersRef.current[0], { opacity: 0, duration: 1.2, ease: 'none' }, 't1')
        .to(sceneLayersRef.current[1], { opacity: 1, duration: 1.2, ease: 'none' }, 't1')
        .to(overlayRefs.current[1], { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', pointerEvents: 'auto' }, 't1+=0.2')
        .to('.hud-tag-1', { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 't1+=0.25')
        .to('.hud-title-1', { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 't1+=0.3')
        .to('.hud-desc-1', { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, 't1+=0.35')
        .to('.hud-badge-1', { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, 't1+=0.4')

        // ── Scene 2: Shibuya Hold ──
        .to({}, { duration: 2.3 })

        // ── Transition: Scene 2 Leaves -> Scene 3 Enters ──
        .to(overlayRefs.current[1], { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in', pointerEvents: 'none' }, 't2')
        .to(sceneLayersRef.current[1], { opacity: 0, duration: 1.2, ease: 'none' }, 't2')
        .to(sceneLayersRef.current[2], { opacity: 1, duration: 1.2, ease: 'none' }, 't2')
        .to(overlayRefs.current[2], { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', pointerEvents: 'auto' }, 't2+=0.2')
        .to('.hud-tag-2', { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 't2+=0.25')
        .to('.hud-title-2', { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 't2+=0.3')
        .to('.hud-desc-2', { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, 't2+=0.35')
        .to('.hud-badge-2', { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, 't2+=0.4')
        .to(
          pricingRef.current,
          { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.8, ease: 'power4.out' },
          't2+=0.35'
        )

        // ── Scene 3: Showdown & Shop Hold ──
        .to({}, { duration: 2.8 });
    }, containerRef);

    return () => ctx.revert();
  }, [handleScrollProgress]);

  const scrollToSection = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[550vh] bg-[#080403]">
      {/* 
        ============================================================
        PINNED FULL-SCREEN 1440P HARDWARE-ACCELERATED VIDEO VIEWPORT
        ============================================================
      */}
      <div className="sticky top-0 h-screen w-full overflow-hidden z-10 flex items-center justify-center will-change-transform transform-gpu">
        {/* Layer 1: Seamless Optical Dissolve Video Scenes (Scene 1, Scene 2, Scene 3) */}
        <div className="absolute inset-0 w-full h-full bg-black">
          {SCENE_VIDEOS.map((item, idx) => (
            <div
              key={item.id}
              ref={(el) => {
                sceneLayersRef.current[idx] = el;
              }}
              className="absolute inset-0 w-full h-full will-change-transform transform-gpu"
              style={{
                opacity: idx === 0 ? 1 : 0,
                zIndex: idx + 1,
              }}
            >
              <DissolveSceneVideo
                src={item.src}
                fallbackSrc={item.fallbackSrc}
                isActive={activeSceneIdx === idx}
                preload={idx === 0 ? 'auto' : 'metadata'}
              />
            </div>
          ))}
        </div>

        {/* Layer 2A: Full Cinematic Perimeter Vignette (Darkness around screen boundary for theatrical framing) */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(ellipse 85% 75% at center, transparent 35%, rgba(0, 0, 0, 0.55) 68%, rgba(0, 0, 0, 0.94) 100%)',
            boxShadow:
              'inset 0 0 100px rgba(0, 0, 0, 0.9), inset 0 0 200px rgba(0, 0, 0, 0.65), inset 0 0 300px rgba(0, 0, 0, 0.35)',
          }}
        />

        {/* Layer 2B: Localized Bottom-Left Contrast Feathering for Typography */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 0% 100%, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)',
          }}
        />

        {/* Layer 2C: Subtle Top Header Vignette */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* Layer 2D: Ambient Auroral Glow Layer */}
        <div
          className="pointer-events-none absolute inset-0 z-15 mix-blend-screen animate-ambient-pulse"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 75% 25%, rgba(56, 189, 248, 0.12) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 80%)',
          }}
        />

        {/* Layer 2D: Drifting Glowing Embers & Cosmic Dust Particles (Optimized) */}
        <AmbientMistParticles />

        {/* Layer 3: Top Ambient Cyber-Cyan Scrub Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 z-30">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] transition-all duration-75"
            style={{ width: '0%' }}
          />
        </div>

        {/* 
          ============================================================
          STRICT BOTTOM-LEFT DOCKED HUD OVERLAYS (Scenes 1, 2, 3)
          Clean Cyber-Cyan / Emerald Palette with High Contrast
          ============================================================
        */}
        <div className="absolute bottom-12 md:bottom-16 left-6 md:left-20 w-[94vw] max-w-2xl z-20 pointer-events-none">
          {SCENE_OVERLAYS.map((overlay, idx) => (
            <div
              key={idx}
              ref={(el) => {
                overlayRefs.current[idx] = el;
              }}
              className="absolute bottom-0 left-0 w-full pointer-events-auto"
              style={{
                opacity: idx === 0 ? 1 : 0,
              }}
            >
              {/* Line 1: Index Number + Section Subtitle Rule */}
              <div className={cn('hud-tag flex items-center gap-3 mb-2.5', `hud-tag-${idx}`)}>
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {overlay.idx}
                </span>
                <span className="w-6 h-px bg-white/30" />
                <span className="text-xs font-sans uppercase tracking-[0.25em] text-neutral-300/90 font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {overlay.subtitle}
                </span>
              </div>

              {/* Line 2: Large Majestic Editorial Serif Title (with overflow-hidden mask for slide-up reveal) */}
              <div className="overflow-hidden mb-4">
                <h2
                  className={cn(
                    'hud-title text-5xl sm:text-6xl md:text-7xl lg:text-[4.75rem] font-normal font-serif text-white tracking-tight leading-[1.04] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]',
                    `hud-title-${idx}`
                  )}
                >
                  {overlay.title}
                </h2>
              </div>

              {/* Line 3: Editorial Prose Description */}
              <p
                className={cn(
                  'hud-desc text-base sm:text-lg md:text-xl text-neutral-200/95 font-light leading-relaxed mb-6 max-w-xl font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]',
                  `hud-desc-${idx}`
                )}
              >
                {overlay.description}
              </p>

              {/* Line 4: Row of Capsule Tag Pills */}
              <div className={cn('hud-badges flex flex-wrap items-center gap-2.5 mb-6', `hud-badges-${idx}`)}>
                {overlay.badges.map((badge, bIdx) => (
                  <span
                    key={bIdx}
                    className={cn(
                      'hud-badge rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs md:text-sm text-white font-sans tracking-wide shadow-md whitespace-nowrap hover:bg-white/20 transition-colors inline-block',
                      `hud-badge-${idx}`
                    )}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Optional Scene 1 Action CTA */}
              {overlay.showCta && (
                <button
                  type="button"
                  onClick={() => scrollToSection('plans')}
                  className={cn(
                    'hud-cta rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black font-medium transition-all duration-200 px-7 py-2.5 text-xs md:text-sm shadow-[0_0_25px_rgba(56,189,248,0.3)] inline-flex items-center gap-2 active:scale-95 whitespace-nowrap pointer-events-auto',
                    `hud-cta-${idx}`
                  )}
                >
                  <span>Buy License Key</span>
                  <span className="text-xs">→</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 
          ============================================================
          SCENE 3: FROSTED OBSIDIAN GLASS PRICING CARDS
          ============================================================
        */}
        <div
          ref={pricingRef}
          className="absolute bottom-16 right-6 md:right-20 z-20 w-full max-w-md lg:max-w-lg space-y-4 pointer-events-none will-change-transform transform-gpu"
          id="plans-box"
        >
          {/* 2 Frosted Obsidian Glass Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PLANS.map((plan) => {
              const isPopular = plan.badge === 'Most Popular' || plan.badge === 'Popular';
              const count = (stockCounts && stockCounts[plan.id]) ?? 0;
              const isOutOfStock = count === 0;
              const isWaitlisted = Boolean(waitlistedPlans && waitlistedPlans[plan.id]);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative p-6 rounded-2xl bg-neutral-950/85 backdrop-blur-md border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-2xl pointer-events-auto transform-gpu',
                    isPopular
                      ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(56,189,248,0.15)] hover:border-cyan-400'
                      : 'border-white/10 hover:border-cyan-500/40'
                  )}
                >
                  {/* Top Badges */}
                  <div className="absolute -top-2.5 right-3 flex items-center gap-1.5">
                    {plan.discount_badge && (
                      <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-emerald-500/25 text-amber-300 border border-amber-400/40 text-[10px] font-mono uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        🔥 {plan.discount_badge}
                      </div>
                    )}
                    {isPopular && (
                      <div className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono uppercase tracking-wider font-bold">
                        POPULAR
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-white font-sans">{plan.name}</h3>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {plan.device_slots} Device{plan.device_slots > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline flex-wrap gap-x-2">
                      {plan.original_price_inr && (
                        <span className="text-sm font-mono text-rose-400/70 line-through decoration-rose-500/90 decoration-1">
                          ₹{(plan.original_price_inr / 100).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-white font-sans tracking-tight">
                        ₹{(plan.price_inr / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                        {plan.original_price_usd && (
                          <span className="text-rose-400/60 line-through decoration-rose-500/80">
                            ${(plan.original_price_usd / 100).toFixed(2)}
                          </span>
                        )}
                        <span>(${(plan.price_usd / 100).toFixed(2)})</span>
                      </span>
                    </div>

                    {/* Per-device savings subtext */}
                    {plan.device_slots > 1 && (
                      <div className="mt-1 text-[11px] font-mono text-emerald-400/90 font-medium">
                        ⚡ ₹{((plan.price_inr / plan.device_slots) / 100).toFixed(0)} / device
                      </div>
                    )}

                    <div className="mt-2 text-xs font-mono">
                      {isOutOfStock ? (
                        <span className="text-red-400">● Sold Out</span>
                      ) : (
                        <span className="text-emerald-400">● {count} in vault</span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {isOutOfStock ? (
                    isWaitlisted ? (
                      <button
                        type="button"
                        onClick={() => onNotifyClick?.(plan)}
                        className="w-full py-2 text-center text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full border border-emerald-500/30 transition-colors"
                        title="Click to update or re-register notification email"
                      >
                        ✓ Waitlisted (Update)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNotifyClick?.(plan)}
                        className="w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono font-medium text-cyan-300 uppercase transition-all"
                      >
                        Notify Me
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        triggerParticleBurst(e, 25);
                        onBuyClick?.(plan);
                      }}
                      className={cn(
                        'w-full py-2.5 rounded-full font-medium text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95',
                        isPopular
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(56,189,248,0.3)] font-semibold'
                          : 'bg-white text-black hover:bg-cyan-400 hover:text-black'
                      )}
                    >
                      Buy Key
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expandable FAQ Drawer Toggle */}
          <div className="flex flex-col items-center pointer-events-auto">
            <button
              type="button"
              onClick={() => setFaqDrawerOpen(!faqDrawerOpen)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-950/80 border border-white/10 backdrop-blur-md text-xs font-mono text-neutral-300 hover:text-cyan-300 transition-colors shadow-lg"
            >
              <HelpCircle size={12} className="text-cyan-400" />
              <span>Trainer FAQ & Support ({FAQS.length})</span>
              {faqDrawerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Collapsible FAQ Content */}
            {faqDrawerOpen && (
              <div className="mt-3 p-4 rounded-2xl bg-neutral-950/95 border border-white/10 shadow-2xl w-full text-left space-y-2.5 animate-in fade-in duration-200">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-2">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                      className="w-full py-1 flex items-center justify-between text-left text-xs font-medium text-neutral-200 hover:text-cyan-300 font-sans"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={11} className={`transition-transform ${openFaqIdx === idx ? 'rotate-180 text-cyan-400' : ''}`} />
                    </button>
                    {openFaqIdx === idx && (
                      <p className="text-[11px] font-mono text-neutral-400 pt-1 leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}

                <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Discord</a>
                    <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Reddit</a>
                    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Telegram</a>
                  </div>
                  <span className="text-emerald-400">Instant Automated Dispatch</span>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Clean Legal Disclaimer */}
          <div className="text-center text-[10px] font-mono text-neutral-500 space-x-3 pointer-events-auto">
            <span>© {new Date().getFullYear()} AETHERIA</span>
            <a href="/terms" className="hover:text-neutral-300">Terms</a>
            <a href="/privacy" className="hover:text-neutral-300">Privacy</a>
            <a href="/refund" className="hover:text-neutral-300">Refunds</a>
          </div>
        </div>

        {/* 
          ============================================================
          BOTTOM-RIGHT FLOATING SOCIAL DOCK (Discord, Reddit, Telegram)
          ============================================================
        */}
        <div className="fixed bottom-6 right-6 md:right-10 z-30 flex items-center pointer-events-auto">
          {/* Frosted Translucent Dark Social Capsule */}
          <div className="px-3.5 py-1.5 rounded-full bg-neutral-950/70 backdrop-blur-xl border border-white/15 shadow-[0_4px_25px_rgba(0,0,0,0.6)] flex items-center gap-3 text-neutral-300 transition-all hover:border-cyan-500/40">
            {/* Discord */}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-neutral-400 hover:text-[#5865F2] hover:scale-110 transition-all duration-200"
              title="Discord Profile"
              aria-label="Discord Profile"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>

            <span className="w-px h-3 bg-white/15" />

            {/* Reddit */}
            <a
              href={REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-neutral-400 hover:text-[#FF4500] hover:scale-110 transition-all duration-200"
              title="Reddit Profile"
              aria-label="Reddit Profile"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .688.56 1.25 1.25 1.25.688 0 1.25-.562 1.25-1.25 0-.69-.562-1.25-1.25-1.25zm5.5 0c-.688 0-1.25.56-1.25 1.25 0 .688.562 1.25 1.25 1.25.69 0 1.25-.562 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.465 4.01a.342.342 0 0 0-.252.578c.846.85 2.148 1.157 2.967 1.157.82 0 2.122-.307 2.968-1.157a.342.342 0 1 0-.484-.484c-.66.662-1.72.899-2.484.899-.763 0-1.824-.237-2.484-.899a.338.338 0 0 0-.235-.094z"/>
              </svg>
            </a>

            <span className="w-px h-3 bg-white/15" />

            {/* Telegram */}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-neutral-400 hover:text-[#229ED9] hover:scale-110 transition-all duration-200"
              title="Telegram: @sleekfx3"
              aria-label="Telegram: @sleekfx3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.51l-3-2.21-1.45 1.39c-.16.16-.3.3-.61.3l.22-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.86.93z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Minimal Scroll Cue */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 opacity-60 pointer-events-none">
          <span>SCROLL</span>
          <ChevronDown size={11} />
        </div>
      </div>

      {/* 
        ============================================================
        NAVIGATION ANCHORS (Positioned along the 550vh runway)
        ============================================================
      */}
      <div id="hero" className="absolute top-0 pointer-events-none" />
      <div id="features" className="absolute top-[38%] pointer-events-none" />
      <div id="plans" className="absolute top-[75%] pointer-events-none" />
      <div id="faq" className="absolute top-[80%] pointer-events-none" />
    </div>
  );
}
