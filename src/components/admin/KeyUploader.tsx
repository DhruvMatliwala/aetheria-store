'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Key, Shield, Sparkles, Mail, Radio } from 'lucide-react';
import toast from 'react-hot-toast';
import { TELEGRAM_PROOF_CHANNEL } from '@/lib/constants';

interface UploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
  restockAnnounced?: boolean;
}

interface KeyUploaderProps {
  adminToken: string;
  onUploadSuccess?: () => void;
}

export function KeyUploader({ adminToken, onUploadSuccess }: KeyUploaderProps) {
  const [rawKeys, setRawKeys] = useState('');
  const [patreonEmail, setPatreonEmail] = useState('');
  const [announceInChannel, setAnnounceInChannel] = useState(true);
  const [broadcastingManual, setBroadcastingManual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleManualAnnounce() {
    setBroadcastingManual(true);
    try {
      const res = await fetch('/api/admin/keys?action=announce', {
        headers: { 'x-admin-secret': adminToken },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`📢 Restock alert sent to ${TELEGRAM_PROOF_CHANNEL}!`);
      } else {
        toast.error(data.error || 'Failed to send restock alert.');
      }
    } catch (err) {
      toast.error('Network error sending restock alert.');
    } finally {
      setBroadcastingManual(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    const keys = rawKeys
      .split(/\r?\n+/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      setError('Please paste at least one valid license key.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify({
          source: 'patreon_3slot',
          keys,
          patreonEmail: patreonEmail.trim() || undefined,
          announceInChannel,
        }),
      });

      const data = (await res.json()) as UploadResult & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Upload failed.');
      }

      setResult(data);
      setRawKeys('');
      setPatreonEmail('');
      if (data.restockAnnounced) {
        toast.success(`📢 Restock alert posted to ${TELEGRAM_PROOF_CHANNEL}!`);
      }
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsLoading(false);
    }
  }

  const detectedKeyCount = rawKeys.split(/\r?\n+/).filter((k) => k.trim()).length;

  return (
    <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-6 shadow-card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Upload size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Bulk Upload License Keys</span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                AES-256-GCM
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Keys are encrypted at rest and automatically tagged with your Patreon source account
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {detectedKeyCount > 0 && (
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-3 py-1 rounded-xl">
              {detectedKeyCount} Key{detectedKeyCount > 1 ? 's' : ''} Detected
            </span>
          )}
          <button
            type="button"
            onClick={handleManualAnnounce}
            disabled={broadcastingManual}
            className="px-3 py-1.5 rounded-xl bg-[#070b13] border border-cyan-700/50 hover:border-cyan-500 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={`Post a restock announcement to ${TELEGRAM_PROOF_CHANNEL} channel right now`}
          >
            <Radio size={13} className={broadcastingManual ? 'animate-bounce text-amber-400' : 'text-cyan-400'} />
            <span>{broadcastingManual ? 'Broadcasting...' : 'Broadcast to Channel'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Patreon Source Email (Batch) */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Mail size={13} className="text-cyan-400" />
              <span>Patreon Source Email (Optional for this batch)</span>
            </span>
            <span className="text-[11px] text-cyan-400/80 font-normal">
              Tags all keys in this batch for 1-click device clearing
            </span>
          </label>
          <input
            type="email"
            value={patreonEmail}
            onChange={(e) => setPatreonEmail(e.target.value)}
            placeholder="e.g. pgsharpdeal60@gmail.com (or write inline per key below)"
            className="w-full bg-[#080e1a] border border-[#1b2b48] rounded-xl px-4 py-2.5 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Keys Input Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-400">
              Paste Keys (One key per line)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Format: KEY or KEY : email@example.com
            </span>
          </div>
          <textarea
            rows={7}
            value={rawKeys}
            onChange={(e) => setRawKeys(e.target.value)}
            placeholder={`e.g.&#10;XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY : account2@gmail.com&#10;ZZZZ-ZZZZ-ZZZZ-ZZZZ`}
            className="w-full bg-[#080e1a] border border-[#1b2b48] rounded-xl p-4 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Restock Announcement Checkbox */}
        <div className="bg-[#070b13]/60 border border-[#142238] rounded-xl p-3 flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={announceInChannel}
              onChange={(e) => setAnnounceInChannel(e.target.checked)}
              className="w-4 h-4 rounded bg-[#070b13] border-[#1b2b48] text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 font-medium">
              <span>📢 Post Restock Alert to</span>
              <span className="text-cyan-400 font-bold">{TELEGRAM_PROOF_CHANNEL}</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">(Creates instant customer FOMO)</span>
            </span>
          </label>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            Auto-Broadcast
          </span>
        </div>

        {/* Action Button & Security note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield size={14} className="text-cyan-400" />
            <span>Encrypted before saving to database. Duplicate keys are automatically ignored.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || detectedKeyCount === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Encrypting & Uploading...</span>
              </>
            ) : (
              <>
                <Key size={14} />
                <span>Encrypt & Add to Vault</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Notification */}
      {result && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-emerald-300">Upload Completed Successfully</p>
            <p className="text-emerald-400/90 mt-0.5">
              <strong>{result.inserted}</strong> key{result.inserted !== 1 ? 's' : ''} added to vault.{' '}
              {result.skipped > 0 && `(${result.skipped} duplicate keys skipped)`}
            </p>
            {result.restockAnnounced && (
              <p className="text-cyan-300 font-semibold mt-1 flex items-center gap-1.5">
                <span>📣</span>
                <span>Restock alert broadcasted live to <strong>{TELEGRAM_PROOF_CHANNEL}</strong>!</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-300">Upload Failed</p>
            <p className="text-rose-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
