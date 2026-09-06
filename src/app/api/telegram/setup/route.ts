import { NextRequest, NextResponse } from 'next/server';
import {
  setTelegramWebhook,
  getTelegramWebhookInfo,
  setTelegramCommands,
  setTelegramChatMenuButton,
} from '@/lib/telegram/bot';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret') || request.nextUrl.searchParams.get('secret');
  if (process.env.ADMIN_API_SECRET && adminSecret === process.env.ADMIN_API_SECRET) {
    return true;
  }
  // In development, allow localhost without secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      {
        error: 'TELEGRAM_BOT_TOKEN is not configured.',
        instructions:
          'Please create a bot via @BotFather on Telegram and add TELEGRAM_BOT_TOKEN to your environment variables.',
      },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'https://aetheria-store.vercel.app');

  const webhookUrl = `${baseUrl.replace(/\/+$/, '')}/api/telegram/webhook`;

  try {
    // 1. Set Webhook
    const webhookRes = await setTelegramWebhook(
      webhookUrl,
      TELEGRAM_WEBHOOK_SECRET || undefined
    );

    // 2. Set Bot Commands
    const commandsRes = await setTelegramCommands([
      { command: 'start', description: '⚡ Launch PGSharp key shop' },
      { command: 'stock', description: '📦 Check available keys' },
      { command: 'buy', description: '🛒 Order 1 or 2 device key' },
      { command: 'keys', description: '👤 View my purchased keys' },
      { command: 'help', description: '💬 Support & questions' },
    ]);

    // 3. Set Web App Menu Button (Telegram Mini App)
    const menuBtnRes = await setTelegramChatMenuButton({
      type: 'web_app',
      text: '🌐 Store',
      web_app: { url: baseUrl },
    });

    // 4. Retrieve current info
    const infoRes = await getTelegramWebhookInfo();

    return NextResponse.json({
      success: true,
      webhookUrl,
      webhookResult: webhookRes,
      commandsResult: commandsRes,
      menuButtonResult: menuBtnRes,
      currentWebhookInfo: infoRes,
      message: 'Telegram bot webhook and Mini App configuration successfully registered!',
    });
  } catch (err: any) {
    console.error('[telegram/setup]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to configure Telegram bot webhook.' },
      { status: 500 }
    );
  }
}
