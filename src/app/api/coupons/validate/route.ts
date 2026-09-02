import { NextRequest, NextResponse } from 'next/server';
import { PLAN_MAP } from '@/lib/constants';
import { validateAndApplyCoupon } from '@/lib/firestore/coupons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ValidateRequestBody {
  code: string;
  planId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateRequestBody;
    const { code, planId } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { valid: false, error: 'Please enter a promo code.' },
        { status: 400 }
      );
    }

    const plan = PLAN_MAP[planId];
    if (!plan) {
      return NextResponse.json(
        { valid: false, error: 'Invalid plan selected.' },
        { status: 400 }
      );
    }

    const result = await validateAndApplyCoupon(code, plan);

    if (!result.valid) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/coupons/validate]', err);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate promo code.' },
      { status: 500 }
    );
  }
}
