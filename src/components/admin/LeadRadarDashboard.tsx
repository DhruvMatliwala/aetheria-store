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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface LeadItem {
  id: string;
  source: 'reddit' | 'web' | 'telegram';
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
  const [newSubreddit, setNewSubreddit] = useState('');
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
          toast.success(`📡 Scan complete! Found ${data.totalCount} leads, dispatched ${data.newlyDispatched} new alert(s) to Discord!`);
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
        toast.success('🧪 Test lead sent to Discord! Check your phone/channel.');
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
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20 p-6 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Crosshair className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
                  Lead Radar
                  {config?.discordWebhookUrl ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      SEPARATE #LEADS CHANNEL CONNECTED
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      SET #LEADS WEBHOOK (ORDERS PROTECTED)
                    </button>
                  )}
                </h2>
                <p className="text-sm text-neutral-400">
                  Autonomous 24/7 internet crawler tracking prospective PGSharp buyers on Reddit, Forums & Telegram.
                </p>
              </div>
            </div>

            {lastScanned && (
              <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
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
              className="border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800 hover:text-white"
            >
              <Send className={`mr-2 h-4 w-4 ${testingWebhook ? 'animate-spin' : 'text-amber-400'}`} />
              {testingWebhook ? 'Sending...' : 'Test Webhook Alert'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="border-neutral-800 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800 hover:text-white"
            >
              <Sliders className="mr-2 h-4 w-4 text-cyan-400" />
              {showSettings ? 'Hide Settings' : 'Radar Settings'}
            </Button>

            <Button
              onClick={handleScan}
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 font-semibold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Scanning Internet...' : 'Scan Internet Now'}
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Settings Drawer */}
      {showSettings && config && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 backdrop-blur-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                Radar Target Settings & Keywords
              </h3>
              <p className="text-xs text-neutral-400">
                Customize which subreddits and buying keywords trigger alerts. No code editing required.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {savingConfig ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Dedicated Discord Webhook for Leads */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Dedicated Discord Leads Webhook (Keeps Order Channel Clean)
              </label>
              <span className="text-[11px] text-neutral-400">Posts only buyer leads, never orders</span>
            </div>
            <input
              type="text"
              placeholder="https://discord.com/api/webhooks/YOUR_CHANNEL_ID/YOUR_TOKEN"
              value={config.discordWebhookUrl || ''}
              onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-neutral-400">
              💡 Create a dedicated <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded">#leads</code> channel in your Discord server, copy its webhook URL, and paste it here so it never mixes with orders.
            </p>
          </div>

          {/* Recency Threshold & Scan Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Max Post Age (Hours) - Ignores Old Threads
              </label>
              <select
                value={config.maxLeadAgeHours || 24}
                onChange={(e) => setConfig({ ...config, maxLeadAgeHours: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value={6}>Last 6 Hours (Ultra Fresh Only)</option>
                <option value={12}>Last 12 Hours</option>
                <option value={24}>Last 24 Hours (Recommended)</option>
                <option value={48}>Last 48 Hours</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Background Scan Interval
              </label>
              <select
                value={config.scanIntervalSeconds || 60}
                onChange={(e) => setConfig({ ...config, scanIntervalSeconds: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value={45}>Every 45 Seconds</option>
                <option value={60}>Every 60 Seconds (Recommended)</option>
                <option value={120}>Every 2 Minutes</option>
                <option value={300}>Every 5 Minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Subreddits to Monitor */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Target Subreddits ({config.subreddits.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {config.subreddits.map((sub, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs font-medium text-neutral-200"
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
                      className="text-neutral-400 hover:text-red-400"
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
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 focus:outline-none"
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
                  className="border-neutral-800 text-neutral-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* High-Intent Trigger Keywords */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Buyer Intent Trigger Words ({config.highIntentKeywords.length})
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {config.highIntentKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300"
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
                      className="text-amber-400 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. spare slot, buy key"
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
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
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
                  className="border-neutral-800 text-neutral-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Sales Pitch Template */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                1-Tap Copy Sales Pitch (Use {'{author}'} and {'{storeUrl}'})
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
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Lead Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              filter === 'ALL'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Leads ({leads.length})
          </button>
          <button
            onClick={() => setFilter('HOT')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              filter === 'HOT'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-neutral-400 hover:text-amber-300'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            Hot Buyers ({hotCount})
          </button>
          <button
            onClick={() => setFilter('WARM')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              filter === 'WARM'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-neutral-400 hover:text-cyan-300'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Warm Leads ({warmCount})
          </button>
        </div>

        {/* 24/7 Desktop Worker Banner */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span>24/7 Background Monitor: Double-click <code className="text-amber-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">Start-Lead-Radar.bat</code></span>
        </div>
      </div>

      {/* Discovered Leads Stream */}
      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-400 mb-4">
            <Crosshair className="h-7 w-7 text-amber-400/70" />
          </div>
          <h3 className="text-base font-semibold text-white">No active leads in current view</h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-400">
            Click the <strong className="text-amber-400">Scan Internet Now</strong> button above to sweep Reddit, forums, and Telegram for new customers.
          </p>
          <Button
            size="sm"
            onClick={handleScan}
            disabled={loading}
            className="mt-5 bg-neutral-800 text-white hover:bg-neutral-700"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Live Scan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLeads.map((lead) => {
            const isHot = lead.intentLevel === 'HOT';
            const isCopied = copiedId === lead.id;

            return (
              <div
                key={lead.id}
                className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-200 ${
                  isHot
                    ? 'border-amber-500/30 bg-neutral-900/90 hover:border-amber-500/50 shadow-sm shadow-amber-950/20'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                          isHot
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {isHot ? <Flame className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                        {lead.intentLevel} LEAD
                      </span>

                      <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300">
                        {lead.subSource || lead.source.toUpperCase()}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <User className="h-3 w-3" />
                        {lead.author}
                      </span>

                      <span className="text-xs text-neutral-500">
                        • {new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white leading-snug">
                      {lead.title}
                    </h4>

                    {lead.body && (
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                        "{lead.body}"
                      </p>
                    )}

                    {/* Matched Keywords */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-neutral-500">Triggered by:</span>
                      {lead.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded bg-neutral-800/90 px-1.5 py-0.5 text-[10px] font-medium text-amber-300/90 border border-neutral-700/50"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0">
                    <Button
                      size="sm"
                      onClick={() => copyPitch(lead)}
                      className={`w-full sm:w-auto text-xs font-medium transition-all ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-black hover:bg-amber-400 font-semibold'
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
                          Copy Sales Pitch
                        </>
                      )}
                    </Button>

                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-cyan-400 py-1 px-2 rounded hover:bg-neutral-800 transition-colors"
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
