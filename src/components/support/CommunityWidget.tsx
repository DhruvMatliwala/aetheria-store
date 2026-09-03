'use client';

import { useState } from 'react';
import { MessageSquare, X, ExternalLink, Users, Sparkles } from 'lucide-react';
import { DISCORD_URL, REDDIT_URL, TELEGRAM_URL } from '@/lib/constants';

export function CommunityWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open community and support channels"
          className="relative group flex items-center gap-2.5 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-full shadow-glow-lg transition-all duration-300 hover:scale-105 border border-brand-400/40"
        >
          {/* Animated pulse dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>

          <div className="flex items-center gap-1.5 font-bold text-sm">
            <MessageSquare size={16} />
            <span>Community Support</span>
          </div>
        </button>
      </div>

      {/* Flyout Modal / Popup */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-end justify-center sm:justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in cursor-pointer"
        >
          <div
            className="w-full max-w-md bg-surface-800 border border-surface-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-slide-up cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-surface-700 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-brand-900/80 border border-brand-700/50 flex items-center justify-center text-brand-300">
                <Users size={18} />
              </div>
              <h2 className="text-lg font-black text-white">Community & Support</h2>
            </div>
            <p className="text-gray-400 text-xs mb-5">
              Need assistance with key activation, coords, or spoofing guides? Join our official community hubs.
            </p>

            {/* Community Links */}
            <div className="space-y-3">
              {/* Discord */}
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 hover:border-[#5865F2] rounded-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm group-hover:text-[#5865F2] transition-colors flex items-center gap-1.5">
                        <span>Message on Discord</span>
                        <ExternalLink size={13} />
                      </h3>
                      <p className="text-gray-400 text-xs">
                        Direct message support for key activation and instant help.
                      </p>
                    </div>
                  </div>
                </div>
              </a>

              {/* Reddit */}
              <a
                href={REDDIT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border border-[#FF4500]/30 hover:border-[#FF4500] rounded-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF4500] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.334.334 0 0 0-.232-.095z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm group-hover:text-[#FF4500] transition-colors flex items-center gap-1.5">
                        <span>Message on Reddit</span>
                        <ExternalLink size={13} />
                      </h3>
                      <p className="text-gray-400 text-xs">
                        Direct communication for queries, verification, and support.
                      </p>
                    </div>
                  </div>
                </div>
              </a>
              {/* Telegram */}
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 hover:border-[#229ED9] rounded-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.51l-3-2.21-1.45 1.39c-.16.16-.3.3-.61.3l.22-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.86.93z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm group-hover:text-[#229ED9] transition-colors flex items-center gap-1.5">
                        <span>Message on Telegram</span>
                        <ExternalLink size={13} />
                      </h3>
                      <p className="text-gray-400 text-xs">
                        Direct support with @sleekfx3 for instant key verification.
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-700 text-center">
              <p className="text-xs text-gray-500">
                🔒 24/7 Automated instant key delivery is active.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
