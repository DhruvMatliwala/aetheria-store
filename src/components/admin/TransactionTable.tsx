'use client';

import { Receipt, CheckCircle, Clock, XCircle } from 'lucide-react';
import { OrderPublic, PaymentStatus } from '@/types/order';
import { PLAN_MAP } from '@/lib/constants';

interface TransactionTableProps {
  orders: OrderPublic[];
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === 'paid' || status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono">
        <CheckCircle size={10} />
        <span>Paid</span>
      </span>
    );
  }
  if (status === 'verifying' || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-mono">
        <Clock size={10} />
        <span>Pending</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/60 font-mono">
      <XCircle size={10} />
      <span>Failed</span>
    </span>
  );
}

export function TransactionTable({ orders }: TransactionTableProps) {
  return (
    <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#16243d]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Receipt size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Order Transactions</h3>
            <p className="text-[11px] text-slate-400">Lifetime customer purchase history</p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 font-semibold bg-[#080e1a] border border-[#16243d] px-2.5 py-1 rounded-lg">
          {orders.length} Order{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <Receipt size={36} className="mx-auto mb-2 opacity-30 text-cyan-400" />
          <p className="font-semibold text-slate-400">No orders recorded yet.</p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Incoming customer transactions will populate here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#16243d] bg-[#080e1a] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Customer Email</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment Status</th>
                <th className="px-6 py-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16243d]/60 text-[11px]">
              {orders.map((order) => {
                const plan = PLAN_MAP[order.plan_type];
                const amountDisplay =
                  order.currency === 'INR'
                    ? `₹${(order.amount / 100).toLocaleString('en-IN')}`
                    : `$${(order.amount / 100).toFixed(2)}`;

                return (
                  <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold text-cyan-400">
                      {order.order_id}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {order.customer_email || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {plan ? plan.name : order.plan_type === '1_month' ? '1 Device' : '2 Devices'}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      {amountDisplay}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-400 text-[10px]">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
