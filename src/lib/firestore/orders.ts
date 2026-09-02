import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { Order, OrderPublic, PaymentGateway, Currency } from '@/types/order';

const COLLECTION = 'orders';

export interface CreateOrderInput {
  order_id: string;
  customer_email: string;
  customer_phone?: string;
  plan_type: string;
  amount: number;
  currency: Currency;
  payment_gateway: PaymentGateway;
  gateway_order_id: string;
  coupon_code?: string;
  discount_amount?: number;
  original_amount?: number;
}

export interface RevenueStats {
  totalRevenueINR: number;
  totalRevenueUSD: number;
  paidOrdersCount: number;
  tierSales: Record<string, number>;
}

export async function createOrder(input: CreateOrderInput): Promise<void> {
  const db = getAdminFirestore();
  const doc: Record<string, any> = {
    order_id: input.order_id,
    customer_email: input.customer_email,
    customer_phone: input.customer_phone ?? '',
    plan_type: input.plan_type,
    amount: input.amount,
    currency: input.currency,
    payment_gateway: input.payment_gateway,
    payment_status: 'pending',
    delivered_key: null,
    gateway_order_id: input.gateway_order_id,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (input.coupon_code) {
    doc.coupon_code = input.coupon_code;
  }
  if (input.discount_amount !== undefined) {
    doc.discount_amount = input.discount_amount;
  }
  if (input.original_amount !== undefined) {
    doc.original_amount = input.original_amount;
  }

  await db.collection(COLLECTION).doc(input.order_id).set(doc);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(orderId).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as Order), order_id: doc.id };
}

export async function getOrderByGatewayId(gatewayOrderId: string): Promise<Order | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTION)
    .where('gateway_order_id', '==', gatewayOrderId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...(doc.data() as Order), order_id: doc.id };
}

export async function getRecentOrders(limit = 50): Promise<OrderPublic[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTION)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as Order;
    return {
      order_id: doc.id,
      plan_type: data.plan_type,
      amount: data.amount,
      currency: data.currency,
      payment_status: data.payment_status,
      delivered_key: null, // never expose key in admin list
      created_at: data.created_at?.toDate?.().toISOString() ?? '',
    };
  });
}

export async function getRevenueStats(): Promise<RevenueStats> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).where('payment_status', '==', 'paid').get();

  let totalRevenueINR = 0;
  let totalRevenueUSD = 0;
  const tierSales: Record<string, number> = {
    '1_month_1_device': 0,
    '1_month_2_device': 0,
  };

  snap.docs.forEach((doc) => {
    const data = doc.data() as Order;
    const amountUnits = (data.amount || 0) / 100;
    if (data.currency === 'USD') {
      totalRevenueUSD += amountUnits;
    } else {
      totalRevenueINR += amountUnits;
    }

    if (data.plan_type) {
      tierSales[data.plan_type] = (tierSales[data.plan_type] || 0) + 1;
    }
  });

  return {
    totalRevenueINR: Math.round(totalRevenueINR * 100) / 100,
    totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
    paidOrdersCount: snap.size,
    tierSales,
  };
}

export function toOrderPublic(order: Order): OrderPublic {
  return {
    order_id: order.order_id,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    plan_type: order.plan_type,
    amount: order.amount,
    currency: order.currency,
    payment_gateway: order.payment_gateway,
    payment_status: order.payment_status,
    delivered_key: order.payment_status === 'paid' ? order.delivered_key : null,
    utr_number: order.utr_number,
    paypal_tx_id: order.paypal_tx_id,
    slots_assigned: order.slots_assigned,
    created_at: (order.created_at as unknown as { toDate: () => Date })?.toDate?.().toISOString() ?? '',
  };
}
