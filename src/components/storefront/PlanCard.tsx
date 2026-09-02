'use client';

import { Plan } from '@/types/plan';
import { Check, Zap, Sparkles, Bell, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PokeballLottie } from '@/components/lottie/LottiePokemon';

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
  onNotifyClick: (plan: Plan) => void;
  stockCount?: number;
  isPopular?: boolean;
  isWaitlistedState?: boolean;
}

export function PlanCard({
  plan,
  onSelect,
  onNotifyClick,
  stockCount = 0,
  isPopular = false,
  isWaitlistedState = false,
}: PlanCardProps) {
  const isOutOfStock = stockCount === 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;

  function handleBuy() {
    if (isOutOfStock) {
      onNotifyClick(plan);
      return;
    }
    onSelect(plan);
  }

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 product-lift border group',
        isPopular
          ? 'bg-gradient-to-b from-[#0c1424] to-[#070b13] border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
          : 'bg-[#090e1a] border-[#16243d] hover:border-cyan-500/40'
      )}
    >
      {/* Popular Cyan Gradient Highlight Bar */}
      {isPopular && (
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />
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
              {plan.discount_badge ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  🔥 {plan.discount_badge}
                </span>
              ) : isPopular ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                  <Sparkles size={10} className="text-cyan-400 animate-spin" />
                  Popular
                </span>
              ) : null}
            </div>

            {/* Meta */}
            <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
              {plan.duration} · {plan.device_slots} DEVICE SLOT{plan.device_slots > 1 ? 'S' : ''}
            </p>
          </div>

          {/* Animated Pokéball icon */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110',
            isPopular
              ? 'bg-cyan-950/60 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-[#0c1424] border-[#16243d]'
          )}>
            <PokeballLottie size={36} />
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white font-display tracking-tight">
              ₹{(plan.price_inr / 100).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            ${(plan.price_usd / 100).toFixed(2)} USD via PayPal
          </p>
        </div>

        {/* Stock status */}
        <div className="mb-5">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-xs font-mono text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">Sold Out — Restocking Soon</span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">Only {stockCount} left</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">{stockCount} slots available</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#16243d] my-1" />

        {/* Features list */}
        <ul className="flex-1 space-y-2.5 py-4">
          {plan.features.slice(0, 5).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
              <Check size={14} strokeWidth={3} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action Button */}
        {isOutOfStock ? (
          isWaitlistedState ? (
            <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-xs font-mono uppercase tracking-wider">
              <CheckCircle size={16} />
              <span>You&apos;re on the waitlist</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNotifyClick(plan)}
              id={`notify-${plan.id}`}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#0c1424] hover:bg-[#142038] border border-cyan-600/40 text-cyan-300 hover:text-cyan-200 font-bold text-xs font-mono uppercase tracking-wider transition-all btn-press"
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
              'flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-xs font-mono uppercase tracking-wider transition-all btn-press cursor-pointer',
              isPopular
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-[#101b30] hover:bg-[#16243d] border border-[#1b2b48] text-white hover:border-cyan-500/50'
            )}
          >
            <Zap size={14} className={isPopular ? 'fill-slate-950' : 'text-cyan-400'} />
            <span>Buy License Key</span>
          </button>
        )}
      </div>
    </div>
  );
}
