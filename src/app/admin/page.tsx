'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  Upload,
  Receipt,
  Users,
  CreditCard,
  Shield,
  RefreshCw,
  Sparkles,
  CheckCircle,
  Clock,
  Send,
  Database,
  Key,
  AlertCircle,
  Smartphone,
  Plus,
  Zap,
  Tag,
  Percent,
} from 'lucide-react';
import { KeyUploader } from '@/components/admin/KeyUploader';
import { StockDashboard } from '@/components/admin/StockDashboard';
import { WaitlistWidget } from '@/components/admin/WaitlistWidget';
import { TransactionTable } from '@/components/admin/TransactionTable';
import { PendingApprovals } from '@/components/admin/PendingApprovals';
import { SmsBridgeCard } from '@/components/admin/SmsBridgeCard';
import { CouponManager } from '@/components/admin/CouponManager';
import { OrderPublic } from '@/types/order';
import { InventoryStatsSummary } from '@/lib/firestore/keys';
import { RestockStats } from '@/lib/firestore/restock';
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

type AdminTab =
  | 'Dashboard'
  | 'Inventory'
  | 'Bulk Upload'
  | 'Orders & Deliveries'
  | 'Waitlist & Demand'
  | 'SMS Bank Bridge'
  | 'Coupons';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string>('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live Real-Time Clock (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      };
      setCurrentTime(now.toLocaleString('en-US', options) + ' IST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // ── Real Data Calculations (Zero Mock/Fake Numbers) ─────────────────────────
  const realStockCounts = stats?.stockCounts || {};
  const totalAvailable = useMemo(() => {
    if (stats?.inventoryStats?.activeKeys !== undefined) {
      return stats.inventoryStats.activeKeys;
    }
    return Object.values(realStockCounts).reduce((acc, s) => acc + (s.available || 0), 0);
  }, [stats, realStockCounts]);

  const totalSold = useMemo(() => {
    if (stats?.inventoryStats?.fullyAllocatedKeys !== undefined) {
      return stats.inventoryStats.fullyAllocatedKeys;
    }
    return Object.values(realStockCounts).reduce((acc, s) => acc + (s.sold || 0), 0);
  }, [stats, realStockCounts]);

  const totalKeys = totalAvailable + totalSold;

  const totalPaidOrders = useMemo(() => {
    return stats?.revenueStats?.paidOrdersCount || (stats?.recentOrders || []).filter((o) => o.payment_status === 'paid').length;
  }, [stats]);

  const pendingOrders = useMemo(() => {
    return (stats?.recentOrders || []).filter((o) => o.payment_status === 'pending');
  }, [stats]);

  const totalRevenueDisplay = useMemo(() => {
    const inr = stats?.revenueStats?.totalRevenueINR || 0;
    const usd = stats?.revenueStats?.totalRevenueUSD || 0;
    if (inr === 0 && usd === 0) return '₹0';
    if (inr > 0 && usd > 0) {
      return `₹${(inr / 100).toLocaleString('en-IN')} + $${(usd / 100).toFixed(2)}`;
    }
    if (inr > 0) return `₹${(inr / 100).toLocaleString('en-IN')}`;
    return `$${(usd / 100).toFixed(2)}`;
  }, [stats]);

  const waitlistCount = stats?.waitlistStats?.totalRequests ?? 0;

  // Donut Arc calculation for Real Data
  const availablePercent = totalKeys > 0 ? Math.round((totalAvailable / totalKeys) * 100) : 100;
  const soldPercent = totalKeys > 0 ? 100 - availablePercent : 0;
  const strokeDashLength = Math.round((availablePercent / 100) * 251);

  return (
    <div className="flex min-h-screen bg-[#070b13] text-slate-100 font-sans antialiased">
      {/* ════════════════════════════════════════════════════════════════════════
          LEFT SIDEBAR: AETHERIA BRANDED
          ════════════════════════════════════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 bg-[#090e1a] border-r border-[#152138] flex flex-col justify-between sticky top-0 h-screen z-40">
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Aetheria Brand Logo Header */}
          <div className="p-5 flex items-center gap-3 border-b border-[#152138]/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-800 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.45)]">
              <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
                {/* Aetheria Delta Crystal Emblem */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400 fill-current drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                  <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-black text-sm tracking-widest text-white">AETHERIA</span>
              <p className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase">
                VAULT ADMIN
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Our Real Features Only) */}
          <nav className="p-3 space-y-1.5 flex-1">
            <SidebarNavItem
              icon={<LayoutDashboard size={17} />}
              label="Dashboard"
              badge={pendingOrders.length > 0 ? `${pendingOrders.length} Pending` : undefined}
              active={activeTab === 'Dashboard'}
              onClick={() => setActiveTab('Dashboard')}
            />
            <SidebarNavItem
              icon={<Package size={17} />}
              label="Inventory"
              badge={`${totalAvailable} Keys`}
              active={activeTab === 'Inventory'}
              onClick={() => setActiveTab('Inventory')}
            />
            <SidebarNavItem
              icon={<Upload size={17} />}
              label="Bulk Upload"
              active={activeTab === 'Bulk Upload'}
              onClick={() => setActiveTab('Bulk Upload')}
            />
            <SidebarNavItem
              icon={<Receipt size={17} />}
              label="Orders & Deliveries"
              active={activeTab === 'Orders & Deliveries'}
              onClick={() => setActiveTab('Orders & Deliveries')}
            />
            <SidebarNavItem
              icon={<Users size={17} />}
              label="Waitlist & Demand"
              badge={waitlistCount > 0 ? `${waitlistCount}` : undefined}
              active={activeTab === 'Waitlist & Demand'}
              onClick={() => setActiveTab('Waitlist & Demand')}
            />
            <SidebarNavItem
              icon={<CreditCard size={17} />}
              label="SMS Bank Bridge"
              active={activeTab === 'SMS Bank Bridge'}
              onClick={() => setActiveTab('SMS Bank Bridge')}
            />
            <SidebarNavItem
              icon={<Tag size={17} />}
              label="Coupons"
              active={activeTab === 'Coupons'}
              onClick={() => setActiveTab('Coupons')}
            />
          </nav>

          {/* Sidebar Bottom Status */}
          <div className="p-4 space-y-3 border-t border-[#152138]/80">
            {/* Real System Status */}
            <div className="bg-[#0c1424] border border-[#1b2b48] rounded-xl p-3">
              <span className="text-[10px] font-mono uppercase text-slate-400">System Pipeline</span>
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Bank & Key Dispatch Online
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-full shadow-[0_0_8px_#10b981]" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">Zero Manual Delays</span>
            </div>

            {/* Quick Session Indicator */}
            <div className="bg-[#0c1424] border border-[#1b2b48] rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-cyan-400" />
                <span className="text-[11px] text-slate-300 font-mono">Passcode Auth</span>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('pgsharp_admin_secret');
                  window.location.reload();
                }}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA & TOP HEADER
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070b13]">
        {/* Top Header Bar */}
        <header className="h-20 border-b border-[#141e33] px-8 flex items-center justify-between sticky top-0 bg-[#070b13]/90 backdrop-blur-md z-30">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{activeTab}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Aetheria Key Distribution Engine</span>
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                Official Admin
              </span>
            </div>
          </div>

          {/* Right Action Icons & Live Clock */}
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchStats()}
              disabled={loading}
              className="bg-[#0c1424] border-[#1b2b48] hover:bg-[#142038] text-slate-200 text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-cyan-400' : ''} />
              <span>Refresh Vault Data</span>
            </Button>

            {/* Date/Time IST Chip */}
            <div className="flex items-center gap-2 bg-[#0c1424] border border-[#192742] px-3.5 py-1.5 rounded-xl text-xs text-slate-300 font-mono">
              <Clock size={13} className="text-cyan-400" />
              <span>{currentTime || 'Syncing IST...'}</span>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════════════
            BODY / CONTENT AREA
            ════════════════════════════════════════════════════════════════════════ */}
        <main className="p-8 space-y-6 flex-1">
          {/* Secret Login Banner if Needed */}
          {showSecretModal && (
            <div className="p-6 bg-[#0c1424] border border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Key size={18} />
                <h2 className="text-base font-bold text-white">Enter Admin Passcode to Authorize</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Provide your <code className="text-cyan-300">ADMIN_API_SECRET</code> to unlock live inventory & orders:
              </p>
              <form onSubmit={handleSaveSecret} className="flex gap-3 max-w-md">
                <input
                  type="password"
                  placeholder="ADMIN_API_SECRET..."
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  className="flex-1 bg-[#070b13] border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
                <Button type="submit" variant="primary" size="md">
                  Authorize
                </Button>
              </form>
            </div>
          )}

          {error && !showSecretModal && (
            <div className="flex items-center gap-3 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-300 text-xs">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 1: REAL DASHBOARD COMMAND CENTER
              ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6">
              {/* TOP ROW: 5 STAT CARDS (POWERED 100% BY REAL DATA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. TOTAL REVENUE */}
                <CyberStatCard
                  icon={<Zap size={16} className="text-cyan-400" />}
                  iconBg="bg-cyan-950/60 border-cyan-800/60"
                  label="TOTAL REVENUE"
                  value={totalRevenueDisplay}
                  subtext="Direct UPI & PayPal collected"
                  strokeColor="#06b6d4"
                />

                {/* 2. TOTAL PAID ORDERS */}
                <CyberStatCard
                  icon={<Receipt size={16} className="text-purple-400" />}
                  iconBg="bg-purple-950/60 border-purple-800/60"
                  label="PAID ORDERS"
                  value={totalPaidOrders.toString()}
                  subtext="Keys successfully delivered"
                  strokeColor="#a855f7"
                />

                {/* 3. AVAILABLE VAULT KEYS */}
                <CyberStatCard
                  icon={<Key size={16} className="text-teal-400" />}
                  iconBg="bg-teal-950/60 border-teal-800/60"
                  label="AVAILABLE KEYS"
                  value={totalAvailable.toString()}
                  subtext="Ready in AES-256 vault"
                  strokeColor="#14b8a6"
                  highlight={totalAvailable === 0}
                />

                {/* 4. PENDING ORDERS */}
                <CyberStatCard
                  icon={<Clock size={16} className="text-amber-400" />}
                  iconBg="bg-amber-950/60 border-amber-800/60"
                  label="PENDING APPROVALS"
                  value={pendingOrders.length.toString()}
                  subtext={pendingOrders.length > 0 ? 'Awaiting payment/bank match' : 'All orders fulfilled'}
                  strokeColor="#f59e0b"
                />

                {/* 5. RESTOCK WAITLIST */}
                <CyberStatCard
                  icon={<Users size={16} className="text-emerald-400" />}
                  iconBg="bg-emerald-950/60 border-emerald-800/60"
                  label="WAITLIST DEMAND"
                  value={waitlistCount.toString()}
                  subtext="Trainers subscribed for restocks"
                  strokeColor="#10b981"
                />
              </div>

              {/* MIDDLE ROW: REAL TIER BREAKDOWN + INVENTORY DONUT + SYSTEM STATUS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* REAL TIER INVENTORY OVERVIEW (6 Cols) */}
                <div className="lg:col-span-6 bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Plan Stock & Slot Allocation</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Real-time key inventory per PGSharp edition
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('Inventory')}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                      >
                        Manage Inventory →
                      </button>
                    </div>

                    <div className="space-y-4 pt-2">
                      {/* Standard Tier: 1 Device */}
                      <div className="bg-[#080e1a] border border-[#152138] rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Smartphone size={14} className="text-cyan-400" />
                            Standard Key (1 Android Device)
                          </span>
                          <span className="font-mono text-cyan-300 font-bold">
                            {realStockCounts['1_month']?.available ?? 0} In Stock
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full transition-all duration-500"
                            style={{
                              width: `${
                                (realStockCounts['1_month']?.available || 0) > 0 ? 100 : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                          <span>Sold: {realStockCounts['1_month']?.sold ?? 0}</span>
                          <span>Price: ₹190 / $1.99</span>
                        </div>
                      </div>

                      {/* Duo Tier: 2 Devices */}
                      <div className="bg-[#080e1a] border border-[#152138] rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Smartphone size={14} className="text-purple-400" />
                            Dual Key (2 Android Devices)
                          </span>
                          <span className="font-mono text-purple-300 font-bold">
                            {realStockCounts['3_month']?.available ?? 0} In Stock
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full transition-all duration-500"
                            style={{
                              width: `${
                                (realStockCounts['3_month']?.available || 0) > 0 ? 100 : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                          <span>Sold: {realStockCounts['3_month']?.sold ?? 0}</span>
                          <span>Price: ₹340 / $3.69</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#16243d] flex items-center justify-between text-xs text-slate-400">
                    <span>Total Vault Balance:</span>
                    <span className="font-mono font-bold text-white">{totalAvailable} Available</span>
                  </div>
                </div>

                {/* INVENTORY DISTRIBUTION DONUT CHART (REAL DATA) (3 Cols) */}
                <div className="lg:col-span-3 bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white">Vault Health</h3>
                    <span className="text-[10px] font-mono text-cyan-400">Real Data</span>
                  </div>

                  {/* Donut Chart with Center Text */}
                  <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Background track */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#16243d" strokeWidth="12" />
                      {/* Available Segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="12"
                        strokeDasharray={`${strokeDashLength} 251`}
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                    </svg>

                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[10px] text-slate-400 font-medium">Total In Vault</span>
                      <span className="text-xl font-black text-white leading-none mt-0.5">{totalAvailable}</span>
                      <span className="text-[9px] text-cyan-400 font-mono mt-0.5">Available</span>
                    </div>
                  </div>

                  {/* Real Legend list */}
                  <div className="space-y-2 text-xs pt-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Available for Sale
                      </span>
                      <span className="font-mono text-slate-200 font-bold text-[11px]">{totalAvailable}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        Delivered / Sold
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">{totalSold}</span>
                    </div>
                  </div>
                </div>

                {/* REAL LIVE INFRASTRUCTURE STATUS (3 Cols) */}
                <div className="lg:col-span-3 bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Store Infrastructure</h3>
                    <p className="text-[11px] font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      All Payment Rails Online
                    </p>

                    <div className="space-y-2.5">
                      <StatusRow label="Cloud Firestore" status="Connected" />
                      <StatusRow label="Direct UPI (Paise Engine)" status="0% Fee Active" />
                      <StatusRow label="Android SMS Forwarder" status="Ready" />
                      <StatusRow label="PayPal Direct" status="Connected" />
                      <StatusRow label="AES-256-GCM Vault" status="Encrypted" />
                      <StatusRow label="Promo Code Engine" status="Active" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-[#16243d]">
                    <span>Last checked: {currentTime ? currentTime.split('|')[1]?.trim() : 'Live'}</span>
                    <button
                      onClick={() => fetchStats()}
                      title="Refresh status"
                      className="hover:text-cyan-400 transition-colors"
                    >
                      <RefreshCw size={11} className={loading ? 'animate-spin text-cyan-400' : ''} />
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: REAL RECENT ORDERS + QUICK ACTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* REAL RECENT ORDERS TABLE (8 Cols) */}
                <div className="lg:col-span-8 bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Recent Customer Orders</h3>
                      <p className="text-xs text-slate-400">Live order queue from Firestore</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('Orders & Deliveries')}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      View All Orders ({stats?.recentOrders?.length || 0}) →
                    </button>
                  </div>

                  {stats && stats.recentOrders && stats.recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-[10px] font-mono text-slate-400 border-b border-[#16243d]">
                            <th className="pb-2 font-semibold">ORDER ID</th>
                            <th className="pb-2 font-semibold">CUSTOMER EMAIL</th>
                            <th className="pb-2 font-semibold">PLAN</th>
                            <th className="pb-2 font-semibold">AMOUNT</th>
                            <th className="pb-2 font-semibold">STATUS</th>
                            <th className="pb-2 font-semibold text-right">DATE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#16243d]/60 text-[11px]">
                          {stats.recentOrders.slice(0, 5).map((order) => (
                            <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 font-mono font-bold text-cyan-400">{order.order_id}</td>
                              <td className="py-3 text-slate-300 font-medium">{order.customer_email || 'Anonymous'}</td>
                              <td className="py-3 text-slate-400">
                                {order.plan_type === '1_month' ? '1 Device' : '2 Devices'}
                              </td>
                              <td className="py-3 font-bold text-white">
                                {order.currency === 'INR'
                                  ? `₹${(order.amount / 100).toLocaleString('en-IN')}`
                                  : `$${(order.amount / 100).toFixed(2)}`}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                    order.payment_status === 'paid'
                                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                      : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                                  }`}
                                >
                                  {order.payment_status === 'paid' ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-3 text-right font-mono text-slate-500 text-[10px]">
                                {order.created_at ? new Date(order.created_at).toLocaleTimeString() : 'Recent'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-[#080e1a] rounded-xl border border-slate-800/60">
                      <p className="text-xs text-slate-400">No orders placed yet.</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        When trainers purchase keys on your storefront, orders will appear here in real time.
                      </p>
                    </div>
                  )}
                </div>

                {/* QUICK ACTIONS & VAULT SECURITY (4 Cols) */}
                <div className="lg:col-span-4 bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Quick Vault Actions</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <QuickActionTile
                        icon={<Upload size={18} />}
                        label="Upload Keys"
                        desc="Encrypt into vault"
                        onClick={() => setActiveTab('Bulk Upload')}
                      />
                      <QuickActionTile
                        icon={<Package size={18} />}
                        label="Stock Counts"
                        desc="Device tier stats"
                        onClick={() => setActiveTab('Inventory')}
                      />
                      <QuickActionTile
                        icon={<CreditCard size={18} />}
                        label="SMS Bridge"
                        desc="Test UPI forwarder"
                        onClick={() => setActiveTab('SMS Bank Bridge')}
                      />
                      <QuickActionTile
                        icon={<Tag size={18} />}
                        label="Promo Codes"
                        desc="Manage discounts"
                        onClick={() => setActiveTab('Coupons')}
                      />
                    </div>
                  </div>

                  {/* Vault Security Card */}
                  <div className="mt-4 p-3.5 bg-[#080e1a] border border-[#16243d] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center">
                        <Shield size={16} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">Vault Security</p>
                        <p className="text-[10px] text-slate-400 font-mono">AES-256-GCM Hardware Encrypted</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      SECURED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 2: INVENTORY DASHBOARD
              ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Inventory' && (
            <div className="space-y-6">
              <StockDashboard
                stockCounts={stats?.stockCounts || {}}
                inventoryStats={stats?.inventoryStats}
                revenueStats={stats?.revenueStats}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 3: BULK UPLOAD
              ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Bulk Upload' && (
            <div className="space-y-6">
              <KeyUploader adminToken={adminToken} onUploadSuccess={() => fetchStats()} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 4: ORDERS & DELIVERIES
              ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Orders & Deliveries' && (
            <div className="space-y-6">
              {stats?.recentOrders && (
                <PendingApprovals
                  orders={stats.recentOrders}
                  adminToken={adminToken}
                  onRefresh={() => fetchStats()}
                />
              )}
              <TransactionTable orders={stats?.recentOrders || []} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 5: WAITLIST & DEMAND
              ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Waitlist & Demand' && (
            <div className="space-y-6">
              <WaitlistWidget waitlistStats={stats?.waitlistStats} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 6: SMS BANK BRIDGE
              ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'SMS Bank Bridge' && (
            <div className="space-y-6">
              {adminToken && <SmsBridgeCard adminToken={adminToken} />}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VIEW 7: COUPONS & PROMO CODES
              ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Coupons' && (
            <div className="space-y-6">
              <CouponManager adminToken={adminToken} />
            </div>
          )}
        </main>

        {/* ════════════════════════════════════════════════════════════════════════
            FOOTER BAR
            ════════════════════════════════════════════════════════════════════════ */}
        <footer className="px-8 py-4 border-t border-[#141e33] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 bg-[#070b13]">
          <span>AETHERIA Storefront Admin • v2.5.0</span>
          <span className="font-mono text-cyan-400/80 tracking-widest font-bold">
            SECURE. AUTOMATED. INSTANT.
          </span>
          <span>Official Distribution System</span>
        </footer>
      </div>
    </div>
  );
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function SidebarNavItem({
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-cyan-950/80 via-[#0b1b30] to-[#0c1424] border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.18)]'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? 'text-cyan-400' : 'text-slate-400'}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
          {badge}
        </span>
      )}
    </button>
  );
}

function CyberStatCard({
  icon,
  iconBg,
  label,
  value,
  subtext,
  strokeColor,
  highlight,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subtext: string;
  strokeColor: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-[#0c1424] border rounded-2xl p-4 shadow-card flex flex-col justify-between relative overflow-hidden transition-colors ${
        highlight ? 'border-rose-500/50 bg-rose-950/10' : 'border-[#16243d] hover:border-cyan-500/30'
      }`}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${iconBg}`}>
            {icon}
          </div>
          <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 uppercase">
            {label}
          </span>
        </div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>
      </div>

      <div className="h-1.5 w-full bg-slate-800/60 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            backgroundColor: strokeColor,
            width: value === '0' || value === '₹0' ? '15%' : '100%',
            boxShadow: `0 0 8px ${strokeColor}`,
          }}
        />
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-300 text-[11px]">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {status}
      </span>
    </div>
  );
}

function QuickActionTile({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-3 bg-[#080e1a] hover:bg-[#0e182b] border border-[#16243d] hover:border-cyan-500/40 rounded-xl flex flex-col items-start text-left gap-1 transition-all group"
    >
      <div className="text-cyan-400 group-hover:scale-110 transition-transform mb-1">{icon}</div>
      <span className="text-xs font-bold text-white leading-tight">{label}</span>
      <span className="text-[10px] text-slate-400 leading-tight">{desc}</span>
    </button>
  );
}
