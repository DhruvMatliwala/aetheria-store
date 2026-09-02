'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Mail, Shield, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plan } from '@/types/plan';

interface RestockNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSuccess: (planId: string) => void;
}

export function RestockNotifyModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
}: RestockNotifyModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await fetch('/api/restock-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit waitlist notification.');
      }

      // Persist in localStorage to remember the user is on the waitlist
      if (typeof window !== 'undefined') {
        localStorage.setItem(`restock_requested_${plan.id}`, 'true');
      }

      toast.success("You're on the restock waitlist!");
      onSuccess(plan.id);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restock Notification">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plan Header Info */}
        <div className="bg-[#090e1a] rounded-xl p-4 border border-[#16243d]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">{plan.name} License</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-cyan-300">
                  Temporarily Sold Out
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {plan.duration} · {plan.device_slots} Device Slot{plan.device_slots > 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Bell size={20} />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Enter your email address below to join the priority restock queue. We will automatically notify you as soon as new license keys are uploaded.
        </p>

        {/* Email Address Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="notify-email">
            <Mail size={12} className="inline mr-1 text-cyan-400" />
            Email Address <span className="text-rose-400">*</span>
          </label>
          <input
            id="notify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            className="w-full bg-[#080e1a] border border-[#1b2b48] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
          <p className="text-[11px] text-slate-500 mt-1">No spam ever. Strictly 1-time restock alert.</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          isLoading={isLoading}
          id="submit-restock-notify"
        >
          <Bell size={16} />
          <span>Notify Me When in Stock</span>
        </Button>

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
          <Shield size={12} className="text-emerald-400" />
          <span>Instant automated email dispatch upon admin restock</span>
        </div>
      </form>
    </Modal>
  );
}
