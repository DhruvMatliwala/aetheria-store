'use client';

import { useState } from 'react';
import { Check, X, Copy, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderPublic } from '@/types/order';

interface PendingApprovalsProps {
  orders: OrderPublic[];
  adminToken: string;
  onRefresh: () => void;
}

export function PendingApprovals({ orders, adminToken, onRefresh }: PendingApprovalsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingOrders = orders.filter((o) => o.payment_status === 'verifying' || o.payment_status === 'pending');

  if (pendingOrders.length === 0) {
    return null;
  }

  const handleCopyRef = (refText: string, id: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedId(id);
    toast.success('Reference copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to approve order.');
      }

      toast.success(`Order #${orderId} approved! Key allocated & sent.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error approving order.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm(`Are you sure you want to REJECT order #${orderId}?`)) return;

    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify({ orderId, reason: 'Payment reference could not be verified' }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to reject order.');
      }

      toast.success(`Order #${orderId} rejected.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Error rejecting order.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-[#0c1424] border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Pending Manual Approvals</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold">
                {pendingOrders.length} Order{pendingOrders.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Orders requiring manual confirmation before instant key dispatch
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {pendingOrders.map((order) => {
          const amountDisplay =
            order.currency === 'INR'
              ? `₹${(order.amount / 100).toLocaleString('en-IN')}`
              : `$${(order.amount / 100).toFixed(2)}`;

          return (
            <div
              key={order.order_id}
              className="bg-[#080e1a] border border-[#16243d] hover:border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">{order.order_id}</span>
                  <span className="text-xs font-semibold text-white">{amountDisplay}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({order.plan_type === '1_month' ? '1 Device' : '2 Devices'})
                  </span>
                </div>
                <p className="text-xs text-slate-300">{order.customer_email || 'No email provided'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(order.order_id)}
                  disabled={processingId === order.order_id}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  <Check size={13} />
                  <span>Approve & Send Key</span>
                </button>
                <button
                  onClick={() => handleReject(order.order_id)}
                  disabled={processingId === order.order_id}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <X size={13} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
