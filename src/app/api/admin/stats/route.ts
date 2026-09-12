import { NextRequest, NextResponse } from 'next/server';
import { getInventoryStats } from '@/lib/firestore/keys';
import { getRecentOrders, getRevenueStats } from '@/lib/firestore/orders';
import { getRestockStats } from '@/lib/firestore/restock';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const [inventoryStats, recentOrders, waitlistStats, revenueStats] = await Promise.all([
      getInventoryStats(),
      getRecentOrders(50),
      getRestockStats(30),
      getRevenueStats(),
    ]);

    // Precise stockCounts map based on actual inventory and real sales
    const count1 = inventoryStats.tierStock['1_month_1_device'] ?? 0;
    const sold1 = revenueStats.tierSales['1_month_1_device'] ?? 0;
    const count2 = inventoryStats.tierStock['1_month_2_device'] ?? 0;
    const sold2 = revenueStats.tierSales['1_month_2_device'] ?? 0;

    const stockCounts = {
      '1_month_1_device': {
        available: count1,
        sold: sold1,
        total: count1 + sold1,
      },
      '1_month_2_device': {
        available: count2,
        sold: sold2,
        total: count2 + sold2,
      },
      // Backward-compatibility aliases
      '1_month': {
        available: count1,
        sold: sold1,
        total: count1 + sold1,
      },
      '3_month': {
        available: count2,
        sold: sold2,
        total: count2 + sold2,
      },
    };

    return NextResponse.json({
      inventoryStats,
      stockCounts,
      recentOrders,
      waitlistStats,
      revenueStats,
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: 'Failed to load stats.' }, { status: 500 });
  }
}
