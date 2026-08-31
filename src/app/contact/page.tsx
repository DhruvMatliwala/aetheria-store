import { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Users, Clock, Shield } from 'lucide-react';
import { DISCORD_URL, REDDIT_URL, TELEGRAM_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact & Community Support | AETHERIA',
  description: 'Connect with our 24/7 official Discord, Reddit, and Telegram support channels.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-hero-gradient text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-surface-700/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🎮</span>
            <span className="text-white font-extrabold text-lg">PGSharp Keys</span>
          </Link>
          <Link
            href="/#plans"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            ← Back to Storefront
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-16 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold mb-4 uppercase tracking-wider">
            <Users size={14} />
            Direct Support Channels
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            We&apos;re Here to Help
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Need help with your PGSharp license key, setup, or have questions about safe spoofing? Reach out directly via Discord, Reddit, or Telegram.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Discord Card */}
            <div className="p-6 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center text-white mb-4 shadow-md">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Discord Support</h2>
                <p className="text-gray-300 text-xs leading-relaxed mb-6">
                  Direct message support for immediate help with key activation, errors, or troubleshooting.
                </p>
              </div>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md"
              >
                <span>Message on Discord</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Reddit Card */}
            <div className="p-6 bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FF4500] flex items-center justify-center text-white mb-4 shadow-md">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.334.334 0 0 0-.232-.095z"/>
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Reddit Support</h2>
                <p className="text-gray-300 text-xs leading-relaxed mb-6">
                  Message directly on Reddit for assistance with key delivery, safe spoofing rules, and queries.
                </p>
              </div>
              <a
                href={REDDIT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md"
              >
                <span>Message on Reddit</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Telegram Card */}
            <div className="p-6 bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#229ED9] flex items-center justify-center text-white mb-4 shadow-md">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.51l-3-2.21-1.45 1.39c-.16.16-.3.3-.61.3l.22-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.86.93z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Telegram Support</h2>
                <p className="text-gray-300 text-xs leading-relaxed mb-6">
                  Direct message @sleekfx3 on Telegram for quick key recovery, verification, and chat.
                </p>
              </div>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1E8BC0] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md"
              >
                <span>Message @sleekfx3</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-surface-900/80 border border-surface-700/60 rounded-2xl text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              <span>Automated Key Delivery: <strong>24/7/365 Active</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-brand-400" />
              <span>Average Community Response Time: <strong>&lt; 15 Minutes</strong></span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
