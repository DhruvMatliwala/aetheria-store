'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  Upload,
  Receipt,
  Users,
  Shield,
  RefreshCw,
  Clock,
  Key,
  AlertCircle,
  Smartphone,
  Zap,
  Tag,
  CheckCircle,
  Plus,
  ArrowRight,
  Database,
  Menu,
  X,
  LogOut,
  Star,
  Bell,
  Crosshair,
} from 'lucide-react';
import { KeyUploader } from '@/components/admin/KeyUploader';
import { StockDashboard } from '@/components/admin/StockDashboard';
import { WaitlistWidget } from '@/components/admin/WaitlistWidget';
import { TransactionTable } from '@/components/admin/TransactionTable';
import { PendingApprovals } from '@/components/admin/PendingApprovals';
import { SmsBridgeCard } from '@/components/admin/SmsBridgeCard';
import { CouponManager } from '@/components/admin/CouponManager';
import { ReviewsManager } from '@/components/admin/ReviewsManager';
import { LeadRadarDashboard } from '@/components/admin/LeadRadarDashboard';
import { OrderPublic } from '@/types/order';
import { InventoryStatsSummary } from '@/lib/firestore/keys';
import { RestockStats } from '@/lib/firestore/restock';
import { Button } from '@/components/ui/Button';
import { getClientAuth } from '@/lib/firebase/client';
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
  | 'Lead Radar'
  | 'Inventory'
  | 'Bulk Upload'
  | 'Orders & Deliveries'
  | 'UPI Bank Bridge'
  | 'Coupons'
  | 'Waitlist & Demand'
  | 'Buyer Reviews';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string>('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [testingWebhook, setTestingWebhook] = useState(false);

  async function handleTestWebhook() {
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/admin/test-discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('🔔 Discord Webhook test sent! Check your channel.');
      } else {
        toast.error(data.error || 'Failed to send test alert. Check DISCORD_ADMIN_WEBHOOK_URL.');
      }
    } catch (err: any) {
      toast.error('Network error testing webhook.');
    } finally {
      setTestingWebhook(false);
    }
  }

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
    let token = '';

    if (typeof window !== 'undefined') {
      // 1. Check URL query param ?key=... or ?pass=...
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('key') || urlParams.get('pass');
      if (urlKey) {
        token = urlKey.trim();
        localStorage.setItem('pgsharp_admin_secret', token);
        sessionStorage.setItem('pgsharp_admin_secret', token);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else {
        token =
          localStorage.getItem('pgsharp_admin_secret') ||
          sessionStorage.getItem('pgsharp_admin_secret') ||
          '';
      }
    }

    setAdminToken(token);
    if (token) {
      fetchStats(token);
    } else {
      setShowSecretModal(true);
      setLoading(false);
    }
  }, []);

  async function fetchStats(tokenToUse?: string) {
    const token =
      tokenToUse ||
      adminToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('pgsharp_admin_secret') ||
          sessionStorage.getItem('pgsharp_admin_secret')
        : '') ||
      '';
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pgsharp_admin_secret');
            sessionStorage.removeItem('pgsharp_admin_secret');
          }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('pgsharp_admin_secret', cleanSecret);
      sessionStorage.setItem('pgsharp_admin_secret', cleanSecret);
    }
    setAdminToken(cleanSecret);
    setShowSecretModal(false);
    fetchStats(cleanSecret);
  }

  // ── Real Data Calculations ──────────────────────────────────────────────────
  const realStockCounts = stats?.stockCounts || {};

  const plan1Stock =
    realStockCounts['1_month_1_device']?.available ??
    realStockCounts['1_month']?.available ??
    stats?.inventoryStats?.tierStock?.['1_month_1_device'] ??
    0;
  const plan1Sold =
    realStockCounts['1_month_1_device']?.sold ??
    realStockCounts['1_month']?.sold ??
    stats?.revenueStats?.tierSales?.['1_month_1_device'] ??
    0;

  const plan2Stock =
    realStockCounts['1_month_2_device']?.available ??
    realStockCounts['3_month']?.available ??
    stats?.inventoryStats?.tierStock?.['1_month_2_device'] ??
    0;
  const plan2Sold =
    realStockCounts['1_month_2_device']?.sold ??
    realStockCounts['3_month']?.sold ??
    stats?.revenueStats?.tierSales?.['1_month_2_device'] ??
    0;

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

  const totalPaidOrders = useMemo(() => {
    return stats?.revenueStats?.paidOrdersCount || (stats?.recentOrders || []).filter((o) => o.payment_status === 'paid').length;
  }, [stats]);

  const pendingOrders = useMemo(() => {
    return (stats?.recentOrders || []).filter((o) => o.payment_status === 'pending' || o.payment_status === 'verifying');
  }, [stats]);

  const totalRevenueDisplay = useMemo(() => {
    const inr = stats?.revenueStats?.totalRevenueINR || 0;
    const usd = stats?.revenueStats?.totalRevenueUSD || 0;
    if (inr === 0 && usd === 0) return '₹0';
    if (inr > 0 && usd > 0) {
      return `₹${inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + $${usd.toFixed(2)}`;
    }
    if (inr > 0) return `₹${inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${usd.toFixed(2)}`;
  }, [stats]);

  const waitlistCount = stats?.waitlistStats?.totalRequests ?? 0;

  const navItems: {
    id: AdminTab;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = useMemo(
    () => [
      {
        id: 'Dashboard',
        label: 'Dashboard',
        mobileLabel: 'Overview',
        icon: <LayoutDashboard size={17} />,
        badge: pendingOrders.length > 0 ? `${pendingOrders.length} Pending` : undefined,
      },
      {
        id: 'Lead Radar',
        label: 'Lead Radar',
        mobileLabel: 'Radar',
        icon: <Crosshair size={17} className="text-amber-400 animate-pulse" />,
        badge: 'Live',
      },
      {
        id: 'Inventory',
        label: 'Inventory',
        mobileLabel: 'Stock',
        icon: <Package size={17} />,
        badge: `${totalAvailable} Keys`,
      },
      {
        id: 'Bulk Upload',
        label: 'Bulk Upload',
        mobileLabel: 'Add Keys',
        icon: <Upload size={17} />,
      },
      {
        id: 'Orders & Deliveries',
        label: 'Orders & Deliveries',
        mobileLabel: 'Orders',
        icon: <Receipt size={17} />,
        badge: stats?.recentOrders?.length ? `${stats.recentOrders.length}` : undefined,
      },
      {
        id: 'UPI Bank Bridge',
        label: 'UPI Bank Bridge',
        mobileLabel: 'Bank Bridge',
        icon: <Smartphone size={17} />,
        badge: '24/7 Auto',
      },
      {
        id: 'Coupons',
        label: 'Coupons',
        mobileLabel: 'Coupons',
        icon: <Tag size={17} />,
      },
      {
        id: 'Waitlist & Demand',
        label: 'Waitlist & Demand',
        mobileLabel: 'Waitlist',
        icon: <Users size={17} />,
        badge: waitlistCount > 0 ? `${waitlistCount}` : undefined,
      },
      {
        id: 'Buyer Reviews',
        label: 'Buyer Reviews',
        mobileLabel: 'Reviews',
        icon: <Star size={17} />,
      },
    ],
    [pendingOrders.length, totalAvailable, stats?.recentOrders?.length, waitlistCount]
  );

  async function handleSignOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pgsharp_admin_secret');
      sessionStorage.removeItem('pgsharp_admin_secret');
    }
    setAdminToken('');
    try {
      const auth = getClientAuth();
      await auth.signOut();
    } catch (err) {}
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // STRICT ZERO-LEAK GUARD
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-[#0c1424] border border-[#16243d] rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.25)] p-2 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Aetheria Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide">Aetheria Vault Locked</h2>
          <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
            Administrative access token required. Unauthenticated sessions cannot view orders, keys, or revenue.
          </p>

          <button
            onClick={() => setShowSecretModal(true)}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Enter Vault Key
          </button>
        </div>

        {showSecretModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0c1424] border border-[#1b2b48] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-base font-bold text-white mb-1">Enter Admin Passcode</h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">Input your KEY_ENCRYPTION_SECRET</p>
              <form onSubmit={handleSaveSecret} className="space-y-4">
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Paste admin secret..."
                  className="w-full bg-[#070b13] border border-[#1b2b48] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Unlock Portal
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col antialiased">
      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE SLIDE-OVER DRAWER
          ══════════════════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#090e1a] border-r border-[#152138] z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Drawer Brand Header */}
          <div className="p-4 flex items-center justify-between border-b border-[#152138]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-800 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.45)] overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-[#090e1a] rounded-[9px] flex items-center justify-center overflow-hidden p-0.5">
                  <Image
                    src="/logo.png"
                    alt="Aetheria Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <span className="font-black text-sm tracking-widest text-white">AETHERIA</span>
                <p className="text-[9px] font-mono tracking-wider text-cyan-400 font-bold uppercase">
                  VAULT ADMIN
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Navigation Tabs */}
          <nav className="p-3 space-y-1.5 flex-1">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                active={activeTab === item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
              />
            ))}
          </nav>

          {/* Drawer Bottom Status & Sign Out */}
          <div className="p-4 space-y-2.5 border-t border-[#152138]/80 bg-[#070b13]/50">
            <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Firestore Online</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">Ready</span>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-w-0">
        {/* ══════════════════════════════════════════════════════════════════════
            DESKTOP SIDEBAR (HIDDEN ON MOBILE)
            ══════════════════════════════════════════════════════════════════════ */}
        <aside className="hidden lg:flex lg:w-64 border-r border-[#141e33] bg-[#090e1a] flex-col justify-between flex-shrink-0 z-20">
          <div className="flex flex-col h-full">
            {/* Brand Header */}
            <div className="p-5 flex items-center gap-3 border-b border-[#152138]/80">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-800 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.45)] overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center overflow-hidden p-0.5">
                  <Image
                    src="/logo.png"
                    alt="Aetheria Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <span className="font-black text-sm tracking-widest text-white">AETHERIA</span>
                <p className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase">
                  VAULT ADMIN
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="p-3 space-y-1.5 flex-1">
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  active={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </nav>

            {/* Sidebar Bottom Status */}
            <div className="p-4 space-y-2.5 border-t border-[#152138]/80 bg-[#070b13]/50">
              <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firestore Online</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">Ready</span>
              </div>

              <div className="bg-[#0c1424] border border-[#1b2b48] rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-cyan-400" />
                  <span className="text-[11px] text-slate-300 font-mono">Admin Session</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════════════
            MAIN CONTENT AREA & TOP HEADER
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#070b13]">
          {/* Top Header Bar */}
          <header className="h-16 lg:h-20 border-b border-[#141e33] px-3.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 bg-[#070b13]/95 backdrop-blur-md z-30">
            {/* Left side: Hamburger button + Title */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#0c1424] border border-[#1b2b48] text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors relative flex-shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu size={18} />
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#070b13] animate-pulse" />
                )}
              </button>

              <div className="min-w-0">
                <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight truncate">
                  {activeTab}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 hidden sm:inline">Aetheria Key Distribution Engine</span>
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                    Official Admin
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Icons & Live Clock */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="bg-[#0c1424] border-[#1b2b48] hover:bg-[#142038] text-slate-200 text-xs px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5"
                title="Send a test ping to your Discord admin webhook"
              >
                <Bell size={13} className={testingWebhook ? 'animate-bounce text-amber-400' : 'text-amber-400'} />
                <span className="hidden sm:inline">{testingWebhook ? 'Testing...' : 'Test Webhook'}</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchStats()}
                disabled={loading}
                className="bg-[#0c1424] border-[#1b2b48] hover:bg-[#142038] text-slate-200 text-xs px-2.5 sm:px-3.5 py-1.5 flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
                <span className="hidden sm:inline">Refresh Vault Data</span>
              </Button>

              {/* Date/Time IST Chip (Hidden on small mobile) */}
              <div className="hidden md:flex items-center gap-2 bg-[#0c1424] border border-[#192742] px-3.5 py-1.5 rounded-xl text-xs text-slate-300 font-mono">
                <Clock size={13} className="text-cyan-400" />
                <span>{currentTime || 'Syncing IST...'}</span>
              </div>
            </div>
          </header>

          {/* Mobile Horizontal Quick-Tab Strip */}
          <div className="lg:hidden border-b border-[#141e33] bg-[#090e1a]/90 backdrop-blur px-3.5 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 flex-nowrap z-20">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                      : 'bg-[#0c1424] border border-[#16243d] text-slate-300 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-slate-950' : 'text-cyan-400'}>{item.icon}</span>
                  <span>{item.mobileLabel}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              BODY / CONTENT AREA
              ════════════════════════════════════════════════════════════════════ */}
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 flex-1 min-w-0">
            {error && (
              <div className="flex items-center gap-3 bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-rose-300 text-xs">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 1: CLEAN DASHBOARD OVERVIEW
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Dashboard' && (
              <div className="space-y-6">
                {/* 4 SPACIOUS CORE BUSINESS KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* 1. TOTAL REVENUE */}
                  <CyberStatCard
                    icon={<Zap size={18} className="text-cyan-400" />}
                    iconBg="bg-cyan-950/60 border-cyan-800/60"
                    label="TOTAL REVENUE"
                    value={totalRevenueDisplay}
                    subtext="Direct UPI & PayPal collected"
                    strokeColor="#06b6d4"
                  />

                  {/* 2. PAID ORDERS */}
                  <CyberStatCard
                    icon={<CheckCircle size={18} className="text-emerald-400" />}
                    iconBg="bg-emerald-950/60 border-emerald-800/60"
                    label="COMPLETED ORDERS"
                    value={totalPaidOrders.toString()}
                    subtext="Keys successfully delivered"
                    strokeColor="#10b981"
                  />

                  {/* 3. AVAILABLE VAULT KEYS */}
                  <CyberStatCard
                    icon={<Key size={18} className="text-teal-400" />}
                    iconBg="bg-teal-950/60 border-teal-800/60"
                    label="AVAILABLE KEYS"
                    value={totalAvailable.toString()}
                    subtext="Ready in encrypted vault"
                    strokeColor="#14b8a6"
                    highlight={totalAvailable === 0}
                  />

                  {/* 4. PENDING ORDERS */}
                  <CyberStatCard
                    icon={<Clock size={18} className="text-amber-400" />}
                    iconBg="bg-amber-950/60 border-amber-800/60"
                    label="PENDING APPROVALS"
                    value={pendingOrders.length.toString()}
                    subtext={pendingOrders.length > 0 ? 'Requires manual proof review' : 'All transactions cleared'}
                    strokeColor={pendingOrders.length > 0 ? '#f59e0b' : '#06b6d4'}
                    highlight={pendingOrders.length > 0}
                  />
                </div>

                {/* DIRECT PENDING APPROVAL ACTION CENTER (IF ANY ORDERS ARE PENDING) */}
                {pendingOrders.length > 0 && stats?.recentOrders && (
                  <PendingApprovals
                    orders={stats.recentOrders}
                    adminToken={adminToken}
                    onRefresh={() => fetchStats()}
                  />
                )}

                {/* 2-COLUMN OPERATIONAL WORKSPACE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT: RECENT CUSTOMER ORDERS TABLE (7 COLS) */}
                  <div className="lg:col-span-7 bg-[#0c1424] border border-[#16243d] rounded-2xl p-4 sm:p-6 shadow-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-white">Recent Customer Orders</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Live order queue from Firestore</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('Orders & Deliveries')}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>View All Orders ({stats?.recentOrders?.length || 0})</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      {stats && stats.recentOrders && stats.recentOrders.length > 0 ? (
                        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead>
                              <tr className="text-[10px] font-mono text-slate-400 border-b border-[#16243d]">
                                <th className="pb-2.5 font-semibold">ORDER ID</th>
                                <th className="pb-2.5 font-semibold">CUSTOMER EMAIL</th>
                                <th className="pb-2.5 font-semibold">PLAN</th>
                                <th className="pb-2.5 font-semibold">AMOUNT</th>
                                <th className="pb-2.5 font-semibold">STATUS</th>
                                <th className="pb-2.5 font-semibold text-right">DATE</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#16243d]/60 text-[11px]">
                              {stats.recentOrders.slice(0, 6).map((order) => (
                                <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="py-3 font-mono font-bold text-cyan-400">{order.order_id}</td>
                                  <td className="py-3 text-slate-300 font-medium">{order.customer_email || 'Anonymous'}</td>
                                  <td className="py-3 text-slate-400 font-mono">
                                    {order.plan_type?.includes('2_device') ? '2 Devices' : '1 Device'}
                                  </td>
                                  <td className="py-3 font-bold text-white font-mono">
                                    {order.currency === 'INR'
                                      ? `₹${(order.amount / 100).toLocaleString('en-IN')}`
                                      : `$${(order.amount / 100).toFixed(2)}`}
                                  </td>
                                  <td className="py-3">
                                    <span
                                      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                        order.payment_status === 'paid'
                                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                          : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'
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
                        <div className="py-12 text-center bg-[#080e1a] rounded-xl border border-slate-800/60">
                          <p className="text-xs text-slate-400">No orders placed yet.</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            When customers purchase keys, orders will appear here in real time.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: PLAN INVENTORY & QUICK RESTOCK (5 COLS) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* PLAN STOCK BREAKDOWN */}
                    <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-4 sm:p-6 shadow-card space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white">Live Plan Stock</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Inventory per active tier</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('Inventory')}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Standard Tier */}
                        <div className="bg-[#080e1a] border border-[#152138] rounded-xl p-4">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-white flex items-center gap-2">
                              <Smartphone size={15} className="text-cyan-400" />
                              Standard Key (1 Device)
                            </span>
                            <span className="font-mono text-cyan-300 font-bold text-sm">
                              {plan1Stock} In Stock
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full transition-all duration-500"
                              style={{
                                width: `${plan1Stock > 0 ? 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                            <span>Sold: {plan1Sold}</span>
                            <span>₹180 / $1.99</span>
                          </div>
                        </div>

                        {/* Dual Tier */}
                        <div className="bg-[#080e1a] border border-[#152138] rounded-xl p-4">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-white flex items-center gap-2">
                              <Smartphone size={15} className="text-purple-400" />
                              Dual Key (2 Devices)
                            </span>
                            <span className="font-mono text-purple-300 font-bold text-sm">
                              {plan2Stock} In Stock
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-500 h-full transition-all duration-500"
                              style={{
                                width: `${plan2Stock > 0 ? 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                            <span>Sold: {plan2Sold}</span>
                            <span>₹350 / $3.50</span>
                          </div>
                        </div>
                      </div>

                      {/* RESTOCK BUTTON */}
                      <div className="pt-3 border-t border-[#16243d] flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400">Total Vault Balance</p>
                          <p className="text-sm font-bold text-white font-mono">{totalAvailable} Keys Ready</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('Bulk Upload')}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                          <Plus size={14} />
                          <span>Upload Keys</span>
                        </button>
                      </div>
                    </div>

                    {/* PROMO CODES QUICK TILE */}
                    <div className="bg-[#0c1424] border border-[#16243d] rounded-2xl p-5 shadow-card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                          <Tag size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">VIP Promo Codes</p>
                          <p className="text-[11px] text-slate-400">Create secret discounts for buyers</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('Coupons')}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <span>Manage Codes</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 2: INVENTORY & STOCK
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Inventory' && (
              <div className="space-y-6">
                <StockDashboard
                  stockCounts={stats?.stockCounts || {}}
                  inventoryStats={stats?.inventoryStats}
                  revenueStats={stats?.revenueStats}
                />
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 3: BULK UPLOAD KEYS
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Bulk Upload' && (
              <div className="space-y-6">
                <KeyUploader adminToken={adminToken} onUploadSuccess={() => fetchStats()} />
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 4: ORDERS & DELIVERIES
                ════════════════════════════════════════════════════════════════ */}
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

            {/* ════════════════════════════════════════════════════════════════
                VIEW 5: 24/7 UPI BANK BRIDGE (SMS FORWARDER)
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'UPI Bank Bridge' && (
              <div className="space-y-6">
                {adminToken && <SmsBridgeCard adminToken={adminToken} />}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 6: COUPONS & DISCOUNTS
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Coupons' && (
              <div className="space-y-6">
                <CouponManager adminToken={adminToken} />
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 6: WAITLIST & DEMAND
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Waitlist & Demand' && (
              <div className="space-y-6">
                <WaitlistWidget waitlistStats={stats?.waitlistStats} />
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 7: BUYER REVIEWS MODERATION
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Buyer Reviews' && (
              <div className="space-y-6">
                <ReviewsManager adminToken={adminToken} />
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                VIEW 8: LEAD RADAR (INTERNET LEAD GENERATOR)
                ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Lead Radar' && (
              <div className="space-y-6">
                <LeadRadarDashboard adminToken={adminToken} />
              </div>
            )}
          </main>

          {/* ══════════════════════════════════════════════════════════════════
              FOOTER BAR
              ══════════════════════════════════════════════════════════════════ */}
          <footer className="px-8 py-4 border-t border-[#141e33] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 bg-[#070b13]">
            <span>AETHERIA Storefront Admin • v3.0</span>
            <span className="font-mono text-cyan-400/80 tracking-widest font-bold">
              SECURE. AUTOMATED. INSTANT.
            </span>
            <span>Official Distribution System</span>
          </footer>
        </div>
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
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
        active
          ? 'bg-cyan-950/60 border border-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] font-semibold'
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
      className={`bg-[#0c1424] border rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden transition-colors ${
        highlight ? 'border-amber-500/60 bg-amber-950/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-[#16243d] hover:border-cyan-500/30'
      }`}
    >
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${iconBg}`}>
            {icon}
          </div>
          <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 uppercase">
            {label}
          </span>
        </div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>
      </div>

      <div className="h-1.5 w-full bg-slate-800/60 rounded-full mt-4 overflow-hidden">
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
