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
      <header className="fixed top-2 sm:top-5 left-0 right-0 z-50 pointer-events-none px-3 sm:px-6 md:px-12 flex items-center justify-between pt-[env(safe-area-inset-top,0px)]">
        {/* 
          ============================================================
          LEFT: FLOATING CLEAN BRAND BADGE (SpaceX Minimalist Style)
          ============================================================
        */}
        <div className="relative pointer-events-auto">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 sm:gap-3 group active:scale-95 transition-transform"
            aria-label="AETHERIA Home"
          >
            {/* Pure Floating Emblem */}
            <div className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="AETHERIA"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Clean Bold Wordmark */}
            <span className="font-sans font-bold text-sm sm:text-lg tracking-[0.16em] sm:tracking-[0.24em] text-white uppercase group-hover:text-cyan-300 transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              AETHERIA
            </span>
          </Link>

          {/* Secret +100 XP Reward Toast */}
          {showReward && (
            <div className="absolute top-12 sm:top-13 left-0 z-50 animate-slide-up flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded-full shadow-lg border border-cyan-400/40 backdrop-blur-md pointer-events-none whitespace-nowrap">
              <Sparkles size={12} className="animate-spin text-cyan-400" />
              <span>+100 XP VAULT SYNCED! ⚡</span>
            </div>
          )}
        </div>

        {/* 
          ============================================================
          RIGHT: COMPACT FLOATING FROSTED CAPSULE (SpaceX Style Tabs)
          ============================================================
        */}
        <div className="pointer-events-auto flex items-center gap-2">
          <nav className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-1.5 transition-all duration-300 hover:border-white/25">
            {/* Desktop Capsule Tabs */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeTab === link.label;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setActiveTab(link.label)}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
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

            {/* My Keys Customer Vault Button (Desktop visible, on Mobile moved to 3-line drawer) */}
            <button
              type="button"
              onClick={() => setVaultOpen(true)}
              className="hidden sm:inline-flex rounded-full bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white px-3.5 sm:px-4 py-1.5 text-xs font-mono font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] items-center gap-1.5 active:scale-95 whitespace-nowrap ml-1 group"
              title="View your purchased license keys"
            >
              <Key size={13} className="text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span>My Keys</span>
              {user && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>}
            </button>

            {/* Buy Key CTA Pill Button (Always visible on all screen sizes) */}
            <a
              href="#plans"
              className="rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black px-3.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-sans font-bold transition-all duration-200 shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-1 active:scale-95 whitespace-nowrap ml-0.5 sm:ml-1"
            >
              <span>Buy Key</span>
              <span className="text-[10px] sm:text-[11px]">→</span>
            </a>

            {/* Ambient Background Audio Toggle Button */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Mute ambient audio' : 'Play ambient audio'}
              title={isPlaying ? 'Mute ambient audio' : 'Play ambient audio'}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-300 hover:text-white hover:border-cyan-400 transition-all backdrop-blur-md shadow-[0_0_10px_rgba(6,182,212,0.15)] ml-0.5 sm:ml-1 flex-shrink-0 active:scale-90 group"
            >
              {isPlaying ? (
                <svg
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"
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
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 opacity-60 text-neutral-300 group-hover:text-white"
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

            {/* Mobile Hamburger Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white ml-0.5"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? (
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="absolute top-14 right-4 w-60 p-4 rounded-3xl bg-neutral-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl pointer-events-auto animate-fade-in-up md:hidden">
            {/* Primary Mobile Action: Customer Vault / My Keys */}
            <button
              type="button"
              onClick={() => {
                setVaultOpen(true);
                setMobileOpen(false);
              }}
              className="w-full text-center py-2.5 mb-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95"
            >
              <Key size={14} className="text-cyan-400" />
              <span>Customer Vault (My Keys)</span>
              {user && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>}
            </button>

            <div className="space-y-1 border-t border-white/10 pt-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setActiveTab(link.label);
                    setMobileOpen(false);
                  }}
                  className="block px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-white/10 mt-2">
                <a
                  href="#plans"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-2 rounded-full bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                >
                  Buy License Key →
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
