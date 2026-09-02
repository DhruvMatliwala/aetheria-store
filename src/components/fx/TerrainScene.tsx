'use client';

/**
 * TerrainScene — Vector topographic contour terrain map with GPS waypoints.
 * Styled in cyberpunk Obsidian, Cyan, and Blue.
 */
export function TerrainScene({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`} aria-hidden="true">
      {/* Soft atmospheric gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b13] via-transparent to-[#070b13]" />

      {/* SVG Topographic Contour Lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Contour rings */}
        <ellipse cx="350" cy="300" rx="200" ry="130" stroke="#06b6d4" strokeWidth="0.8" />
        <ellipse cx="350" cy="300" rx="280" ry="190" stroke="#06b6d4" strokeWidth="0.6" />
        <ellipse cx="350" cy="300" rx="370" ry="250" stroke="#06b6d4" strokeWidth="0.4" />
        <ellipse cx="850" cy="500" rx="180" ry="110" stroke="#3b82f6" strokeWidth="0.8" />
        <ellipse cx="850" cy="500" rx="260" ry="170" stroke="#3b82f6" strokeWidth="0.5" />
        <ellipse cx="850" cy="500" rx="350" ry="230" stroke="#3b82f6" strokeWidth="0.3" />
        {/* Architectural Winding paths */}
        <path d="M 100 600 Q 300 400 500 500 T 900 350 T 1200 400" stroke="#06b6d4" strokeWidth="0.6" strokeDasharray="8 6" />
        <path d="M 0 200 Q 200 350 400 250 T 800 300 T 1100 200" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="6 8" />
      </svg>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-topo-lines" />

      {/* Glowing Cyan waypoint markers */}
      <WaypointDot x="22%" y="28%" color="gold" delay={0} />
      <WaypointDot x="68%" y="65%" color="gold" delay={1.2} />
      <WaypointDot x="45%" y="42%" color="amber" delay={2.5} />
      <WaypointDot x="82%" y="25%" color="gold" delay={0.8} />

      {/* Radar sweep in Cyan */}
      <div className="absolute top-[30%] left-[25%] w-[220px] h-[220px] -translate-x-1/2 -translate-y-1/2">
        <div className="w-full h-full rounded-full animate-radar-spin opacity-[0.08]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.5) 40deg, transparent 60deg)',
          }}
        />
      </div>
    </div>
  );
}

function WaypointDot({ x, y, color, delay }: { x: string; y: string; color: 'gold' | 'amber'; delay: number }) {
  const bg = color === 'gold' ? 'bg-cyan-400' : 'bg-sky-400';
  const ring = color === 'gold' ? 'border-cyan-400/40' : 'border-sky-400/40';

  return (
    <div className="absolute" style={{ left: x, top: y }}>
      {/* Pulse ring */}
      <div
        className={`absolute -inset-3 rounded-full border ${ring} animate-waypoint-pulse`}
        style={{ animationDelay: `${delay}s` }}
      />
      {/* Core dot */}
      <div className={`w-2 h-2 rounded-full ${bg} shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse`}
        style={{ animationDelay: `${delay}s` }}
      />
    </div>
  );
}

/**
 * AmbientParticles — Lightweight CSS drifting particles in Cyan.
 */
export function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `float-idle ${5 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}
