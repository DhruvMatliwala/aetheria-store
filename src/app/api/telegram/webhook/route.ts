import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram/handlers';
import { TELEGRAM_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN } from '@/lib/constants';
import { TelegramUpdate } from '@/lib/telegram/bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health check & diagnostic status for the Telegram Webhook
 */
export async function GET() {
  const isConfigured = Boolean(TELEGRAM_BOT_TOKEN);
  return NextResponse.json({
    ok: true,
    status: isConfigured ? 'ready' : 'missing_bot_token',
    message: isConfigured
      ? 'Telegram webhook endpoint is active and listening for updates.'
      : 'TELEGRAM_BOT_TOKEN is not configured in environment variables.',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Primary Webhook listener for Telegram Bot API
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Optional Secret Token Verification ────────────────────────────────
    if (TELEGRAM_WEBHOOK_SECRET) {
      const incomingSecret = request.headers.get('x-telegram-bot-api-secret-token');
      if (incomingSecret !== TELEGRAM_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized secret token.' }, { status: 401 });
      }
    }

    // ── 2. Parse Telegram Update ─────────────────────────────────────────────
    const update = (await request.json()) as TelegramUpdate;
    if (!update || typeof update !== 'object') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // ── 3. Process the update (await required for Vercel serverless functions) ──
    await handleTelegramUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[TelegramWebhook] POST error:', err);
    // Return 200 to Telegram so it doesn't storm with retries on malformed bodies
    return NextResponse.json({ ok: false, error: err?.message || 'Processing failed' });
  }
}
