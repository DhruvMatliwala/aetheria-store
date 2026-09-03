import { NextRequest, NextResponse } from 'next/server';
import { getInventoryStats } from '@/lib/firestore/keys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  try {
    const stats = await getInventoryStats();
    return NextResponse.json(
      {
        stock: stats.tierStock,
        usableSlots: stats.totalUsableSlots,
        activeKeys: stats.activeKeys,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[api/stock]', err);
    return NextResponse.json(
      {
        stock: {
          '1_month_1_device': 0,
          '1_month_2_device': 0,
          '1_month_3_device': 0,
        },
        usableSlots: 0,
        activeKeys: 0,
      },
      { status: 500 }
    );
  }
}
