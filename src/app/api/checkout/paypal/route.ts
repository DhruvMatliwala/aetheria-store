import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PLAN_MAP, PAYPAL_ME_URL, PAYPAL_EMAIL, PAYPAL_USERNAME } from '@/lib/constants';
import { createOrder, getRecentPendingOrder } from '@/lib/firestore/orders';
import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { getAvailableCount } from '@/lib/firestore/keys';
import { validateAndApplyCoupon, incrementCouponUsage } from '@/lib/firestore/coupons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    let finalPriceUsdCents = plan.price_usd;
    let appliedCouponCode: string | undefined;
    let discountAmountUsd: number | undefined;

    if (couponCode && couponCode.trim()) {
      const couponResult = await validateAndApplyCoupon(couponCode, plan, 'USD');
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error || 'Invalid coupon code.' },
          { status: 400 }
        );
      }
      finalPriceUsdCents = couponResult.newPriceUsd!;
      appliedCouponCode = couponResult.code;
      discountAmountUsd = couponResult.discountAmountUsd;
    }

    // ── Check if customer already has an active pending order for this plan ──
    const normalizedEmail = email.toLowerCase().trim();
    const existingOrder = await getRecentPendingOrder(normalizedEmail, planId, 'paypal_direct', 20);

    let orderId: string;
    const amountUsd = (finalPriceUsdCents / 100).toFixed(2);

    if (existingOrder) {
      orderId = existingOrder.order_id;
      const db = getAdminFirestore();
      const updateData: Record<string, any> = {
        amount: finalPriceUsdCents,
        customer_phone: (phone || '').trim(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (appliedCouponCode) {
        updateData.coupon_code = appliedCouponCode;
        updateData.discount_amount = discountAmountUsd;
      }
      await db.collection('orders').doc(orderId).update(updateData);
    } else {
      orderId = `ord_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      await createOrder({
        order_id: orderId,
        customer_email: normalizedEmail,
        customer_phone: (phone || '').trim(),
        plan_type: planId,
        amount: finalPriceUsdCents,
        currency: 'USD',
        payment_gateway: 'paypal_direct',
        gateway_order_id: `paypal_${orderId}`,
        coupon_code: appliedCouponCode,
        discount_amount: discountAmountUsd,
        original_amount: plan.price_usd,
      });
    }

    const note = `AETHERIA_${orderId.slice(-8).toUpperCase()}`;

    // Standard PayPal.me payment link with pre-filled amount:
    // e.g. https://www.paypal.me/MatliwalaYogesh/2.00USD or /3.60USD
    const cleanBaseUrl = PAYPAL_ME_URL.replace(/\/+$/, '');
    const prefilledPaypalMeUrl = `${cleanBaseUrl}/${amountUsd}USD`;

    return NextResponse.json({
      orderId,
      amount: plan.price_usd,
      amountUsd,
      currency: 'USD',
      paypalMeUrl: prefilledPaypalMeUrl,
      paypalEmail: PAYPAL_EMAIL,
      paypalUsername: PAYPAL_USERNAME,
      note,
    });
  } catch (err) {
    console.error('[checkout/paypal]', err);
    return NextResponse.json(
      { error: 'Failed to create PayPal checkout session.' },
      { status: 500 }
    );
  }
}
