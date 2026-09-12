import { NextRequest, NextResponse } from 'next/server';
import { sendTestDiscordAlert } from '@/lib/notifications/discordAdmin';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await sendTestDiscordAlert();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Test notification sent to Discord!' });
}
