'use client';

import { Package, Smartphone, Key, Shield, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { PLANS } from '@/lib/constants';
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
  const activeKeys = inventoryStats?.activeKeys ?? 0;
  const totalUsableSlots = inventoryStats?.totalUsableSlots ?? 0;
  const totalKeys = inventoryStats?.totalKeys ?? 0;
  const fullyAllocated = inventoryStats?.fullyAllocatedKeys ?? 0;

  const count1 =
    stockCounts['1_month_1_device']?.available ??
    stockCounts['1_month']?.available ??
    inventoryStats?.tierStock?.['1_month_1_device'] ??
    0;
  const sold1 =
    stockCounts['1_month_1_device']?.sold ??
    stockCounts['1_month']?.sold ??
    revenueStats?.tierSales?.['1_month_1_device'] ??
    0;

  const count2 =
    stockCounts['1_month_2_device']?.available ??
    stockCounts['3_month']?.available ??
    inventoryStats?.tierStock?.['1_month_2_device'] ??
    0;
  const sold2 =
    stockCounts['1_month_2_device']?.sold ??
    stockCounts['3_month']?.sold ??
    revenueStats?.tierSales?.['1_month_2_device'] ??
    0;

  const revenueINR = revenueStats?.totalRevenueINR ?? 0;
  const revenueUSD = revenueStats?.totalRevenueUSD ?? 0;
  const paidOrdersCount = revenueStats?.paidOrdersCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>Inventory & Stock Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time key availability, device capacity, and automated order fulfillment stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold">
            {activeKeys} Active Keys in Vault
          </span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Keys */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
              Available Keys
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Key size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{activeKeys}</p>
          <p className="text-[11px] text-slate-400 mt-1">Ready for instant automated delivery</p>
        </div>

        {/* Device Slot Capacity */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
              Usable Device Slots
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Smartphone size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalUsableSlots}</p>
          <p className="text-[11px] text-slate-400 mt-1">Simultaneous trainer device access</p>
        </div>

        {/* Fulfilled Orders */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider font-mono">
              Delivered Keys
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{fullyAllocated}</p>
          <p className="text-[11px] text-slate-400 mt-1">Successfully claimed by customers</p>
        </div>

        {/* Total Key Database */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Vault Total
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-300">
              <Shield size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalKeys}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total lifetime uploaded keys</p>
        </div>
      </div>

      {/* Real Plan Stock Breakdown */}
      <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-6 shadow-card">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Smartphone size={18} className="text-cyan-400" />
          <span>Device Edition Stock & Fulfillment</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Live inventory counts for both customer editions available on your store
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Standard Plan: 1 Device */}
          <div className="bg-[#080e1a] border border-[#152138] hover:border-cyan-500/40 rounded-2xl p-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  Standard Tier
                </span>
                <h4 className="text-base font-bold text-white mt-1.5">1 Android Device Key</h4>
                <p className="text-xs text-slate-400">1 Device Slot per order • ₹180 / $1.99</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-cyan-300 font-mono">{count1}</span>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Available</p>
              </div>
            </div>

            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden my-3">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${count1 > 0 ? 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span>Lifetime Sold: {sold1} orders</span>
              <span className={count1 > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {count1 > 0 ? '● In Stock' : '○ Out of Stock'}
              </span>
            </div>
          </div>

          {/* Dual Plan: 2 Devices */}
          <div className="bg-[#080e1a] border border-[#152138] hover:border-purple-500/40 rounded-2xl p-5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                  Duo Tier
                </span>
                <h4 className="text-base font-bold text-white mt-1.5">2 Android Devices Key</h4>
                <p className="text-xs text-slate-400">2 Device Slots per order • ₹350 / $3.50</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-purple-300 font-mono">{count2}</span>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Available</p>
              </div>
            </div>

            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden my-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${count2 > 0 ? 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span>Lifetime Sold: {sold2} orders</span>
              <span className={count2 > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {count2 > 0 ? '● In Stock' : '○ Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Verified Payments */}
      <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Actual Revenue ({paidOrdersCount} Paid Order{paidOrdersCount !== 1 ? 's' : ''})
            </p>
            <div className="flex flex-wrap items-baseline gap-4 mt-2">
              {revenueINR > 0 && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-cyan-300">
                    ₹{(revenueINR / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-cyan-400 uppercase font-mono">INR (UPI)</span>
                </div>
              )}
              {revenueUSD > 0 && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-emerald-400">
                    ${(revenueUSD / 100).toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 uppercase font-mono">USD (PayPal)</span>
                </div>
              )}
              {revenueUSD === 0 && revenueINR === 0 && (
                <span className="text-2xl font-black text-slate-500">₹0 / $0.00</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Real-time settlement from verified UPI direct transfers and PayPal checkout.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
