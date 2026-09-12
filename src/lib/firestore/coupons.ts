import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { Plan } from '@/types/plan';
import { Coupon, CouponValidationResult } from '@/types/coupon';

const COUPONS_COLLECTION = 'coupons';

/**
 * Normalize coupon string for case-insensitive matching
 */
export function normalizeCouponCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * Fetch all coupons from Firestore (for Admin Dashboard)
 */
export async function getAllCoupons(): Promise<Coupon[]> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(COUPONS_COLLECTION).get();
    if (snap.empty) return [];

    return snap.docs.map((doc) => {
      const data = doc.data() as Partial<Coupon>;
      return {
        code: doc.id,
        discount_type: data.discount_type || 'flat',
        discount_value_inr: data.discount_value_inr ?? 1000,
        discount_value_usd: data.discount_value_usd ?? 15,
        percentage: data.percentage,
        min_order_inr: data.min_order_inr,
        max_uses: data.max_uses,
        times_used: data.times_used ?? 0,
        active: data.active ?? true,
        description: data.description || `${doc.id} Promo Code`,
      };
    });
  } catch (err) {
    console.error('[getAllCoupons] Firestore fetch error:', err);
    return [];
  }
}

/**
 * Save or update a coupon in Firestore
 */
export async function saveCoupon(coupon: Coupon): Promise<void> {
  const code = normalizeCouponCode(coupon.code);
  if (!code) throw new Error('Valid coupon code is required.');

  const db = getAdminFirestore();
  await db.collection(COUPONS_COLLECTION).doc(code).set(
    {
      ...coupon,
      code,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Delete a coupon from Firestore
 */
export async function deleteCoupon(rawCode: string): Promise<boolean> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return false;

  try {
    const db = getAdminFirestore();
    await db.collection(COUPONS_COLLECTION).doc(code).delete();
    return true;
  } catch (err) {
    console.error(`[deleteCoupon] Failed to delete coupon "${code}":`, err);
    return false;
  }
}

/**
 * Fetch a single coupon from Firestore
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
  if (code.startsWith('REF30_')) {
    // Clean USD pricing: $2.00 -> $1.70 (30c off), $3.60 -> $3.00 (60c off)
    discountAmountUsd = plan.id.includes('2_device') ? 60 : 30;
  } else if (coupon.discount_type === 'percentage' && coupon.percentage) {
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
