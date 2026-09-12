import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendExpiryReminders } from '@/lib/telegram/reminders';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  // 1. Check Vercel Cron Secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // 2. Check Admin API Secret
  if (verifyAdminSecret(request)) {
    return true;
  }

  // 3. In local development, allow invocation
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await checkAndSendExpiryReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (err: any) {
    console.error('[cron/expiry-reminders] Execution error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process reminders.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
