import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/firestore/orders';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';
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
    const body = (await request.json()) as { orderId?: string };
    const orderId = body.orderId?.trim();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (existingOrder.payment_status === 'paid' && existingOrder.delivered_key) {
      return NextResponse.json({
        success: true,
        message: 'Order was already approved and fulfilled.',
        deliveredKey: existingOrder.delivered_key,
      });
    }

    // Allocate Key Slot
    const txRef = existingOrder.utr_number ? `UTR_${existingOrder.utr_number}` : `PAYPAL_${existingOrder.paypal_tx_id || 'DIRECT'}`;
    const allocation = await allocateKeySlot(orderId, txRef);

    // Mark as paid
    const db = getAdminFirestore();
    await db.collection('orders').doc(orderId).update({
      payment_status: 'paid',
      updated_at: new Date(),
    });

    // Send transactional email
    sendKeyDeliveryEmail({
      to: existingOrder.customer_email,
      orderId: existingOrder.order_id,
      planType: existingOrder.plan_type,
      licenseKey: allocation.decryptedKey,
    }).catch((err) => console.error('[admin/orders/approve] Email send error:', err));

    // Send Discord notification
    sendAdminOrderAlert({
      orderId: existingOrder.order_id,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      planType: existingOrder.plan_type,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      gateway: existingOrder.payment_gateway,
      transactionId: existingOrder.utr_number || existingOrder.paypal_tx_id || 'N/A',
      deliveredKey: allocation.decryptedKey,
    }).catch((err) => console.error('[admin/orders/approve] Discord alert error:', err));

    return NextResponse.json({
      success: true,
      deliveredKey: allocation.decryptedKey,
      message: 'Order approved successfully.',
    });
  } catch (err: any) {
    console.error('[admin/orders/approve]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to approve order.' },
      { status: 500 }
    );
  }
}
