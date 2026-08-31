'use client';

import React, { useState, useEffect } from 'react';
import { Check, Zap, Bell, CheckCircle, Sparkles } from 'lucide-react';
import { Plan } from '@/types/plan';
import { triggerParticleBurst } from '@/components/interactive/ParticleBurst';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: Plan;
  stockCount: number;
  onBuyClick: (plan: Plan) => void;
  onNotifyClick: (plan: Plan) => void;
  waitlisted?: boolean;
}

const LOW_STOCK_LIMIT = 5;

export function PlanCard({
  plan,
  stockCount,
  onBuyClick,
  onNotifyClick,
  waitlisted = false,
}: PlanCardProps) {
  const isPopular = plan.badge === 'Most Popular';
  const isOutOfStock = stockCount === 0;
  const isLowStock = stockCount > 0 && stockCount <= LOW_STOCK_LIMIT;

  const [isWaitlistedState, setIsWaitlistedState] = useState(waitlisted);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`restock_requested_${plan.id}`) === 'true';
      if (stored) {
        setIsWaitlistedState(true);
      }
    }
  }, [plan.id, waitlisted]);

  function handleBuy(e: React.MouseEvent) {
    triggerParticleBurst(e, 28);
    onBuyClick(plan);
  }

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 product-lift border group',
        isPopular
          ? 'bg-gradient-to-b from-surface-800 to-surface-900 border-[#ffbc09]/80 shadow-glow-sm'
          : 'bg-surface-850 border-surface-700 hover:border-surface-600'
      )}
    >
      {/* Popular Saffron Gold highlight bar */}
      {isPopular && (
        <div className="h-1.5 bg-gradient-to-r from-[#d97706] via-[#ffbc09] to-[#ffd053]" />
      )}

      <div className="p-6 sm:p-7 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            {/* Plan name */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-[#ece7e0] font-display tracking-tight">
                {plan.name}
              </h3>
              {plan.discount_badge && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  🔥 {plan.discount_badge}
                </span>
              )}
              {isPopular && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#ffbc09]/15 text-[#ffbc09] border border-[#ffbc09]/40 flex items-center gap-1">
                  <Sparkles size={10} className="text-[#ffbc09] animate-spin" />
                  Popular
                </span>
              )}
            </div>

            {/* Meta */}
            <p className="text-xs text-[#bfb8ae] mt-1 font-mono uppercase tracking-wider">
              {plan.duration} · {plan.device_slots} DEVICE SLOT{plan.device_slots > 1 ? 'S' : ''}
            </p>
          </div>

          {/* Animated Pokéball icon */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110',
            isPopular
              ? 'bg-[#ffbc09]/15 border-[#ffbc09]/40 shadow-glow-sm'
              : 'bg-surface-800 border-surface-700'
          )}>
            <PokeballLottie size={36} />
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            {plan.original_price_inr && (
              <span className="text-xl sm:text-2xl font-mono text-rose-400/70 line-through decoration-rose-500/90">
                ₹{(plan.original_price_inr / 100).toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-4xl sm:text-5xl font-black text-[#ece7e0] font-display tracking-tight">
              ₹{(plan.price_inr / 100).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs font-mono text-[#bfb8ae] mt-1 flex items-center gap-1">
            {plan.original_price_usd && (
              <span className="line-through text-rose-400/60 mr-1">
                ${(plan.original_price_usd / 100).toFixed(2)}
              </span>
            )}
            <span>${(plan.price_usd / 100).toFixed(2)} USD via PayPal</span>
          </p>
        </div>

        {/* Stock status */}
        <div className="mb-5">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-xs font-mono text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">Sold Out — Restocking Soon</span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">Only {stockCount} left</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-[#ffbc09]">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-glow-breathe" />
              <span className="font-semibold uppercase tracking-wider">{stockCount} slots available</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-surface-700 my-1" />

        {/* Features list */}
        <ul className="flex-1 space-y-2.5 py-4">
          {plan.features.slice(0, 5).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#ece7e0]">
              <Check size={14} strokeWidth={3} className="text-[#ffbc09] flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action Button in Saffron Gold */}
        {isOutOfStock ? (
          isWaitlistedState ? (
            <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-300 font-bold text-xs font-mono uppercase tracking-wider">
              <CheckCircle size={16} />
              <span>You&apos;re on the waitlist</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNotifyClick(plan)}
              id={`notify-${plan.id}`}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-surface-800 hover:bg-surface-750 border border-amber-600/40 text-amber-300 hover:text-amber-200 font-bold text-xs font-mono uppercase tracking-wider transition-all btn-press"
            >
              <Bell size={15} />
              <span>Notify Me When in Stock</span>
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={handleBuy}
            id={`buy-${plan.id}`}
            className={cn(
              'flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-xs font-mono uppercase tracking-wider transition-all btn-press',
              isPopular
                ? 'bg-[#ffbc09] hover:bg-[#ffd053] text-[#080403] shadow-glow-gold'
                : 'bg-surface-750 hover:bg-surface-700 border border-surface-600 text-[#ece7e0]'
            )}
          >
            <Zap size={14} className={isPopular ? 'fill-[#080403]' : ''} />
            <span>Buy License Key</span>
          </button>
        )}
      </div>
    </div>
  );
}
