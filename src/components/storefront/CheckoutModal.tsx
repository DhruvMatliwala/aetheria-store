'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, Wallet, AlertCircle, Mail, Shield, Check, Copy, Sparkles, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plan } from '@/types/plan';
import { cn } from '@/lib/utils';

type PaymentMethod = 'upi' | 'paypal';
type CheckoutStep = 'details' | 'upi_qr';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
}

interface UpiSessionData {
  orderId: string;
  amount: number;
  amountRupees: number;
  currency: string;
  upiId: string;
  payeeName: string;
  upiString: string;
  note: string;
}

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<CheckoutStep>('details');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UPI Stage 2 states
  const [upiSession, setUpiSession] = useState<UpiSessionData | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!plan) return null;

  const priceDisplay =
    method === 'upi'
      ? `₹${(plan.price_inr / 100).toLocaleString('en-IN')}`
      : `$${(plan.price_usd / 100).toFixed(2)} USD`;

  const resetModal = () => {
    setStep('details');
    setError(null);
    setIsLoading(false);
    setIsVerifying(false);
    setUtrNumber('');
    onClose();
  };

  const handleCopyUpi = () => {
    if (!upiSession?.upiId) return;
    navigator.clipboard.writeText(upiSession.upiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      if (method === 'upi') {
        // ── Direct UPI Session Flow ──────────────────────────────────────────
        const res = await fetch('/api/checkout/upi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id, email: cleanEmail }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error ?? 'Failed to initialize UPI session.');
        }

        setUpiSession(data);
        setStep('upi_qr');
        setIsLoading(false);
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

  async function handleVerifyUtr(e: React.FormEvent) {
    e.preventDefault();
    if (!upiSession?.orderId) return;

    const cleanUtr = utrNumber.replace(/\D/g, '').trim();
    if (cleanUtr.length !== 12) {
      setError('Please enter a valid 12-digit UPI Reference Number / UTR.');
      toast.error('UTR must be exactly 12 digits');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/checkout/upi/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: upiSession.orderId,
          utr: cleanUtr,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to verify transaction.');
      }

      toast.success('Payment verified! Unlocking license key...');
      window.location.href = `/order-success/${upiSession.orderId}`;
    } catch (err: any) {
      const msg = err?.message || 'Verification issue. Please retry.';
      setError(msg);
      toast.error(msg);
      setIsVerifying(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetModal}
      title={step === 'upi_qr' ? '⚡ Scan UPI QR & Claim Key' : `Order ${plan.name} License`}
    >
      {step === 'details' ? (
        /* ════════════════════════════════════════════════════════════════════════
           STEP 1: EMAIL & PAYMENT RAIL SELECTION
           ════════════════════════════════════════════════════════════════════════ */
        <form onSubmit={handleSubmitDetails} className="space-y-4">
          {/* Plan Summary Card */}
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-600">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-base">{plan.name} Key</p>
                  {plan.discount_badge && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      🔥 {plan.discount_badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{plan.duration} Validity</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-medium">
                    {plan.device_slots} Android Device{plan.device_slots > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {method === 'upi' && plan.original_price_inr && (
                  <p className="text-xs font-mono text-rose-400/70 line-through">
                    ₹{(plan.original_price_inr / 100).toLocaleString('en-IN')}
                  </p>
                )}
                {method === 'paypal' && plan.original_price_usd && (
                  <p className="text-xs font-mono text-rose-400/70 line-through">
                    ${(plan.original_price_usd / 100).toFixed(2)} USD
                  </p>
                )}
                <p className="text-2xl font-black text-white">{priceDisplay}</p>
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="checkout-email">
              <Mail size={12} className="inline mr-1 text-cyan-400" />
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              id="checkout-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full bg-surface-900 border border-surface-600 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Your activation key will be delivered on-screen and to this email.
            </p>
          </div>

          {/* Payment Method Selector */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-2">Select Payment Rail</p>
            <div className="grid grid-cols-2 gap-3">
              {/* UPI Direct (Instant 0% Fee) */}
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={cn(
                  'flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all',
                  method === 'upi'
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-surface-900 border-surface-600 text-gray-400 hover:border-surface-500'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Wallet size={15} className="text-cyan-400" />
                    Direct UPI
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    INSTANT ₹
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  GPay, PhonePe, Paytm, BHIM, QR
                </p>
              </button>

              {/* PayPal / International */}
              <button
                type="button"
                onClick={() => setMethod('paypal')}
                className={cn(
                  'flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all',
                  method === 'paypal'
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-surface-900 border-surface-600 text-gray-400 hover:border-surface-500'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <CreditCard size={15} className="text-sky-400" />
                    PayPal
                  </span>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
                    USD $
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  International Cards, Balance
                </p>
              </button>
            </div>
          </div>

          {/* Supported Apps Strip */}
          <div className="pt-1">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred', 'PayPal'].map((app) => (
                <span
                  key={app}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-900 border border-surface-600/80 text-gray-400"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-xs text-red-300">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Proceed Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)]"
            isLoading={isLoading}
            disabled={isLoading}
            id="checkout-submit"
          >
            Proceed to {method === 'upi' ? 'UPI QR Payment' : 'PayPal'} ({priceDisplay}) →
          </Button>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-1">
            <span className="flex items-center gap-1">
              <Shield size={12} className="text-emerald-400" /> 100% Secure Transaction
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-400" /> Instant Key Allocation
            </span>
          </div>
        </form>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════
           STEP 2: DYNAMIC UPI QR & 12-DIGIT UTR CLAIM SCREEN
           ════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Top Amount & Back Button */}
          <div className="flex items-center justify-between bg-surface-900 rounded-xl p-3 border border-surface-600">
            <div>
              <p className="text-[11px] text-gray-400 font-mono">Amount to Pay</p>
              <p className="text-xl font-black text-white">
                ₹{upiSession?.amountRupees.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-emerald-400 font-normal">INR</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setError(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30 transition-colors"
            >
              ← Change Details
            </button>
          </div>

          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <div className="p-3 bg-white rounded-xl shadow-lg mb-3">
              {upiSession?.upiString && (
                <QRCodeSVG
                  value={upiSession.upiString}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              )}
            </div>

            <p className="text-xs text-gray-300 font-medium mb-2 text-center">
              Scan with <span className="text-cyan-400 font-bold">GPay</span>,{' '}
              <span className="text-cyan-400 font-bold">PhonePe</span>, or{' '}
              <span className="text-cyan-400 font-bold">Paytm</span>
            </p>

            {/* Payee Info & Copy Button */}
            <div className="flex items-center justify-between w-full max-w-xs px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
              <div className="truncate pr-2">
                <span className="text-gray-400 block text-[10px]">UPI ID</span>
                <span className="font-mono text-cyan-300 font-bold">{upiSession?.upiId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 text-[11px] font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1 rounded-md transition-colors"
              >
                {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                {copiedUpi ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Mobile Direct Intent Button */}
            {upiSession?.upiString && (
              <a
                href={upiSession.upiString}
                className="mt-3 sm:hidden w-full max-w-xs py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold text-center shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                Open in Installed UPI App
              </a>
            )}
          </div>

          {/* UTR Submission Form */}
          <form onSubmit={handleVerifyUtr} className="space-y-3 pt-1">
            <div>
              <label htmlFor="utr-input" className="block text-xs font-bold text-gray-200 mb-1">
                Enter 12-Digit UPI Reference No. / UTR <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="utr-input"
                  type="text"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 423819284719"
                  className="w-full bg-surface-900 border border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-white font-mono text-base tracking-widest placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  required
                />
                <span className="absolute right-3 top-3 text-[11px] font-mono text-gray-400">
                  {utrNumber.length}/12
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Found in payment receipt on GPay / PhonePe / Paytm / Bank SMS.
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-xs text-red-300">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Verification */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              isLoading={isVerifying}
              disabled={isVerifying || utrNumber.length !== 12}
            >
              {isVerifying ? 'Verifying & Unlocking Key...' : '⚡ Verify & Claim License Key'}
            </Button>
          </form>

          {/* Help Note */}
          <p className="text-[11px] text-center text-gray-500">
            Need help? Contact our Discord support from the footer anytime.
          </p>
        </div>
      )}
    </Modal>
  );
}

