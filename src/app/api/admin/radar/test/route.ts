import { NextRequest, NextResponse } from 'next/server';
import { dispatchDiscordLead } from '../../../../../../radar/services/discordLeadNotifier';
import { LeadItem } from '../../../../../../radar/types';
import { getLiveRadarConfig } from '@/lib/firestore/radarConfig';

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
  if (!config.discordWebhookUrl) {
    return NextResponse.json(
      { error: 'No Discord leads webhook configured. Please add your Lead Alerts Discord Webhook in Radar Settings or set DISCORD_LEADS_WEBHOOK_URL in .env.local.' },
      { status: 400 }
    );
  }

  const sampleLead: LeadItem = {
    id: `test_${Date.now()}`,
    source: 'reddit',
    subSource: 'r/PoGoAndroids (Test Connection)',
    author: 'Demo_Trainer_Ash',
    title: 'Looking for a PGSharp Standard Edition key slot right now',
    body: "Does anyone have a spare PGSharp Standard key? Willing to pay via PayPal or UPI instantly if someone has an extra activation key.",
    url: 'https://reddit.com/r/PoGoAndroids',
    timestamp: Date.now(),
    matchedKeywords: ['need key', 'buy', 'spare key', 'paypal', 'upi'],
    intentLevel: 'HOT',
  };

  try {
    const success = await dispatchDiscordLead(sampleLead, config);
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Sample HOT lead alert sent to your Discord channel!',
        sampleLead,
      });
    } else {
      return NextResponse.json(
        { error: 'Discord rejected the webhook. Please check that the URL is valid and channel permissions allow Webhook posts.' },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error('[Radar:Test] Webhook test failed:', err);
    return NextResponse.json(
      { error: `Webhook error: ${err.message || 'Unknown network error'}` },
      { status: 500 }
    );
  }
}
