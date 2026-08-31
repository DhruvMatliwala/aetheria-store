import { NextRequest, NextResponse } from 'next/server';
import { getAvailableCount } from '@/lib/firestore/keys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const count = await getAvailableCount(params.planId);
    return NextResponse.json({ available: count });
  } catch (err) {
    console.error('[api/stock/[planId]]', err);
    return NextResponse.json({ available: 0 });
  }
}
