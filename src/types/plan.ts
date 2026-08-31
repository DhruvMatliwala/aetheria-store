export interface Plan {
  id: string;           // matches plan_type in Firestore
  name: string;
  duration: string;
  price_inr: number;            // in paise (× 100 for Razorpay)
  price_usd: number;            // in cents (× 100 for PayPal)
  original_price_inr?: number;  // original/strikethrough price in paise
  original_price_usd?: number;  // original/strikethrough price in cents
  features: string[];
  badge?: string;               // e.g. "Popular"
  discount_badge?: string;      // e.g. "BEST VALUE"
  device_slots: number;
}
