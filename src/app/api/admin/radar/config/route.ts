import { NextRequest, NextResponse } from 'next/server';
import { getLiveRadarConfig, saveLiveRadarConfig } from '@/lib/firestore/radarConfig';
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

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const config = await getLiveRadarConfig();
    return NextResponse.json({
      success: true,
      config,
      hasWebhook: Boolean(config.discordWebhookUrl && config.discordWebhookUrl.startsWith('http')),
    });
  } catch (err) {
    console.error('[Admin:RadarConfig] Error reading config:', err);
    return NextResponse.json({ error: 'Failed to read radar configuration.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await saveLiveRadarConfig(body);
    return NextResponse.json({
      success: true,
      message: 'Radar configuration saved successfully!',
      config: updated,
    });
  } catch (err) {
    console.error('[Admin:RadarConfig] Error saving config:', err);
    return NextResponse.json({ error: 'Failed to save radar configuration.' }, { status: 500 });
  }
}
