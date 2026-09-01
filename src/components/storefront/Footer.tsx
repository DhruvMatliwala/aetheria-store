'use client';

import Image from 'next/image';
import { DISCORD_URL, REDDIT_URL, TELEGRAM_URL } from '@/lib/constants';

const FOOTER_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Contact', href: '/contact' },
];

const NAV_LINKS = [
  { label: 'Ingress', href: '/#hero' },
  { label: 'Expedition', href: '/#features' },
  { label: 'Showdown', href: '/#journey' },
  { label: 'Vault', href: '/#plans' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#080403]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-5 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="AETHERIA"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-sans font-semibold tracking-[0.2em] text-sm text-white uppercase">
                  AETHERIA
                </span>
                <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest ml-1">
                  // ACCESS
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs font-mono">
              Independent license key delivery portal. Instant automated dispatch, verified SSL security, 24/7 support.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3 md:col-start-6">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">[ NAVIGATE ]</h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-cyan-300 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Support */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">[ CONNECT ]</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-neutral-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <span>Discord Profile</span>
                  <span className="text-[10px] text-emerald-400">● Online</span>
                </a>
              </li>
              <li>
                <a
                  href={REDDIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-neutral-400 hover:text-cyan-300 transition-colors"
                >
                  Reddit Profile
                </a>
              </li>
              <li>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-neutral-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <span>Telegram (@sleekfx3)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-neutral-500 font-mono">
            © {new Date().getFullYear()} AETHERIA. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[11px] text-neutral-400 hover:text-cyan-300 transition-colors font-mono"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
