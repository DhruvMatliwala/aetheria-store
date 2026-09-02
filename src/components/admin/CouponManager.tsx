'use client';

import { useState } from 'react';
import { Tag, Sparkles, Copy, Check, Plus, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CouponItem {
  code: string;
  type: string;
  discount: string;
  description: string;
  status: 'active' | 'inactive';
}

export function CouponManager({ adminToken }: { adminToken: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<CouponItem[]>([
    {
      code: 'VIPDHRUV',
      type: 'Flat Discount',
      discount: '₹10 OFF ($0.15)',
      description: 'Private VIP Regular Trainer Discount',
      status: 'active',
    },
    {
      code: 'DISCORDMEMBER',
      type: 'Flat Discount',
      discount: '₹10 OFF ($0.15)',
      description: 'Exclusive Discord Community Reward',
      status: 'active',
    },
  ]);

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('10');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const cleanCode = newCode.trim().toUpperCase();
    const created: CouponItem = {
      code: cleanCode,
      type: 'Flat Discount',
      discount: `₹${newDiscount} OFF`,
      description: newDescription.trim() || 'Custom Promo Code',
      status: 'active',
    };

    setCoupons([created, ...coupons]);
    setNewCode('');
    setNewDescription('');
    setIsAdding(false);
    toast.success(`Coupon "${cleanCode}" created successfully!`);
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

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <Plus size={14} />
          <span>New Promo Code</span>
        </button>
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
              className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-cyan-600 hover:bg-cyan-500 shadow-glow-sm"
            >
              Save & Activate
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
                <th className="py-3.5 px-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 flex items-center gap-2">
                    <span>{c.code}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{c.type}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{c.discount}</td>
                  <td className="py-3.5 px-4 text-slate-400">{c.description}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleCopy(c.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all font-medium"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
