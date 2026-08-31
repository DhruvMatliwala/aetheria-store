import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPaymentSignature } from '@/lib/payments/razorpay';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VerifyBody {
  orderId?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  // CamelCase fallbacks
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = body.orderId;
    const razorpayPaymentId = body.razorpay_payment_id || body.razorpayPaymentId;
    const razorpayOrderId = body.razorpay_order_id || body.razorpayOrderId;
    const razorpaySignature = body.razorpay_signature || body.razorpaySignature;

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay verification parameters.' },
        { status: 400 }
      );
    }

    // ── 1. Verify Razorpay Payment Signature ─────────────────────────────────
    let isValid = false;
    try {
      isValid = verifyRazorpayPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );
    } catch (sigErr: any) {
      console.error('[checkout/upi/verify] Signature calculation error:', sigErr?.message || sigErr);
      return NextResponse.json(
        { error: 'Server signature configuration error.' },
        { status: 500 }
      );
    }

    if (!isValid) {
      console.warn('[checkout/upi/verify] Invalid payment signature for order:', orderId);
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // ── 2. Check existing order in Firestore ─────────────────────────────────
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Idempotency: if already processed, return immediately
    if (existingOrder.payment_status === 'paid' && existingOrder.delivered_key) {
      return NextResponse.json({
        success: true,
        order: toOrderPublic(existingOrder),
        message: 'Order was already verified and fulfilled.',
      });
    }

    // ── 3. Atomically allocate license key slot ──────────────────────────────
    const allocation = await allocateKeySlot(orderId, razorpayPaymentId);

    // ── 4. Send transactional key delivery email asynchronously ──────────────
    try {
      sendKeyDeliveryEmail({
        to: existingOrder.customer_email,
        orderId: existingOrder.order_id,
        planType: existingOrder.plan_type,
        licenseKey: allocation.decryptedKey,
      }).catch((emailErr) => {
        console.error('[checkout/upi/verify] Email delivery background error:', emailErr);
      });
    } catch (emailErr) {
      console.error('[checkout/upi/verify] Failed to schedule email delivery:', emailErr);
    }

    // ── 4B. Dispatch real-time Admin Discord backup alert ────────────────────
    sendAdminOrderAlert({
      orderId: existingOrder.order_id,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      planType: existingOrder.plan_type,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      gateway: 'upi',
      transactionId: razorpayPaymentId,
      deliveredKey: allocation.decryptedKey,
    }).catch((alertErr) => {
      console.error('[checkout/upi/verify] Discord admin alert error:', alertErr);
    });

    // ── 5. Fetch updated order and return response ───────────────────────────
    const updatedOrder = await getOrderById(orderId);
    const publicOrder = updatedOrder ? toOrderPublic(updatedOrder) : null;

    return NextResponse.json({
      success: true,
      order: publicOrder,
    });
  } catch (err: any) {
    console.error('[checkout/upi/verify] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to verify UPI payment.' },
      { status: 500 }
    );
  }
}
