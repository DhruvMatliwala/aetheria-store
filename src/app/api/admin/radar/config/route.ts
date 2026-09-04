import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RadarConfig } from '../../../../../../radar/types';

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

const CONFIG_PATH = path.join(process.cwd(), 'radar', 'radar.config.json');

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config: RadarConfig = JSON.parse(raw);
    const hasEnvWebhook = Boolean(process.env.DISCORD_LEADS_WEBHOOK_URL);
    return NextResponse.json({
      success: true,
      config,
      hasWebhook: Boolean(config.discordWebhookUrl) || hasEnvWebhook,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read radar configuration.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const existingRaw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const existing: RadarConfig = JSON.parse(existingRaw);

    const updatedConfig: RadarConfig = {
      ...existing,
      storeUrl: typeof body.storeUrl === 'string' ? body.storeUrl.trim() : existing.storeUrl,
      scanIntervalSeconds: typeof body.scanIntervalSeconds === 'number' ? body.scanIntervalSeconds : existing.scanIntervalSeconds,
      maxLeadAgeHours: typeof body.maxLeadAgeHours === 'number' ? body.maxLeadAgeHours : existing.maxLeadAgeHours,
      subreddits: Array.isArray(body.subreddits) ? body.subreddits : existing.subreddits,
      redditSearchQueries: Array.isArray(body.redditSearchQueries) ? body.redditSearchQueries : existing.redditSearchQueries,
      googleAlertRssUrls: Array.isArray(body.googleAlertRssUrls) ? body.googleAlertRssUrls : existing.googleAlertRssUrls,
      telegramChannels: Array.isArray(body.telegramChannels) ? body.telegramChannels : existing.telegramChannels,
      highIntentKeywords: Array.isArray(body.highIntentKeywords) ? body.highIntentKeywords : existing.highIntentKeywords,
      generalKeywords: Array.isArray(body.generalKeywords) ? body.generalKeywords : existing.generalKeywords,
      excludeKeywords: Array.isArray(body.excludeKeywords) ? body.excludeKeywords : existing.excludeKeywords,
      pitchTemplates: body.pitchTemplates || existing.pitchTemplates,
    };

    if (typeof body.discordWebhookUrl === 'string') {
      updatedConfig.discordWebhookUrl = body.discordWebhookUrl.trim();
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: 'Radar configuration saved successfully!' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save radar configuration.' }, { status: 500 });
  }
}
