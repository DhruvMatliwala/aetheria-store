'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Shield,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Key,
  Smartphone,
  Star,
  Check,
  Bell,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { Plan } from '@/types/plan';
import { PLANS, DISCORD_URL, REDDIT_URL } from '@/lib/constants';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';
import { cn } from '@/lib/utils';

// Register ScrollTrigger once on client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Compact Features for Scene 2
const FEATURES = [
  { id: 'joystick', title: 'GPS Joystick', tag: 'JOYSTICK', coord: '35.6595° N, 139.7005° E', detail: '9.3 km/h Egg Hatching' },
  { id: 'teleport', title: 'Instant Teleport', tag: 'TELEPORT', coord: '41.6488° N, 0.8891° W', detail: 'Cooldown: 00:00 (Safe)' },
  { id: 'iv', title: '100% IV Radar', tag: 'SCANNER', coord: 'Live Global Feed', detail: '100% IV Wild Spawns' },
  { id: 'autowalk', title: 'Route Auto-Walk', tag: 'GPX PATROL', coord: 'Corridor Active', detail: 'Hands-Free GPX Patrol' },
];

// Sleek horizontal stepper for Scene 3
const STEPPER = [
  { num: '01', title: 'Select Tier', desc: '1 or 2 Devices' },
  { num: '02', title: 'Pay Instantly', desc: 'UPI or PayPal' },
  { num: '03', title: 'Instant Key', desc: '< 10s Screen & Email' },
  { num: '04', title: 'Activate & Play', desc: 'Paste in Settings' },
];

// FAQ items for Scene 4 Drawer
const FAQS = [
  {
    q: 'How fast do I receive my PGSharp license key?',
    a: 'Delivery is 100% automated and instant. As soon as your payment completes on UPI or PayPal, your key is revealed directly on your screen and dispatched to your email in under 10 seconds.',
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
    a: 'Download the PGSharp APK from pgsharp.com, log into Pokémon GO, tap the star/settings icon → Activate, and paste your key. Features unlock immediately.',
  },
  {
    q: 'Where can I reach out for assistance or questions?',
    a: 'Our team and trainer community are active 24/7. Join our Discord Server or Reddit Forum for instant responses.',
  },
];

interface CinematicHeroProps {
  stockCounts: Record<string, number>;
  onBuyClick: (plan: Plan) => void;
  onNotifyClick: (plan: Plan) => void;
  waitlistedPlans: Record<string, boolean>;
}

export function CinematicHeroExperience({
  stockCounts = {},
  onBuyClick,
  onNotifyClick,
  waitlistedPlans = {},
}: Partial<CinematicHeroProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // HUD overlay refs
  const scene1Ref = useRef<HTMLDivElement>(null);
  const scene2Ref = useRef<HTMLDivElement>(null);
  const scene3Ref = useRef<HTMLDivElement>(null);
  const scene4Ref = useRef<HTMLDivElement>(null);

  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const scrollToSection = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Global progress bar
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${self.progress * 100}%`;
          }
        },
      });

      // Video cross-fade helper
      const crossFadeTo = (targetIdx: number) => {
        setActiveSceneIdx(targetIdx);
        videoRefs.current.forEach((v, idx) => {
          if (v) {
            gsap.to(v, {
              opacity: idx === targetIdx ? 1 : 0,
              duration: 0.7,
              ease: 'power2.out',
            });
            // Ensure video plays smoothly
            if (idx === targetIdx && v.paused) {
              v.play().catch(() => {});
            }
          }
        });
      };

      // ==========================================
      // SCENE 1 (Track: #track-scene-1, 180vh)
      // ==========================================
      const track1 = document.getElementById('track-scene-1');
      if (track1 && scene1Ref.current) {
        ScrollTrigger.create({
          trigger: track1,
          start: 'top top',
          end: 'bottom bottom',
          onEnter: () => crossFadeTo(0),
          onEnterBack: () => crossFadeTo(0),
        });

        // Scene 1 HUD: Fades out cleanly before Scene 2 enters
        gsap.fromTo(
          scene1Ref.current,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: -30,
            ease: 'power2.in',
            scrollTrigger: {
              trigger: track1,
              start: '60% top',
              end: '95% top',
              scrub: 0.4,
            },
          }
        );
      }

      // ==========================================
      // SCENE 2 (Track: #track-scene-2, 200vh)
      // ==========================================
      const track2 = document.getElementById('track-scene-2');
      if (track2 && scene2Ref.current) {
        ScrollTrigger.create({
          trigger: track2,
          start: 'top top',
          end: 'bottom bottom',
          onEnter: () => crossFadeTo(1),
          onEnterBack: () => crossFadeTo(1),
        });

        // Scene 2 HUD: Enters at 15%, stays 25-75%, exits by 95%
        gsap.fromTo(
          scene2Ref.current,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: track2,
              start: 'top 80%',
              end: 'top 25%',
              scrub: 0.4,
            },
          }
        );

        gsap.to(scene2Ref.current, {
          opacity: 0,
          y: -30,
          ease: 'power2.in',
          scrollTrigger: {
            trigger: track2,
            start: '65% top',
            end: '95% top',
            scrub: 0.4,
          },
        });
      }

      // ==========================================
      // SCENE 3 (Track: #track-scene-3, 200vh)
      // ==========================================
      const track3 = document.getElementById('track-scene-3');
      if (track3 && scene3Ref.current) {
        ScrollTrigger.create({
          trigger: track3,
          start: 'top top',
          end: 'bottom bottom',
          onEnter: () => crossFadeTo(2),
          onEnterBack: () => crossFadeTo(2),
        });

        // Scene 3 HUD: Enters cleanly, stays, exits before Scene 4
        gsap.fromTo(
          scene3Ref.current,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: track3,
              start: 'top 80%',
              end: 'top 25%',
              scrub: 0.4,
            },
          }
        );

        gsap.to(scene3Ref.current, {
          opacity: 0,
          y: -30,
          ease: 'power2.in',
          scrollTrigger: {
            trigger: track3,
            start: '65% top',
            end: '95% top',
            scrub: 0.4,
          },
        });
      }

      // ==========================================
      // SCENE 4 (Track: #track-scene-4, 250vh)
      // ==========================================
      const track4 = document.getElementById('track-scene-4');
      if (track4 && scene4Ref.current) {
        ScrollTrigger.create({
          trigger: track4,
          start: 'top top',
          end: 'bottom bottom',
          onEnter: () => crossFadeTo(3),
          onEnterBack: () => crossFadeTo(3),
        });

        // Scene 4 Pricing HUD fades in cleanly
        gsap.fromTo(
          scene4Ref.current,
          { opacity: 0, y: 40, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: track4,
              start: 'top 80%',
              end: 'top 20%',
              scrub: 0.4,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const activeFeature = FEATURES[activeFeatureIdx];

  return (
    <div ref={containerRef} className="relative w-full bg-[#070b13]">
      {/* 
        ============================================================
        PINNED STICKY VIEWPORT (Hardware Accelerated 60FPS)
        ============================================================
      */}
      <div className="sticky top-0 h-screen w-full overflow-hidden z-10 flex items-center justify-center will-change-transform transform-gpu">
        {/* Layer 1: Auto-Playing 60FPS Background Video Cross-Faders */}
        <div className="absolute inset-0 w-full h-full bg-black">
          {[
            { id: 'v1', src: '/videos/Scene1.mp4' },
            { id: 'v2', src: '/videos/Scene2.mp4' },
            { id: 'v3', src: '/videos/Scene3.mp4' },
            { id: 'v4', src: '/videos/Scene4.mp4' },
          ].map((item, idx) => (
            <video
              key={item.id}
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 will-change-transform transform-gpu"
              style={{
                opacity: idx === 0 ? 1 : 0,
                zIndex: idx + 1,
              }}
            >
              <source src={item.src} type="video/mp4" />
              <source src={item.src.toLowerCase()} type="video/mp4" />
            </video>
          ))}
        </div>

        {/* Layer 2: Subtle Cinematic Vignettes (Keeps visual focal points clear) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/25 to-transparent pointer-events-none z-10" />

        {/* Layer 3: Top Ambient Cyan Scrub Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 z-30">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-75"
            style={{ width: '0%' }}
          />
        </div>

        {/* Layer 4: Minimal Scene Index Pill (Top Right) */}
        <div className="absolute top-20 right-6 sm:right-10 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[11px] font-mono text-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>SCENE 0{activeSceneIdx + 1} // 04</span>
        </div>

        {/* 
          ============================================================
          DE-CLUTTERED TWO-COLUMN HUD OVERLAYS
          Text stays in slim left column; Right column is open for video!
          ============================================================
        */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 w-full h-full flex flex-col justify-center pointer-events-none">

          {/* 
            --------------------------------------------------------
            SCENE 1: MINIMAL HERO (Rayquaza Dive)
            --------------------------------------------------------
          */}
          <div
            ref={scene1Ref}
            className={`w-full max-w-lg space-y-6 pointer-events-auto transition-all duration-300 ${
              activeSceneIdx === 0 ? 'opacity-100' : 'opacity-0 absolute'
            }`}
          >
            {/* Minimal Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                01 // ATMOSPHERIC INGRESS
              </span>
            </div>

            {/* Clean Sans Headline */}
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.05] font-sans">
              Unlock <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400">
                the Map.
              </span>
            </h1>

            {/* Single Concise Value Prop */}
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-md font-sans">
              Instant PGSharp Standard license keys dispatched in seconds. GPS joystick, route teleport, and 100% IV radar starting from ₹180.
            </p>

            {/* Primary Action Button */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('plans')}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95"
              >
                <Zap size={14} className="fill-slate-950" />
                <span>Claim License Key</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="text-xs font-mono text-neutral-400 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <span>Features</span>
                <ChevronDown size={13} />
              </button>
            </div>
          </div>

          {/* 
            --------------------------------------------------------
            SCENE 2: SHIBUYA EXPEDITION + DOCKED FROSTED WIDGET
            --------------------------------------------------------
          */}
          <div
            ref={scene2Ref}
            className={`w-full max-w-lg space-y-5 pointer-events-auto transition-all duration-300 ${
              activeSceneIdx === 1 ? 'opacity-100' : 'opacity-0 absolute'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                02 // GLOBAL EXPEDITION
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Roam <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400">
                Anywhere.
              </span>
            </h2>

            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-md font-sans">
              Precision GPS joystick, route patrol, and global coordinate teleporting without moving an inch.
            </p>

            {/* Sleek Docked Frosted HUD Widget */}
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-3 max-w-md">
              {/* Feature Pills */}
              <div className="grid grid-cols-2 gap-1.5">
                {FEATURES.map((feat, i) => (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => setActiveFeatureIdx(i)}
                    className={`px-3 py-2 rounded-lg text-left text-xs font-mono transition-all ${
                      i === activeFeatureIdx
                        ? 'bg-cyan-400/20 border border-cyan-400/60 text-cyan-300 font-bold'
                        : 'bg-white/5 border border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {feat.title}
                  </button>
                ))}
              </div>

              {/* Compact Telemetry Readout */}
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between text-[11px] font-mono">
                <div>
                  <span className="text-neutral-500 block text-[9px]">ACTIVE STATUS</span>
                  <span className="text-cyan-400 font-bold">{activeFeature.detail}</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[9px]">TARGET COORD</span>
                  <span className="text-neutral-200">{activeFeature.coord}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 
            --------------------------------------------------------
            SCENE 3: COMBAT SHOWDOWN + SLIM HORIZONTAL STEPPER
            --------------------------------------------------------
          */}
          <div
            ref={scene3Ref}
            className={`w-full max-w-2xl space-y-6 pointer-events-auto transition-all duration-300 ${
              activeSceneIdx === 2 ? 'opacity-100' : 'opacity-0 absolute'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                03 // COMBAT & ACTIVATION
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Dominate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400">
                the League.
              </span>
            </h2>

            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-md font-sans">
              100% IV live feed scanner, auto-curve ball catches, and rapid raid radars.
            </p>

            {/* Sleek Slim Horizontal Status Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {STEPPER.map((step) => (
                <div
                  key={step.num}
                  className="p-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex flex-col justify-between space-y-1"
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-400">{step.num}</span>
                  <p className="text-xs font-bold text-white font-sans">{step.title}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 
            --------------------------------------------------------
            SCENE 4: MASTER BALL VAULT (Centered Pricing + FAQ Drawer)
            --------------------------------------------------------
          */}
          <div
            ref={scene4Ref}
            className={`w-full max-w-3xl mx-auto space-y-6 pointer-events-auto transition-all duration-300 ${
              activeSceneIdx === 3 ? 'opacity-100' : 'opacity-0 absolute'
            }`}
            id="plans"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  04 // ARTIFACT VAULT
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                Claim Your Key.
              </h2>
            </div>

            {/* Two Sleek Frosted Pricing Cards directly beneath Master Ball */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {PLANS.map((plan) => {
                const isPopular = plan.badge === 'Most Popular';
                const count = stockCounts && typeof stockCounts[plan.id] === 'number' ? stockCounts[plan.id] : undefined;
                const isOutOfStock = count !== undefined && count <= 0;
                const isWaitlisted = Boolean(waitlistedPlans && waitlistedPlans[plan.id]);

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'relative p-5 rounded-2xl backdrop-blur-xl border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-2xl',
                      isPopular
                        ? 'bg-black/75 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                        : 'bg-black/60 border-white/10 hover:border-white/20'
                    )}
                  >
                    {/* Single Clean Badge */}
                    {plan.discount_badge ? (
                      <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-mono font-bold uppercase tracking-wider">
                        🔥 {plan.discount_badge}
                      </div>
                    ) : isPopular ? (
                      <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] font-mono font-bold uppercase tracking-wider">
                        POPULAR
                      </div>
                    ) : null}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white font-sans">{plan.name}</h3>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {plan.device_slots} Device{plan.device_slots > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="mt-2">
                        <span className="text-3xl font-extrabold text-white font-sans">
                          ₹{(plan.price_inr / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono ml-2">
                          (${(plan.price_usd / 100).toFixed(2)} USD)
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] font-mono">
                        {isOutOfStock ? (
                          <span className="text-red-400">● Sold Out</span>
                        ) : count !== undefined ? (
                          <span className="text-cyan-400">● {count} in vault</span>
                        ) : (
                          <span className="text-cyan-400">● Available</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {isOutOfStock ? (
                      isWaitlisted ? (
                        <div className="py-2.5 text-center text-xs font-mono text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                          ✓ On Waitlist
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNotifyClick?.(plan)}
                          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-cyan-300 uppercase transition-all"
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
                          'w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 cursor-pointer',
                          isPopular
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        )}
                      >
                        Buy License Key
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Expandable FAQ Drawer Toggle (Keeps Master Ball visible) */}
            <div className="pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setFaqDrawerOpen(!faqDrawerOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-xs font-mono text-neutral-300 hover:text-white transition-colors"
              >
                <HelpCircle size={13} className="text-cyan-400" />
                <span>Trainer FAQ & Support ({FAQS.length})</span>
                {faqDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {/* Collapsible FAQ Drawer Content */}
              {faqDrawerOpen && (
                <div className="mt-4 p-5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/10 shadow-2xl max-w-2xl w-full text-left space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  {FAQS.map((faq, idx) => (
                    <div key={idx} className="border-b border-white/5 pb-2.5">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                        className="w-full py-1.5 flex items-center justify-between text-left text-xs font-bold text-neutral-200 hover:text-cyan-400 font-sans"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={12} className={`transition-transform ${openFaqIdx === idx ? 'rotate-180 text-cyan-400' : ''}`} />
                      </button>
                      {openFaqIdx === idx && (
                        <p className="text-[11px] font-mono text-neutral-400 pt-1.5 leading-relaxed">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Discord Support</a>
                      <a href={REDDIT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Reddit Forum</a>
                    </div>
                    <span>Instant Automated Delivery</span>
                  </div>
                </div>
              )}
            </div>

            {/* Minimal Clean Legal Disclaimer Footer */}
            <div className="pt-2 text-center text-[10px] font-mono text-neutral-500 space-x-4">
              <span>© {new Date().getFullYear()} PGSharp Keys</span>
              <a href="/terms" className="hover:text-neutral-300">Terms</a>
              <a href="/privacy" className="hover:text-neutral-300">Privacy</a>
              <a href="/refund" className="hover:text-neutral-300">Refunds</a>
            </div>
          </div>

        </div>

        {/* Layer 7: Minimal Bottom Scroll Cue */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 opacity-70 animate-bounce pointer-events-none">
          <span>SCROLL</span>
          <ChevronDown size={12} />
        </div>
      </div>

      {/* 
        ============================================================
        CLEAN SCROLL TRACKS
        ============================================================
      */}
      <div className="relative z-0">
        <div id="hero" className="absolute -top-20" />
        <div id="track-scene-1" className="w-full h-[180vh] pointer-events-none" aria-hidden="true" />
        <div id="features" className="absolute" style={{ top: '180vh' }} />
        <div id="track-scene-2" className="w-full h-[200vh] pointer-events-none" aria-hidden="true" />
        <div id="journey" className="absolute" style={{ top: '380vh' }} />
        <div id="track-scene-3" className="w-full h-[200vh] pointer-events-none" aria-hidden="true" />
        <div id="plans" className="absolute" style={{ top: '580vh' }} />
        <div id="faq" className="absolute" style={{ top: '700vh' }} />
        <div id="track-scene-4" className="w-full h-[250vh] pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
}
