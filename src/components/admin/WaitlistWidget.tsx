'use client';

import { Flame, Bell, Mail, Clock, Shield, Sparkles } from 'lucide-react';
import { RestockStats } from '@/lib/firestore/restock';
import { Badge } from '@/components/ui/Badge';

interface WaitlistWidgetProps {
  waitlistStats?: RestockStats;
}

export function WaitlistWidget({ waitlistStats }: WaitlistWidgetProps) {
  const count1 = waitlistStats?.counts?.['1_month_1_device'] ?? 0;
  const count2 = waitlistStats?.counts?.['1_month_2_device'] ?? 0;
  const totalWaitlist = waitlistStats?.totalRequests ?? count1 + count2;

  // Calculate Patreon keys needed to satisfy waitlist demand
  // 1-Device needs 1 slot each, 2-Device needs 2 slots each. Total slots / 2 = Patreon keys
  const totalSlotsNeeded = count1 * 1 + count2 * 2;
  const patreonKeysNeeded = Math.ceil(totalSlotsNeeded / 2);

  const recentList = waitlistStats?.recentRequests ?? [];

  return (
    <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-700/50 flex items-center justify-center text-orange-400">
            <Flame size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>🔥 Real-Time Customer Demand & Waitlist</span>
              {totalWaitlist > 0 && (
                <span className="text-xs bg-orange-950 text-orange-300 border border-orange-700/60 px-2 py-0.5 rounded-full font-bold">
                  {totalWaitlist} Waiting
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">
              Customers waiting for out-of-stock keys. Sourcing intelligence for Patreon bulk purchases.
            </p>
          </div>
        </div>
      </div>

      {/* Demand Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1-Device Waitlist */}
        <div className="bg-surface-900 border border-surface-700/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">1 Device Waitlist</span>
            <Bell size={14} className="text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">{count1}</p>
          <p className="text-[11px] text-gray-400 mt-1">Requires {count1} device slots</p>
        </div>

        {/* 2-Device Waitlist */}
        <div className="bg-surface-900 border border-surface-700/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">2 Devices Waitlist</span>
            <Bell size={14} className="text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">{count2}</p>
          <p className="text-[11px] text-gray-400 mt-1">Requires {count2 * 2} device slots</p>
        </div>

        {/* Recommended Patreon Keys to Purchase */}
        <div className="bg-gradient-to-br from-orange-950/40 via-surface-900 to-surface-900 border border-orange-700/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">Recommended Restock</span>
            <Sparkles size={14} className="text-orange-400" />
          </div>
          <p className="text-2xl font-black text-orange-300">
            {patreonKeysNeeded} <span className="text-sm font-semibold text-gray-400">Patreon Keys</span>
          </p>
          <p className="text-[11px] text-orange-400/80 mt-1">
            Fulfills all {totalSlotsNeeded} waiting device slots
          </p>
        </div>
      </div>

      {/* Recent Waitlist Signups Table */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Recent Waitlist Submissions
        </h3>

        {recentList.length === 0 ? (
          <div className="p-6 bg-surface-900/60 border border-surface-700/60 rounded-xl text-center">
            <p className="text-xs text-gray-400">
              No pending customer restock requests. All demand is currently fulfilled or stock is active.
            </p>
          </div>
        ) : (
          <div className="bg-surface-900 border border-surface-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-800 text-gray-400 border-b border-surface-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Customer Email</th>
                    <th className="py-2.5 px-4">Requested Plan</th>
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800 text-gray-300">
                  {recentList.map((req) => (
                    <tr key={req.id} className="hover:bg-surface-800/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-white flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-500" />
                        <span>{req.email}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-brand-300">
                          {req.plan_id === '1_month_2_device' ? '2 Devices (30 Days)' : '1 Device (30 Days)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-400 flex items-center gap-1">
                        <Clock size={11} className="text-gray-500" />
                        <span>{req.created_at}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60 font-semibold text-[10px]">
                          Pending Restock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
