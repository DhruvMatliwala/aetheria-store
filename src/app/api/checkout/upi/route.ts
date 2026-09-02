import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PLAN_MAP, UPI_VPA, UPI_PAYEE_NAME } from '@/lib/constants';
import { createOrder } from '@/lib/firestore/orders';
import { getAvailableCount } from '@/lib/firestore/keys';
import { allocateUniquePaise } from '@/lib/orders/paiseAllocator';

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

    // ── Validate input (Email required) ──────────────────────────────────────
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

    // ── Create internal order ID & unique paise amount for zero-UTR matching ─
    const orderId = `ord_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const { totalPaisa, amountRupees, paiseOffset } = await allocateUniquePaise(plan.price_inr);
    const priceRupeesStr = amountRupees.toFixed(2);
    const note = `AETHERIA_${orderId.slice(-8).toUpperCase()}`;

    // ── Standard NPCI UPI URI with exact locked amount ───────────────────────
    // Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
    const upiString = `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${priceRupeesStr}&cu=INR&tn=${encodeURIComponent(note)}`;

    // ── Persist pending order to Firestore ───────────────────────────────────
    await createOrder({
      order_id: orderId,
      customer_email: email.toLowerCase().trim(),
      customer_phone: (phone || '').trim(),
      plan_type: planId,
      amount: totalPaisa,
      currency: 'INR',
      payment_gateway: 'upi_direct',
      gateway_order_id: `upi_${orderId}`,
    });

    return NextResponse.json({
      orderId,
      amount: totalPaisa,
      amountRupees,
      paiseOffset,
      currency: 'INR',
      upiId: UPI_VPA,
      payeeName: UPI_PAYEE_NAME,
      upiString,
      note,
    });
  } catch (err) {
    console.error('[checkout/upi]', err);
    return NextResponse.json(
      { error: 'Failed to create UPI checkout session.' },
      { status: 500 }
    );
  }
}
