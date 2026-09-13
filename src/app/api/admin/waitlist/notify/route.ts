import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';
import { notifyWaitlistSubscribers } from '@/lib/firestore/restock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { planId } = body as { planId?: string };

    const result = await notifyWaitlistSubscribers({ planId });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[api/admin/waitlist/notify]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to dispatch waitlist notifications.' },
      { status: 500 }
    );
  }
}
