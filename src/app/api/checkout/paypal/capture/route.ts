import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';
import { capturePayPalOrder } from '@/lib/payments/paypal';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CaptureBody {
  orderId?: string;
  paypalOrderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CaptureBody;
    const { orderId, paypalOrderId } = body;

    if (!orderId || !paypalOrderId) {
      return NextResponse.json(
        { error: 'Both orderId and paypalOrderId are required for capture.' },
        { status: 400 }
      );
    }

    // ── 1. Fetch existing order from Firestore ──────────────────────────────
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Idempotency: if order is already paid & key is assigned, return immediately
    if (existingOrder.payment_status === 'paid' && existingOrder.delivered_key) {
      return NextResponse.json({
        success: true,
        order: toOrderPublic(existingOrder),
        message: 'Order was already captured and fulfilled.',
      });
    }

    // ── 2. Capture payment on PayPal REST API ────────────────────────────────
    try {
      await capturePayPalOrder(paypalOrderId);
    } catch (captureErr: any) {
      console.error('[paypal/capture] PayPal REST API capture error:', captureErr?.message || captureErr);
      // If error is not a duplicate/completed status, return error response
      if (!captureErr?.message?.includes('ORDER_ALREADY_CAPTURED')) {
        return NextResponse.json(
          { error: captureErr?.message || 'Failed to capture PayPal authorization.' },
          { status: 502 }
        );
      }
    }

    // ── 3. Atomically allocate license key slot ──────────────────────────────
    const allocation = await allocateKeySlot(orderId, paypalOrderId);

    // ── 4. Send transactional key delivery email asynchronously ──────────────
    try {
      sendKeyDeliveryEmail({
        to: existingOrder.customer_email,
        orderId: existingOrder.order_id,
        planType: existingOrder.plan_type,
        licenseKey: allocation.decryptedKey,
      }).catch((emailErr) => {
        console.error('[paypal/capture] Email delivery background error:', emailErr);
      });
    } catch (emailErr) {
      console.error('[paypal/capture] Failed to schedule email delivery:', emailErr);
    }

    // ── 5. Fetch and return fulfilled order details ──────────────────────────
    const updatedOrder = await getOrderById(orderId);
    const publicOrder = updatedOrder
      ? toOrderPublic(updatedOrder)
      : {
          order_id: orderId,
          plan_type: existingOrder.plan_type,
          amount: existingOrder.amount,
          currency: existingOrder.currency,
          payment_status: 'paid' as const,
          delivered_key: allocation.decryptedKey,
          slots_assigned: allocation.assignedSlots,
          created_at: new Date().toISOString(),
        };

    return NextResponse.json({
      success: true,
      order: publicOrder,
    });
  } catch (err: any) {
    console.error('[paypal/capture] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error during PayPal capture.' },
      { status: 500 }
    );
  }
}
