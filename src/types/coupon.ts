export type DiscountType = 'flat' | 'percentage';

export interface Coupon {
  code: string;
  discount_type: DiscountType;
  discount_value_inr: number; // in paise, e.g. 1000 = ₹10
  discount_value_usd?: number; // in cents, e.g. 15 = $0.15
  percentage?: number; // 1-100 if discount_type is 'percentage'
  min_order_inr?: number; // min order in paise
  max_uses?: number;
  times_used: number;
  active: boolean;
  description: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  description?: string;
  discountType?: DiscountType;
  discountAmountInr?: number; // paise
  discountAmountUsd?: number; // cents
  discountDisplayInr?: string;
  discountDisplayUsd?: string;
  newPriceInr?: number; // paise
  newPriceUsd?: number; // cents
  error?: string;
}
