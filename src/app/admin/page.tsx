'use client';

import { useState, useEffect } from 'react';
import { KeyUploader } from '@/components/admin/KeyUploader';
import { StockDashboard } from '@/components/admin/StockDashboard';
import { WaitlistWidget } from '@/components/admin/WaitlistWidget';
import { TransactionTable } from '@/components/admin/TransactionTable';
import { PendingApprovals } from '@/components/admin/PendingApprovals';
import { OrderPublic } from '@/types/order';
import { InventoryStatsSummary } from '@/lib/firestore/keys';
import { RestockStats } from '@/lib/firestore/restock';
import { RefreshCw, Key, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface StockData {
  available: number;
  sold: number;
  total: number;
}

interface RevenueStats {
  totalRevenueINR: number;
  totalRevenueUSD: number;
  paidOrdersCount: number;
  tierSales: Record<string, number>;
}

interface StatsResponse {
  inventoryStats?: InventoryStatsSummary;
  stockCounts: Record<string, StockData>;
  recentOrders: OrderPublic[];
  waitlistStats?: RestockStats;
  revenueStats?: RevenueStats;
}

export default function AdminPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string>('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('pgsharp_admin_secret') || '';
    setAdminToken(token);
    if (token) {
      fetchStats(token);
    } else {
      setShowSecretModal(true);
      setLoading(false);
    }
  }, []);

  async function fetchStats(tokenToUse?: string) {
    const token = tokenToUse || adminToken || sessionStorage.getItem('pgsharp_admin_secret') || '';
    if (!token) {
      setShowSecretModal(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-secret': token },
      });

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('pgsharp_admin_secret');
          setAdminToken('');
          setShowSecretModal(true);
          throw new Error('Invalid or expired admin secret. Please re-enter.');
        }
        throw new Error(`Server error: ${res.statusText}`);
      }

      const data = (await res.json()) as StatsResponse;
      setStats(data);
      setShowSecretModal(false);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load stats.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveSecret(e: React.FormEvent) {
    e.preventDefault();
    if (!secretInput.trim()) return;
    const cleanSecret = secretInput.trim();
    sessionStorage.setItem('pgsharp_admin_secret', cleanSecret);
    setAdminToken(cleanSecret);
    setShowSecretModal(false);
    fetchStats(cleanSecret);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Multi-Device Key Inventory, Customer Waitlist & Orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchStats()}
            disabled={loading}
            id="refresh-stats-btn"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Inline Secret Input if needed */}
      {showSecretModal && (
        <div className="p-6 bg-surface-800 border border-brand-500/50 rounded-2xl shadow-card">
          <div className="flex items-center gap-2 mb-2 text-brand-400">
            <Key size={18} />
            <h2 className="text-base font-bold text-white">Enter Admin API Secret to Load Data</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            To view private inventory metrics and execute bulk operations, provide your{' '}
            <code className="text-brand-300">ADMIN_API_SECRET</code>:
          </p>
          <form onSubmit={handleSaveSecret} className="flex gap-3 max-w-md">
            <input
              type="password"
              placeholder="ADMIN_API_SECRET..."
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              className="flex-1 bg-surface-900 border border-surface-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <Button type="submit" variant="primary" size="md">
              Connect
            </Button>
          </form>
        </div>
      )}

      {error && !showSecretModal && (
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actionable Pending Payment Verifications */}
      {stats && stats.recentOrders && (
        <PendingApprovals
          orders={stats.recentOrders}
          adminToken={adminToken}
          onRefresh={() => fetchStats()}
        />
      )}

      {/* Real-Time Demand & Waitlist Widget */}
      <section>
        {loading ? (
          <div className="h-44 rounded-3xl shimmer" />
        ) : (
          <WaitlistWidget waitlistStats={stats?.waitlistStats} />
        )}
      </section>

      {/* Stock Dashboard */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📦 Multi-Slot Inventory Overview</span>
          </h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl shimmer" />
            ))}
          </div>
        ) : stats ? (
          <StockDashboard
            stockCounts={stats.stockCounts}
            inventoryStats={stats.inventoryStats}
            revenueStats={stats.revenueStats}
          />
        ) : (
          <p className="text-gray-500 text-sm">No inventory data loaded yet.</p>
        )}
      </section>

      {/* Key Uploader */}
      <section>
        <KeyUploader adminToken={adminToken} onUploadSuccess={() => fetchStats()} />
      </section>

      {/* Transactions */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">🧾 Recent Orders & Deliveries</h2>
        {loading ? (
          <div className="h-64 rounded-2xl shimmer" />
        ) : stats ? (
          <TransactionTable orders={stats.recentOrders} />
        ) : null}
      </section>
    </div>
  );
}
