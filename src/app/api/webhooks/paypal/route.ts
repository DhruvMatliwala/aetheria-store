import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhookSignature } from '@/lib/payments/paypal';
import { getOrderById } from '@/lib/firestore/orders';
import { assignKeyToOrder } from '@/lib/firestore/transaction';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;                           // PayPal capture ID
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
    custom_id?: string;                   // Our internal order ID (set in purchase_units)
    purchase_units?: Array<{
      custom_id?: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Cannot read request body.' }, { status: 400 });
  }

  // ── Verify PayPal webhook signature ────────────────────────────────────────
  const authAlgo       = request.headers.get('paypal-auth-algo') ?? '';
  const certUrl        = request.headers.get('paypal-cert-url') ?? '';
  const transmissionId = request.headers.get('paypal-transmission-id') ?? '';
  const transmissionSig= request.headers.get('paypal-transmission-sig') ?? '';
  const transmissionTime = request.headers.get('paypal-transmission-time') ?? '';

  let isValid: boolean;
  try {
    isValid = await verifyPayPalWebhookSignature({
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
      rawBody,
    });
  } catch (err) {
    console.error('[webhook/paypal] Verification error:', err);
    return NextResponse.json({ error: 'Signature verification failed.' }, { status: 401 });
  }

  if (!isValid) {
    console.warn('[webhook/paypal] Invalid signature.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  // ── Parse event ────────────────────────────────────────────────────────────
  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  // ── Process only PAYMENT.CAPTURE.COMPLETED ────────────────────────────────
  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ received: true });
  }

  // Extract internal order ID from custom_id (set during order creation)
  const internalOrderId =
    event.resource.custom_id ??
    event.resource.purchase_units?.[0]?.custom_id;

  if (!internalOrderId) {
    console.error('[webhook/paypal] No custom_id in event:', event.resource);
    return NextResponse.json({ error: 'Missing custom_id.' }, { status: 400 });
  }

  try {
    // ── Find order ─────────────────────────────────────────────────────────
    // PayPal custom_id is our internal order_id, stored in Firestore as order_id
    const order = await getOrderById(internalOrderId);

    if (!order) {
      console.error('[webhook/paypal] Order not found:', internalOrderId);
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // ── Idempotency check ──────────────────────────────────────────────────
    if (order.payment_status === 'paid') {
      console.log('[webhook/paypal] Already processed:', order.order_id);
      return NextResponse.json({ received: true });
    }

    // ── Atomic key assignment ──────────────────────────────────────────────
    const decryptedKey = await assignKeyToOrder(order.order_id);

    // ── Send email ─────────────────────────────────────────────────────────
    sendKeyDeliveryEmail({
      to: order.customer_email,
      orderId: order.order_id,
      planType: order.plan_type,
      licenseKey: decryptedKey,
    }).catch((err) => {
      console.error('[webhook/paypal] Email failed (non-fatal):', err);
    });

    console.log('[webhook/paypal] Key delivered for order:', order.order_id);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/paypal] Processing error:', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
