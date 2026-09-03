import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Order } from '@/types/order';

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
    let order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // If this specific session is still pending, check if a concurrent/sister session
    // for the same customer email was paid in the last 30 minutes!
    if (order.payment_status !== 'paid' && order.customer_email) {
      try {
        const db = getAdminFirestore();
        const userPaidSnap = await db
          .collection('orders')
          .where('customer_email', '==', order.customer_email.toLowerCase())
          .where('payment_status', '==', 'paid')
          .limit(5)
          .get();

        const recentPaidDoc = userPaidSnap.docs.find((d) => {
          const data = d.data();
          const dTime =
            data.created_at?.toDate?.()?.getTime?.() ??
            (typeof data.created_at === 'number' ? data.created_at : 0);
          return Date.now() - dTime < 30 * 60 * 1000;
        });

        if (recentPaidDoc) {
          order = recentPaidDoc.data() as Order;
        }
      } catch (sisterErr) {
        console.warn('[api/order] Failed to check concurrent order:', sisterErr);
      }
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
