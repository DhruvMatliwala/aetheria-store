import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
  }

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Return sanitized order — key is only included when paid
    const publicOrder = toOrderPublic(order);

    return NextResponse.json(publicOrder, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err) {
    console.error('[api/order]', err);
    return NextResponse.json({ error: 'Failed to fetch order.' }, { status: 500 });
  }
}
