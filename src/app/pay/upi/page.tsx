'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ShieldCheck, Send } from 'lucide-react';
import { UPI_VPA, UPI_PAYEE_NAME, TELEGRAM_BOT_USERNAME, PLANS, PLAN_MAP } from '@/lib/constants';

function UpiPayContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || '1_month_1_device';
  const orderId = searchParams.get('orderId') || '';
  const amountParam = searchParams.get('amount');
  
  const plan = PLAN_MAP[planId] || PLANS[0];
  const amountRupees = amountParam ? parseInt(amountParam, 10) : Math.round(plan.price_inr / 100);

  const [copied, setCopied] = useState(false);

  // Construct official UPI QR string
  const upiUri = `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(orderId || 'AetheriaKey')}&aid=uGICAgMC507CUEg`;
  const telegramBotUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}`;

  // Safe P2P: No automatic 3rd-party intent triggers that cause bank limit errors

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_VPA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('upi-qr-code') as unknown as SVGElement | null;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 25, 25, 350, 350);
        const a = document.createElement('a');
        a.download = `AetheriaStore_UPI_QR_₹${amountRupees}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Aetheria Store • UPI Gateway
            </span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full">
            Instant 0% Fee
          </span>
        </div>

        {/* Amount & Plan Section */}
        <div className="text-center mb-6">
          <p className="text-xs text-neutral-400 font-medium mb-1">
            {plan.name} ({plan.duration})
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-4xl font-black text-white tracking-tight">₹{amountRupees}</span>
            <span className="text-sm font-semibold text-emerald-400 mt-1">INR</span>
          </div>
          {orderId && (
            <p className="text-[10px] font-mono text-neutral-500 mt-1">
              Order Ref: {orderId}
            </p>
          )}
        </div>

        {/* Primary Action: 1-Tap Copy UPI ID (Bypasses all 3rd-party bank limits) */}
        <div className="mb-6 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-inner">
          <label className="block text-[11px] font-mono text-neutral-400 mb-2">
            1️⃣ Tap to Copy UPI ID (Pay in GPay / PhonePe / Paytm):
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs">
            <code className="font-mono text-cyan-300 font-bold truncate select-all text-sm">
              {UPI_VPA}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 rounded-lg transition-all shadow-md shrink-0 ml-2 active:scale-95"
            >
              {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 text-center">
            Pasting into your UPI app gives <strong className="text-emerald-400 font-medium">100% bank success rate</strong> with zero 3rd-party limit errors.
          </p>
        </div>

        {/* Divider with Scan or Pay via QR */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-neutral-800 w-full" />
          <span className="bg-neutral-900 px-3 text-[11px] font-mono text-neutral-400 uppercase tracking-wider shrink-0">
            Or Scan QR Code
          </span>
          <div className="border-t border-neutral-800 w-full" />
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 mb-5">
          <div className="p-3 bg-white rounded-2xl shadow-lg mb-2.5 flex items-center justify-center">
            <QRCodeSVG
              id="upi-qr-code"
              value={upiUri}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Save QR to Gallery</span>
          </button>
        </div>


        {/* Step-by-Step Instructions */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-neutral-300 space-y-2 mb-5">
          <div className="flex items-start gap-2">
            <span className="font-mono text-cyan-400 font-bold">1.</span>
            <span>Complete transfer of exact <b>₹{amountRupees}</b> via GPay, PhonePe, or Paytm.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono text-cyan-400 font-bold">2.</span>
            <span>Find your <b>12-digit UPI Reference / UTR Number</b> on the receipt.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono text-cyan-400 font-bold">3.</span>
            <span>Paste your 12-digit UTR in the Telegram Bot to get your key instantly!</span>
          </div>
        </div>

        {/* Back to Bot Action */}
        <a
          href={telegramBotUrl}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
        >
          <Send size={14} className="text-cyan-400" />
          <span>Return to Telegram Bot (@{TELEGRAM_BOT_USERNAME})</span>
        </a>
      </div>

      {/* Security Footer */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>256-bit Encrypted Key Delivery • Instant Dispatch</span>
      </div>
    </div>
  );
}

export default function UpiPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
      </div>
    }>
      <UpiPayContent />
    </Suspense>
  );
}
