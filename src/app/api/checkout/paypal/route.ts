import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PLAN_MAP } from '@/lib/constants';
import { createPayPalOrder, getPayPalApprovalUrl } from '@/lib/payments/paypal';
import { createOrder } from '@/lib/firestore/orders';
import { getAvailableCount } from '@/lib/firestore/keys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // ── Create PayPal order in USD (formatted as 2-decimal string) ───────────
    let paypalOrder;
    try {
      paypalOrder = await createPayPalOrder(plan.price_usd, orderId, plan.name);
    } catch (err: any) {
      console.error('[checkout/paypal] PayPal API Error:', err?.message || err);
      return NextResponse.json(
        { error: err?.message || 'PayPal payment gateway is currently unavailable.' },
        { status: 502 }
      );
    }

    // ── Persist pending order to Firestore in USD ────────────────────────────
    await createOrder({
      order_id: orderId,
      customer_email: email.toLowerCase().trim(),
      customer_phone: (phone || '').trim(),
      plan_type: planId,
      amount: plan.price_usd,
      currency: 'USD',
      payment_gateway: 'paypal',
      gateway_order_id: paypalOrder.id,
    });

    const approvalUrl = getPayPalApprovalUrl(paypalOrder);

    return NextResponse.json({
      orderId,
      paypalOrderId: paypalOrder.id,
      currency: 'USD',
      amountUsd: (plan.price_usd / 100).toFixed(2),
      approvalUrl,
    });
  } catch (err) {
    console.error('[checkout/paypal]', err);
    return NextResponse.json(
      { error: 'Failed to create PayPal checkout session.' },
      { status: 500 }
    );
  }
}
