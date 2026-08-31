import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PLAN_MAP } from '@/lib/constants';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { createOrder } from '@/lib/firestore/orders';
import { getAvailableCount } from '@/lib/firestore/keys';

export const runtime = 'nodejs';

interface CheckoutBody {
  planId: string;
  email: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const { planId, email, phone = '' } = body;

    // ── Validate input (Email only required) ─────────────────────────────────
    if (!planId || !email || !email.trim()) {
      return NextResponse.json(
        { error: 'Valid planId and email address are required.' },
        { status: 400 }
      );
    }

    const plan = PLAN_MAP[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }

    // ── Check stock ──────────────────────────────────────────────────────────
    const available = await getAvailableCount(planId);
    if (available === 0) {
      return NextResponse.json(
        { error: 'This plan is currently out of stock.' },
        { status: 409 }
      );
    }

    // ── Create internal order ID ─────────────────────────────────────────────
    const orderId = `ord_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    // ── Create Razorpay order ────────────────────────────────────────────────
    const rzpOrder = await createRazorpayOrder(plan.price_inr, orderId);

    // ── Persist pending order to Firestore ───────────────────────────────────
    await createOrder({
      order_id: orderId,
      customer_email: email.toLowerCase().trim(),
      customer_phone: (phone || '').trim(),
      plan_type: planId,
      amount: plan.price_inr,
      currency: 'INR',
      payment_gateway: 'upi_gateway',
      gateway_order_id: rzpOrder.id,
    });

    return NextResponse.json({
      orderId,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[checkout/upi]', err);
    return NextResponse.json(
      { error: 'Failed to create UPI checkout session.' },
      { status: 500 }
    );
  }
}
