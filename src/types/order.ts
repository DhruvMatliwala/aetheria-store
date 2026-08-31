export type PaymentStatus = 'pending' | 'paid' | 'COMPLETED' | 'failed';
export type PaymentGateway = 'upi_gateway' | 'paypal';
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
  gateway_order_id: string;      // razorpay order id / paypal order id
  slots_assigned?: number;       // number of device slots claimed
  key_id?: string;               // document ID of the assigned license key
  created_at: FirebaseFirestore.Timestamp;
  updated_at?: FirebaseFirestore.Timestamp;
}

// Sanitized version returned to client
export interface OrderPublic {
  order_id: string;
  plan_type: string;
  amount: number;
  currency: Currency;
  payment_status: PaymentStatus;
  delivered_key: string | null;
  slots_assigned?: number;
  created_at: string;
}
