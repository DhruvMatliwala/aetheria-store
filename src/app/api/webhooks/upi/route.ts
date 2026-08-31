import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { getOrderByGatewayId } from '@/lib/firestore/orders';
import { assignKeyToOrder } from '@/lib/firestore/transaction';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';

// Razorpay requires the raw body for signature verification.
// Next.js App Router provides the raw body via request.text().
export async function POST(request: NextRequest) {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Cannot read request body.' }, { status: 400 });
  }

  // ── Verify signature ───────────────────────────────────────────────────────
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  let isValid: boolean;
  try {
    isValid = verifyRazorpayWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error('[webhook/upi] Signature verification error:', err);
    return NextResponse.json({ error: 'Signature verification failed.' }, { status: 401 });
  }

  if (!isValid) {
    console.warn('[webhook/upi] Invalid signature received.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  // ── Parse event ────────────────────────────────────────────────────────────
  let event: {
    event: string;
    payload: {
      payment: {
        entity: {
          order_id: string;
          id: string;
          status: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  // ── Process only payment.captured events ──────────────────────────────────
  if (event.event !== 'payment.captured') {
    // Acknowledge other events without processing
    return NextResponse.json({ received: true });
  }

  const razorpayOrderId = event.payload.payment.entity.order_id;

  try {
    // ── Find internal order ────────────────────────────────────────────────
    const order = await getOrderByGatewayId(razorpayOrderId);
    if (!order) {
      console.error('[webhook/upi] Order not found for gateway ID:', razorpayOrderId);
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // ── Already processed (idempotency) ───────────────────────────────────
    if (order.payment_status === 'paid') {
      console.log('[webhook/upi] Order already processed:', order.order_id);
      return NextResponse.json({ received: true });
    }

    // ── Atomic key assignment transaction ─────────────────────────────────
    const decryptedKey = await assignKeyToOrder(order.order_id);

    // ── Send email (fire-and-forget, don't fail the webhook on email error) ─
    sendKeyDeliveryEmail({
      to: order.customer_email,
      orderId: order.order_id,
      planType: order.plan_type,
      licenseKey: decryptedKey,
    }).catch((err) => {
      console.error('[webhook/upi] Email delivery failed (non-fatal):', err);
    });

    console.log('[webhook/upi] Key delivered for order:', order.order_id);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/upi] Processing error:', err);
    // Return 500 so Razorpay retries the webhook
    return NextResponse.json({ error: 'Internal processing error.' }, { status: 500 });
  }
}
