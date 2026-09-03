import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { Order } from '@/types/order';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface CustomerKeyItem {
  order_id: string;
  plan_type: string;
  amount: number;
  currency: string;
  delivered_key: string;
  payment_gateway: string;
  gateway_order_id: string;
  slots_assigned: number;
  created_at: string;
  due_date: string;
  days_remaining: number;
}

function calculateDueDateAndRemaining(createdAtIso: string): { dueDate: string; daysRemaining: number } {
  const createdDate = createdAtIso ? new Date(createdAtIso) : new Date();
  const dueDateObj = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = dueDateObj.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const yyyy = dueDateObj.getFullYear();
  const mm = String(dueDateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dueDateObj.getDate()).padStart(2, '0');
  const dueDate = `${yyyy}-${mm}-${dd}`;

  return { dueDate, daysRemaining };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token.' }, { status: 401 });
    }

    const idToken = authHeader.replace('Bearer ', '').trim();
    const adminAuth = getAdminAuth();
    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenErr: any) {
      console.error('[api/user/keys] Token verification failed:', tokenErr?.message);
      return NextResponse.json({ error: 'Unauthorized: Token expired or invalid.' }, { status: 401 });
    }

    const userEmail = decodedToken.email?.toLowerCase().trim();
    if (!userEmail) {
      return NextResponse.json({ error: 'No email address found in user token.' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const snap = await db
      .collection('orders')
      .where('customer_email', '==', userEmail)
      .get();

    const keys: CustomerKeyItem[] = [];

    snap.docs.forEach((doc) => {
      const data = doc.data() as Order;
      if (data.payment_status === 'paid' && data.delivered_key) {
        const createdAtIso =
          (data.created_at as unknown as { toDate: () => Date })?.toDate?.().toISOString() ||
          new Date().toISOString();

        const { dueDate, daysRemaining } = calculateDueDateAndRemaining(createdAtIso);

        keys.push({
          order_id: doc.id,
          plan_type: data.plan_type,
          amount: data.amount,
          currency: data.currency,
          delivered_key: data.delivered_key,
          payment_gateway: data.payment_gateway,
          gateway_order_id: data.gateway_order_id,
          slots_assigned: data.slots_assigned ?? (data.plan_type.includes('2_device') ? 2 : 1),
          created_at: createdAtIso,
          due_date: dueDate,
          days_remaining: daysRemaining,
        });
      }
    });

    // Sort newest first
    keys.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      email: userEmail,
      keys,
    });
  } catch (err: any) {
    console.error('[api/user/keys] Error fetching keys:', err);
    return NextResponse.json({ error: 'Failed to retrieve license keys.' }, { status: 500 });
  }
}
