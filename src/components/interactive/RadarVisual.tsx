'use client';

import React, { useState } from 'react';

interface Waypoint {
  id: string;
  name: string;
  coords: string;
  iv: string;
  x: number; // percentage
  y: number; // percentage
  color: string;
}

const WAYPOINTS: Waypoint[] = [
  { id: '1', name: '100% IV Charizard', coords: '37.7749° N, 122.4194° W', iv: '100% IV', x: 72, y: 28, color: '#38bdf8' },
  { id: '2', name: 'Shiny Lucario Feed', coords: '35.6762° N, 139.6503° E', iv: 'Shiny Alert', x: 26, y: 64, color: '#f59e0b' },
  { id: '3', name: 'Santa Monica Pier Hotspot', coords: '34.0099° N, 118.4960° W', iv: '50+ Pokéstops', x: 62, y: 78, color: '#10b981' },
];

export function RadarVisual() {
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(WAYPOINTS[0]);

  return (
    <div className="relative w-full aspect-square max-w-[460px] mx-auto flex items-center justify-center p-4">
      {/* Background Dark Radial Backdrop */}
      <div className="absolute inset-4 rounded-full bg-surface-900 border border-brand-500/20 shadow-2xl overflow-hidden">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 bg-gaming-grid opacity-30" />

        {/* Concentric Radar Rings */}
        <div className="absolute inset-[15%] rounded-full border border-brand-500/15" />
        <div className="absolute inset-[32%] rounded-full border border-brand-500/20" />
        <div className="absolute inset-[50%] rounded-full border border-brand-500/25" />
        <div className="absolute inset-[68%] rounded-full border border-brand-500/30" />

        {/* Crosshair Lines */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-brand-500/15" />
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-brand-500/15" />

        {/* Sweeping Radar Beam */}
        <div
          className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none opacity-40"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(139, 92, 246, 0.2) 320deg, rgba(6, 182, 212, 0.7) 360deg)',
          }}
        />

        {/* Center Pulse Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-500/20 border border-brand-400 animate-pulse-radar" />
        
        {/* Center Player Location Node */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-400 border-2 border-white shadow-lg flex items-center justify-center text-white z-20">
          <svg className="w-3 h-3 fill-current rotate-45" viewBox="0 0 24 24">
            <path d="m12 2 4.5 20-4.5-6-4.5 6Z" />
          </svg>
        </div>

        {/* Dynamic Interactive Waypoints */}
        {WAYPOINTS.map((wp) => (
          <div
            key={wp.id}
            style={{ top: `${wp.y}%`, left: `${wp.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            onClick={() => setActiveWaypoint(wp)}
            onMouseEnter={() => setActiveWaypoint(wp)}
          >
            {/* Pulsing ring */}
            <span
              className="absolute -inset-2 rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: wp.color }}
            />
            {/* Marker node */}
            <div
              className="relative w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-125 flex items-center justify-center"
              style={{ backgroundColor: wp.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Floating Active Coordinate HUD Pill */}
      {activeWaypoint && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-surface-850/95 border border-brand-500/40 rounded-2xl p-3.5 backdrop-blur-md shadow-glow-card transition-all duration-300 z-30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                style={{ backgroundColor: activeWaypoint.color }}
              >
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white truncate">{activeWaypoint.name}</p>
                  <span
                    className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md text-white flex-shrink-0"
                    style={{ backgroundColor: activeWaypoint.color }}
                  >
                    {activeWaypoint.iv}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono truncate">{activeWaypoint.coords}</p>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-[10px] font-bold text-accent-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-ping" />
                Live GPS
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
