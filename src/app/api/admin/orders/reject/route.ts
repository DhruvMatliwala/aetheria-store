import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/firestore/orders';
import { getAdminFirestore } from '@/lib/firebase/admin';

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

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { orderId?: string; reason?: string };
    const orderId = body.orderId?.trim();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (existingOrder.payment_status === 'paid') {
      return NextResponse.json({ error: 'Cannot reject an already fulfilled order.' }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection('orders').doc(orderId).update({
      payment_status: 'failed',
      updated_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Order rejected successfully.',
    });
  } catch (err: any) {
    console.error('[admin/orders/reject]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to reject order.' },
      { status: 500 }
    );
  }
}
