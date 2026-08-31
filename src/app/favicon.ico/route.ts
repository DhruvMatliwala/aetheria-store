import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const SVG_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="aetheriaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#38bdf8" flood-opacity="0.6" />
    </filter>
  </defs>
  
  <!-- Obsidian Frosted Background -->
  <rect width="32" height="32" rx="8" fill="#050811" />
  <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.45" />

  <!-- AETHERIA Cyber Emblem -->
  <g filter="url(#cyanGlow)">
    <!-- Outer Delta -->
    <path d="M16 6 L25 22 L7 22 Z" fill="none" stroke="url(#aetheriaGlow)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    <!-- Inner Core Nexus -->
    <circle cx="16" cy="17" r="2.8" fill="#38bdf8" />
    <path d="M16 11 L16 14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
  </g>
</svg>`;

export async function GET() {
  return new NextResponse(SVG_FAVICON, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
