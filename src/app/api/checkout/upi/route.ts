import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PLAN_MAP, UPI_VPA, UPI_PAYEE_NAME, SMART_ROUTING_UPI_IDS, OFFICIAL_GPAY_URI } from '@/lib/constants';
import { createOrder } from '@/lib/firestore/orders';
import { getAvailableCount } from '@/lib/firestore/keys';
import { allocateUniquePaise } from '@/lib/orders/paiseAllocator';
import { validateAndApplyCoupon, incrementCouponUsage } from '@/lib/firestore/coupons';

export const runtime = 'nodejs';

interface CheckoutBody {
  planId: string;
  email: string;
  phone?: string;
  couponCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const { planId, email, phone = '', couponCode } = body;

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

    // ── Apply optional promo coupon server-side ──────────────────────────────
    let basePriceInr = plan.price_inr;
    let appliedCouponCode: string | undefined;
    let discountAmountInr: number | undefined;

    if (couponCode && couponCode.trim()) {
      const couponResult = await validateAndApplyCoupon(couponCode, plan, 'INR');
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error || 'Invalid coupon code.' },
          { status: 400 }
        );
      }
      basePriceInr = couponResult.newPriceInr!;
      appliedCouponCode = couponResult.code;
      discountAmountInr = couponResult.discountAmountInr;
    }

    // ── Create internal order ID & unique paise amount for zero-UTR matching ─
    const orderId = `ord_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const { totalPaisa, amountRupees, paiseOffset } = await allocateUniquePaise(basePriceInr);
    const priceRupeesStr = Math.round(amountRupees).toString();
    const note = '';

    // ── Official Authenticated GPay P2P URI with cryptographic aid token ────────
    const upiString = OFFICIAL_GPAY_URI;

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
      coupon_code: appliedCouponCode,
      discount_amount: discountAmountInr,
      original_amount: plan.price_inr,
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
      smartRouting: SMART_ROUTING_UPI_IDS,
    });
  } catch (err) {
    console.error('[checkout/upi]', err);
    return NextResponse.json(
      { error: 'Failed to create UPI checkout session.' },
      { status: 500 }
    );
  }
}
