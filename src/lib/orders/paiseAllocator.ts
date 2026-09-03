import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * Allocates a unique 2-digit paise offset (e.g. 0.01 to 0.99) for an active order
 * so that each buyer has a distinct amount down to the exact paisa.
 * This enables 100% automated matching from Bank SMS without requiring the user to type a UTR!
 */
export async function allocateUniquePaise(basePriceInrPaisa: number): Promise<{
  totalPaisa: number;
  amountRupees: number;
  paiseOffset: number;
}> {
  const db = getAdminFirestore();

  // Look for pending/verifying orders created in the last 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const activeOrdersSnap = await db
    .collection('orders')
    .where('payment_status', 'in', ['pending', 'verifying'])
    .limit(100)
    .get()
    .catch(() => null);

  const usedOffsets = new Set<number>();

  if (activeOrdersSnap && !activeOrdersSnap.empty) {
    const fifteenMinutesAgoMs = Date.now() - 15 * 60 * 1000;
    for (const doc of activeOrdersSnap.docs) {
      const data = doc.data();
      const createdAtMs =
        data.created_at?.toDate?.()?.getTime?.() ??
        (typeof data.created_at === 'number' ? data.created_at : 0);
      if (createdAtMs && createdAtMs < fifteenMinutesAgoMs) continue;

      if (typeof data.amount === 'number') {
        const offset = data.amount - basePriceInrPaisa;
        if (offset > 0 && offset < 100) {
          usedOffsets.add(offset);
        }
      }
    }
  }

  // Find an available offset between 1 and 99
  const availableOffsets: number[] = [];
  for (let i = 1; i <= 99; i++) {
    if (!usedOffsets.has(i)) {
      availableOffsets.push(i);
    }
  }

  // Pick a random available offset, or fallback to random if all 99 are filled
  const chosenOffset =
    availableOffsets.length > 0
      ? availableOffsets[Math.floor(Math.random() * availableOffsets.length)]
      : Math.floor(Math.random() * 98) + 1;

  const totalPaisa = basePriceInrPaisa + chosenOffset;
  const amountRupees = parseFloat((totalPaisa / 100).toFixed(2));

  return {
    totalPaisa,
    amountRupees,
    paiseOffset: chosenOffset,
  };
}
