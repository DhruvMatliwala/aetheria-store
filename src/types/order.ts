export type PaymentStatus = 'pending' | 'verifying' | 'paid' | 'COMPLETED' | 'failed';
export type PaymentGateway = 'upi_gateway' | 'upi_direct' | 'paypal' | 'paypal_direct';
export type Currency = 'INR' | 'USD';

export interface Order {
  order_id: string;
  customer_email: string;
  customer_phone?: string;
  plan_type: string;
  amount: number;
  currency: Currency;
  payment_gateway: PaymentGateway;
  payment_status: PaymentStatus;
  delivered_key: string | null;  // decrypted key — populated after payment
  gateway_order_id: string;      // razorpay order id / paypal order id / upi_direct order id / paypal_direct order id
  utr_number?: string;           // 12-digit UPI transaction reference number
  paypal_tx_id?: string;         // PayPal transaction ID / payer reference
  slots_assigned?: number;       // number of device slots claimed
  key_id?: string;               // document ID of the assigned license key
  created_at: FirebaseFirestore.Timestamp;
  updated_at?: FirebaseFirestore.Timestamp;
}

// Sanitized version returned to client and admin views
export interface OrderPublic {
  order_id: string;
  customer_email?: string;
  customer_phone?: string;
  plan_type: string;
  amount: number;
  currency: Currency;
  payment_gateway?: PaymentGateway;
  payment_status: PaymentStatus;
  delivered_key: string | null;
  utr_number?: string;
  paypal_tx_id?: string;
  slots_assigned?: number;
  created_at: string;
}
