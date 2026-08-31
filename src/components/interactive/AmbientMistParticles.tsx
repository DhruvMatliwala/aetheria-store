'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  color: string;
}

const COLORS = [
  'rgba(56, 189, 248,',  // Cyber Cyan
  'rgba(186, 230, 253,', // Ice Blue
  'rgba(16, 185, 129,',  // Emerald
  'rgba(255, 255, 255,', // Star White
];

export function AmbientMistParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Initialize 20 lightweight ambient motes
    const count = 20;
    const particles: Particle[] = Array.from({ length: count }, () => {
      const baseAlpha = 0.25 + Math.random() * 0.4;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.15 - Math.random() * 0.35, // Slow upward drift
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    let tick = 0;
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !animId) {
        animId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

    const render = () => {
      if (!isTabVisible) {
        animId = 0;
        return;
      }

      tick++;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update position
        p.x += p.speedX + Math.sin(tick * 0.015 + i) * 0.15;
        p.y += p.speedY;

        // Pulsing opacity
        p.alpha = p.baseAlpha + Math.sin(tick * p.pulseSpeed) * 0.12;

        // Wrap around screen boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Draw crisp particle with concentric soft glow
        const currentAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${currentAlpha * 0.25})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${currentAlpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20 w-full h-full opacity-70 mix-blend-screen will-change-transform"
      aria-hidden="true"
    />
  );
}
