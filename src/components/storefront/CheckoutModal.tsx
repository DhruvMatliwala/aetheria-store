'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CreditCard, Wallet, AlertCircle, Mail, Shield, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plan } from '@/types/plan';
import { useRazorpay, RazorpayPaymentResponse } from '@/hooks/useRazorpay';
import { cn } from '@/lib/utils';

type PaymentMethod = 'upi' | 'paypal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
}

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const router = useRouter();
  const { isLoaded: razorpayLoaded, openCheckout } = useRazorpay();

  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  const priceDisplay =
    method === 'upi'
      ? `₹${(plan.price_inr / 100).toLocaleString('en-IN')}`
      : `$${(plan.price_usd / 100).toFixed(2)} USD`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      if (method === 'upi') {
        // ── UPI / Razorpay flow ─────────────────────────────────────────────
        const res = await fetch('/api/checkout/upi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id, email: cleanEmail }),
        });
        const data = (await res.json()) as {
          orderId: string;
          razorpayOrderId: string;
          amount: number;
          currency: string;
          keyId: string;
          error?: string;
        };

        if (!res.ok || data.error) {
          throw new Error(data.error ?? 'Checkout failed.');
        }

        openCheckout({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'PGSharp Keys',
          description: `${plan.name} (${plan.device_slots} Device${plan.device_slots > 1 ? 's' : ''}) — ${plan.duration}`,
          order_id: data.razorpayOrderId,
          prefill: { email: cleanEmail, contact: '9999999999' },
          theme: { color: '#6366f1' },
          handler: async (response: RazorpayPaymentResponse) => {
            setIsLoading(true);
            try {
              const verifyRes = await fetch('/api/checkout/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: data.orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                // Navigate upon verified successful response
                window.location.href = `/order-success/${data.orderId}`;
                return;
              }

              throw new Error(verifyData.error || 'Payment verification failed.');
            } catch (vErr: any) {
              console.error('[checkout] Razorpay verification error:', vErr);
              toast.error(vErr?.message || 'Verification issue. Checking order status...');
              window.location.href = `/order-success/${data.orderId}`;
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            },
          },
        });
      } else {
        // ── PayPal flow ─────────────────────────────────────────────────────
        const res = await fetch('/api/checkout/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id, email: cleanEmail }),
        });
        const data = (await res.json()) as {
          orderId: string;
          approvalUrl: string | null;
          error?: string;
        };

        if (!res.ok || data.error) {
          throw new Error(data.error ?? 'PayPal checkout failed.');
        }

        if (data.approvalUrl) {
          sessionStorage.setItem('pgsharp_pending_order', data.orderId);
          window.location.href = data.approvalUrl;
        } else {
          throw new Error('No PayPal approval URL received.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order ${plan.name} License`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plan Summary Card */}
        <div className="bg-surface-900 rounded-xl p-4 border border-surface-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-bold text-base">{plan.name} Key</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span>{plan.duration} Validity</span>
                <span>•</span>
                <span className="text-brand-300 font-medium">
                  {plan.device_slots} Android Device{plan.device_slots > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">{priceDisplay}</p>
            </div>
          </div>
        </div>

        {/* Email Address (Only Required Input) */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="checkout-email">
            <Mail size={12} className="inline mr-1 text-brand-400" />
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            id="checkout-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            className="w-full bg-surface-900 border border-surface-600 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
          <p className="text-[11px] text-gray-500 mt-1">Your activation key will be delivered here instantly upon payment.</p>
        </div>

        {/* Payment Method Selector */}
        <div>
          <p className="text-xs font-semibold text-gray-300 mb-2">Select Payment Rail</p>
          <div className="grid grid-cols-2 gap-3">
            {/* UPI / India */}
            <button
              type="button"
              onClick={() => setMethod('upi')}
              className={cn(
                'flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all',
                method === 'upi'
                  ? 'bg-brand-900/50 border-brand-500 text-white shadow-glow-sm'
                  : 'bg-surface-900 border-surface-600 text-gray-400 hover:border-surface-500'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Wallet size={15} className="text-brand-400" />
                  UPI & Cards
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  INR ₹
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                GPay, PhonePe, Paytm, BHIM, Cards, NetBanking
              </p>
            </button>

            {/* PayPal / International */}
            <button
              type="button"
              onClick={() => setMethod('paypal')}
              className={cn(
                'flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all',
                method === 'paypal'
                  ? 'bg-brand-900/50 border-brand-500 text-white shadow-glow-sm'
                  : 'bg-surface-900 border-surface-600 text-gray-400 hover:border-surface-500'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <CreditCard size={15} className="text-sky-400" />
                  PayPal
                </span>
                <span className="text-[11px] font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
                  USD $
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                International Cards, PayPal Balance
              </p>
            </button>
          </div>
        </div>

        {/* Accepted Payment Badges */}
        <div className="pt-2">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-1.5 text-center">
            Supported Payment Methods
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-900 border border-surface-600 text-gray-300">
              UPI
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-900 border border-surface-600 text-gray-300">
              Google Pay
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-900 border border-surface-600 text-gray-300">
              PhonePe
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-900 border border-surface-600 text-gray-300">
              Paytm
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-900 border border-surface-600 text-gray-300">
              Amazon Pay
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-900 border border-surface-600 text-gray-300">
              Visa / Mastercard
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-900 border border-surface-600 text-gray-300">
              PayPal
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-xs text-red-300">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold shadow-glow-sm"
          isLoading={isLoading}
          disabled={isLoading || (method === 'upi' && !razorpayLoaded)}
          id="checkout-submit"
        >
          Pay {priceDisplay} →
        </Button>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-1">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-emerald-400" /> Verified SSL Security
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Check size={12} className="text-emerald-400" /> Automated Key Delivery
          </span>
        </div>
      </form>
    </Modal>
  );
}
