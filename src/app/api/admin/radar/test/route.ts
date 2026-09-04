import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { dispatchDiscordLead } from '../../../../../../radar/services/discordLeadNotifier';
import { LeadItem, RadarConfig } from '../../../../../../radar/types';

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

function getRadarConfig(): RadarConfig {
  const configPath = path.join(process.cwd(), 'radar', 'radar.config.json');
  let config: RadarConfig;
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(raw);
  } catch {
    config = {
      discordWebhookUrl: '',
      storeUrl: 'https://aetheria-store.vercel.app',
      scanIntervalSeconds: 60,
      subreddits: ['PoGoAndroids', 'PGSharp'],
      redditSearchQueries: ['pgsharp key'],
      googleAlertRssUrls: [],
      telegramChannels: [],
      highIntentKeywords: ['need key', 'buy', 'spare slot'],
      generalKeywords: ['pgsharp key'],
      excludeKeywords: ['ban wave'],
      pitchTemplates: {
        hot: "Hey @{author}! Saw you're looking for an instant PGSharp Standard key. I have verified keys available with instant auto-delivery, UPI/PayPal, and 24/7 activation support: {storeUrl}",
        warm: "Hey @{author}! If you need a verified PGSharp Standard key or slot, check out our store: {storeUrl}",
      },
    };
  }

  if (!config.discordWebhookUrl || config.discordWebhookUrl.trim() === '') {
    config.discordWebhookUrl = process.env.DISCORD_LEADS_WEBHOOK_URL || '';
  }

  return config;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const config = getRadarConfig();
  if (!config.discordWebhookUrl) {
    return NextResponse.json(
      { error: 'No Discord leads webhook configured. Please add your Lead Alerts Discord Webhook in Radar Settings or set DISCORD_LEADS_WEBHOOK_URL in .env.local.' },
      { status: 400 }
    );
  }

  const sampleLead: LeadItem = {
    id: `simulated_gui_${Date.now()}`,
    source: 'reddit',
    subSource: 'r/PoGoAndroids (Admin GUI Test)',
    author: 'TrainerAsh99',
    title: 'Need a PGSharp Standard Edition key ASAP! Anyone selling or have a spare slot?',
    body: 'Looking to buy a PGSharp standard key for the upcoming Community Day. Happy to pay via PayPal or UPI. Please let me know who has an active key or spare slot available.',
    url: 'https://reddit.com/r/PoGoAndroids',
    timestamp: Date.now(),
    matchedKeywords: ['need a key', 'buy', 'spare slot', 'paypal', 'upi'],
    intentLevel: 'HOT',
  };

  const sent = await dispatchDiscordLead(sampleLead, config);
  if (!sent) {
    return NextResponse.json({ error: 'Failed to dispatch webhook to Discord.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Simulated lead alert dispatched to Discord!' });
}
