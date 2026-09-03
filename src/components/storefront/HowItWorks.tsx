'use client';

import { useRef, useState, useEffect } from 'react';
import { Smartphone, CreditCard, Key, Zap } from 'lucide-react';
import { ScrollReveal } from '@/components/fx/UIComponents';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';

const STEPS = [
  {
    num: '01',
    title: 'Choose Plan',
    desc: 'Select 1 or 2-device 30-day license tier tailored for Android.',
    icon: Smartphone,
    color: '#06b6d4',
  },
  {
    num: '02',
    title: 'Direct Checkout',
    desc: 'Zero-fee checkout via UPI (GPay, PhonePe, Paytm) or PayPal USD.',
    icon: CreditCard,
    color: '#38bdf8',
  },
  {
    num: '03',
    title: 'Digital Key Delivery',
    desc: 'Key revealed directly on your screen & dispatched to your email upon payment verification.',
    icon: Key,
    color: '#10b981',
  },
  {
    num: '04',
    title: 'Activate & Play',
    desc: 'Paste the key into PGSharp settings to unlock the joystick & teleport.',
    icon: Zap,
    color: '#06b6d4',
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          STEPS.forEach((_, i) => {
            setTimeout(() => setActiveStep(i), 200 + i * 350);
          });
          obs.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 px-5 sm:px-8 relative" id="journey">
      <div className="max-w-6xl mx-auto">
        {/* Editorial Section Header */}
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <div className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                <PokeballLottie size={16} />
                <span>[ 02 // ACTIVATION JOURNEY ]</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#ece7e0] font-display tracking-tight">
                Key in hand,<br />
                <span className="text-glow">under 60 seconds.</span>
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-sm font-mono leading-relaxed">
              Fully automated end-to-end processing. Zero human delays, available 24/7.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Structured Editorial Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i <= activeStep;

            return (
              <div
                key={step.num}
                className={`flex flex-col justify-between p-6 sm:p-7 rounded-2xl border transition-all duration-500 product-lift ${
                  isActive
                    ? 'bg-[#0c1424]/90 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
                    : 'bg-[#090e1a]/40 border-[#16243d] opacity-60'
                }`}
              >
                <div>
                  {/* Top Row: Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`text-2xl font-black font-display transition-colors duration-500 ${
                        isActive ? 'text-cyan-400' : 'text-slate-600'
                      }`}
                    >
                      {step.num}
                    </span>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500"
                      style={{
                        backgroundColor: isActive ? `${step.color}15` : 'rgba(12, 20, 36, 0.5)',
                        borderColor: isActive ? `${step.color}50` : 'rgba(22, 36, 61, 0.6)',
                      }}
                    >
                      <Icon
                        size={20}
                        style={{ color: isActive ? step.color : '#666' }}
                        className="transition-colors duration-500"
                      />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`text-lg font-bold font-display transition-colors duration-500 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-xs mt-2.5 font-mono leading-relaxed transition-colors duration-500 ${
                      isActive ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>

                {/* Bottom Step Indicator Bar */}
                <div className="mt-6 pt-4 border-t border-[#16243d] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                    STEP {step.num} // 04
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                      isActive ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-slate-700'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
