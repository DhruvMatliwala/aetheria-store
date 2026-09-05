'use client';

import { useState, useMemo } from 'react';
import {
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Key,
  Mail,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { OrderPublic, PaymentStatus } from '@/types/order';
import { PLAN_MAP } from '@/lib/constants';
import toast from 'react-hot-toast';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      return (
        order.order_id?.toLowerCase().includes(q) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(q)) ||
        (order.delivered_key && order.delivered_key.toLowerCase().includes(q)) ||
        (order.patreon_email && order.patreon_email.toLowerCase().includes(q)) ||
        (order.utr_number && order.utr_number.toLowerCase().includes(q)) ||
        (order.paypal_tx_id && order.paypal_tx_id.toLowerCase().includes(q))
      );
    });
  }, [orders, searchQuery]);

  async function copyToClipboard(text: string, label: string, identifier: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(identifier);
      toast.success(`Copied ${label} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  }

  return (
    <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl overflow-hidden shadow-card">
      {/* Header with Search and Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-[#16243d]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Receipt size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Order Transactions & Key Vault</h3>
            <p className="text-[11px] text-slate-400">
              Customer purchase history with linked Patreon accounts for instant device clearing
            </p>
          </div>
        </div>

        {/* Search Bar & Order Counter */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Key, Patreon Email, Customer..."
              className="w-full bg-[#080e1a] border border-[#1b2b48] rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <span className="shrink-0 text-xs font-mono text-slate-400 font-semibold bg-[#080e1a] border border-[#16243d] px-2.5 py-2 rounded-xl">
            {filteredOrders.length} / {orders.length}
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <Receipt size={36} className="mx-auto mb-2 opacity-30 text-cyan-400" />
          <p className="font-semibold text-slate-400">No orders recorded yet.</p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Incoming customer transactions will populate here automatically.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <Search size={32} className="mx-auto mb-2 opacity-30 text-cyan-400" />
          <p className="font-semibold text-slate-400">No transactions match &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-cyan-400 text-xs font-mono underline hover:text-cyan-300"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#16243d] bg-[#080e1a] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Customer Email</th>
                <th className="px-4 py-3 font-semibold">Delivered Key</th>
                <th className="px-4 py-3 font-semibold">Patreon Source Account</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Amount & Status</th>
                <th className="px-5 py-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16243d]/60 text-[11px]">
              {filteredOrders.map((order) => {
                const plan = PLAN_MAP[order.plan_type];
                const amountDisplay =
                  order.currency === 'INR'
                    ? `₹${(order.amount / 100).toLocaleString('en-IN')}`
                    : `$${(order.amount / 100).toFixed(2)}`;

                const keyId = `key_${order.order_id}`;
                const emailId = `patreon_${order.order_id}`;

                return (
                  <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Order ID */}
                    <td className="px-5 py-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{order.order_id}</span>
                      </div>
                    </td>

                    {/* Customer Email */}
                    <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                      {order.customer_email || 'Anonymous'}
                    </td>

                    {/* Delivered License Key */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.delivered_key ? (
                        <div className="inline-flex items-center gap-1.5 bg-[#080e1a] border border-cyan-900/40 px-2 py-1 rounded-lg">
                          <Key size={11} className="text-cyan-400" />
                          <span className="font-mono text-xs font-semibold text-cyan-300 select-all">
                            {order.delivered_key}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(order.delivered_key!, 'License Key', keyId)
                            }
                            title="Copy License Key"
                            className="text-slate-400 hover:text-cyan-300 transition-colors p-0.5"
                          >
                            {copiedId === keyId ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px]">Not Delivered</span>
                      )}
                    </td>

                    {/* Patreon Source Email */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.patreon_email ? (
                        <div className="inline-flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-lg">
                          <Mail size={12} className="text-amber-400 shrink-0" />
                          <span className="font-mono text-xs font-medium text-amber-300 select-all">
                            {order.patreon_email}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(order.patreon_email!, 'Patreon Email', emailId)
                            }
                            title="1-Click Copy Patreon Email to Clear Devices"
                            className="text-amber-400 hover:text-amber-200 transition-colors p-0.5 ml-1 bg-amber-900/60 rounded px-1 text-[10px] font-bold"
                          >
                            {copiedId === emailId ? (
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Check size={10} /> Copied
                              </span>
                            ) : (
                              <span>Copy</span>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs font-mono">—</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {plan
                        ? `${plan.name} (${plan.device_slots} Device${plan.device_slots > 1 ? 's' : ''})`
                        : order.plan_type?.includes('2_device')
                        ? '2 Devices'
                        : '1 Device'}
                    </td>

                    {/* Amount & Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{amountDisplay}</span>
                        <StatusBadge status={order.payment_status} />
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-right font-mono text-slate-400 text-[10px] whitespace-nowrap">
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

