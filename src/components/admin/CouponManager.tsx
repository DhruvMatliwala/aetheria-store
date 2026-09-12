'use client';

import { useState, useEffect } from 'react';
import { Tag, Sparkles, Copy, Check, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Coupon } from '@/types/coupon';

export function CouponManager({ adminToken }: { adminToken: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('10');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch live coupons from Firestore via admin API
  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: {
          'x-admin-secret': adminToken,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load coupons.');
      }

      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err: any) {
      console.error('[CouponManager] Fetch error:', err);
      toast.error('Failed to load coupons from database.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminToken) {
      fetchCoupons();
    }
  }, [adminToken]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify({
          code: newCode.trim(),
          discountInr: newDiscount,
          description: newDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create coupon.');
      }

      toast.success(`Coupon "${data.coupon.code}" created successfully!`);
      setNewCode('');
      setNewDescription('');
      setIsAdding(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || 'Error creating coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete promo code "${code}"?`)) {
      return;
    }

    setDeletingCode(code);
    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminToken,
        },
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete coupon.');
      }

      toast.success(`Coupon "${code}" deleted permanently.`);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
    } catch (err: any) {
      toast.error(err.message || 'Error deleting coupon.');
    } finally {
      setDeletingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Promo & Discount Coupons</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Private codes for repeat buyers, Discord promotions & VIP trainers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCoupons()}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 border border-slate-700/60 transition-colors disabled:opacity-50"
            title="Refresh Coupons"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Plus size={14} />
            <span>New Promo Code</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreateCoupon}
          className="bg-[#0c1424] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus size={16} className="text-cyan-400" />
            <span>Create New Secret Code</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Coupon Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. VIP20"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full bg-[#070b13] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="1"
                required
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                className="w-full bg-[#070b13] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. For Discord Loyalists"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-[#070b13] border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-cyan-600 hover:bg-cyan-500 shadow-glow-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Activate'}
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-[#0c1424] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#080f1e] text-slate-400 border-b border-slate-800">
                <th className="py-3.5 px-4 font-semibold">COUPON CODE</th>
                <th className="py-3.5 px-4 font-semibold">TYPE</th>
                <th className="py-3.5 px-4 font-semibold">DISCOUNT VALUE</th>
                <th className="py-3.5 px-4 font-semibold">DESCRIPTION</th>
                <th className="py-3.5 px-4 font-semibold">STATUS</th>
                <th className="py-3.5 px-4 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading coupons from Firestore...</span>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No Active Coupons</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      All promo discounts are currently removed. Click &quot;+ New Promo Code&quot; above to create one anytime.
                    </p>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const discountRs = (c.discount_value_inr / 100).toFixed(0);
                  const discountUsd = c.discount_value_usd ? (c.discount_value_usd / 100).toFixed(2) : '0.15';
                  const isDeleting = deletingCode === c.code;

                  return (
                    <tr key={c.code} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        <span>{c.code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 capitalize">
                        {c.discount_type === 'flat' ? 'Flat Discount' : 'Percentage'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ₹{discountRs} OFF (${discountUsd})
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{c.description}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(c.code)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all font-medium text-xs"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? (
                              <>
                                <Check size={12} className="text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 transition-all font-medium text-xs disabled:opacity-50"
                            title="Delete coupon permanently"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-rose-400">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
