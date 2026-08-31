'use client';

import React from 'react';
import { Shield, Zap, Smartphone, Clock, Globe, HeadphonesIcon, Sparkles } from 'lucide-react';
import { SpotlightCard } from '@/components/interactive/SpotlightCard';
import { ScrollReveal } from '@/components/interactive/ScrollReveal';

const FEATURES = [
  {
    icon: Zap,
    title: 'Automated Instant Delivery',
    description: 'Zero human delay. The moment your payment clears on UPI or PayPal, your license key is revealed on screen and sent to your email.',
    color: '#8b5cf6',
  },
  {
    icon: Shield,
    title: 'Encrypted Vault Storage',
    description: 'Keys are secured at rest with authenticated encryption. Each customer receives dedicated, untouched slot allocation.',
    color: '#ffbc09',
  },
  {
    icon: Smartphone,
    title: '1 & 2 Device Hardware Slots',
    description: 'Choose 1 device or 2 devices 30-day tiers. Easily switch between phones or tablets without messy re-authentication.',
    color: '#10b981',
  },
  {
    icon: Globe,
    title: 'Domestic & Global Payments',
    description: 'Pay with zero extra charges using Indian UPI (GPay, PhonePe, Paytm, CRED) or International PayPal worldwide.',
    color: '#f59e0b',
  },
  {
    icon: Clock,
    title: '24/7 Automated Infrastructure',
    description: 'Order at 3 AM or mid-event. Our automated backend processes orders, decrypts keys, and dispatches receipts continuously.',
    color: '#ec4899',
  },
  {
    icon: HeadphonesIcon,
    title: 'Direct Community Support',
    description: 'Have a question? Reach out directly to our team and fellow trainers on our official Discord server and Reddit community.',
    color: '#3b82f6',
  },
];

export function FeatureList() {
  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden" id="features">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/40 text-brand-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} className="text-brand-400" />
            <span>The PGSharp Keys Difference</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Built for Serious Trainers
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-2.5">
            Reliable, safe, and lightning-fast key distribution trusted by thousands.
          </p>
        </div>

        {/* Features 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            return (
              <ScrollReveal key={f.title} delay={idx * 80} direction="up">
                <SpotlightCard
                  spotlightColor={`${f.color}20`}
                  className="h-full p-7 bg-surface-850/80 border border-surface-700/80 hover:border-brand-500/40 transition-all duration-300 shadow-glow-card group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 shadow-sm"
                    style={{ backgroundColor: `${f.color}15`, border: `1px solid ${f.color}50` }}
                  >
                    <Icon size={22} style={{ color: f.color }} />
                  </div>

                  <h3 className="text-lg font-black text-white mb-2 font-heading group-hover:text-brand-300 transition-colors">
                    {f.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {f.description}
                  </p>
                </SpotlightCard>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
