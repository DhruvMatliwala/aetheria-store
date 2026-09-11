import { NextRequest, NextResponse } from 'next/server';
import { broadcastOrderProof } from '@/lib/telegram/proofs';
import { TELEGRAM_PROOF_CHANNEL, TELEGRAM_BOT_USERNAME } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest): boolean {
  const adminSecret =
    request.headers.get('x-admin-secret') ||
    request.nextUrl.searchParams.get('secret');

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
    const success = await broadcastOrderProof({
      orderId: `ord_sample_${Date.now().toString().slice(-6)}`,
      planType: '1_month_1_device',
      gateway: 'upi_direct',
      customerUsername: 'sleekfx3',
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          channel: TELEGRAM_PROOF_CHANNEL,
          error:
            `Could not post to Telegram channel. Make sure @${TELEGRAM_BOT_USERNAME} is added as an Administrator in ` +
            TELEGRAM_PROOF_CHANNEL +
            ' with "Post Messages" permission.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: TELEGRAM_PROOF_CHANNEL,
      message: `Test proof successfully broadcast to ${TELEGRAM_PROOF_CHANNEL}! Check your Telegram channel.`,
    });
  } catch (err: any) {
    console.error('[test-proof] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send test proof.' },
      { status: 500 }
    );
  }
}
