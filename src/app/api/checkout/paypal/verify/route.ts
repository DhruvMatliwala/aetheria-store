import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';
import { getPaypalCredit, claimPaypalCredit } from '@/lib/firestore/paypalCredits';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendPaymentVerificationAlert, sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';
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
      const dupData = dupSnapshot.docs[0].data();
      if (dupData.payment_status === 'paid' || dupData.payment_status === 'verifying') {
        return NextResponse.json(
          { error: 'This Transaction ID has already been submitted for another order. Please check your PayPal receipt.' },
          { status: 409 }
        );
      }
    }

    // ── 3. Check if PayPal IPN already arrived and verified this transaction ─
    const paypalCredit = await getPaypalCredit(rawTxId);

    if (paypalCredit && paypalCredit.status === 'unclaimed') {
      const allocation = await allocateKeySlot(orderId, `AUTO_PAYPAL_IPN_${rawTxId}`);

      await db.collection('orders').doc(orderId).update({
        payment_status: 'paid',
        paypal_tx_id: rawTxId,
        payment_gateway: 'paypal_direct',
        updated_at: new Date(),
      });

      await claimPaypalCredit(rawTxId, orderId);

      sendKeyDeliveryEmail({
        to: existingOrder.customer_email,
        orderId: existingOrder.order_id,
        planType: existingOrder.plan_type,
        licenseKey: allocation.decryptedKey,
      }).catch((err) => console.error('[checkout/paypal/verify] Email send error:', err));

      sendAdminOrderAlert({
        orderId: existingOrder.order_id,
        customerEmail: existingOrder.customer_email,
        customerPhone: existingOrder.customer_phone,
        planType: existingOrder.plan_type,
        amount: existingOrder.amount,
        currency: 'USD',
        gateway: 'PayPal IPN (Instant Match)',
        transactionId: `Verified PayPal Tx: ${rawTxId}`,
        deliveredKey: allocation.decryptedKey,
      }).catch((err) => console.error('[checkout/paypal/verify] Discord alert error:', err));

      const updatedOrder = await getOrderById(orderId);
      return NextResponse.json({
        success: true,
        status: 'paid',
        order: updatedOrder ? toOrderPublic(updatedOrder) : null,
        message: 'Payment verified with PayPal! Key allocated.',
      });
    }

    // ── 4. Fallback: IPN hasn't hit server yet or pending manual approval ────
    await db.collection('orders').doc(orderId).update({
      payment_status: 'verifying',
      paypal_tx_id: rawTxId,
      payment_gateway: 'paypal_direct',
      updated_at: new Date(),
    });

    // Dispatch instant Admin Discord alert with 1-click action links as backup
    sendPaymentVerificationAlert({
      orderId: existingOrder.order_id,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      planType: existingOrder.plan_type,
      amount: existingOrder.amount,
      currency: 'USD',
      gateway: 'PayPal (Direct)',
      transactionId: `PayPal: ${rawTxId}`,
    }).catch((alertErr) => {
      console.error('[checkout/paypal/verify] Discord admin alert error:', alertErr);
    });

    const updatedOrder = await getOrderById(orderId);
    const publicOrder = updatedOrder ? toOrderPublic(updatedOrder) : null;

    return NextResponse.json({
      success: true,
      status: 'verifying',
      order: publicOrder,
      message: 'Payment proof submitted. Verifying transaction with PayPal.',
    });
  } catch (err: any) {
    console.error('[checkout/paypal/verify] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to submit PayPal payment proof.' },
      { status: 500 }
    );
  }
}
