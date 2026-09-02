'use client';

import { Shield, Zap, Wallet, MessageCircle } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Zap, label: 'Instant Delivery', detail: '< 10s Automated' },
  { icon: Shield, label: 'Encrypted Vault Storage', detail: 'Protected Slots' },
  { icon: Wallet, label: 'UPI & PayPal', detail: 'Zero Extra Fees' },
  { icon: MessageCircle, label: '24/7 Support', detail: 'Discord & Reddit' },
];

export function TrustStrip() {
  return (
    <section className="py-8 px-5 sm:px-8 border-y border-surface-700/80 bg-surface-900/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {TRUST_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl bg-surface-950/60 border border-surface-700/60 hover:border-cyan-500/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ece7e0] font-mono truncate">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-[#bfb8ae] font-mono mt-0.5">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
