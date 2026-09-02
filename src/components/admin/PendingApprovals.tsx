'use client';

import { useState } from 'react';
import { CheckCircle, Check, X, Copy, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderPublic } from '@/types/order';
import { PLAN_MAP } from '@/lib/constants';

interface PendingApprovalsProps {
  orders: OrderPublic[];
  adminToken: string;
  onRefresh: () => void;
}

export function PendingApprovals({ orders, adminToken, onRefresh }: PendingApprovalsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingOrders = orders.filter((o) => o.payment_status === 'verifying');

  if (pendingOrders.length === 0) {
    return null; // Don't take up space if nothing is pending
  }

  const handleCopyRef = (refText: string, id: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedId(id);
    toast.success('Reference copied to clipboard!');
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
        body: JSON.stringify({ orderId }),
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
    <div className="bg-gradient-to-r from-amber-950/40 via-surface-800 to-amber-950/20 border-2 border-amber-500/50 rounded-2xl p-5 mb-8 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
      <div className="flex items-center justify-between pb-4 border-b border-amber-500/30 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              Action Required: Pending Payment Verifications
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-black">
                {pendingOrders.length} PENDING
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Check your bank SMS / GPay / PhonePe / PayPal notification, then click Approve to dispatch the key!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {pendingOrders.map((order) => {
          const plan = PLAN_MAP[order.plan_type];
          const isProcessing = processingId === order.order_id;
          const refText = order.utr_number || order.paypal_tx_id || 'N/A';
          const amountDisplay =
            order.currency === 'INR'
              ? `₹${(order.amount / 100).toLocaleString('en-IN')}`
              : `$${(order.amount / 100).toFixed(2)} USD`;

          return (
            <div
              key={order.order_id}
              className="bg-surface-900/90 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    {order.order_id}
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-white font-semibold text-sm">
                    {order.customer_email || 'No Email'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span className="text-emerald-400 font-bold">{amountDisplay}</span>
                  <span>({plan?.name || order.plan_type})</span>
                  <span>•</span>
                  <span>
                    Rail: <strong className="text-white">{order.payment_gateway || 'Direct'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-amber-300 font-medium">Payment Ref / UTR:</span>
                  <span className="px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-amber-200 font-mono text-xs font-bold">
                    {refText}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(refText, order.order_id)}
                    className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                    title="Copy Reference"
                  >
                    {copiedId === order.order_id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleApprove(order.order_id)}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  <CheckCircle size={15} />
                  <span>{isProcessing ? 'Approving...' : 'Approve & Deliver Key'}</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleReject(order.order_id)}
                  className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  title="Reject Unpaid / Fake"
                >
                  <X size={15} />
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
