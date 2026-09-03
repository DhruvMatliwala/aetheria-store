'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, Wallet, AlertCircle, Mail, Shield, Check, Copy, Sparkles, ExternalLink, HelpCircle, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plan } from '@/types/plan';
import { CouponValidationResult } from '@/types/coupon';
import { cn } from '@/lib/utils';
import { SMART_ROUTING_UPI_IDS, SmartRoute } from '@/lib/constants';

type PaymentMethod = 'upi' | 'paypal';
type CheckoutStep = 'details' | 'upi_qr' | 'paypal_direct';

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
  smartRouting?: SmartRoute[];
}

interface PaypalSessionData {
  orderId: string;
  amount: number;
  amountUsd: string;
  currency: string;
  paypalMeUrl: string;
  paypalEmail: string;
  paypalUsername: string;
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
  const [activeVpa, setActiveVpa] = useState<string>(SMART_ROUTING_UPI_IDS[0].vpa);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [showUtrHelp, setShowUtrHelp] = useState(false);
  const [showManualUtr, setShowManualUtr] = useState(false);

  // PayPal Stage 2 states
  const [paypalSession, setPaypalSession] = useState<PaypalSessionData | null>(null);
  const [paypalTxId, setPaypalTxId] = useState('');
  const [copiedPaypalEmail, setCopiedPaypalEmail] = useState(false);

  // Restore active session from localStorage if user reloaded or switched back from UPI app
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;
    try {
      const saved = localStorage.getItem('aetheria_active_checkout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orderId && Date.now() - (parsed.timestamp || 0) < 30 * 60 * 1000) {
          if (parsed.upiSession && parsed.method === 'upi') {
            setUpiSession(parsed.upiSession);
            if (parsed.upiSession.upiId) {
              setActiveVpa(parsed.upiSession.upiId);
            }
            setMethod('upi');
            setStep('upi_qr');
          } else if (parsed.paypalSession && parsed.method === 'paypal') {
            setPaypalSession(parsed.paypalSession);
            setMethod('paypal');
            setStep('paypal_direct');
          }
        }
      }
    } catch {}
  }, [isOpen]);

  // ── Auto-poll for Zero-UTR & PayPal instant bank/cloud match ───────────────
  useEffect(() => {
    const targetOrderId =
      step === 'upi_qr'
        ? upiSession?.orderId
        : step === 'paypal_direct'
        ? paypalSession?.orderId
        : null;

    if (!targetOrderId) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/order/${targetOrderId}`);
        if (!res.ok) return;
        const data = await res.json();
        const isPaid =
          data?.payment_status === 'paid' || data?.order?.payment_status === 'paid';

        if (isPaid && isSubscribed) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('aetheria_active_checkout');
          }
          clearInterval(interval);
          toast.success('⚡ Payment Verified! Delivering your key...');
          window.location.href = `/order-success/${targetOrderId}`;
        }
      } catch {
        // silent retry
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [step, upiSession?.orderId, paypalSession?.orderId]);

  // Promo Coupon states
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);

  if (!plan) return null;

  const currentPriceInr = appliedCoupon?.newPriceInr ?? plan.price_inr;
  const currentPriceUsd = appliedCoupon?.newPriceUsd ?? plan.price_usd;

  const priceDisplay =
    method === 'upi'
      ? `₹${(currentPriceInr / 100).toLocaleString('en-IN')}`
      : `$${(currentPriceUsd / 100).toFixed(2)} USD`;

  const resetModal = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aetheria_active_checkout');
    }
    setStep('details');
    setError(null);
    setIsLoading(false);
    setIsVerifying(false);
    setUtrNumber('');
    setPaypalTxId('');
    setCouponInput('');
    setCouponError(null);
    setAppliedCoupon(null);
    onClose();
  };

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim() || !plan) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          planId: plan.id,
        }),
      });

      const data = (await res.json()) as CouponValidationResult;
      if (!res.ok || !data.valid) {
        throw new Error(data.error || 'Invalid or expired promo code.');
      }

      setAppliedCoupon(data);
      toast.success(
        `🎉 ${data.code} applied! Saved ${method === 'upi' ? data.discountDisplayInr : data.discountDisplayUsd}`
      );
    } catch (err: any) {
      setCouponError(err.message || 'Invalid promo code.');
      toast.error(err.message || 'Invalid promo code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    toast.success('Promo code removed.');
  };

  const currentUpiId = activeVpa || upiSession?.upiId || SMART_ROUTING_UPI_IDS[0].vpa;
  const currentUpiString = upiSession
    ? `upi://pay?pa=${encodeURIComponent(currentUpiId)}&pn=${encodeURIComponent(upiSession.payeeName || 'Dhruv')}&cu=INR`
    : '';

  const handleCopyUpi = () => {
    if (!currentUpiId) return;
    navigator.clipboard.writeText(currentUpiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleCopyAmount = () => {
    if (!upiSession?.amountRupees) return;
    navigator.clipboard.writeText(Math.round(upiSession.amountRupees).toString());
    setCopiedAmount(true);
    toast.success(`Copied amount: ₹${Math.round(upiSession.amountRupees)}`);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handleCopyPaypalEmail = () => {
    if (!paypalSession?.paypalEmail) return;
    navigator.clipboard.writeText(paypalSession.paypalEmail);
    setCopiedPaypalEmail(true);
    toast.success('PayPal Email copied to clipboard!');
    setTimeout(() => setCopiedPaypalEmail(false), 2500);
  };

  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      if (method === 'upi') {
        // ── Direct UPI Session Flow with optional Promo Code ─────────────────
        const res = await fetch('/api/checkout/upi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            email: cleanEmail,
            couponCode: appliedCoupon?.code,
          }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error ?? 'Failed to initialize UPI session.');
        }

        setUpiSession(data);
        if (data.upiId) {
          setActiveVpa(data.upiId);
        }
        setStep('upi_qr');
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'aetheria_active_checkout',
            JSON.stringify({
              orderId: data.orderId,
              method: 'upi',
              planId: plan.id,
              upiSession: data,
              timestamp: Date.now(),
            })
          );
        }
        setIsLoading(false);
      } else {
        // ── Direct PayPal.Me Flow with optional Promo Code ──────────────────
        const res = await fetch('/api/checkout/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            email: cleanEmail,
            couponCode: appliedCoupon?.code,
          }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error ?? 'Failed to initialize PayPal session.');
        }

        setPaypalSession(data);
        setStep('paypal_direct');
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'aetheria_active_checkout',
            JSON.stringify({
              orderId: data.orderId,
              method: 'paypal',
              planId: plan.id,
              paypalSession: data,
              timestamp: Date.now(),
            })
          );
        }
        setIsLoading(false);
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

  async function handleVerifyPaypal(e: React.FormEvent) {
    e.preventDefault();
    if (!paypalSession?.orderId) return;

    const cleanTxId = paypalTxId.trim();
    if (cleanTxId.length < 4) {
      setError('Please enter your PayPal Transaction ID or Payer Email address.');
      toast.error('Please provide your Transaction ID or Payer Email');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/checkout/paypal/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: paypalSession.orderId,
          transactionId: cleanTxId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to verify PayPal transaction.');
      }

      toast.success('Payment submitted! Unlocking license key...');
      window.location.href = `/order-success/${paypalSession.orderId}`;
    } catch (err: any) {
      const msg = err?.message || 'Verification issue. Please retry.';
      setError(msg);
      toast.error(msg);
      setIsVerifying(false);
    }
  }

  const getModalTitle = () => {
    if (step === 'upi_qr') return '⚡ Scan UPI QR & Claim Key';
    if (step === 'paypal_direct') return '⚡ Pay via PayPal & Claim Key';
    return `Order ${plan.name} License`;
  };

  return (
    <Modal isOpen={isOpen} onClose={resetModal} title={getModalTitle()}>
      {step === 'details' && (
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
                {appliedCoupon ? (
                  <>
                    <p className="text-xs font-mono text-neutral-400 line-through">
                      {method === 'upi'
                        ? `₹${(plan.price_inr / 100).toLocaleString('en-IN')}`
                        : `$${(plan.price_usd / 100).toFixed(2)} USD`}
                    </p>
                    <p className="text-2xl font-black text-emerald-400">{priceDisplay}</p>
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 inline-block mt-0.5">
                      SAVED {method === 'upi' ? appliedCoupon.discountDisplayInr : appliedCoupon.discountDisplayUsd}
                    </span>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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

          {/* Promo / Discount Coupon Section */}
          <div className="bg-surface-900/80 border border-surface-600 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5" htmlFor="checkout-promo">
                <Sparkles size={13} className="text-cyan-400" />
                <span>Have a Promo Code?</span>
              </label>
              {appliedCoupon && (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold font-mono text-white">{appliedCoupon.code}</span>
                    <span className="text-emerald-400/90 ml-1.5">
                      ({method === 'upi' ? appliedCoupon.discountDisplayInr : appliedCoupon.discountDisplayUsd} OFF)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  APPLIED
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id="checkout-promo"
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  placeholder="Enter promo code"
                  className="flex-1 bg-surface-950 border border-surface-700 rounded-lg px-3 py-1.5 text-white placeholder-gray-500 text-xs font-mono uppercase focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  disabled={couponLoading || !couponInput.trim()}
                  onClick={() => handleApplyCoupon()}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all flex items-center gap-1 shrink-0"
                >
                  {couponLoading ? (
                    <span className="animate-spin text-xs">⏳</span>
                  ) : (
                    <span>Apply</span>
                  )}
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-[11px] text-rose-400 mt-1.5">{couponError}</p>
            )}
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

              {/* Direct PayPal / International */}
              <button
                type="button"
                onClick={() => setMethod('paypal')}
                className={cn(
                  'flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all',
                  method === 'paypal'
                    ? 'bg-blue-950/50 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                    : 'bg-surface-900 border-surface-600 text-gray-400 hover:border-surface-500'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <CreditCard size={15} className="text-blue-400" />
                    PayPal
                  </span>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/60">
                    USD $
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  PayPal.Me, Balance, Cards
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
            Proceed to {method === 'upi' ? 'UPI QR Payment' : 'PayPal Payment'} ({priceDisplay}) →
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
      )}

      {step === 'upi_qr' && (
        /* ════════════════════════════════════════════════════════════════════════
           STEP 2A: DYNAMIC UPI QR & 12-DIGIT UTR CLAIM SCREEN
           ════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Top Amount & Back Button */}
          {/* Amount Box with 1-Tap Copy */}
          <div className="flex items-center justify-between bg-surface-900 rounded-xl p-3 border border-surface-600">
            <div>
              <p className="text-[11px] text-gray-400 font-mono">Amount to Pay</p>
              <p className="text-xl font-black text-white flex items-center gap-1.5">
                ₹{Math.round(upiSession?.amountRupees || 0)}{' '}
                <span className="text-xs text-emerald-400 font-normal">INR</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAmount}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 transition-colors"
                title="Copy exact amount"
              >
                {copiedAmount ? <Check size={12} /> : <Copy size={12} />}
                {copiedAmount ? 'Copied' : `Copy ₹${Math.round(upiSession?.amountRupees || 0)}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setError(null);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <div className="p-3 bg-white rounded-xl shadow-lg mb-3">
              {(currentUpiString || upiSession?.upiString) && (
                <QRCodeSVG
                  value={currentUpiString || upiSession!.upiString}
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
            <div className="w-full max-w-xs">
              {/* UPI ID */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
                <div className="truncate pr-2">
                  <span className="text-gray-400 block text-[10px]">UPI ID</span>
                  <span className="font-mono text-cyan-300 font-bold">{currentUpiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 text-[11px] font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1 rounded-md transition-colors shrink-0"
                >
                  {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                  {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* 3-Step Clear Instructions */}
            <div className="w-full max-w-xs mt-3 px-3 py-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-gray-300 space-y-1 text-left">
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold font-mono">1.</span>
                <span>Scan QR or pay to UPI ID above.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold font-mono">2.</span>
                <span>Enter exact amount: <strong className="text-emerald-300 font-bold">₹{Math.round(upiSession?.amountRupees || 0)}</strong></span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold font-mono">3.</span>
                <span>⚡ <strong className="text-white">Auto-Unlocks in 2-3s!</strong> No UTR needed.</span>
              </div>
            </div>

            {/* Google Pay Smart Bank Failover Route Switcher */}
            <div className="w-full max-w-xs pt-2.5 pb-1 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                  <Sparkles size={11} /> Smart Bank Routing
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 4 Active
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-950/80 rounded-lg border border-neutral-800">
                {SMART_ROUTING_UPI_IDS.map((route) => {
                  const isSelected = currentUpiId === route.vpa;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => {
                        setActiveVpa(route.vpa);
                        toast.success(`Switched to ${route.bank} route`, { duration: 1500 });
                      }}
                      className={cn(
                        'py-1 px-1 rounded-md text-[10px] font-mono font-medium transition-all text-center truncate',
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                      )}
                      title={`${route.bank} (${route.vpa})`}
                    >
                      {route.bank.replace(' Bank', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Direct Intent Button */}
            {(currentUpiString || upiSession?.upiString) && (
              <a
                href={currentUpiString || upiSession!.upiString}
                className="mt-2 sm:hidden w-full max-w-xs py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold text-center shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                Open in Installed UPI App
              </a>
            )}
          </div>

          {/* Zero-UTR Live Detection Radar Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-surface-900 to-cyan-950/60 border border-emerald-500/40 shadow-lg text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Listening for Bank Deposit...
              </span>
            </div>
            <p className="text-xs text-gray-200 font-medium">
              Pay the exact <strong className="text-cyan-300 font-bold">₹{Math.round(upiSession?.amountRupees || 0)}</strong> via GPay, PhonePe, or Paytm.
            </p>
            <p className="text-[11px] text-gray-400">
              ⚡ <strong className="text-white">Zero UTR Needed!</strong> This window will automatically unlock your license key in 2-3 seconds after payment.
            </p>
            <p className="text-[10px] text-amber-400/90 font-mono">
              ⚠️ Please enter the exact amount (₹{Math.round(upiSession?.amountRupees || 0)}). Less or incorrect amounts cannot unlock your key automatically.
            </p>
          </div>

          {/* Fallback Manual UTR Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowManualUtr(!showManualUtr)}
              className="w-full text-center text-[11px] text-gray-400 hover:text-gray-300 transition-colors py-1 flex items-center justify-center gap-1"
            >
              <span>{showManualUtr ? '▲ Hide manual UTR form' : '▼ Paid with a different amount or want to enter UTR manually?'}</span>
            </button>

            {showManualUtr && (
              <form onSubmit={handleVerifyUtr} className="space-y-3 pt-3 border-t border-surface-700 mt-2">
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

                  {/* Where to find helper toggle */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowUtrHelp(!showUtrHelp)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <HelpCircle size={13} />
                      <span>Where do I find this 12-digit number?</span>
                    </button>

                    {showUtrHelp && (
                      <div className="mt-2 p-3 rounded-xl bg-surface-900/90 border border-cyan-500/30 text-[11px] text-gray-300 space-y-2 animate-in fade-in duration-200">
                        <p className="font-bold text-cyan-300 text-xs">Look for the 12-digit number on your payment receipt:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                            <span className="font-bold text-white block">Google Pay (GPay):</span>
                            <span className="text-gray-400">Listed as <strong className="text-emerald-300">&quot;UPI transaction ID&quot;</strong></span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                            <span className="font-bold text-white block">PhonePe:</span>
                            <span className="text-gray-400">Tap &quot;Transfer Details&quot; ➔ Look for <strong className="text-emerald-300">&quot;UTR&quot;</strong></span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                            <span className="font-bold text-white block">Paytm:</span>
                            <span className="text-gray-400">Listed as <strong className="text-emerald-300">&quot;UPI Ref No.&quot;</strong></span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                            <span className="font-bold text-white block">Bank SMS:</span>
                            <span className="text-gray-400">Look for the 12-digit number in the SMS received right after paying</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
            )}
          </div>

          {/* Help Note */}
          <p className="text-[11px] text-center text-gray-500">
            Need help? Contact our Discord support from the footer anytime.
          </p>
        </div>
      )}

      {step === 'paypal_direct' && (
        /* ════════════════════════════════════════════════════════════════════════
           STEP 2B: DIRECT PAYPAL.ME & TRANSACTION VERIFICATION
           ════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Top Amount & Back Button */}
          <div className="flex items-center justify-between bg-surface-900 rounded-xl p-3 border border-surface-600">
            <div>
              <p className="text-[11px] text-gray-400 font-mono">Amount to Pay</p>
              <p className="text-xl font-black text-white">
                ${paypalSession?.amountUsd}{' '}
                <span className="text-xs text-blue-400 font-normal">USD</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setError(null);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded-lg bg-blue-950/50 border border-blue-500/30 transition-colors"
            >
              ← Change Details
            </button>
          </div>

          {/* PayPal Action Card */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center mb-3 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <CreditCard size={24} />
            </div>

            <p className="text-sm font-bold text-white mb-1">Direct PayPal Payment</p>
            <p className="text-xs text-gray-400 text-center mb-4 max-w-xs">
              Click the button below to open PayPal.Me with the pre-filled amount:
            </p>

            {/* Direct PayPal.Me Button */}
            {paypalSession?.paypalMeUrl && (
              <a
                href={paypalSession.paypalMeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-xs py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white text-sm font-bold text-center shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mb-4"
              >
                <span>Pay ${paypalSession.amountUsd} USD on PayPal.Me</span>
                <ExternalLink size={15} />
              </a>
            )}

            {/* Payee Info / Copy Email Fallback */}
            <div className="flex items-center justify-between w-full max-w-xs px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
              <div className="truncate pr-2">
                <span className="text-gray-400 block text-[10px]">PayPal Email (Alternative)</span>
                <span className="font-mono text-blue-300 font-bold truncate block">
                  {paypalSession?.paypalEmail}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPaypalEmail}
                className="flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-md transition-colors flex-shrink-0"
              >
                {copiedPaypalEmail ? <Check size={12} /> : <Copy size={12} />}
                {copiedPaypalEmail ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Transaction ID Submission Form */}
          <form onSubmit={handleVerifyPaypal} className="space-y-3 pt-1">
            <div>
              <label htmlFor="paypal-tx-input" className="block text-xs font-bold text-gray-200 mb-1">
                Enter PayPal Transaction ID or Payer Email <span className="text-red-400">*</span>
              </label>
              <input
                id="paypal-tx-input"
                type="text"
                value={paypalTxId}
                onChange={(e) => setPaypalTxId(e.target.value)}
                placeholder="e.g. 9AB12345CD67890EF or your-paypal@email.com"
                className="w-full bg-surface-900 border border-blue-500/50 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Found on your PayPal receipt screen or payment confirmation email.
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
              className="w-full font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              isLoading={isVerifying}
              disabled={isVerifying || paypalTxId.trim().length < 4}
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

