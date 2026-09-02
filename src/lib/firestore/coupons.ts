import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { Plan } from '@/types/plan';
import { Coupon, CouponValidationResult } from '@/types/coupon';

const COUPONS_COLLECTION = 'coupons';

/**
 * Built-in private secret coupons for trusted buyers.
 * Strangers cannot guess these without being given them directly!
 */
const DEFAULT_COUPONS: Record<string, Coupon> = {
  VIPDHRUV: {
    code: 'VIPDHRUV',
    discount_type: 'flat',
    discount_value_inr: 1000, // ₹10 (1000 paise)
    discount_value_usd: 15,   // $0.15 (15 cents)
    times_used: 0,
    active: true,
    description: 'Private VIP Trainer Discount (₹10 OFF)',
  },
  DISCORDMEMBER: {
    code: 'DISCORDMEMBER',
    discount_type: 'flat',
    discount_value_inr: 1000, // ₹10 (1000 paise)
    discount_value_usd: 15,   // $0.15 (15 cents)
    times_used: 0,
    active: true,
    description: 'Exclusive Discord Member Discount (₹10 OFF)',
  },
};

/**
 * Normalize coupon string for case-insensitive matching
 */
export function normalizeCouponCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * Fetch a coupon from Firestore, falling back to built-in default coupons
 */
export async function getCoupon(rawCode: string): Promise<Coupon | null> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;

  try {
    const db = getAdminFirestore();
    const docRef = db.collection(COUPONS_COLLECTION).doc(code);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as Partial<Coupon>;
      return {
        code,
        discount_type: data.discount_type || 'flat',
        discount_value_inr: data.discount_value_inr ?? 1000,
        discount_value_usd: data.discount_value_usd ?? 15,
        percentage: data.percentage,
        min_order_inr: data.min_order_inr,
        max_uses: data.max_uses,
        times_used: data.times_used ?? 0,
        active: data.active ?? true,
        description: data.description || `${code} Discount Applied`,
      };
    }
  } catch (err) {
    console.error('[getCoupon] Firestore check error:', err);
  }

  // Fallback to built-in default coupons
  if (DEFAULT_COUPONS[code]) {
    return DEFAULT_COUPONS[code];
  }

  return null;
}

/**
 * Validate coupon code against a specific plan and compute exact discounted prices
 */
export async function validateAndApplyCoupon(
  rawCode: string,
  plan: Plan,
  currency: 'INR' | 'USD' = 'INR'
): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { valid: false, code: '', error: 'Coupon code cannot be empty.' };
  }

  const coupon = await getCoupon(code);
  if (!coupon) {
    return { valid: false, code, error: `Promo code "${code}" is invalid.` };
  }

  if (!coupon.active) {
    return { valid: false, code, error: `Promo code "${code}" is currently disabled.` };
  }

  if (coupon.max_uses !== undefined && coupon.times_used >= coupon.max_uses) {
    return { valid: false, code, error: `Promo code "${code}" has reached its maximum redemptions.` };
  }

  if (coupon.min_order_inr && plan.price_inr < coupon.min_order_inr) {
    const minRs = (coupon.min_order_inr / 100).toLocaleString('en-IN');
    return {
      valid: false,
      code,
      error: `Promo code "${code}" requires a minimum order of ₹${minRs}.`,
    };
  }

  // Calculate INR discount
  let discountAmountInr = 0;
  if (coupon.discount_type === 'percentage' && coupon.percentage) {
    discountAmountInr = Math.round((plan.price_inr * coupon.percentage) / 100);
  } else {
    discountAmountInr = coupon.discount_value_inr;
  }

  // Enforce minimum ₹1 (100 paise) so payment gateway doesn't fail
  const minPriceInr = 100;
  const newPriceInr = Math.max(minPriceInr, plan.price_inr - discountAmountInr);
  const actualDiscountInr = plan.price_inr - newPriceInr;

  // Calculate USD discount
  let discountAmountUsd = 0;
  if (coupon.discount_type === 'percentage' && coupon.percentage) {
    discountAmountUsd = Math.round((plan.price_usd * coupon.percentage) / 100);
  } else {
    discountAmountUsd = coupon.discount_value_usd ?? Math.round((actualDiscountInr / 83));
  }

  const minPriceUsd = 10; // $0.10 minimum
  const newPriceUsd = Math.max(minPriceUsd, plan.price_usd - discountAmountUsd);
  const actualDiscountUsd = plan.price_usd - newPriceUsd;

  return {
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discount_type,
    discountAmountInr: actualDiscountInr,
    discountAmountUsd: actualDiscountUsd,
    discountDisplayInr: `₹${(actualDiscountInr / 100).toLocaleString('en-IN')}`,
    discountDisplayUsd: `$${(actualDiscountUsd / 100).toFixed(2)}`,
    newPriceInr,
    newPriceUsd,
  };
}

/**
 * Atomically increment coupon times_used count in Firestore
 */
export async function incrementCouponUsage(rawCode: string): Promise<void> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return;

  try {
    const db = getAdminFirestore();
    const docRef = db.collection(COUPONS_COLLECTION).doc(code);
    await docRef.set(
      {
        times_used: admin.firestore.FieldValue.increment(1),
        last_used_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`[incrementCouponUsage] Could not increment usage for ${code}:`, err);
  }
}
