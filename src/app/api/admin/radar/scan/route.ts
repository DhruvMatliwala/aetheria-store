import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { scanSubreddit, searchReddit } from '../../../../../../radar/services/redditWatcher';
import { scanWebRssFeeds } from '../../../../../../radar/services/webAlertWatcher';
import { scanTelegramChannels } from '../../../../../../radar/services/telegramWatcher';
import { dispatchDiscordLead } from '../../../../../../radar/services/discordLeadNotifier';
import { leadStorage } from '../../../../../../radar/store/leadStorage';
import { LeadItem, RadarConfig } from '../../../../../../radar/types';

import { getLiveRadarConfig, getPersistentSeenLeads, addPersistentSeenLeads } from '@/lib/firestore/radarConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  return Boolean(
    adminSecret &&
    process.env.ADMIN_API_SECRET &&
    adminSecret.trim() === process.env.ADMIN_API_SECRET.trim()
  );
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const config = await getLiveRadarConfig();
  const allDiscovered: LeadItem[] = [];

  // 1. Scan subreddits
  for (const sub of config.subreddits.slice(0, 3)) {
    try {
      const leads = await scanSubreddit(sub, config);
      allDiscovered.push(...leads);
    } catch (err) {
      console.error(`[AdminScan] Error scanning r/${sub}:`, err);
    }
  }

  // 2. Scan reddit search queries
  for (const q of config.redditSearchQueries.slice(0, 2)) {
    try {
      const leads = await searchReddit(q, config);
      allDiscovered.push(...leads);
    } catch (err) {
      console.error(`[AdminScan] Error on query "${q}":`, err);
    }
  }

  // 3. Scan Web RSS
  try {
    const webLeads = await scanWebRssFeeds(config);
    allDiscovered.push(...webLeads);
  } catch (err) {
    console.error('[AdminScan] Error scanning web RSS:', err);
  }

  // 4. Scan Telegram
  try {
    const tgLeads = await scanTelegramChannels(config);
    allDiscovered.push(...tgLeads);
  } catch (err) {
    console.error('[AdminScan] Error scanning telegram:', err);
  }

  // Apply recency filter (default: 24h)
  const maxAgeMs = (config.maxLeadAgeHours || 24) * 60 * 60 * 1000;
  const cutoffTime = Date.now() - maxAgeMs;

  // Load persistent seen lead IDs from Firestore to ensure 0 duplicates across cold starts
  const persistentSeenIds = await getPersistentSeenLeads();
  const newlySeenIds: string[] = [];

  const freshLeads: LeadItem[] = [];
  for (const lead of allDiscovered) {
    if (lead.timestamp >= cutoffTime) {
      freshLeads.push(lead);
    } else {
      // Historical post: cache so it never alerts in future
      if (!persistentSeenIds.has(lead.id)) {
        newlySeenIds.push(lead.id);
        persistentSeenIds.add(lead.id);
      }
      leadStorage.add(lead.id);
    }
  }

  // Sort fresh leads by newest first
  freshLeads.sort((a, b) => b.timestamp - a.timestamp);

  // Dispatch any unsent leads to Discord (limit to top 5 in a manual GUI scan)
  let newlyDispatched = 0;
  for (const lead of freshLeads.slice(0, 5)) {
    const alreadySeen = leadStorage.has(lead.id) || persistentSeenIds.has(lead.id);
    if (!alreadySeen) {
      if (config.discordWebhookUrl) {
        await dispatchDiscordLead(lead, config);
        newlyDispatched++;
        newlySeenIds.push(lead.id);
      }
      leadStorage.add(lead.id);
      persistentSeenIds.add(lead.id);
    }
  }

  // Persist all newly seen lead IDs to Firestore
  if (newlySeenIds.length > 0) {
    await addPersistentSeenLeads(newlySeenIds);
  }

  return NextResponse.json({
    success: true,
    leads: freshLeads,
    totalCount: freshLeads.length,
    newlyDispatched,
    scannedAt: Date.now(),
  });
}
