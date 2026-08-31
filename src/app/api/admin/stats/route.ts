import { NextRequest, NextResponse } from 'next/server';
import { getInventoryStats } from '@/lib/firestore/keys';
import { getRecentOrders, getRevenueStats } from '@/lib/firestore/orders';
import { getRestockStats } from '@/lib/firestore/restock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
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
    const [inventoryStats, recentOrders, waitlistStats, revenueStats] = await Promise.all([
      getInventoryStats(),
      getRecentOrders(50),
      getRestockStats(30),
      getRevenueStats(),
    ]);

    // Precise stockCounts map based on actual inventory and real sales
    const stockCounts = {
      '1_month_1_device': {
        available: inventoryStats.tierStock['1_month_1_device'] ?? 0,
        sold: revenueStats.tierSales['1_month_1_device'] ?? 0,
        total: (inventoryStats.tierStock['1_month_1_device'] ?? 0) + (revenueStats.tierSales['1_month_1_device'] ?? 0),
      },
      '1_month_2_device': {
        available: inventoryStats.tierStock['1_month_2_device'] ?? 0,
        sold: revenueStats.tierSales['1_month_2_device'] ?? 0,
        total: (inventoryStats.tierStock['1_month_2_device'] ?? 0) + (revenueStats.tierSales['1_month_2_device'] ?? 0),
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
