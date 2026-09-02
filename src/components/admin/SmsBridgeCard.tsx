'use client';

import { useState } from 'react';
import { Smartphone, Copy, Check, Send, Zap, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface SmsBridgeCardProps {
  adminToken: string;
}

export function SmsBridgeCard({ adminToken }: SmsBridgeCardProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Simulator states
  const [sampleSms, setSampleSms] = useState(
    'Dear SBI User, A/C ... credited by Rs 180.14 on 02Sep26 transfer from UPI/423819284719/Payment Ref No. 423819284719.'
  );
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/upi`
      : 'https://aetheria-store.vercel.app/api/webhooks/upi';

  const bridgeSecret = adminToken || 'aetheria-sms-bridge-secret';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    toast.success('Webhook URL copied!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(bridgeSecret);
    setCopiedSecret(true);
    toast.success('Bridge Secret copied!');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleSms.trim()) return;

    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/webhooks/upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: bridgeSecret,
          message: sampleSms.trim(),
        }),
      });

      const data = await res.json();
      setSimResult(data);
      if (res.ok && data.matched) {
        toast.success(`Success! Order #${data.order_id} matched and key dispatched.`);
      } else if (res.ok) {
        toast('Webhook received (No pending order matched this exact paise amount).');
      } else {
        toast.error(data.error || 'Simulation failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Smartphone size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>24/7 Automated UPI Bank Bridge</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Zero-gateway-fee automated payment matching via your personal bank SMS
            </p>
          </div>
        </div>
      </div>

      {/* Connection Endpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Webhook Endpoint */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Your Webhook URL</span>
            <button
              onClick={handleCopyUrl}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {copiedUrl ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-[#080e1a] border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 break-all select-all">
            {webhookUrl}
          </div>
          <p className="text-[11px] text-slate-500">
            Enter this URL in your Android SMS Forwarder app target settings.
          </p>
        </div>

        {/* Bridge Secret */}
        <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Bridge Secret Token</span>
            <button
              onClick={handleCopySecret}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {copiedSecret ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-[#080e1a] border border-slate-800 rounded-xl p-3 font-mono text-xs text-white break-all select-all">
            {bridgeSecret}
          </div>
          <p className="text-[11px] text-slate-500">
            Pass this secret in your forwarder JSON payload to secure the webhook.
          </p>
        </div>
      </div>

      {/* Simulator Card */}
      <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Live SMS Match Simulator</h3>
        </div>
        <p className="text-xs text-slate-400">
          Simulate an incoming bank SMS to test your regex parser, paise matching, and automated key delivery.
        </p>

        <form onSubmit={handleSimulate} className="space-y-3">
          <textarea
            rows={2}
            value={sampleSms}
            onChange={(e) => setSampleSms(e.target.value)}
            className="w-full bg-[#080e1a] border border-[#1b2b48] rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={simulating}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Test SMS Webhook</span>
                </>
              )}
            </button>
          </div>
        </form>

        {simResult && (
          <div className="p-3.5 bg-[#080e1a] rounded-xl border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <span>Status:</span>
              <span className={simResult.matched ? 'text-emerald-400' : 'text-slate-300'}>
                {simResult.matched ? 'Order Matched & Key Delivered' : 'Parsed Successfully (No matching pending order)'}
              </span>
            </div>
            {simResult.parsed && (
              <p className="text-slate-400">
                Detected Amount: ₹{(simResult.parsed.amount / 100).toFixed(2)} • Ref:{' '}
                {simResult.parsed.reference || 'N/A'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
