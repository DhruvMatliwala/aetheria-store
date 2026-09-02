'use client';

import { useState } from 'react';
import { Smartphone, Copy, Check, Send, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface SmsBridgeCardProps {
  adminToken: string;
}

export function SmsBridgeCard({ adminToken }: SmsBridgeCardProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Simulator states
  const [sampleSms, setSampleSms] = useState(
    'Dear SBI User, A/C ... credited by Rs 180.00 on 02Sep26 transfer from UPI/423819284719/Payment Ref No. 423819284719.'
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
    toast.success('Secret copied!');
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

      if (!res.ok || data.error) {
        toast.error(data.error || 'Simulation failed.');
      } else {
        toast.success(`Verified UTR: ${data.utr} (Amount: ₹${data.amount || 'N/A'})`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error executing test.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="bg-surface-800 border border-surface-600 rounded-2xl p-5 mb-8 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-700 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-base">24/7 Android Bank SMS Bridge</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Auto-fulfills orders at 3 AM while you sleep using your real incoming bank credit SMS.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 self-start md:self-auto"
        >
          <span>{showGuide ? 'Hide Setup Guide' : 'How to Setup MacroDroid'}</span>
          {showGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Webhook & Secret Details Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs font-mono">
        <div className="p-3 bg-surface-900 border border-surface-700 rounded-xl flex items-center justify-between gap-2">
          <div className="truncate">
            <span className="text-gray-500 block text-[10px] uppercase font-sans">Webhook URL</span>
            <span className="text-cyan-300 font-bold truncate block">{webhookUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-gray-300 transition-colors flex-shrink-0"
            title="Copy URL"
          >
            {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="p-3 bg-surface-900 border border-surface-700 rounded-xl flex items-center justify-between gap-2">
          <div className="truncate">
            <span className="text-gray-500 block text-[10px] uppercase font-sans">Bridge Secret</span>
            <span className="text-amber-300 font-bold truncate block">{bridgeSecret}</span>
          </div>
          <button
            type="button"
            onClick={handleCopySecret}
            className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-gray-300 transition-colors flex-shrink-0"
            title="Copy Secret"
          >
            {copiedSecret ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* MacroDroid Setup Guide (Collapsible) */}
      {showGuide && (
        <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl mb-4 text-xs text-gray-300 space-y-2">
          <p className="font-bold text-cyan-300">📱 2-Minute Setup in MacroDroid (Free on Play Store):</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-300">
            <li>Open <strong>MacroDroid</strong> & tap <strong>Add Macro</strong>.</li>
            <li>
              <strong>Trigger</strong>: Tap (+), choose <strong>SMS Received</strong> &rarr; Select incoming from your bank (e.g., SBI, HDFC, ICICI, etc.).
            </li>
            <li>
              <strong>Action</strong>: Tap (+), choose <strong>HTTP Request</strong>:
              <ul className="list-disc list-inside pl-4 pt-1 space-y-0.5 text-gray-400 font-mono text-[11px]">
                <li>Method: <strong>POST</strong></li>
                <li>URL: <code className="text-cyan-300">{webhookUrl}</code></li>
                <li>Content Type: <strong>application/json</strong></li>
                <li>
                  Body: <code className="text-amber-300">&#123;&quot;secret&quot;:&quot;{bridgeSecret}&quot;, &quot;message&quot;:&quot;[sms_body]&quot;&#125;</code>
                </li>
              </ul>
            </li>
            <li>Save the Macro. That’s it! Now every time money enters your bank, your phone tells AETHERIA in 1 second!</li>
          </ol>
        </div>
      )}

      {/* Test Simulator */}
      <form onSubmit={handleSimulate} className="space-y-2 pt-1">
        <label className="block text-xs font-semibold text-gray-300">
          <Zap size={13} className="inline mr-1 text-cyan-400" />
          Test Bank SMS Parser & Matcher
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={sampleSms}
            onChange={(e) => setSampleSms(e.target.value)}
            placeholder="Paste raw bank SMS text..."
            className="flex-1 bg-surface-900 border border-surface-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={simulating}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md flex-shrink-0 disabled:opacity-50"
          >
            <Send size={13} />
            <span>{simulating ? 'Testing...' : 'Simulate SMS'}</span>
          </button>
        </div>

        {simResult && (
          <div className="p-3 bg-surface-900 border border-surface-700 rounded-xl text-xs font-mono mt-2">
            <span className="text-gray-400 block text-[10px]">PARSER OUTPUT:</span>
            <pre className="text-emerald-300 mt-1 whitespace-pre-wrap">
              {JSON.stringify(simResult, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
}
