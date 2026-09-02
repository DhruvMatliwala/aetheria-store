import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VerifyBody {
  orderId?: string;
  transactionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = (body.orderId || '').trim();
    const rawTxId = (body.transactionId || '').trim();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required.' },
        { status: 400 }
      );
    }

    if (!rawTxId || rawTxId.length < 4) {
      return NextResponse.json(
        { error: 'Please enter your PayPal Transaction ID or Payer Email address.' },
        { status: 400 }
      );
    }

    // ── 1. Check existing order in Firestore ─────────────────────────────────
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Idempotency: if already processed and key assigned, return immediately
    if (existingOrder.payment_status === 'paid' && existingOrder.delivered_key) {
      return NextResponse.json({
        success: true,
        order: toOrderPublic(existingOrder),
        message: 'Order was already verified and fulfilled.',
      });
    }

    // ── 2. Check for duplicate Transaction ID usage across other orders ──────
    const db = getAdminFirestore();
    const dupSnapshot = await db
      .collection('orders')
      .where('paypal_tx_id', '==', rawTxId)
      .limit(1)
      .get();

    if (!dupSnapshot.empty && dupSnapshot.docs[0].id !== orderId) {
      return NextResponse.json(
        { error: 'This Transaction ID has already been submitted for another order. Please check your PayPal receipt.' },
        { status: 409 }
      );
    }

    // ── 3. Atomically allocate license key slot ──────────────────────────────
    const allocation = await allocateKeySlot(orderId, `PAYPAL_${rawTxId}`);

    // Update order with PayPal Transaction ID
    await db.collection('orders').doc(orderId).update({
      paypal_tx_id: rawTxId,
      payment_gateway: 'paypal_direct',
      updated_at: new Date(),
    });

    // ── 4. Send transactional key delivery email asynchronously ──────────────
    try {
      sendKeyDeliveryEmail({
        to: existingOrder.customer_email,
        orderId: existingOrder.order_id,
        planType: existingOrder.plan_type,
        licenseKey: allocation.decryptedKey,
      }).catch((emailErr) => {
        console.error('[checkout/paypal/verify] Email delivery background error:', emailErr);
      });
    } catch (emailErr) {
      console.error('[checkout/paypal/verify] Failed to schedule email delivery:', emailErr);
    }

    // ── 5. Dispatch real-time Admin Discord backup alert with PayPal Ref ──────
    sendAdminOrderAlert({
      orderId: existingOrder.order_id,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      planType: existingOrder.plan_type,
      amount: existingOrder.amount,
      currency: 'USD',
      gateway: 'PayPal (Direct)',
      transactionId: `PayPal: ${rawTxId}`,
      deliveredKey: allocation.decryptedKey,
    }).catch((alertErr) => {
      console.error('[checkout/paypal/verify] Discord admin alert error:', alertErr);
    });

    // ── 6. Fetch updated order and return response ───────────────────────────
    const updatedOrder = await getOrderById(orderId);
    const publicOrder = updatedOrder ? toOrderPublic(updatedOrder) : null;

    return NextResponse.json({
      success: true,
      order: publicOrder,
    });
  } catch (err: any) {
    console.error('[checkout/paypal/verify] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to verify PayPal payment.' },
      { status: 500 }
    );
  }
}
