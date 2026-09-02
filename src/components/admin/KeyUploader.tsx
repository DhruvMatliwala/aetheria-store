'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Key, Shield, Sparkles } from 'lucide-react';

interface UploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

interface KeyUploaderProps {
  adminToken: string;
  onUploadSuccess?: () => void;
}

export function KeyUploader({ adminToken, onUploadSuccess }: KeyUploaderProps) {
  const [rawKeys, setRawKeys] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    const keys = rawKeys
      .split(/[\n,]+/)
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
        body: JSON.stringify({ source: 'patreon_2slot', keys }),
      });

      const data = (await res.json()) as UploadResult & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Upload failed.');
      }

      setResult(data);
      setRawKeys('');
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsLoading(false);
    }
  }

  const detectedKeyCount = rawKeys.split(/[\n,]+/).filter((k) => k.trim()).length;

  return (
    <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-6 shadow-card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              Keys are encrypted at rest and automatically dispatched upon verified payment
            </p>
          </div>
        </div>

        {detectedKeyCount > 0 && (
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-3 py-1 rounded-xl">
            {detectedKeyCount} Key{detectedKeyCount > 1 ? 's' : ''} Detected
          </span>
        )}
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Keys Input Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Paste Keys (One key per line)
          </label>
          <textarea
            rows={7}
            value={rawKeys}
            onChange={(e) => setRawKeys(e.target.value)}
            placeholder={`e.g.&#10;XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY`}
            className="w-full bg-[#080e1a] border border-[#1b2b48] rounded-xl p-4 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
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
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
