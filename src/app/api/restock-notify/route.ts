import { NextRequest, NextResponse } from 'next/server';
import { saveRestockRequest } from '@/lib/firestore/restock';
import { PLAN_MAP } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { planId?: string; email?: string };
    const { planId, email } = body;

    if (!planId || !email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid planId and email address are required.' },
        { status: 400 }
      );
    }

    if (!PLAN_MAP[planId]) {
      return NextResponse.json(
        { error: 'Invalid plan ID.' },
        { status: 400 }
      );
    }

    // Extract client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const result = await saveRestockRequest({
      planId,
      email: email.trim(),
      ip,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[api/restock-notify]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to save restock notification request.' },
      { status: 500 }
    );
  }
}
