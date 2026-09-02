import { getAdminFirestore, admin } from '@/lib/firebase/admin';

export interface PaypalCredit {
  txn_id: string;
  amount_usd: number | null;
  payer_email: string;
  status: 'unclaimed' | 'claimed';
  order_id?: string;
  credited_at: FirebaseFirestore.Timestamp;
}

const COLLECTION = 'verified_paypal_credits';

export async function recordPaypalCredit(
  txnId: string,
  amountUsd: number | null,
  payerEmail: string
): Promise<{ alreadyExisted: boolean }> {
  const db = getAdminFirestore();
  const docRef = db.collection(COLLECTION).doc(txnId);
  const snap = await docRef.get();

  if (snap.exists) {
    return { alreadyExisted: true };
  }

  await docRef.set({
    txn_id: txnId,
    amount_usd: amountUsd || null,
    payer_email: payerEmail.toLowerCase().trim(),
    status: 'unclaimed',
    credited_at: admin.firestore.FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  });

  return { alreadyExisted: false };
}

export async function getPaypalCredit(txnId: string): Promise<PaypalCredit | null> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).doc(txnId).get();
  if (!snap.exists) return null;
  return snap.data() as PaypalCredit;
}

export async function claimPaypalCredit(txnId: string, orderId: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(txnId).update({
    status: 'claimed',
    order_id: orderId,
    claimed_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
