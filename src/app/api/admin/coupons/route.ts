import { NextRequest, NextResponse } from 'next/server';
import { getAllCoupons, saveCoupon, deleteCoupon, normalizeCouponCode } from '@/lib/firestore/coupons';
import { verifyAdminSecret } from '@/lib/admin/adminAuth';
import { Coupon } from '@/types/coupon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const coupons = await getAllCoupons();
    return NextResponse.json({ coupons });
  } catch (err: any) {
    console.error('[api/admin/coupons] GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch coupons.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawCode = (body.code || '').trim();
    const discountRs = Number(body.discountInr || 10);
    const description = (body.description || '').trim();

    const code = normalizeCouponCode(rawCode);
    if (!code || code.length < 3) {
      return NextResponse.json({ error: 'Coupon code must be at least 3 characters.' }, { status: 400 });
    }

    const discountPaise = Math.round(discountRs * 100);
    const discountCents = Math.round((discountRs / 83) * 100) || 15;

    const coupon: Coupon = {
      code,
      discount_type: 'flat',
      discount_value_inr: discountPaise,
      discount_value_usd: discountCents,
      times_used: 0,
      active: true,
      description: description || `₹${discountRs} OFF Promo Discount`,
    };

    await saveCoupon(coupon);

    return NextResponse.json({
      success: true,
      coupon,
      message: `Coupon "${code}" created successfully.`,
    });
  } catch (err: any) {
    console.error('[api/admin/coupons] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create coupon.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let code = searchParams.get('code');

    if (!code) {
      const body = await request.json().catch(() => ({}));
      code = body.code;
    }

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required for deletion.' }, { status: 400 });
    }

    const cleanCode = normalizeCouponCode(code);
    const deleted = await deleteCoupon(cleanCode);

    return NextResponse.json({
      success: deleted,
      code: cleanCode,
      message: `Coupon "${cleanCode}" deleted successfully.`,
    });
  } catch (err: any) {
    console.error('[api/admin/coupons] DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete coupon.' }, { status: 500 });
  }
}
