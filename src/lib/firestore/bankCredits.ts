import { getAdminFirestore, admin } from '@/lib/firebase/admin';

export interface BankCredit {
  utr: string;
  amount: number | null;
  status: 'unclaimed' | 'claimed';
  order_id?: string;
  raw_sms?: string;
  credited_at: FirebaseFirestore.Timestamp;
}

const COLLECTION = 'verified_bank_credits';

/**
 * Records an authentic incoming bank credit received via the Android SMS Bridge.
 */
export async function recordBankCredit(
  utrOrDocId: string,
  amount: number | null,
  rawSms?: string
): Promise<{ alreadyExisted: boolean; docId: string }> {
  const db = getAdminFirestore();
  const docId = utrOrDocId || `CREDIT_${Date.now()}_${Math.round((amount || 0) * 100)}`;
  const docRef = db.collection(COLLECTION).doc(docId);
  const snap = await docRef.get();

  if (snap.exists) {
    return { alreadyExisted: true, docId };
  }

  // Privacy protection: Redact account numbers and sensitive info before saving
  const sanitizedSms = rawSms
    ? rawSms
        .replace(/\b\d{9,18}\b/g, (match) => {
          return match === utrOrDocId ? match : '******' + match.slice(-4);
        })
        .slice(0, 300)
    : '';

  await docRef.set({
    utr: utrOrDocId,
    amount: amount || null,
    status: 'unclaimed',
    raw_sms: sanitizedSms,
    credited_at: admin.firestore.FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  });

  return { alreadyExisted: false, docId };
}

/**
 * Looks up if a UTR has arrived in the bank account and is ready to be claimed.
 */
export async function getBankCredit(utr: string): Promise<BankCredit | null> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).doc(utr).get();
  if (!snap.exists) return null;
  return snap.data() as BankCredit;
}

/**
 * Marks a bank credit as claimed by an order.
 */
export async function claimBankCredit(docIdOrUtr: string, orderId: string): Promise<void> {
  const db = getAdminFirestore();
  const docRef = db.collection(COLLECTION).doc(docIdOrUtr);
  const snap = await docRef.get();
  if (snap.exists) {
    await docRef.update({
      status: 'claimed',
      order_id: orderId,
      claimed_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Returns recent verified bank credits for display on the admin dashboard.
 */
export async function getRecentBankCredits(limitCount = 10): Promise<BankCredit[]> {
  const db = getAdminFirestore();
  try {
    const snap = await db
      .collection(COLLECTION)
      .orderBy('credited_at', 'desc')
      .limit(limitCount)
      .get();

    return snap.docs.map((doc) => doc.data() as BankCredit);
  } catch (err) {
    // If index is pending, fallback without remote ordering and sort in memory
    const snap = await db.collection(COLLECTION).limit(limitCount).get();
    const list = snap.docs.map((doc) => doc.data() as BankCredit);
    list.sort((a, b) => {
      const timeA = (a.credited_at as unknown as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
      const timeB = (b.credited_at as unknown as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0;
      return timeB - timeA;
    });
    return list;
  }
}
