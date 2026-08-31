'use client';

/**
 * TerrainScene — Saffron Gold topographic contour lines,
 * warm atmospheric ambient glow, and precision waypoints.
 * Pure SVG + CSS, zero runtime overhead.
 */
export function TerrainScene({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {/* Atmospheric fog layers */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-[15%] w-[600px] h-[450px] rounded-full bg-brand-500/[0.05] blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[400px] rounded-full bg-[#712011]/[0.18] blur-[140px]" />
        <div className="absolute top-[40%] left-[50%] w-[350px] h-[350px] rounded-full bg-brand-600/[0.04] blur-[90px]" />
      </div>

      {/* Topographic contour SVG in Saffron Gold & Terracotta */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Contour rings */}
        <ellipse cx="350" cy="300" rx="200" ry="130" stroke="#ffbc09" strokeWidth="0.8" />
        <ellipse cx="350" cy="300" rx="280" ry="190" stroke="#ffbc09" strokeWidth="0.6" />
        <ellipse cx="350" cy="300" rx="370" ry="250" stroke="#ffbc09" strokeWidth="0.4" />
        <ellipse cx="850" cy="500" rx="180" ry="110" stroke="#c25844" strokeWidth="0.8" />
        <ellipse cx="850" cy="500" rx="260" ry="170" stroke="#c25844" strokeWidth="0.5" />
        <ellipse cx="850" cy="500" rx="350" ry="230" stroke="#c25844" strokeWidth="0.3" />
        {/* Architectural Winding paths */}
        <path d="M 100 600 Q 300 400 500 500 T 900 350 T 1200 400" stroke="#ffbc09" strokeWidth="0.6" strokeDasharray="8 6" />
        <path d="M 0 200 Q 200 350 400 250 T 800 300 T 1100 200" stroke="#c25844" strokeWidth="0.5" strokeDasharray="6 8" />
      </svg>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-topo-lines" />

      {/* Glowing Saffron waypoint markers */}
      <WaypointDot x="22%" y="28%" color="gold" delay={0} />
      <WaypointDot x="68%" y="65%" color="gold" delay={1.2} />
      <WaypointDot x="45%" y="42%" color="amber" delay={2.5} />
      <WaypointDot x="82%" y="25%" color="gold" delay={0.8} />

      {/* Radar sweep in Saffron Gold */}
      <div className="absolute top-[30%] left-[25%] w-[220px] h-[220px] -translate-x-1/2 -translate-y-1/2">
        <div className="w-full h-full rounded-full animate-radar-spin opacity-[0.08]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,188,9,0.5) 40deg, transparent 60deg)',
          }}
        />
      </div>
    </div>
  );
}

function WaypointDot({ x, y, color, delay }: { x: string; y: string; color: 'gold' | 'amber'; delay: number }) {
  const bg = color === 'gold' ? 'bg-[#ffbc09]' : 'bg-[#f59e0b]';
  const ring = color === 'gold' ? 'border-[#ffbc09]/40' : 'border-[#f59e0b]/40';

  return (
    <div className="absolute" style={{ left: x, top: y }}>
      {/* Pulse ring */}
      <div
        className={`absolute -inset-3 rounded-full border ${ring} animate-waypoint-pulse`}
        style={{ animationDelay: `${delay}s` }}
      />
      {/* Core dot */}
      <div className={`w-2 h-2 rounded-full ${bg} shadow-lg animate-glow-breathe`}
        style={{ animationDelay: `${delay}s` }}
      />
    </div>
  );
}

/**
 * AmbientParticles — Lightweight CSS drifting particles in Saffron Gold.
 */
export function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#ffbc09]/30"
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
