'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Smartphone, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

  const SLOTS_PER_KEY = 2; // All keys are 2-slot Patreon keys

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    // Parse keys: split by newlines and commas, filter empty
    const keys = rawKeys
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      setError('No valid keys found. Enter one key per line.');
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
  const potentialSlots = detectedKeyCount * SLOTS_PER_KEY;

  return (
    <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-900/60 border border-brand-700/50 flex items-center justify-center">
          <Upload size={18} className="text-brand-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Bulk Upload Patreon License Keys</h2>
          <p className="text-gray-400 text-sm">
            Import standard Patreon 2-slot keys with automated vault encryption.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Capacity Info Pill */}
        <div className="flex items-center justify-between p-3.5 bg-surface-900/90 border border-surface-700 rounded-2xl text-xs text-gray-300">
          <div className="flex items-center gap-2.5">
            <Smartphone size={15} className="text-brand-400" />
            <span>
              Key Specification:{' '}
              <strong className="text-white">Patreon License Key (2 Android Device Slots per key)</strong>
            </span>
          </div>
          {detectedKeyCount > 0 && (
            <span className="text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              + {potentialSlots} Usable Slots
            </span>
          )}
        </div>

        {/* Keys textarea */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5" htmlFor="upload-keys">
            License Keys (one key per line)
          </label>
          <textarea
            id="upload-keys"
            value={rawKeys}
            onChange={(e) => setRawKeys(e.target.value)}
            placeholder={'XXXX-XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY-YYYY\n...'}
            rows={7}
            className="w-full bg-surface-900 border border-surface-600 rounded-2xl px-4 py-3 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-y"
          />
          <p className="text-xs text-gray-500 mt-1.5 flex items-center justify-between">
            <span>{detectedKeyCount} key(s) detected • {potentialSlots} total usable slots</span>
            <span className="text-[11px] text-gray-400">Encrypted before Firestore storage</span>
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-sm text-red-300">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Result notification */}
        {result && (
          <div className="flex items-start gap-2 bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 text-sm text-emerald-300">
            <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Upload complete!</p>
              <p>
                ✅ {result.inserted} keys inserted ({result.inserted * SLOTS_PER_KEY} device slots added) · ⏭️ {result.skipped} skipped
              </p>
              {result.errors.length > 0 && (
                <p className="text-red-300 mt-1">{result.errors.length} errors encountered</p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full font-bold shadow-glow-sm"
          id="upload-keys-btn"
        >
          <Upload size={16} />
          Upload & Encrypt Patreon Keys
        </Button>
      </form>
    </div>
  );
}
