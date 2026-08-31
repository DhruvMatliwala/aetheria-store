export interface Plan {
  id: string;           // matches plan_type in Firestore
  name: string;
  duration: string;
  price_inr: number;   // in paise (× 100 for Razorpay)
  price_usd: number;   // in cents (× 100 for PayPal)
  features: string[];
  badge?: string;      // e.g. "Most Popular"
  device_slots: number;
}
