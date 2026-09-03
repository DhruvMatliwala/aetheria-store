'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ExternalLink, HelpCircle } from 'lucide-react';
import { DISCORD_URL, REDDIT_URL } from '@/lib/constants';
import { ScrollReveal } from '@/components/fx/UIComponents';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    question: 'How fast do I receive my PGSharp license key?',
    answer: (
      <p>
        Delivery is <strong>100% automated and instant</strong>. As soon as your payment clears on UPI or PayPal, your license key is revealed directly on your screen on the order confirmation page and simultaneously dispatched to your email address in under 10 seconds.
      </p>
    ),
  },
  {
    question: 'How do device slots work across 1-Device and 2-Device plans?',
    answer: (
      <div className="space-y-2">
        <p>
          Each PGSharp Standard tier provides active concurrent hardware slots for 30 days:
        </p>
        <ul className="list-disc list-inside space-y-1 text-[#bfb8ae] ml-2 font-mono text-xs">
          <li><strong>1 Device Plan (₹180 / $1.99):</strong> Activates 1 Android phone or tablet at a time.</li>
          <li><strong>2 Devices Plan (₹350 / $3.50):</strong> Activates up to 2 Android phones or tablets simultaneously.</li>
        </ul>
        <p className="text-cyan-400 text-xs mt-2 font-mono">
          ⚠️ As per PGSharp policy, keys bind to device hardware during their 30-day validity. Make sure to activate on your intended device.
        </p>
      </div>
    ),
  },
  {
    question: 'What payment methods can I use?',
    answer: (
      <div className="space-y-2">
        <p>
          We support all major Indian and international payment gateways:
        </p>
        <ul className="list-disc list-inside space-y-1 text-[#bfb8ae] ml-2 font-mono text-xs">
          <li><strong>India (INR):</strong> Direct UPI QR (Google Pay, PhonePe, Paytm, BHIM, CRED) with fast digital delivery upon verification.</li>
          <li><strong>International (USD):</strong> PayPal (PayPal Balance, Linked Debit/Credit Cards, and Pay in 4) with direct digital delivery.</li>
        </ul>
      </div>
    ),
  },
  {
    question: 'How do I activate the license key in PGSharp?',
    answer: (
      <div className="space-y-2">
        <p>Activation takes 4 simple steps:</p>
        <ol className="list-decimal list-inside space-y-1 text-[#bfb8ae] ml-2 font-mono text-xs">
          <li>Download the PGSharp APK from the official site (pgsharp.com).</li>
          <li>Log into your Pokémon GO trainer account as usual.</li>
          <li>Tap the floating PGSharp star/settings icon → <strong>Activate</strong>.</li>
          <li>Paste your license key and press Confirm. All features activate immediately!</li>
        </ol>
      </div>
    ),
  },
  {
    question: 'Where can I reach out if I have questions or need assistance?',
    answer: (
      <div className="space-y-3">
        <p>
          Reach out directly on Discord or Reddit for instant 1-on-1 assistance:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-900 hover:bg-cyan-500/10 border border-surface-600 hover:border-cyan-500/50 text-[#ece7e0] hover:text-cyan-400 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all"
          >
            <span>Discord Profile</span>
            <ExternalLink size={12} />
          </a>
          <a
            href={REDDIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-900 hover:bg-cyan-500/10 border border-surface-600 hover:border-cyan-500/50 text-[#ece7e0] hover:text-cyan-400 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all"
          >
            <span>Reddit Profile</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    ),
  },
];

function AccordionItem({ faq, isOpen, onToggle }: { faq: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className={`border-b border-surface-700/80 transition-colors ${isOpen ? 'border-cyan-500/60' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-base sm:text-lg font-bold pr-6 transition-colors font-display ${isOpen ? 'text-cyan-400' : 'text-[#ece7e0] group-hover:text-cyan-400'}`}>
          {faq.question}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          isOpen ? 'rotate-180 bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-surface-800 text-gray-400 border border-surface-700'
        }`}>
          <ChevronDown size={16} />
        </div>
      </button>
      <div
        className="overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height }}
      >
        <div ref={contentRef} className="pb-6 text-[#bfb8ae] text-sm sm:text-base leading-relaxed font-mono">
          {faq.answer}
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggleIndex(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 relative" id="faq">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column — Sticky Editorial Support Block */}
          <div className="lg:col-span-5">
            <ScrollReveal>
              <div className="lg:sticky lg:top-28 space-y-6">
                <div>
                  <div className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                    <PokeballLottie size={16} />
                    <span>[ 05 // SUPPORT & FAQ ]</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#ece7e0] font-display tracking-tight">
                    Frequently<br />
                    <span className="text-glow">Asked Questions.</span>
                  </h2>
                </div>

                <p className="text-[#bfb8ae] text-sm font-mono leading-relaxed">
                  Have questions about digital key delivery, hardware device slots, PGSharp activation, or payment methods? Find quick answers here or contact us directly.
                </p>

                {/* Support CTAs */}
                <div className="space-y-3 pt-2">
                  <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-surface-900 border border-surface-700 hover:border-cyan-500/60 transition-all group shadow-depth"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/40 flex items-center justify-center text-[#7289da] flex-shrink-0 group-hover:scale-110 transition-transform">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold font-display text-[#ece7e0] group-hover:text-cyan-400 transition-colors">Discord Server</p>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">24/7 Trainer Community & Support</p>
                    </div>
                  </a>

                  <a
                    href={REDDIT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-surface-900 border border-surface-700 hover:border-cyan-500/60 transition-all group shadow-depth"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FF4500]/15 border border-[#FF4500]/30 flex items-center justify-center text-[#ff6a33] flex-shrink-0 group-hover:scale-110 transition-transform">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.26c.04.236.06.48.06.727 0 3.736-4.347 6.765-9.707 6.765-5.36 0-9.707-3.03-9.707-6.765 0-.247.02-.49.06-.727a1.774 1.774 0 0 1-.06-.439c0-.979.794-1.774 1.774-1.774.478 0 .913.19 1.232.5 1.522-1.1 3.63-1.809 5.97-1.898l1.003-4.71a.29.29 0 0 1 .345-.228l3.33.706a1.266 1.266 0 0 1 2.392.577 1.265 1.265 0 0 1-2.362.544l-2.968-.63-.893 4.192c2.314.098 4.395.807 5.9 1.9a1.77 1.77 0 0 1 1.233-.502c.98 0 1.774.795 1.774 1.774 0 .156-.02.308-.058.44zM8.08 13.226c-.697 0-1.263.567-1.263 1.264 0 .697.566 1.263 1.263 1.263.698 0 1.264-.566 1.264-1.264 0-.697-.566-1.264-1.264-1.264zm7.84 0c-.698 0-1.264.567-1.264 1.264 0 .697.566 1.263 1.264 1.263.697 0 1.263-.566 1.263-1.263 0-.697-.566-1.264-1.264-1.264zm-7.55 4.63a.29.29 0 0 1 .41-.008c.826.806 2.07 1.233 3.6 1.233h.04c1.53 0 2.773-.427 3.6-1.233a.29.29 0 1 1 .402.418c-.96.936-2.37 1.41-4.002 1.41h-.04c-1.632 0-3.042-.474-4.002-1.41a.29.29 0 0 1-.008-.41z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-display text-[#ece7e0] group-hover:text-cyan-400 transition-colors">Reddit Forum</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">Discussions, Tips & Coordinates</p>
                    </div>
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column — Large Editorial Accordion */}
          <div className="lg:col-span-7">
            <div className="divide-y-0 bg-surface-900/60 p-6 sm:p-8 rounded-3xl border border-surface-700/60 shadow-depth">
              {FAQS.map((faq, index) => (
                <AccordionItem
                  key={index}
                  faq={faq}
                  isOpen={openIndex === index}
                  onToggle={() => toggleIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
