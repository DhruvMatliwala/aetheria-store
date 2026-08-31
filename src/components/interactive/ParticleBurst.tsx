'use client';

import React, { useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

const COLORS = ['#a78bfa', '#8b5cf6', '#38bdf8', '#06b6d4', '#34d399', '#fbbf24', '#f472b6'];

export function triggerParticleBurst(e: React.MouseEvent | MouseEvent, count = 24) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.() || {
    left: e.clientX,
    top: e.clientY,
    width: 0,
    height: 0,
  };

  const originX = e.clientX || rect.left + rect.width / 2;
  const originY = e.clientY || rect.top + rect.height / 2;

  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  document.body.appendChild(canvas);

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 2 + Math.random() * 3.5,
      alpha: 1,
      life: 0,
      maxLife: 25 + Math.random() * 15,
    });
  }

  let animationFrame: number;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeCount = 0;
    particles.forEach((p) => {
      p.life++;
      if (p.life < p.maxLife) {
        activeCount++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // subtle gravity
        p.vx *= 0.96; // air friction
        p.alpha = 1 - p.life / p.maxLife;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.restore();
      }
    });

    if (activeCount > 0) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  render();
}

interface ParticleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  particleCount?: number;
}

export function ParticleButton({
  children,
  onClick,
  particleCount = 20,
  className = '',
  ...props
}: ParticleButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    triggerParticleBurst(e, particleCount);
    if (onClick) onClick(e);
  }

  return (
    <button onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  );
}
