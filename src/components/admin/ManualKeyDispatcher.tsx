'use client';

import { useState } from 'react';
import {
  Send,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Key,
  Lock,
  User,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ManualKeyDispatcherProps {
  adminToken: string;
  onDispatchSuccess?: () => void;
}

interface DispatchResult {
  orderId: string;
  decryptedKey: string;
  slotsAssigned: number;
  planType: string;
  recipient: string;
  keyId: string;
  remainingSlotsOnKey: number;
  keyStatus: string;
  orderUrl: string;
  createdAt: number;
}

export function ManualKeyDispatcher({ adminToken, onDispatchSuccess }: ManualKeyDispatcherProps) {
  const [slots, setSlots] = useState<1 | 2 | 3>(1);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DispatchResult | null>(null);
  const [showKey, setShowKey] = useState(true);

  async function handleDispatch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/keys/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify({
          recipient: recipient.trim() || 'Direct Customer',
          slots,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch license key.');
      }

      setResult(data);
      toast.success(
        slots === 3
          ? '👑 100% Dedicated Private Key locked & allocated!'
          : `⚡ ${slots} Slot(s) allocated successfully!`
      );

      if (onDispatchSuccess) {
        onDispatchSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch key.');
      toast.error(err?.message || 'Failed to dispatch key.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  }

  function resetForm() {
    setResult(null);
    setRecipient('');
    setNote('');
    setError(null);
  }

  return (
    <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-6 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#16243d] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Send size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Direct Key Dispatch</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Manual Allocation
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Give a key directly to a customer in Telegram/Discord DMs without sharing risks
            </p>
          </div>
        </div>

        {/* Live Protection Badge */}
        <div className="flex items-center gap-2 bg-[#080d19] border border-[#1a2c4e] px-3 py-1.5 rounded-lg">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[11px] text-slate-300">Atomic Firestore Lock Active</span>
        </div>
      </div>

      {/* Result Display Card (When Key Allocated) */}
      {result ? (
        <div className="bg-[#080e1b] border border-emerald-500/40 rounded-xl p-5 space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle size={18} />
              <span>Key Allocated & Locked Successfully!</span>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              {result.orderId}
            </span>
          </div>

          {/* Decrypted License Key Box */}
          <div className="bg-[#050912] border border-[#1e3458] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-cyan-400">
                <Key size={14} /> License Key Code:
              </span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
              >
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showKey ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 bg-[#0a1120] border border-cyan-900/40 rounded-lg p-3">
              <span className="font-mono font-bold text-white tracking-wider text-base sm:text-lg select-all overflow-x-auto">
                {showKey ? result.decryptedKey : '••••••••••••••••••••••••••••••••'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(result.decryptedKey, 'License Key')}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 shrink-0"
              >
                <Copy size={13} />
                <span>Copy Key</span>
              </button>
            </div>
          </div>

          {/* Allocation Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#0d1627] border border-[#1a2c4e] p-3 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Recipient</span>
              <span className="font-bold text-white text-sm">{result.recipient}</span>
            </div>

            <div className="bg-[#0d1627] border border-[#1a2c4e] p-3 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Slots Assigned</span>
              <span className="font-bold text-cyan-400 text-sm">
                {result.slotsAssigned === 3 ? '👑 3 Slots (Private / Dedicated)' : `${result.slotsAssigned} Slot(s) Shared`}
              </span>
            </div>

            <div className="bg-[#0d1627] border border-[#1a2c4e] p-3 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Database Status</span>
              <span className={`font-bold text-sm ${result.keyStatus === 'full' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {result.keyStatus === 'full' ? '🔒 Locked (0 slots left)' : `🟢 Active (${result.remainingSlotsOnKey} left)`}
              </span>
            </div>
          </div>

          {/* Customer Fulfillment Link */}
          <div className="bg-[#0d1627] border border-[#1a2c4e] p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Customer Fulfillment Link (Paste to customer):</span>
              <span className="font-mono text-xs text-cyan-300 truncate block">{result.orderUrl}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(result.orderUrl, 'Fulfillment Link')}
                className="bg-[#16243d] hover:bg-[#1f3357] text-white text-xs px-3 py-1.5 rounded-md border border-[#273e6b] flex items-center gap-1 transition-colors"
              >
                <Copy size={12} />
                <span>Copy Link</span>
              </button>
              <a
                href={result.orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#16243d] hover:bg-[#1f3357] text-white text-xs px-3 py-1.5 rounded-md border border-[#273e6b] flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={12} />
                <span>Open</span>
              </a>
            </div>
          </div>

          {/* Dispatch Another Button */}
          <button
            type="button"
            onClick={resetForm}
            className="w-full py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#101b30] hover:bg-[#14233e] border border-[#1e3458] rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} className="text-cyan-400" />
            <span>Allocate Another Key</span>
          </button>
        </div>
      ) : (
        /* Dispatch Form */
        <form onSubmit={handleDispatch} className="space-y-5">
          {/* Step 1: Device Slots Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>1. Choose Key Privacy & Device Slots:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: 1 Device */}
              <button
                type="button"
                onClick={() => setSlots(1)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  slots === 1
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-[#080e1a] border-[#16243d] hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Smartphone size={16} className="text-cyan-400" />
                    <span>1 Device</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                    1 Slot
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Shared pool: Consumes 1 slot. Remaining 2 slots stay available for other buyers.
                </p>
              </button>

              {/* Option 2: 2 Devices */}
              <button
                type="button"
                onClick={() => setSlots(2)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  slots === 2
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-[#080e1a] border-[#16243d] hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Smartphone size={16} className="text-cyan-400" />
                    <span>2 Devices</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                    2 Slots
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Shared pool: Consumes 2 slots. Remaining 1 slot stays available for a 1-device buyer.
                </p>
              </button>

              {/* Option 3: Full Private Key (3 Slots) */}
              <button
                type="button"
                onClick={() => setSlots(3)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  slots === 3
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50'
                    : 'bg-[#080e1a] border-[#16243d] hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                    <Sparkles size={16} className="text-amber-400" />
                    <span>Full Private Key</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                    3 Slots Exclusive
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <strong className="text-amber-300 font-medium">100% Dedicated:</strong> Pulls a fresh virgin key & locks it. Zero strangers can ever share it.
                </p>
              </button>
            </div>
          </div>

          {/* Step 2: Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                <span>Recipient (Telegram @handle, Discord, or Name):</span>
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. @sleekfx3 or customer@gmail.com"
                className="w-full bg-[#080e1a] border border-[#16243d] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                <span>Admin Note (Optional reference):</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Paid ₹100 via GPay / Giveaway Winner"
                className="w-full bg-[#080e1a] border border-[#16243d] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Privacy Guarantee Notice */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            slots === 3
              ? 'bg-amber-950/20 border-amber-800/50 text-amber-200'
              : 'bg-cyan-950/20 border-cyan-800/50 text-cyan-200'
          }`}>
            <Lock size={15} className="shrink-0 mt-0.5" />
            <div>
              {slots === 3 ? (
                <span>
                  <strong>Guaranteed Private Key:</strong> The system will pick a 3/3 fresh key and immediately lock it from public stock. No other buyer on the website or bot will ever receive this key code.
                </span>
              ) : (
                <span>
                  <strong>Shared Slot Allocation:</strong> Consumes {slots} slot(s). The database will automatically pair remaining slots with future website orders so no slots are wasted.
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${
              slots === 3
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-amber-500/20'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black shadow-cyan-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <span>Allocating & Locking Key...</span>
            ) : (
              <>
                <Send size={16} />
                <span>
                  {slots === 3
                    ? '⚡ Allocate & Lock Dedicated Private Key'
                    : `⚡ Allocate ${slots} Slot(s) to Customer`}
                </span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
