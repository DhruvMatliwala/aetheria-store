'use client';

import { AlertTriangle, Package, TrendingUp, Smartphone, Key, Shield, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PLANS, LOW_STOCK_THRESHOLD } from '@/lib/constants';
import { InventoryStatsSummary } from '@/lib/firestore/keys';

interface StockData {
  available: number;
  sold: number;
  total: number;
}

interface RevenueStats {
  totalRevenueINR: number;
  totalRevenueUSD: number;
  paidOrdersCount: number;
  tierSales: Record<string, number>;
}

interface StockDashboardProps {
  stockCounts?: Record<string, StockData>;
  inventoryStats?: InventoryStatsSummary;
  revenueStats?: RevenueStats;
}

export function StockDashboard({ stockCounts = {}, inventoryStats, revenueStats }: StockDashboardProps) {
  const usableSlots = inventoryStats?.totalUsableSlots ?? 0;
  const activeKeys = inventoryStats?.activeKeys ?? 0;
  const fullyAllocated = inventoryStats?.fullyAllocatedKeys ?? 0;
  const partiallyFilled = inventoryStats?.partiallyFilledKeys ?? 0;
  const untouchedKeys = inventoryStats?.untouchedKeys ?? 0;

  const isLowStock = usableSlots <= LOW_STOCK_THRESHOLD * 2;

  const revenueINR = revenueStats?.totalRevenueINR ?? 0;
  const revenueUSD = revenueStats?.totalRevenueUSD ?? 0;
  const paidOrdersCount = revenueStats?.paidOrdersCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Low stock alert */}
      {isLowStock && (
        <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-700/50 rounded-2xl p-4 text-amber-300">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <div>
            <p className="font-semibold">Low Slot Inventory Warning</p>
            <p className="text-sm text-amber-400/80">
              Only {usableSlots} usable device slot(s) remaining across active Patreon keys. Please bulk-upload more Patreon keys.
            </p>
          </div>
        </div>
      )}

      {/* Primary Multi-Slot Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usable Slots */}
        <div className="bg-surface-800 border border-brand-500/40 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">Usable Slots</span>
            <div className="w-8 h-8 rounded-lg bg-brand-900/60 flex items-center justify-center text-brand-400">
              <Smartphone size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{usableSlots}</p>
          <p className="text-[11px] text-gray-400 mt-1">Total simultaneous device capacity</p>
        </div>

        {/* Active Keys */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Keys</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center text-emerald-400">
              <Key size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{activeKeys}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {untouchedKeys} untouched · {partiallyFilled} partial
          </p>
        </div>

        {/* Partially Filled */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Partially Used</span>
            <div className="w-8 h-8 rounded-lg bg-amber-900/40 flex items-center justify-center text-amber-400">
              <RefreshCw size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{partiallyFilled}</p>
          <p className="text-[11px] text-gray-400 mt-1">Packed first for 1-slot orders</p>
        </div>

        {/* Fully Allocated Keys */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Keys</span>
            <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-gray-300">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{fullyAllocated}</p>
          <p className="text-[11px] text-gray-400 mt-1">100% device capacity claimed</p>
        </div>
      </div>

      {/* Real Multi-Currency Revenue Summary */}
      <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Total Actual Revenue ({paidOrdersCount} Paid Order{paidOrdersCount !== 1 ? 's' : ''})
            </p>
            <div className="flex flex-wrap items-baseline gap-4 mt-2">
              {revenueUSD > 0 && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-emerald-400">
                    ${revenueUSD.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-emerald-500/80 uppercase">USD</span>
                </div>
              )}
              {revenueINR > 0 && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-brand-300">
                    ₹{revenueINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-brand-400/80 uppercase">INR</span>
                </div>
              )}
              {revenueUSD === 0 && revenueINR === 0 && (
                <span className="text-3xl font-black text-gray-500">
                  $0.00 / ₹0
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Calculated in real-time from verified completed transactions on Razorpay (UPI) and PayPal (USD).
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Plan Fulfillment Capacity Cards (2 Tiers: 1 Device & 2 Devices) */}
      <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 shadow-card">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Package size={18} className="text-brand-400" />
          <span>Real-Time Customer Tier Fulfillment Capacity</span>
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          Calculated dynamically based on available slot packing algorithms across active Patreon keys.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const availableCapacity = inventoryStats?.tierStock[plan.id as keyof typeof inventoryStats.tierStock] ?? 0;
            const isZero = availableCapacity === 0;

            return (
              <div
                key={plan.id}
                className="bg-surface-900 border border-surface-700/80 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                    <p className="text-[11px] text-gray-400">{plan.device_slots} Device Slot{plan.device_slots > 1 ? 's' : ''} / order</p>
                  </div>
                  {plan.badge && (
                    <Badge variant="brand" className="text-[10px]">
                      {plan.badge}
                    </Badge>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-gray-400">Can fulfill:</span>
                  <span className={`text-xl font-extrabold ${isZero ? 'text-red-400' : 'text-emerald-400'}`}>
                    {availableCapacity} order{availableCapacity !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patreon Inventory Breakdown Card */}
      {inventoryStats && (
        <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield size={18} className="text-brand-400" />
              <span>Patreon Key Inventory Breakdown</span>
            </h3>
            <span className="text-xs text-brand-300 font-semibold bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-800">
              {inventoryStats.patreonKeys.total} Total Keys Uploaded
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-3.5">
              <span className="text-[11px] text-gray-400 block mb-1">Available Keys</span>
              <span className="text-xl font-bold text-emerald-400">{inventoryStats.patreonKeys.available}</span>
            </div>
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-3.5">
              <span className="text-[11px] text-gray-400 block mb-1">Remaining Usable Slots</span>
              <span className="text-xl font-bold text-white">{inventoryStats.patreonKeys.remainingSlots}</span>
            </div>
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-3.5">
              <span className="text-[11px] text-gray-400 block mb-1">Claimed Device Slots</span>
              <span className="text-xl font-bold text-gray-300">{inventoryStats.patreonKeys.usedSlots}</span>
            </div>
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-3.5">
              <span className="text-[11px] text-gray-400 block mb-1">Fully Depleted Keys</span>
              <span className="text-xl font-bold text-gray-400">{inventoryStats.patreonKeys.full}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
