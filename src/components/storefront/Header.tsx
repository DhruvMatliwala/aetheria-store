'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Key } from 'lucide-react';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';
import { useAmbientAudio } from '@/context/AmbientAudioContext';
import { CustomerVaultModal } from '@/components/vault/CustomerVaultModal';
import { getClientAuth } from '@/lib/firebase/client';
import { User, onAuthStateChanged } from 'firebase/auth';

const NAV_LINKS = [
  { label: 'AWAKEN', href: '#hero' },
  { label: 'EXPEDITION', href: '#features' },
  { label: 'SHOWDOWN', href: '#plans' },
];

export function Header() {
  const [activeTab, setActiveTab] = useState('AWAKEN');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isPlaying, togglePlay } = useAmbientAudio();

  useEffect(() => {
    try {
      const auth = getClientAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('[Header] Auth listener error:', err);
    }
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    triggerParticleBurst(e, 25);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2400);
  };

  return (
    <>
      <header className="fixed top-5 left-0 right-0 z-50 pointer-events-none px-6 md:px-12 flex items-center justify-between">
        {/* 
          ============================================================
          LEFT: FLOATING CLEAN BRAND BADGE (SpaceX Minimalist Style)
          ============================================================
        */}
        <div className="relative pointer-events-auto">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
            {/* Frosted Rounded Emblem Badge */}
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 group-hover:border-cyan-400/50 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="AETHERIA"
                width={26}
                height={26}
                className="w-5 h-5 object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
              />
            </div>

            {/* Clean Sans Wordmark */}
            <span className="font-sans font-bold text-sm tracking-[0.2em] text-white uppercase group-hover:text-cyan-300 transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              AETHERIA
            </span>
          </Link>

          {/* Secret +100 XP Reward Toast */}
          {showReward && (
            <div className="absolute top-12 left-0 z-50 animate-slide-up flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded-full shadow-lg border border-cyan-400/40 backdrop-blur-md pointer-events-none whitespace-nowrap">
              <Sparkles size={12} className="animate-spin text-cyan-400" />
              <span>+100 XP VAULT SYNCED! ⚡</span>
            </div>
          )}
        </div>

        {/* 
          ============================================================
          RIGHT: COMPACT FLOATING FROSTED CAPSULE (SpaceX Style Tabs)
          Center is 100% open so no part of the scene is hidden
          ============================================================
        */}
        <div className="pointer-events-auto flex items-center gap-2">
          <nav className="px-2 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-1 transition-all duration-300 hover:border-white/25">
            {/* Desktop Capsule Tabs */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeTab === link.label;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setActiveTab(link.label)}
                    className={`px-4 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white backdrop-blur-md font-semibold shadow-sm border border-white/20'
                        : 'text-neutral-300/80 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>

            {/* My Keys Customer Vault Pill Button */}
            <button
              type="button"
              onClick={() => setVaultOpen(true)}
              className="rounded-full bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white px-3.5 sm:px-4 py-1 text-xs font-mono font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-1.5 active:scale-95 whitespace-nowrap ml-1 group"
              title="View your purchased license keys"
            >
              <Key size={13} className="text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span>My Keys</span>
              {user && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>}
            </button>

            {/* Buy Key CTA Pill Button */}
            <a
              href="#plans"
              className="rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black px-4 sm:px-5 py-1 text-xs font-mono font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-1.5 active:scale-95 whitespace-nowrap ml-1"
            >
              <span>Buy Key</span>
              <span className="text-[10px]">→</span>
            </a>

            {/* Ambient Background Audio Toggle Button */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Mute ambient audio' : 'Play ambient audio'}
              title={isPlaying ? 'Mute ambient audio' : 'Play ambient audio'}
              className="h-7 w-7 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-300 hover:text-white hover:border-cyan-400 transition-all backdrop-blur-md shadow-[0_0_10px_rgba(6,182,212,0.15)] ml-1 flex-shrink-0 active:scale-90 group"
            >
              {isPlaying ? (
                <svg
                  className="w-3.5 h-3.5 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 opacity-60 text-neutral-300 group-hover:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-1.5 text-neutral-300 hover:text-white transition-colors ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                ) : (
                  <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>
                )}
              </svg>
            </button>
          </nav>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="absolute top-16 right-6 w-56 p-4 rounded-3xl bg-neutral-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl pointer-events-auto animate-fade-in-up md:hidden">
            <div className="space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setActiveTab(link.label);
                    setMobileOpen(false);
                  }}
                  className="block px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-white/10 mt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setVaultOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full text-center py-2 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5"
                >
                  <Key size={13} />
                  <span>My Keys</span>
                  {user && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>}
                </button>
                <a
                  href="#plans"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-2 rounded-full bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                >
                  Buy Key →
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Customer Vault Modal Mounted */}
      <CustomerVaultModal isOpen={vaultOpen} onClose={() => setVaultOpen(false)} />
    </>
  );
}
