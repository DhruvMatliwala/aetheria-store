import fs from 'fs';
import path from 'path';
import { LeadItem, RadarConfig } from './types';
import { scanSubreddit, searchReddit } from './services/redditWatcher';
import { scanWebRssFeeds } from './services/webAlertWatcher';
import { scanTelegramChannels } from './services/telegramWatcher';
import { dispatchDiscordLead } from './services/discordLeadNotifier';
import { leadStorage } from './store/leadStorage';

// Simple environment loader for .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

loadEnvLocal();

// Load radar.config.json
const CONFIG_PATH = path.join(__dirname, 'radar.config.json');
let rawConfig: RadarConfig;

try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  rawConfig = JSON.parse(raw);
} catch (err) {
  console.error('[Radar] Failed to read radar.config.json. Using defaults.', err);
  process.exit(1);
}

// Fallback to DISCORD_LEADS_WEBHOOK_URL from env if config is empty (never mix with orders channel)
if (!rawConfig.discordWebhookUrl || rawConfig.discordWebhookUrl.trim() === '') {
  rawConfig.discordWebhookUrl = process.env.DISCORD_LEADS_WEBHOOK_URL || '';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runCycle(isInitial = false): Promise<number> {
  const cycleStart = Date.now();
  console.log(`\n[${new Date().toLocaleTimeString()}] 📡 Scanning internet streams for PGSharp leads...`);

  const leadsFound: LeadItem[] = [];

  // 1. Scan Subreddits
  for (const sub of rawConfig.subreddits) {
    try {
      const subLeads = await scanSubreddit(sub, rawConfig);
      leadsFound.push(...subLeads);
      await sleep(500);
    } catch (err) {
      console.error(`[Radar] Error on subreddit ${sub}:`, err);
    }
  }

  // 2. Scan Reddit Global Search Queries
  for (const q of rawConfig.redditSearchQueries) {
    try {
      const searchLeads = await searchReddit(q, rawConfig);
      leadsFound.push(...searchLeads);
      await sleep(500);
    } catch (err) {
      console.error(`[Radar] Error on query "${q}":`, err);
    }
  }

  // 3. Scan Web / Google Alerts RSS Feeds
  try {
    const webLeads = await scanWebRssFeeds(rawConfig);
    leadsFound.push(...webLeads);
  } catch (err) {
    console.error('[Radar] Error scanning Web RSS feeds:', err);
  }

  // 4. Scan Telegram Public Feeds
  try {
    const tgLeads = await scanTelegramChannels(rawConfig);
    leadsFound.push(...tgLeads);
  } catch (err) {
    console.error('[Radar] Error scanning Telegram channels:', err);
  }

  // Recency cutoff
  const maxAgeMs = (rawConfig.maxLeadAgeHours || 48) * 60 * 60 * 1000;
  const cutoffTime = Date.now() - maxAgeMs;

  const freshLeads: LeadItem[] = [];
  let archivedCount = 0;

  for (const lead of leadsFound) {
    if (leadStorage.has(lead.id)) {
      continue;
    }

    if (lead.timestamp < cutoffTime) {
      // Historical post: silently mark as seen to avoid flooding Discord
      leadStorage.add(lead.id);
      archivedCount++;
    } else {
      freshLeads.push(lead);
    }
  }

  console.log(
    `[Radar] Scan complete in ${((Date.now() - cycleStart) / 1000).toFixed(1)}s. ${freshLeads.length} fresh leads (< ${rawConfig.maxLeadAgeHours || 48}h), ${archivedCount} historical posts archived.`
  );

  // Process & Dispatch Fresh Leads
  let dispatchedCount = 0;
  for (const lead of freshLeads) {
    if (leadStorage.has(lead.id)) {
      continue;
    }

    console.log(`\n🚨 [${lead.intentLevel} LEAD FOUND]`);
    console.log(`   Source:  ${lead.subSource || lead.source}`);
    console.log(`   Author:  ${lead.author}`);
    console.log(`   Title:   ${lead.title}`);
    console.log(`   URL:     ${lead.url}`);
    console.log(`   Matches: ${lead.matchedKeywords.join(', ')}`);

    // Dispatch to Discord
    const sent = await dispatchDiscordLead(lead, rawConfig);
    if (sent) {
      dispatchedCount++;
      console.log(`   ✅ Successfully dispatched to Discord!`);
    }

    // Save to deduplication store
    leadStorage.add(lead.id);

    // Sleep to respect Discord rate limits
    await sleep(1000);
  }

  return dispatchedCount;
}

// Send a simulated test lead to Discord
async function sendTestLead() {
  console.log('[Radar] Sending simulated test lead to Discord...');
  const sampleLead: LeadItem = {
    id: `test_lead_${Date.now()}`,
    source: 'reddit',
    subSource: 'r/PoGoAndroids (Simulated Lead)',
    author: 'TrainerAsh99',
    title: 'Need a PGSharp Standard Edition key ASAP! Anyone selling or have a spare slot?',
    body: 'Looking to buy a PGSharp standard key for the upcoming Community Day. Happy to pay via PayPal or UPI. Please let me know who has an active key or spare slot available.',
    url: 'https://reddit.com/r/PoGoAndroids',
    timestamp: Date.now(),
    matchedKeywords: ['need a key', 'buy', 'spare slot', 'paypal', 'upi'],
    intentLevel: 'HOT',
  };

  const sent = await dispatchDiscordLead(sampleLead, rawConfig);
  if (sent) {
    console.log('✅ Test lead sent to Discord! Check your Discord channel to see the embed layout.');
  } else {
    console.log('❌ Failed to send test lead. Make sure DISCORD_ADMIN_WEBHOOK_URL is set in .env.local or radar.config.json.');
  }
}

async function main() {
  const args = process.argv.slice(2);

  console.log('===============================================================');
  console.log('      🛰️  AETHERIA LEAD RADAR - 24/7 INTERNET INTELLIGENCE    ');
  console.log('===============================================================');
  console.log(`[✓] Storefront URL:    ${rawConfig.storeUrl}`);
  console.log(`[✓] Subreddits (${rawConfig.subreddits.length}):   r/${rawConfig.subreddits.join(', r/')}`);
  console.log(`[✓] Gaming Forums (${(rawConfig.gamingForums || []).length}): ${(rawConfig.gamingForums || []).join(', ')}`);
  console.log(`[✓] Social Streams (${(rawConfig.socialSearchQueries || []).length}): X/Twitter, YouTube, Facebook, Threads, Instagram`);
  console.log(`[✓] Telegram Feeds:    ${rawConfig.telegramChannels.length} channel(s) (@${rawConfig.telegramChannels.join(', @')})`);
  console.log(`[✓] Discord Webhook:   ${rawConfig.discordWebhookUrl ? 'Configured ✅' : 'NOT CONFIGURED ⚠️'}`);
  console.log(`[✓] Scan Frequency:    Every ${rawConfig.scanIntervalSeconds} seconds`);
  console.log(`[✓] Max Lead Recency:  ${rawConfig.maxLeadAgeHours || 48} hours`);
  console.log('===============================================================\n');

  if (args.includes('--test')) {
    await sendTestLead();
    return;
  }

  const isOnce = args.includes('--once');

  if (isOnce) {
    console.log('[Radar] Running single cycle (--once mode)...');
    await runCycle(true);
    console.log('[Radar] Finished single run.');
    return;
  }

  console.log('[Radar] Starting continuous 24/7 background listener. Press Ctrl+C to stop.');
  while (true) {
    try {
      await runCycle();
    } catch (err) {
      console.error('[Radar:Loop] Uncaught cycle error, recovering...', err);
    }
    await sleep(rawConfig.scanIntervalSeconds * 1000);
  }
}

main().catch((err) => {
  console.error('[Radar:Fatal] Fatal error in Lead Radar:', err);
  process.exit(1);
});
