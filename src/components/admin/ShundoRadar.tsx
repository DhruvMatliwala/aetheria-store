'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Crosshair,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Shield,
  Key,
  Globe,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ShinySpawn {
  id: number;
  name: string;
  form: string | null;
  gender: string;
  cp: number;
  level: number;
  countryCode: string;
  city: string;
  despawnEpoch: number;
  despawnIso: string;
  timeLeftSeconds: number;
  isDespawned: boolean;
  discordAlertUrl: string | null;
  coordToken: string | null;
  coordWebUrl: string | null;
  spriteUrl: string;
}

interface ScanResult {
  success: boolean;
  jobId: string;
  status: string;
  friendCode: string;
  checkedSpawns: number;
  totalShinies: number;
  shinies: ShinySpawn[];
  error?: string | null;
  cachedAgeSeconds?: number;
}

interface ShundoRadarProps {
  adminToken: string;
}

export function ShundoRadar({ adminToken }: ShundoRadarProps) {
  const [friendCode, setFriendCode] = useState('9062 3587 9636');
  const [customCookie, setCustomCookie] = useState('');
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScanResult | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Initialize saved cookie from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pokex_scanner_cookie');
      if (saved) setCustomCookie(saved);
    }
  }, []);

  function formatCode(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  function handleSaveCookie() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pokex_scanner_cookie', customCookie.trim());
      toast.success('Scanner session cookie saved locally.');
      setShowCookieSettings(false);
    }
  }

  async function handleScan(forceCode?: string) {
    const targetCode = (forceCode || friendCode).replace(/\D/g, '');
    if (targetCode.length !== 12) {
      toast.error('Friend code must be 12 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/shundo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify({
          friendCode: targetCode,
          customCookie: customCookie.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Failed to scan live spawns.');
      } else {
        setData(json);
        if (json.totalShinies > 0) {
          toast.success(`Found ${json.totalShinies} guaranteed shinies!`);
        } else {
          toast('No active guaranteed shinies for this account right now.', {
            icon: 'ℹ️',
          });
        }
      }
    } catch (err: any) {
      toast.error('Network error scanning spawns.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyIntel(spawn: ShinySpawn) {
    const text = `[AETHERIA SHUNDO] ${spawn.name}${spawn.form ? ` (${spawn.form})` : ''} | 100% IV | CP ${spawn.cp} | Lv ${spawn.level} | ${spawn.city}, ${spawn.countryCode}\nDiscord Alert: ${spawn.discordAlertUrl || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(spawn.id);
    toast.success(`Copied ${spawn.name} intel to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-6 shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-500 to-purple-500" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Crosshair size={26} className={loading ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  SHUNDO RADAR
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 uppercase tracking-widest">
                  Classified Admin Eye
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Deterministic Seed Matcher • Cross-referencing 3,500+ live 100% IV spawns against target Friend Code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCookieSettings(!showCookieSettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/60 bg-[#080e1a] text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <Settings size={14} />
              <span>Session Cookie</span>
              {showCookieSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* ── COOKIE DRAWER ──────────────────────────────────────── */}
        {showCookieSettings && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Shield size={13} className="text-amber-400" />
                <span>Scanner Session Cookie (PokeXperience)</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Stored securely in your local browser storage
              </span>
            </div>
            <textarea
              rows={2}
              value={customCookie}
              onChange={(e) => setCustomCookie(e.target.value)}
              placeholder="px_vt=1; z=...; cf_clearance=...; Token=..."
              className="w-full bg-[#080e1a] border border-[#16243d] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveCookie}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
              >
                Save Cookie
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTROL PANEL ──────────────────────────────────────── */}
      <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-6 shadow-card space-y-4">
        <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Key size={14} className="text-cyan-400" />
            <span>Target Pokémon GO Friend Code (12 Digits)</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">No login or password needed</span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={friendCode}
            onChange={(e) => setFriendCode(formatCode(e.target.value))}
            placeholder="9062 3587 9636"
            className="flex-1 bg-[#080e1a] border border-[#16243d] rounded-xl px-4 py-3 font-mono text-lg font-bold text-cyan-300 tracking-wider placeholder-slate-600 focus:outline-none focus:border-cyan-500/80"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => handleScan()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Querying Spawns...</span>
              </>
            ) : (
              <>
                <Crosshair size={16} />
                <span>Scan for Shundos</span>
              </>
            )}
          </button>
        </div>

        {/* Quick select tags */}
        <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500 font-mono">Quick load:</span>
          <button
            type="button"
            onClick={() => {
              setFriendCode('9062 3587 9636');
              handleScan('9062 3587 9636');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#080e1a] border border-slate-800 hover:border-cyan-500/50 text-cyan-300 font-mono text-[11px] transition-colors"
          >
            9062 3587 9636 (Dhruv)
          </button>
        </div>
      </div>

      {/* ── LIVE RESULTS ────────────────────────────────────────── */}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>
              Checked <strong className="text-white font-bold">{data.checkedSpawns.toLocaleString()}</strong> live 100% IV spawns
            </span>
            <span className="text-amber-400 font-bold">
              {data.totalShinies} Guaranteed {data.totalShinies === 1 ? 'Shiny' : 'Shinies'} Identified
            </span>
          </div>

          {data.shinies.length === 0 ? (
            <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-10 text-center space-y-2">
              <Crosshair size={32} className="mx-auto text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-white">No Guaranteed Shinies Live Right Now</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Spawns rotate every 15-30 minutes worldwide. Check back in a few minutes or re-scan during community events.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.shinies.map((spawn) => (
                <div
                  key={`${spawn.id}-${spawn.despawnEpoch}-${spawn.cp}`}
                  className="bg-[#0c1424] border border-[#16243d] hover:border-amber-500/40 rounded-2xl p-5 shadow-card space-y-4 transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/20 to-transparent w-24 h-24 pointer-events-none rounded-bl-full" />

                  {/* Header Row */}
                  <div className="flex items-start gap-3">
                    <div className="relative w-14 h-14 rounded-xl bg-[#080e1a] border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <Image
                        src={spawn.spriteUrl}
                        alt={spawn.name}
                        width={48}
                        height={48}
                        className="object-contain"
                        unoptimized
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-extrabold text-white truncate">
                          {spawn.name}
                        </h4>
                        {spawn.form && (
                          <span className="text-[10px] font-semibold text-purple-400">
                            ({spawn.form})
                          </span>
                        )}
                        <span className="text-xs">
                          {spawn.gender === 'Male' ? '♂' : spawn.gender === 'Female' ? '♀' : '⚲'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                          100% IV
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          CP {spawn.cp}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Lv {spawn.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location & Despawn Timer */}
                  <div className="bg-[#080e1a] border border-[#152138] rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <Globe size={13} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{spawn.city}, {spawn.countryCode}</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[11px] font-bold shrink-0">
                      <Clock size={12} className={spawn.isDespawned ? 'text-red-400' : 'text-emerald-400'} />
                      <span className={spawn.isDespawned ? 'text-red-400' : 'text-emerald-400'}>
                        {spawn.isDespawned
                          ? 'Despawned'
                          : `${Math.floor(spawn.timeLeftSeconds / 60)}m ${spawn.timeLeftSeconds % 60}s`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {spawn.discordAlertUrl && (
                      <a
                        href={spawn.discordAlertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <ExternalLink size={13} />
                        <span>Discord Coords</span>
                      </a>
                    )}

                    {spawn.coordWebUrl && (
                      <a
                        href={spawn.coordWebUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>Web</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyIntel(spawn)}
                      className="p-2 rounded-xl border border-slate-800 bg-[#080e1a] hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
                      title="Copy Intel to Clipboard"
                    >
                      {copiedId === spawn.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
