'use client';

import { useState, useEffect } from 'react';
import {
  Crosshair,
  RefreshCw,
  Send,
  ExternalLink,
  Copy,
  Check,
  Flame,
  Zap,
  Sliders,
  Sparkles,
  Search,
  Plus,
  X,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  Globe,
  Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface LeadItem {
  id: string;
  source: 'reddit' | 'web' | 'forum' | 'telegram';
  subSource?: string;
  author: string;
  title: string;
  body: string;
  url: string;
  timestamp: number;
  matchedKeywords: string[];
  intentLevel: 'HOT' | 'WARM';
}

interface RadarConfigData {
  discordWebhookUrl: string;
  storeUrl: string;
  scanIntervalSeconds: number;
  maxLeadAgeHours?: number;
  subreddits: string[];
  redditSearchQueries: string[];
  webSearchQueries?: string[];
  gamingForums?: string[];
  googleAlertRssUrls: string[];
  telegramChannels: string[];
  highIntentKeywords: string[];
  generalKeywords: string[];
  excludeKeywords: string[];
  pitchTemplates: {
    hot: string;
    warm: string;
  };
}

export function LeadRadarDashboard({ adminToken }: { adminToken: string }) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'HOT' | 'WARM'>('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<RadarConfigData | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [lastScanned, setLastScanned] = useState<Date | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New tag inputs
  const [newWebQuery, setNewWebQuery] = useState('');
  const [newForum, setNewForum] = useState('');
  const [newSubreddit, setNewSubreddit] = useState('');
  const [newGoogleAlert, setNewGoogleAlert] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Fetch initial config and recent leads
  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/admin/radar/config', {
        headers: { 'x-admin-secret': adminToken },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
      }
    } catch {
      // Quiet fail
    }
  }

  async function handleScan() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/radar/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads(data.leads || []);
        setLastScanned(new Date());
        if (data.newlyDispatched > 0) {
          toast.success(
            `📡 Whole-internet scan complete! Found ${data.totalCount} leads across Web, Forums & Reddit. Dispatched ${data.newlyDispatched} alert(s) to Discord!`
          );
        } else {
          toast.success(`📡 Scan complete! ${data.totalCount} active lead(s) discovered.`);
        }
      } else {
        toast.error(data.error || 'Failed to complete scan.');
      }
    } catch {
      toast.error('Network error during internet scan.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestWebhook() {
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/admin/radar/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('🧪 Test lead sent to Discord! Check your #leads channel.');
      } else {
        toast.error(data.error || 'Failed to send test alert.');
      }
    } catch {
      toast.error('Network error testing Discord alert.');
    } finally {
      setTestingWebhook(false);
    }
  }

  async function handleSaveConfig() {
    if (!config) return;
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/radar/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminToken,
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('💾 Radar configuration saved!');
        setShowSettings(false);
      } else {
        toast.error(data.error || 'Failed to save configuration.');
      }
    } catch {
      toast.error('Network error saving configuration.');
    } finally {
      setSavingConfig(false);
    }
  }

  function copyPitch(lead: LeadItem) {
    if (!config) return;
    const template = lead.intentLevel === 'HOT' ? config.pitchTemplates.hot : config.pitchTemplates.warm;
    const pitch = template
      .replace('{author}', lead.author || 'there')
      .replace('{storeUrl}', config.storeUrl || 'https://aetheria-store.vercel.app');

    navigator.clipboard.writeText(pitch);
    setCopiedId(lead.id);
    toast.success(`📋 Copied pitch for @${lead.author}!`);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const filteredLeads = leads.filter((lead) => {
    if (filter === 'HOT') return lead.intentLevel === 'HOT';
    if (filter === 'WARM') return lead.intentLevel === 'WARM';
    return true;
  });

  const hotCount = leads.filter((l) => l.intentLevel === 'HOT').length;
  const warmCount = leads.filter((l) => l.intentLevel === 'WARM').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-[#16243d] bg-gradient-to-r from-[#0c1424] via-[#0c1424] to-[#081a33] p-6 backdrop-blur-xl shadow-card">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Crosshair className="h-5 w-5 animate-pulse text-cyan-400" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
                  <span>Lead Radar</span>
                  {config?.discordWebhookUrl ? (
                    <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800/60 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      SEPARATE #LEADS CHANNEL CONNECTED
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-700/60 hover:bg-cyan-900/60 transition-colors flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      SET #LEADS WEBHOOK (ORDERS PROTECTED)
                    </button>
                  )}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Autonomous 24/7 internet crawler tracking prospective PGSharp buyers across Google, Gaming Forums, Reddit & Telegram.
                </p>
              </div>
            </div>

            {lastScanned && (
              <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                Last scanned: {lastScanned.toLocaleTimeString()} ({leads.length} leads in cache)
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestWebhook}
              disabled={testingWebhook}
              className="border-[#16243d] bg-[#080e1a] text-slate-300 hover:text-white hover:border-[#1b2b48]"
            >
              <Send className={`mr-2 h-4 w-4 ${testingWebhook ? 'animate-spin' : 'text-cyan-400'}`} />
              {testingWebhook ? 'Sending...' : 'Test Webhook Alert'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="border-[#16243d] bg-[#080e1a] text-cyan-300 hover:text-white hover:border-cyan-500/50"
            >
              <Sliders className="mr-2 h-4 w-4 text-cyan-400" />
              {showSettings ? 'Hide Settings' : 'Radar Settings'}
            </Button>

            <Button
              onClick={handleScan}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Scanning Internet...' : 'Scan Internet Now'}
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Settings Drawer */}
      {showSettings && config && (
        <div className="rounded-2xl border border-[#16243d] bg-[#0c1424] p-6 shadow-card space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-[#16243d] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span>Radar Internet Target Settings & Keywords</span>
              </h3>
              <p className="text-xs text-slate-400">
                Customize which open web search engines, gaming forums, subreddits, and buying keywords trigger alerts.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {savingConfig ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Dedicated Discord Webhook for Leads */}
          <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 font-mono">
                <Send className="h-3.5 w-3.5" />
                Dedicated Discord Leads Webhook (Keeps Order Channel Clean)
              </label>
              <span className="text-[11px] text-slate-400">Posts only buyer leads, never orders</span>
            </div>
            <input
              type="text"
              placeholder="https://discord.com/api/webhooks/YOUR_CHANNEL_ID/YOUR_TOKEN"
              value={config.discordWebhookUrl || ''}
              onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
              className="w-full rounded-lg border border-[#1b2b48] bg-[#080e1a] p-2.5 text-xs text-cyan-300 placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-400">
              💡 Create a dedicated <code className="text-cyan-300 bg-[#080e1a] px-1 py-0.5 rounded border border-[#16243d]">#leads</code> channel in your Discord server, copy its webhook URL, and paste it here so it never mixes with orders.
            </p>
          </div>

          {/* Recency Threshold & Scan Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Max Post Age (Hours) - Ignores Old Threads
              </label>
              <select
                value={config.maxLeadAgeHours || 24}
                onChange={(e) => setConfig({ ...config, maxLeadAgeHours: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-[#1b2b48] bg-[#080e1a] p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value={6}>Last 6 Hours (Ultra Fresh Only)</option>
                <option value={12}>Last 12 Hours</option>
                <option value={24}>Last 24 Hours (Recommended)</option>
                <option value={48}>Last 48 Hours</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Background Scan Interval
              </label>
              <select
                value={config.scanIntervalSeconds || 60}
                onChange={(e) => setConfig({ ...config, scanIntervalSeconds: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-[#1b2b48] bg-[#080e1a] p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value={45}>Every 45 Seconds</option>
                <option value={60}>Every 60 Seconds (Recommended)</option>
                <option value={120}>Every 2 Minutes</option>
                <option value={300}>Every 5 Minutes</option>
              </select>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              MULTI-SOURCE TARGET PANELS: THE WHOLE INTERNET
              ══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 1. Open Web Search Queries (Entire Internet) */}
            <div className="space-y-3 bg-[#080e1a] p-4 rounded-xl border border-[#16243d]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Open Web Queries ({(config.webSearchQueries || config.redditSearchQueries).length})</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Crawls entire internet via Bing/Google</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {(config.webSearchQueries || config.redditSearchQueries).map((q, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/50 px-2.5 py-1 text-xs font-medium text-cyan-300"
                  >
                    {q}
                    <button
                      type="button"
                      onClick={() => {
                        const current = config.webSearchQueries || config.redditSearchQueries;
                        const updated = current.filter((_, idx) => idx !== i);
                        setConfig({ ...config, webSearchQueries: updated, redditSearchQueries: updated });
                      }}
                      className="text-cyan-400 hover:text-rose-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. buy pgsharp key, pgsharp standard key slot"
                  value={newWebQuery}
                  onChange={(e) => setNewWebQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newWebQuery.trim()) {
                      e.preventDefault();
                      const clean = newWebQuery.trim().toLowerCase();
                      const current = config.webSearchQueries || config.redditSearchQueries;
                      if (!current.includes(clean)) {
                        const updated = [...current, clean];
                        setConfig({ ...config, webSearchQueries: updated, redditSearchQueries: updated });
                      }
                      setNewWebQuery('');
                    }
                  }}
                  className="w-full rounded-lg border border-[#1b2b48] bg-[#0c1424] px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (newWebQuery.trim()) {
                      const clean = newWebQuery.trim().toLowerCase();
                      const current = config.webSearchQueries || config.redditSearchQueries;
                      if (!current.includes(clean)) {
                        const updated = [...current, clean];
                        setConfig({ ...config, webSearchQueries: updated, redditSearchQueries: updated });
                      }
                      setNewWebQuery('');
                    }
                  }}
                  className="border-[#1b2b48] text-cyan-300 hover:border-cyan-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* 2. Gaming & Cheat Forums (OwnedCore, Elitepvpers, EpicNPC) */}
            <div className="space-y-3 bg-[#080e1a] p-4 rounded-xl border border-[#16243d]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-mono">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  <span>Gaming & Trade Forums ({(config.gamingForums || ['ownedcore.com', 'elitepvpers.com', 'epicnpc.com', 'playerup.com']).length})</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Specific trade boards</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {(config.gamingForums || ['ownedcore.com', 'elitepvpers.com', 'epicnpc.com', 'playerup.com']).map((forum, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-800/60 bg-purple-950/50 px-2.5 py-1 text-xs font-medium text-purple-300"
                  >
                    {forum}
                    <button
                      type="button"
                      onClick={() => {
                        const current = config.gamingForums || ['ownedcore.com', 'elitepvpers.com', 'epicnpc.com', 'playerup.com'];
                        setConfig({
                          ...config,
                          gamingForums: current.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="text-purple-400 hover:text-rose-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ownedcore.com, elitepvpers.com"
                  value={newForum}
                  onChange={(e) => setNewForum(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newForum.trim()) {
                      e.preventDefault();
                      const clean = newForum.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim().toLowerCase();
                      const current = config.gamingForums || ['ownedcore.com', 'elitepvpers.com', 'epicnpc.com', 'playerup.com'];
                      if (!current.includes(clean)) {
                        setConfig({ ...config, gamingForums: [...current, clean] });
                      }
                      setNewForum('');
                    }
                  }}
                  className="w-full rounded-lg border border-[#1b2b48] bg-[#0c1424] px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (newForum.trim()) {
                      const clean = newForum.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim().toLowerCase();
                      const current = config.gamingForums || ['ownedcore.com', 'elitepvpers.com', 'epicnpc.com', 'playerup.com'];
                      if (!current.includes(clean)) {
                        setConfig({ ...config, gamingForums: [...current, clean] });
                      }
                      setNewForum('');
                    }
                  }}
                  className="border-[#1b2b48] text-purple-300 hover:border-purple-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* 3. Subreddits to Monitor */}
            <div className="space-y-3 bg-[#080e1a] p-4 rounded-xl border border-[#16243d]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5 font-mono">
                  <span>Target Subreddits ({config.subreddits.length})</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Reddit live feeds</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {config.subreddits.map((sub, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-800/60 bg-orange-950/50 px-2.5 py-1 text-xs font-medium text-orange-300"
                  >
                    r/{sub}
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          subreddits: config.subreddits.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-orange-400 hover:text-rose-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. PokemonGoSpoofing"
                  value={newSubreddit}
                  onChange={(e) => setNewSubreddit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubreddit.trim()) {
                      e.preventDefault();
                      const clean = newSubreddit.replace(/^r\//, '').trim();
                      if (!config.subreddits.includes(clean)) {
                        setConfig({ ...config, subreddits: [...config.subreddits, clean] });
                      }
                      setNewSubreddit('');
                    }
                  }}
                  className="w-full rounded-lg border border-[#1b2b48] bg-[#0c1424] px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (newSubreddit.trim()) {
                      const clean = newSubreddit.replace(/^r\//, '').trim();
                      if (!config.subreddits.includes(clean)) {
                        setConfig({ ...config, subreddits: [...config.subreddits, clean] });
                      }
                      setNewSubreddit('');
                    }
                  }}
                  className="border-[#1b2b48] text-orange-300 hover:border-orange-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* 4. High-Intent Trigger Keywords */}
            <div className="space-y-3 bg-[#080e1a] p-4 rounded-xl border border-[#16243d]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                  <span>Buyer Intent Trigger Words ({config.highIntentKeywords.length})</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Matches buyer intent</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {config.highIntentKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/60 px-2.5 py-1 text-xs font-medium text-cyan-300"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          highIntentKeywords: config.highIntentKeywords.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-cyan-400 hover:text-rose-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. spare slot, buy key, who sells"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newKeyword.trim()) {
                      e.preventDefault();
                      const clean = newKeyword.trim().toLowerCase();
                      if (!config.highIntentKeywords.includes(clean)) {
                        setConfig({ ...config, highIntentKeywords: [...config.highIntentKeywords, clean] });
                      }
                      setNewKeyword('');
                    }
                  }}
                  className="w-full rounded-lg border border-[#1b2b48] bg-[#0c1424] px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (newKeyword.trim()) {
                      const clean = newKeyword.trim().toLowerCase();
                      if (!config.highIntentKeywords.includes(clean)) {
                        setConfig({ ...config, highIntentKeywords: [...config.highIntentKeywords, clean] });
                      }
                      setNewKeyword('');
                    }
                  }}
                  className="border-[#1b2b48] text-cyan-300 hover:border-cyan-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Sales Pitch Template */}
            <div className="space-y-2 md:col-span-2 bg-[#080e1a] p-4 rounded-xl border border-[#16243d]">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                1-Tap Copy Sales Pitch Template (Use {'{author}'} and {'{storeUrl}'})
              </label>
              <textarea
                rows={2}
                value={config.pitchTemplates.hot}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pitchTemplates: { ...config.pitchTemplates, hot: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-[#1b2b48] bg-[#0c1424] p-3 text-xs text-cyan-300 placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Lead Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16243d] pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all font-mono ${
              filter === 'ALL'
                ? 'bg-[#0c1424] text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Leads ({leads.length})
          </button>
          <button
            onClick={() => setFilter('HOT')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all font-mono ${
              filter === 'HOT'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            Hot Buyers ({hotCount})
          </button>
          <button
            onClick={() => setFilter('WARM')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all font-mono ${
              filter === 'WARM'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Warm Leads ({warmCount})
          </button>
        </div>

        {/* 24/7 Desktop Worker Banner */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span>
            24/7 Background Monitor: Double-click{' '}
            <code className="text-cyan-400 bg-[#080e1a] px-2 py-0.5 rounded border border-[#16243d]">
              Start-Lead-Radar.bat
            </code>
          </span>
        </div>
      </div>

      {/* Discovered Leads Stream */}
      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#16243d] bg-[#0c1424]/40 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Crosshair className="h-7 w-7 text-cyan-400 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">No active leads in current view</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            Click the <strong className="text-cyan-400">Scan Internet Now</strong> button above to sweep Google, gaming forums, Reddit, and Telegram for prospective buyers.
          </p>
          <Button
            size="sm"
            onClick={handleScan}
            disabled={loading}
            className="mt-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Live Internet Scan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLeads.map((lead) => {
            const isHot = lead.intentLevel === 'HOT';
            const isCopied = copiedId === lead.id;

            // Determine source badge styling
            let sourceBadgeClass = 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60';
            let sourceIcon = <Globe className="h-3 w-3" />;
            let sourceLabel = lead.subSource || 'Open Web';

            if (lead.source === 'forum') {
              sourceBadgeClass = 'bg-purple-950/80 text-purple-300 border-purple-800/60';
              sourceIcon = <Gamepad2 className="h-3 w-3" />;
            } else if (lead.source === 'reddit') {
              sourceBadgeClass = 'bg-orange-950/80 text-orange-400 border-orange-800/60';
              sourceIcon = <span className="font-bold text-[10px]">r/</span>;
            } else if (lead.source === 'telegram') {
              sourceBadgeClass = 'bg-sky-950/80 text-sky-400 border-sky-800/60';
              sourceIcon = <Send className="h-3 w-3" />;
            }

            return (
              <div
                key={lead.id}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 bg-[#0c1424] shadow-card ${
                  isHot
                    ? 'border-rose-900/50 hover:border-rose-700/60 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                    : 'border-[#16243d] hover:border-cyan-500/40'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left content */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold border font-mono ${
                          isHot
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                            : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'
                        }`}
                      >
                        {isHot ? <Flame className="h-3 w-3 text-rose-400" /> : <Zap className="h-3 w-3 text-cyan-400" />}
                        {lead.intentLevel} LEAD
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium border font-mono ${sourceBadgeClass}`}
                      >
                        {sourceIcon}
                        <span>{sourceLabel}</span>
                      </span>

                      <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <User className="h-3 w-3 text-slate-500" />
                        {lead.author}
                      </span>

                      <span className="text-xs text-slate-500 font-mono">
                        • {new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      {lead.title}
                    </h4>

                    {lead.body && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-[#080e1a] p-3 rounded-xl border border-[#16243d]">
                        &quot;{lead.body}&quot;
                      </p>
                    )}

                    {/* Matched Keywords */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 font-mono">Triggered by:</span>
                      {lead.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-cyan-950/80 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-300 border border-cyan-800/60"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => copyPitch(lead)}
                      className={`w-full sm:w-auto text-xs font-bold transition-all ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Pitch Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          1-Tap Copy Pitch
                        </>
                      )}
                    </Button>

                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 py-1.5 px-3 rounded-xl bg-[#080e1a] border border-[#16243d] hover:border-cyan-500/40 transition-colors font-mono"
                    >
                      <span>Open Post</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

