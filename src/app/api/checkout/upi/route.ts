import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PLAN_MAP, UPI_VPA, UPI_PAYEE_NAME, SMART_ROUTING_UPI_IDS, OFFICIAL_GPAY_URI } from '@/lib/constants';
import { createOrder, getRecentPendingOrder } from '@/lib/firestore/orders';
import { getAdminFirestore, admin } from '@/lib/firebase/admin';
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

    // ── Check if customer already has an active pending order for this plan ──
    const normalizedEmail = email.toLowerCase().trim();
    const existingOrder = await getRecentPendingOrder(normalizedEmail, planId, 'upi_direct', 20);

    let orderId: string;
    let totalPaisa: number;
    let amountRupees: number;
    let paiseOffset: number;

    const upiString = OFFICIAL_GPAY_URI;
    const note = '';

    if (existingOrder) {
      orderId = existingOrder.order_id;
      totalPaisa = basePriceInr;
      amountRupees = Math.round(basePriceInr / 100);
      paiseOffset = 0;

      const db = getAdminFirestore();
      const updateData: Record<string, any> = {
        amount: totalPaisa,
        customer_phone: (phone || '').trim(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (appliedCouponCode) {
        updateData.coupon_code = appliedCouponCode;
        updateData.discount_amount = discountAmountInr;
      }
      await db.collection('orders').doc(orderId).update(updateData);
    } else {
      orderId = `ord_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const alloc = await allocateUniquePaise(basePriceInr);
      totalPaisa = alloc.totalPaisa;
      amountRupees = alloc.amountRupees;
      paiseOffset = alloc.paiseOffset;

      await createOrder({
        order_id: orderId,
        customer_email: normalizedEmail,
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
    }

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
