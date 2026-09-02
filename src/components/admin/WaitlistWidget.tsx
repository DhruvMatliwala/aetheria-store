'use client';

import { Users, Bell, Mail, Clock } from 'lucide-react';
import { RestockStats } from '@/lib/firestore/restock';

interface WaitlistWidgetProps {
  waitlistStats?: RestockStats;
}

export function WaitlistWidget({ waitlistStats }: WaitlistWidgetProps) {
  const count1 = waitlistStats?.counts?.['1_month_1_device'] ?? 0;
  const count2 = waitlistStats?.counts?.['1_month_2_device'] ?? 0;
  const totalWaitlist = waitlistStats?.totalRequests ?? count1 + count2;

  const recentList = waitlistStats?.recentRequests ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Customer Demand & Waitlist</span>
              {totalWaitlist > 0 && (
                <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {totalWaitlist} Waiting
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Customers who requested email notification when out-of-stock keys are refilled
            </p>
          </div>
        </div>
      </div>

      {/* Demand Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Waiting */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Waiting Customers
            </span>
            <Users size={15} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalWaitlist}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pending restock notifications</p>
        </div>

        {/* 1-Device Waitlist */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
              1 Device Requests
            </span>
            <Bell size={15} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-cyan-300">{count1}</p>
          <p className="text-[11px] text-slate-400 mt-1">Trainers requesting Standard Tier</p>
        </div>

        {/* 2-Device Waitlist */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider font-mono">
              2 Devices Requests
            </span>
            <Bell size={15} className="text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-300">{count2}</p>
          <p className="text-[11px] text-slate-400 mt-1">Trainers requesting Duo Tier</p>
        </div>
      </div>

      {/* Recent Waitlist Requests Table */}
      <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Mail size={16} className="text-cyan-400" />
          <span>Recent Restock Alert Requests</span>
        </h3>

        {recentList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs bg-[#080e1a] rounded-xl border border-slate-800/60">
            <Users size={32} className="mx-auto mb-2 opacity-30 text-cyan-400" />
            <p className="text-slate-400 font-semibold">No waitlist subscribers yet.</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              When a plan is sold out, visitors can enter their email on the storefront to be notified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#16243d] bg-[#080e1a] text-[10px] font-mono text-slate-400 uppercase">
                  <th className="px-4 py-2.5 font-semibold">Email</th>
                  <th className="px-4 py-2.5 font-semibold">Requested Plan</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Requested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#16243d]/60 text-[11px]">
                {recentList.map((req, idx) => (
                  <tr key={req.id || idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-cyan-300 font-medium">
                      {req.email}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {req.plan_id.includes('2_device') ? '2 Android Devices' : '1 Android Device'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500 text-[10px]">
                      {new Date(req.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
