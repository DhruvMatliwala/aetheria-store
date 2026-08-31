'use client';

import { useRef, useEffect, useState } from 'react';

/**
 * ScrollReveal — IntersectionObserver reveal with Saffron spring physics.
 */
export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [once]);

  const transforms: Record<string, string> = {
    up: 'translateY(24px)',
    down: 'translateY(-24px)',
    left: 'translateX(24px)',
    right: 'translateX(-24px)',
    scale: 'scale(0.92)',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Waypoint — Architectural marker with Saffron gold accents.
 */
export function Waypoint({
  label,
  icon,
  description,
  color = 'gold',
  active = false,
}: {
  label: string;
  icon: React.ReactNode;
  description: string;
  color?: 'gold' | 'amber' | 'emerald';
  active?: boolean;
}) {
  const colors = {
    gold: { bg: 'bg-[#ffbc09]', ring: 'border-[#ffbc09]/40', text: 'text-[#ffbc09]', glow: 'shadow-glow-gold' },
    amber: { bg: 'bg-[#f59e0b]', ring: 'border-[#f59e0b]/40', text: 'text-[#fcd34d]', glow: '' },
    emerald: { bg: 'bg-accent-500', ring: 'border-accent-400/40', text: 'text-accent-300', glow: '' },
  };
  const c = colors[color];

  return (
    <div className={`flex items-start gap-4 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-40'}`}>
      {/* Marker */}
      <div className="relative flex-shrink-0">
        {active && (
          <div className={`absolute -inset-2 rounded-full border ${c.ring} animate-waypoint-pulse`} />
        )}
        <div className={`w-10 h-10 rounded-xl ${c.bg}/15 border ${c.ring} flex items-center justify-center ${c.text} ${active ? c.glow : ''} transition-all duration-500`}>
          {icon}
        </div>
      </div>
      {/* Content */}
      <div>
        <p className={`text-sm font-bold ${active ? 'text-[#ece7e0]' : 'text-gray-500'} transition-colors duration-500 font-display`}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 ${active ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-500 font-mono`}>
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * DeviceFrame — Architectural game-UI device mockup in obsidian & gold.
 */
export function DeviceFrame({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer subtle gold/terracotta glow */}
      <div className="absolute -inset-4 bg-[#ffbc09]/[0.08] rounded-[2rem] blur-2xl" />

      {/* Device shell in obsidian with hairline terracotta border */}
      <div className="relative bg-surface-900 border border-surface-600 rounded-[1.5rem] overflow-hidden device-glow">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-surface-950 border-b border-surface-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-glow-breathe" />
            <span className="text-[10px] font-mono text-[#ffbc09] font-bold tracking-wider">PGSHARP // v2.4.9</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-gray-500 tracking-widest">[ ACTIVE ]</span>
          </div>
        </div>

        {/* Screen content */}
        <div className="relative aspect-[9/14] bg-surface-850">
          {children}
        </div>

        {/* Home bar */}
        <div className="flex justify-center py-2 bg-surface-950 border-t border-surface-700">
          <div className="w-20 h-1 rounded-full bg-surface-600" />
        </div>
      </div>
    </div>
  );
}
