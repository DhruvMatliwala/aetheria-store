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
  Star,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Plan } from '@/types/plan';
import { Review } from '@/types/review';
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
    titleLine1: 'BREAK',
    titleLine2: 'EVERY LIMIT.',
    title: 'Break every limit.',
    description: 'Official PGSharp Standard Edition 30-day keys with direct digital dispatch upon payment verification.',
    badges: ['Fast Key Delivery', '30-Day License', 'PGSharp Standard ⚡'],
    showCta: true,
  },
  {
    idx: '02 / 03',
    subtitle: 'GLOBAL EXPEDITION',
    titleLine1: 'ROAM',
    titleLine2: 'ANYWHERE.',
    title: 'Roam anywhere.',
    description: 'Precision PGSharp GPS joystick and route patrol across Tokyo, Zaragoza, and worldwide.',
    badges: ['PGSharp Joystick', 'Auto-Walk', 'Cooldown Radar'],
    showCta: false,
  },
  {
    idx: '03 / 03',
    subtitle: 'COMBAT SHOWDOWN',
    titleLine1: 'MASTER',
    titleLine2: 'EVERY RAID.',
    title: 'Master every raid.',
    description: 'Live 100% IV scanner feed and official 30-day PGSharp Standard Edition licenses. Fast digital delivery.',
    badges: ['100% IV Feed', 'Raid Radar', 'PGSharp Verified'],
    showCta: false,
  },
];

// FAQ items for Scene 3 Drawer
const FAQS = [
  {
    q: 'What are these keys used for?',
    a: 'These are official activation keys for the PGSharp Standard Edition Android app. Entering your key inside the PGSharp app unlocks VIP features including teleportation, auto-walking, quick catch, 100 IV feeds, and shiny scanner for 30 days.',
  },
  {
    q: 'Are you the official creator of PGSharp?',
    a: 'AETHERIA is an independent digital license distributor and reseller. We provide trainers worldwide with fast digital key delivery, direct payment methods (UPI, GPay, PhonePe, Cards, PayPal), and 24/7 priority customer support.',
  },
  {
    q: 'How fast do I receive my PGSharp license key?',
    a: 'Delivery is direct upon payment verification. As soon as your payment clears on UPI or PayPal, your key is revealed right on your screen and dispatched to your email (typically within 1 to 5 minutes).',
  },
  {
    q: 'How do device slots work across 1-Device and 2-Device plans?',
    a: '1 Device Plan (₹180 / $1.99) activates 1 Android device for 30 days. 2 Devices Plan (₹350 / $3.50) activates up to 2 Android devices simultaneously. Keys bind to hardware for the 30-day duration.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'India (INR): Direct UPI QR (Google Pay, PhonePe, Paytm, BHIM, CRED). International (USD): PayPal (PayPal Balance, Debit/Credit Cards, and Pay in 4).',
  },
  {
    q: 'How do I activate my license key in PGSharp?',
    a: 'Download the official PGSharp APK, open Pokémon GO, tap the PGSharp star/settings icon → Settings → Activate, and paste your key. VIP features unlock immediately.',
  },
  {
    q: 'Where can I reach out for assistance or questions?',
    a: 'Reach out directly on Discord, Telegram (@sleekfx3), or our 24/7 support channels for instant 1-on-1 assistance.',
  },
];

interface SceneVideoProps {
  src: string;
  fallbackSrc?: string;
  preload?: 'auto' | 'metadata' | 'none';
  videoClassName?: string;
  onVideoMount?: (video: HTMLVideoElement | null) => void;
}

/**
 * Ultra-Lean Hardware Accelerated Video Node
 * Runs with 0 React overhead and native WebKit/Blink hardware decoding.
 */
function SceneVideo({
  src,
  fallbackSrc,
  preload = 'none',
  videoClassName = 'object-contain object-[center_24%] sm:object-cover sm:object-center',
  onVideoMount,
}: SceneVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Enforce iOS WebKit inline autoplay rules directly on DOM element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', '');
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-black pointer-events-none">
      <video
        ref={(el) => {
          videoRef.current = el;
          if (onVideoMount) onVideoMount(el);
        }}
        muted
        playsInline
        loop={false}
        controls={false}
        preload={preload}
        className={cn(
          'absolute inset-0 w-full h-full will-change-transform transform-gpu pointer-events-none',
          videoClassName
        )}
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneLayersRef = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pricingRef = useRef<HTMLDivElement>(null);
  const scene3TrustRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const mobileScrollIndicatorRef = useRef<HTMLDivElement>(null);
  const desktopScrollIndicatorRef = useRef<HTMLDivElement>(null);
  const videoElementsRef = useRef<(HTMLVideoElement | null)[]>([]);
  const activeSceneRef = useRef<number>(0);
  const prewarmedRef = useRef<Record<number, boolean>>({ 0: true });
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);
  const [liveReviews, setLiveReviews] = useState<Review[]>([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState<number>(0);

  useEffect(() => {
    fetch('/api/reviews', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setLiveReviews(data.reviews);
        }
      })
      .catch((err) => console.error('Error fetching reviews:', err));
  }, []);

  const currentReview = liveReviews[activeReviewIdx] || liveReviews[0];
  const hasMultiple = liveReviews.length > 1;
  const canGoLeft = hasMultiple && activeReviewIdx > 0;
  const canGoRight = hasMultiple && activeReviewIdx < liveReviews.length - 1;

  // Anticipatory Lookahead prewarmer: quietly buffers next video in background
  const prewarmVideo = useCallback((targetIdx: number) => {
    if (prewarmedRef.current[targetIdx]) return;
    prewarmedRef.current[targetIdx] = true;
    const vid = videoElementsRef.current[targetIdx];
    if (vid) {
      vid.preload = 'auto';
      vid.load();
    }
  }, []);

  // Zero-overhead video decoder switcher:
  // Plays video once, pauses at last frame, and replays fresh from start when returning!
  const switchVideo = useCallback((targetIdx: number) => {
    if (activeSceneRef.current === targetIdx && videoElementsRef.current[targetIdx] && !videoElementsRef.current[targetIdx]?.paused) {
      return;
    }
    activeSceneRef.current = targetIdx;
    videoElementsRef.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === targetIdx) {
        video.muted = true;
        // If returning to a scene that ended or paused, replay smoothly from 0.0s
        if (video.ended || video.currentTime > 0) {
          video.currentTime = 0;
        }
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      } else {
        // Pause inactive video and reset position so it replays fresh next time
        if (!video.paused) {
          video.pause();
        }
        if (video.currentTime > 0) {
          video.currentTime = 0;
        }
      }
    });
  }, []);

  // Safe initial autoplay for Scene 0 only, plus gentle gesture unlocker
  useEffect(() => {
    switchVideo(0);

    const unlockFirstVideo = () => {
      const v0 = videoElementsRef.current[0];
      if (v0 && v0.paused) {
        v0.muted = true;
        v0.play().catch(() => {});
      }
    };

    window.addEventListener('touchstart', unlockFirstVideo, { passive: true, once: true });
    window.addEventListener('click', unlockFirstVideo, { passive: true, once: true });
    window.addEventListener('scroll', unlockFirstVideo, { passive: true, once: true });

    // Idle Time Preloader: after 1.8s of viewing Scene 1, quietly buffer Scene 2
    const idleTimer = setTimeout(() => {
      prewarmVideo(1);
    }, 1800);

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('touchstart', unlockFirstVideo);
      window.removeEventListener('click', unlockFirstVideo);
      window.removeEventListener('scroll', unlockFirstVideo);
    };
  }, [switchVideo, prewarmVideo]);

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
    switchVideo(newIdx);
  }, [switchVideo]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial Entry Reveal Animation for Scene 1 (Page Load)
      gsap.set('.hud-tag-0', { opacity: 0, y: -12 });
      gsap.set('.hud-title-0', { opacity: 0, y: 40 });
      gsap.set('.hud-desc-0', { opacity: 0, x: -20 });
      gsap.set('.hud-badge-0', { opacity: 0, scale: 0.9, x: -15 });
      gsap.set('.hud-cta-0', { opacity: 0, scale: 0.95 });
      if (mobileScrollIndicatorRef.current) gsap.set(mobileScrollIndicatorRef.current, { opacity: 0, y: 15 });
      if (desktopScrollIndicatorRef.current) gsap.set(desktopScrollIndicatorRef.current, { opacity: 0, y: 15 });

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
        .to('.hud-cta-0', { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.9)
        .to(
          [mobileScrollIndicatorRef.current, desktopScrollIndicatorRef.current].filter(Boolean),
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          1.0
        );

      // 2. Set initial off-screen states for Scene 2 & Scene 3 HUD elements
      gsap.set(sceneLayersRef.current[0], { opacity: 1 });
      sceneLayersRef.current.slice(1).forEach((v) => gsap.set(v, { opacity: 0 }));

      gsap.set(overlayRefs.current[0], { opacity: 1, y: 0, pointerEvents: 'auto' });
      overlayRefs.current.slice(1).forEach((o) => gsap.set(o, { opacity: 0, y: 35, pointerEvents: 'none' }));

      gsap.set(['.hud-tag-1', '.hud-desc-1', '.hud-tag-2', '.hud-desc-2'], { opacity: 0, x: -30 });
      gsap.set(['.hud-title-1', '.hud-title-2'], { opacity: 0, x: -50 });
      gsap.set(['.hud-badge-1', '.hud-badge-2'], { opacity: 0, x: -20 });
      gsap.set(pricingRef.current, { opacity: 0, autoAlpha: 0, y: 60, pointerEvents: 'none' });
      gsap.set(scene3TrustRef.current, { opacity: 0, autoAlpha: 0, y: 60, pointerEvents: 'none' });

      // 3. Master Pinned Timeline across 3 scenes (550vh runway)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.15,
          pin: viewportRef.current,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          preventOverlaps: true,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`;
            }
            const p = self.progress;

            // Anticipatory Lookahead Preloading: buffer next scene 1,000px before user arrives
            if (p >= 0.05) {
              prewarmVideo(1);
            }
            if (p >= 0.32) {
              prewarmVideo(2);
            }

            handleScrollProgress(p);
          },
        },
      });

      // Build 3-Scene Scrubbed Timeline Sequence
      tl
        // ── Scroll Indicator Fade Out on Initial Scroll ──
        .to(
          [mobileScrollIndicatorRef.current, desktopScrollIndicatorRef.current].filter(Boolean),
          { opacity: 0, y: 20, duration: 0.3, ease: 'power2.in', pointerEvents: 'none' },
          0
        )

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
        .to(
          pricingRef.current,
          { opacity: 1, autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: 0.8, ease: 'power4.out' },
          't1+=0.35'
        )

        // ── Scene 2: Shibuya Hold ──
        .to({}, { duration: 2.3 })

        // ── Transition: Scene 2 Leaves -> Scene 3 Enters ──
        .to(overlayRefs.current[1], { opacity: 0, y: -30, duration: 0.4, ease: 'power2.in', pointerEvents: 'none' }, 't2')
        .to(
          pricingRef.current,
          { opacity: 0, autoAlpha: 0, y: -25, pointerEvents: 'none', duration: 0.5, ease: 'power2.in' },
          't2'
        )
        .to(sceneLayersRef.current[1], { opacity: 0, duration: 1.2, ease: 'none' }, 't2')
        .to(sceneLayersRef.current[2], { opacity: 1, duration: 1.2, ease: 'none' }, 't2')
        .to(overlayRefs.current[2], { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', pointerEvents: 'auto' }, 't2+=0.2')
        .to('.hud-tag-2', { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 't2+=0.25')
        .to('.hud-title-2', { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 't2+=0.3')
        .to('.hud-desc-2', { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, 't2+=0.35')
        .to('.hud-badge-2', { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, 't2+=0.4')
        .to(
          scene3TrustRef.current,
          { opacity: 1, autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: 0.8, ease: 'power4.out' },
          't2+=0.35'
        )

        // ── Scene 3: Showdown & Shop Hold ──
        .to({}, { duration: 2.8 });
    }, containerRef);

    return () => ctx.revert();
  }, [handleScrollProgress]);

  const scrollToSection = (targetId: string) => {
    if (targetId === 'plans' && containerRef.current) {
      const top = containerRef.current.offsetTop + containerRef.current.offsetHeight * 0.38;
      window.scrollTo({ top, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[550vh] bg-[#070b13]">
      {/* 
        ============================================================
        PINNED FULL-SCREEN 1440P HARDWARE-ACCELERATED VIDEO VIEWPORT
        ============================================================
      */}
      <div
        ref={viewportRef}
        className="sticky top-0 h-screen h-[100dvh] w-full overflow-hidden z-10 flex items-center justify-center will-change-transform transform-gpu"
      >
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
                zIndex: idx + 1,
              }}
            >
              <SceneVideo
                src={item.src}
                fallbackSrc={item.fallbackSrc}
                preload={idx === 0 ? 'auto' : 'none'}
                onVideoMount={(el) => {
                  videoElementsRef.current[idx] = el;
                }}
                videoClassName={
                  idx === 2
                    ? 'object-contain object-[center_24%] sm:object-cover sm:object-center'
                    : 'object-contain object-[center_24%] sm:object-cover sm:object-center'
                }
              />
            </div>
          ))}
        </div>

        {/* Layer 2A: Full Cinematic Perimeter Vignette (GPU-friendly pure radial gradient) */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(ellipse 85% 75% at center, transparent 35%, rgba(0, 0, 0, 0.55) 68%, rgba(0, 0, 0, 0.94) 100%)',
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
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* Layer 2D: Ambient Auroral Glow Layer (Desktop only to keep mobile at 60fps) */}
        <div
          className="pointer-events-none absolute inset-0 z-15 mix-blend-screen animate-ambient-pulse hidden md:block"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 75% 25%, rgba(56, 189, 248, 0.12) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 80%)',
          }}
        />

        {/* Layer 2E: Drifting Glowing Embers & Cosmic Dust Particles (Desktop only to prevent mobile thermal lag) */}
        <div className="hidden md:block pointer-events-none">
          <AmbientMistParticles />
        </div>

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
        <div className="absolute bottom-[max(4.5rem,calc(env(safe-area-inset-bottom,0px)+3.5rem))] sm:bottom-14 md:bottom-16 left-4 sm:left-6 md:left-20 w-[calc(100vw-2rem)] sm:w-[85vw] md:w-full max-w-2xl z-20 pointer-events-none">
          {SCENE_OVERLAYS.map((overlay, idx) => (
            <div
              key={idx}
              ref={(el) => {
                overlayRefs.current[idx] = el;
              }}
              className={cn(
                'absolute bottom-0 left-0 w-full pointer-events-auto',
                idx > 0 ? 'hidden md:block' : ''
              )}
              style={{
                opacity: idx === 0 ? 1 : 0,
              }}
            >
              {/* Line 1: Index Number + Section Subtitle Rule */}
              <div className={cn('hud-tag flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2.5', `hud-tag-${idx}`)}>
                <span className="text-xs sm:text-base font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-400 font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {overlay.idx}
                </span>
                <span className="w-4 sm:w-6 h-px bg-white/30" />
                <span className="text-xs sm:text-base font-sans uppercase tracking-[0.16em] sm:tracking-[0.25em] text-neutral-200 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {overlay.subtitle}
                </span>
              </div>

              {/* Line 2: Bold Modern Geometric Display Title (Matches Reference Photo) */}
              <div className="overflow-hidden mb-2 sm:mb-4">
                <h2
                  className={cn(
                    'hud-title text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold uppercase font-display tracking-tight leading-[0.92] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]',
                    `hud-title-${idx}`
                  )}
                >
                  <span className="block text-white">{overlay.titleLine1}</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] via-[#0088cc] to-[#0a3d91] pb-1">
                    {overlay.titleLine2}
                  </span>
                </h2>
              </div>

              {/* Line 3: Editorial Prose Description */}
              <p
                className={cn(
                  'hud-desc text-xs sm:text-lg md:text-xl text-neutral-100 font-normal leading-relaxed mb-3 sm:mb-6 max-w-sm sm:max-w-xl font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]',
                  `hud-desc-${idx}`
                )}
              >
                {overlay.description}
              </p>

              {/* Line 4: Row of Capsule Tag Pills */}
              <div className={cn('hud-badges flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3.5 sm:mb-6', `hud-badges-${idx}`)}>
                {overlay.badges.map((badge, bIdx) => (
                  <span
                    key={bIdx}
                    className={cn(
                      'hud-badge rounded-full bg-white/10 backdrop-blur-md border border-white/25 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm md:text-sm text-white font-sans font-medium tracking-wide shadow-md whitespace-nowrap hover:bg-white/20 transition-colors inline-block',
                      `hud-badge-${idx}`
                    )}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Optional Scene 1 Action CTA */}
              {overlay.showCta && (
                <div className="flex items-center pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => scrollToSection('plans')}
                    className={cn(
                      'hud-cta rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black font-semibold transition-all duration-200 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base shadow-[0_0_20px_rgba(56,189,248,0.25)] inline-flex items-center gap-1.5 active:scale-95 whitespace-nowrap',
                      `hud-cta-${idx}`
                    )}
                  >
                    <span>Buy License Key</span>
                    <span className="text-xs sm:text-sm">→</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 
          ============================================================
          SCENE 2: FROSTED OBSIDIAN GLASS PRICING CARDS (Global Expedition)
          ============================================================
        */}
        <div
          ref={pricingRef}
          className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:bottom-12 md:bottom-16 left-2.5 right-2.5 sm:left-auto sm:right-6 md:right-20 z-20 w-auto sm:w-full sm:max-w-md lg:max-w-lg space-y-1.5 sm:space-y-3 will-change-transform transform-gpu pointer-events-none opacity-0 invisible"
          id="plans-box"
        >
          {/* Side-by-Side Symmetrical Grid on All Devices */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {PLANS.map((plan) => {
              const count = (stockCounts && stockCounts[plan.id]) ?? 0;
              const isOutOfStock = count === 0;
              const isWaitlisted = Boolean(waitlistedPlans && waitlistedPlans[plan.id]);

              return (
                <div key={plan.id} className="flex flex-col justify-end">
                  {/* Tag sitting directly on top edge of the box */}
                  <div className="h-4 sm:h-6 flex items-end justify-end px-1.5 sm:px-3 -mb-[1px] z-10">
                    {plan.discount_badge && (
                      <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-400/40 text-[7px] sm:text-[10px] font-mono uppercase tracking-wider font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] backdrop-blur-md">
                        🔥 {plan.discount_badge}
                      </span>
                    )}
                  </div>

                  {/* 100% Symmetrical Vertically Long Obsidian Box Format */}
                  <div
                    className="p-3 py-3.5 sm:p-5 sm:py-7 md:p-6 md:py-8 rounded-xl sm:rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-white/15 hover:border-cyan-500/50 transition-all duration-200 flex flex-col justify-between min-h-[195px] sm:min-h-[245px] space-y-2 sm:space-y-5 shadow-2xl transform-gpu pointer-events-auto"
                  >
                    <div className="space-y-1.5 sm:space-y-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs sm:text-base font-bold text-white font-sans truncate">{plan.name}</h3>
                        <span className="text-[9px] sm:text-xs font-mono text-neutral-300 font-medium shrink-0">
                          {plan.device_slots} Device{plan.device_slots > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-baseline">
                        <span className="text-xl sm:text-3xl md:text-4xl font-bold text-white font-sans tracking-tight">
                          ₹{(plan.price_inr / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] sm:text-xs md:text-sm text-cyan-400 font-mono ml-1 sm:ml-2">
                          (${(plan.price_usd / 100).toFixed(2)})
                        </span>
                      </div>

                      <div className="text-[9px] sm:text-xs font-mono">
                        {isOutOfStock ? (
                          <span className="text-red-400 font-medium">● Sold Out</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">● Fast Digital Delivery</span>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-white/10 flex flex-col gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] text-neutral-300/90 font-sans">
                        <div className="flex items-center gap-1">
                          <span className="text-cyan-400 font-bold">✓</span>
                          <span className="truncate">30-Day PGSharp VIP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-cyan-400 font-bold">✓</span>
                          <span className="truncate">Teleport & Auto-Walk</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {isOutOfStock ? (
                      isWaitlisted ? (
                        <button
                          type="button"
                          onClick={() => onNotifyClick?.(plan)}
                          className="w-full py-2 sm:py-3 text-center text-[10px] sm:text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg sm:rounded-xl border border-emerald-500/30 transition-colors font-semibold"
                          title="Click to update or re-register notification email"
                        >
                          ✓ Waitlisted
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNotifyClick?.(plan)}
                          className="w-full py-2 sm:py-3 text-center text-[10px] sm:text-xs font-mono text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl border border-white/10 transition-colors font-semibold"
                        >
                          NOTIFY ME
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          triggerParticleBurst(e, 25);
                          onBuyClick?.(plan);
                        }}
                        className="w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 bg-white text-black hover:bg-cyan-400 hover:text-black"
                      >
                        Buy Key
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reassurance Strip */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-mono text-neutral-400/90 pointer-events-auto">
            <span className="flex items-center gap-1">
              <Shield size={10} className="text-cyan-400" /> AES-256 Vault
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1">
              <Zap size={10} className="text-emerald-400" /> Fast Digital Delivery
            </span>
            <span className="text-white/20">•</span>
            <span className="text-neutral-300">Direct UPI & PayPal</span>
          </div>
        </div>

        {/* 
          ============================================================
          SCENE 3: COMMUNITY TRUST, VERIFIED VOUCHES & TRAINER FAQ (Combat Showdown)
          ============================================================
        */}
        <div
          ref={scene3TrustRef}
          className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:bottom-12 md:bottom-16 left-3 right-3 sm:left-auto sm:right-6 md:right-12 lg:right-16 z-20 w-auto sm:w-[420px] md:w-[460px] space-y-2 will-change-transform transform-gpu pointer-events-none opacity-0 invisible"
          id="trust-box"
        >
          {/* Reference Match: The EXACT Minimalist 2-Line Capsule (Slightly Bigger) with Conditional Arrows */}
          {liveReviews.length > 0 && (
            <div className="space-y-2 pointer-events-auto">
              {/* Flex row with conditional left arrow + exact reference card + conditional right arrow */}
              <div className="relative flex items-center justify-center gap-2 sm:gap-2.5">
                {/* Left Arrow: ONLY appears when there is a previous review */}
                {canGoLeft && (
                  <button
                    type="button"
                    onClick={() => setActiveReviewIdx((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#050811]/90 hover:bg-[#091122] border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white backdrop-blur-md flex items-center justify-center transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95 shrink-0"
                    aria-label="Previous review"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                )}

                {/* The EXACT Reference Capsule (Deep Dark Obsidian Shade matching reference) */}
                <div className="flex-1 min-w-0 p-4 sm:p-4.5 rounded-2xl bg-[#050811]/92 backdrop-blur-xl border border-cyan-500/25 shadow-[0_12px_40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] space-y-2 transition-all duration-300 hover:border-cyan-500/40">
                  {/* Top Row: Avatar + @Handle + Verified Checkmark (Left) and 5 Gold Stars + 5.0 (Right) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300 text-xs shadow-sm shrink-0">
                        {(currentReview?.trainerName || 'D').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-white tracking-wide truncate">
                        @{currentReview?.trainerName || 'Dhruv'}
                      </span>
                      <CheckCircle2 size={15} className="text-cyan-400 fill-cyan-400/20 shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 font-mono shrink-0">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-bold text-neutral-200 text-xs sm:text-sm ml-0.5">
                        {(liveReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / liveReviews.length).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Quote Text */}
                  <p className="text-xs sm:text-[13.5px] text-neutral-200 font-sans leading-relaxed pl-0.5">
                    &ldquo;{currentReview?.comment || 'Instant delivery and key worked perfectly!'}&rdquo;
                  </p>
                </div>

                {/* Right Arrow: ONLY appears when there is a next review */}
                {canGoRight && (
                  <button
                    type="button"
                    onClick={() => setActiveReviewIdx((prev) => Math.min(liveReviews.length - 1, prev + 1))}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#050811]/90 hover:bg-[#091122] border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white backdrop-blur-md flex items-center justify-center transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95 shrink-0"
                    aria-label="Next review"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dots Pagination: ONLY appears when multiple reviews exist */}
              {hasMultiple && (
                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                  {liveReviews.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveReviewIdx(idx)}
                      className={`transition-all duration-300 ${
                        activeReviewIdx === idx
                          ? 'w-4 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                          : 'w-1.5 h-1.5 bg-neutral-600 rounded-full hover:bg-neutral-400'
                      }`}
                      aria-label={`Go to review ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Minimalist Sub-controls: FAQ Toggle & Discord */}
          <div className="flex items-center justify-end gap-2 pointer-events-auto pt-0.5">
            <button
              type="button"
              onClick={() => setFaqDrawerOpen(!faqDrawerOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950/70 hover:bg-neutral-900 border border-white/10 backdrop-blur-md text-[10px] font-mono text-neutral-400 hover:text-cyan-300 transition-colors shadow"
            >
              <HelpCircle size={10} className="text-cyan-400" />
              <span>FAQ ({FAQS.length})</span>
              {faqDrawerOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full bg-neutral-950/70 hover:bg-neutral-900 border border-white/10 backdrop-blur-md text-neutral-400 hover:text-white transition-colors shadow flex items-center justify-center"
              title="Discord"
            >
              <ExternalLink size={11} />
            </a>
          </div>

            {/* Collapsible FAQ Content */}
            {faqDrawerOpen && (
              <div className="mt-1.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-950/95 border border-white/10 shadow-2xl w-full text-left space-y-1.5 animate-in fade-in duration-200 max-h-40 sm:max-h-60 overflow-y-auto custom-scrollbar">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-1">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                      className="w-full py-1 flex items-center justify-between text-left text-[11px] sm:text-xs font-medium text-neutral-200 hover:text-cyan-300 font-sans"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={10} className={`transition-transform ${openFaqIdx === idx ? 'rotate-180 text-cyan-400' : ''}`} />
                    </button>
                    {openFaqIdx === idx && (
                      <p className="text-[9px] sm:text-[11px] font-mono text-neutral-400 pt-0.5 leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}

                <div className="pt-1.5 flex items-center justify-between text-[8px] sm:text-[10px] font-mono text-neutral-400 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Discord</a>
                    <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Reddit</a>
                    <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Telegram</a>
                  </div>
                  <span className="text-emerald-400">Fast Digital Delivery</span>
                </div>
              </div>
            )}

          {/* Legal Links & Independent Reseller Disclaimer */}
          <div className="flex flex-col items-center gap-0.5 text-center font-sans pointer-events-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-neutral-500">
              <span>© {new Date().getFullYear()} AETHERIA</span>
              <span>•</span>
              <a href="/terms" className="hover:text-neutral-300">Terms</a>
              <a href="/privacy" className="hover:text-neutral-300">Privacy</a>
              <a href="/refund" className="hover:text-neutral-300">Refunds</a>
            </div>
            <p className="text-[7.5px] sm:text-[9px] text-neutral-500/80 max-w-sm text-center leading-tight">
              AETHERIA is an independent digital license reseller. Not affiliated with Niantic, Nintendo, Pokémon, or PGSharp.
            </p>
          </div>
        </div>

        {/* 
          ============================================================
          BOTTOM-RIGHT FLOATING SOCIAL DOCK (Discord, Reddit, Telegram)
          ============================================================
        */}
        <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 md:right-10 z-30 hidden xs:flex items-center pointer-events-auto">
          {/* Frosted Translucent Dark Social Capsule */}
          <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-xl border border-white/15 shadow-[0_4px_25px_rgba(0,0,0,0.6)] flex items-center gap-2 sm:gap-3 text-neutral-300 transition-all hover:border-cyan-500/40">
            {/* Discord */}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0.5 sm:p-1 text-neutral-400 hover:text-[#5865F2] hover:scale-110 transition-all duration-200"
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

        {/* 
          ============================================================
          100% MATHEMATICALLY CENTERED SCROLL / SWIPE INDICATORS
          ============================================================
        */}
        {/* Mobile-Only Centered Swipe Down Indicator (Aligned with Buy Key Row at bottom-24) */}
        <div
          ref={mobileScrollIndicatorRef}
          className="md:hidden fixed bottom-[5.85rem] left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center justify-center gap-0.5 opacity-0 will-change-transform transform-gpu select-none"
        >
          <span className="scroll-indicator-pulse text-[9px] font-mono font-bold tracking-[0.24em] text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] whitespace-nowrap">
            SWIPE DOWN
          </span>
          <div className="scroll-indicator-pulse w-3.5 h-5 rounded-full border-[1.5px] border-white/85 flex items-start justify-center p-[2px] shadow-[0_0_12px_rgba(255,255,255,0.5)]">
            <div className="w-1 h-1.5 rounded-full bg-white animate-bounce" />
          </div>
        </div>

        {/* Desktop-Only Centered Scroll Indicator (PC / Wide Screens) */}
        <div
          ref={desktopScrollIndicatorRef}
          className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex-col items-center justify-center gap-1.5 opacity-0 will-change-transform transform-gpu select-none"
        >
          <span className="scroll-indicator-pulse text-xs font-mono font-bold tracking-[0.28em] text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            SCROLL TO EXPLORE
          </span>
          <div className="scroll-indicator-pulse w-4 h-5.5 rounded-full border-[1.5px] border-white/85 flex items-start justify-center p-[2px] shadow-[0_0_12px_rgba(255,255,255,0.5)]">
            <div className="w-1 h-1.5 rounded-full bg-white animate-bounce" />
          </div>
        </div>
      </div>

      {/* 
        ============================================================
        NAVIGATION ANCHORS (Positioned along the 550vh runway)
        ============================================================
      */}
      <div id="hero" className="absolute top-0 pointer-events-none" />
      <div id="features" className="absolute top-[38%] pointer-events-none" />
      <div id="plans" className="absolute top-[38%] pointer-events-none" />
      <div id="showdown" className="absolute top-[75%] pointer-events-none" />
      <div id="faq" className="absolute top-[75%] pointer-events-none" />
    </div>
  );
}
