import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * Allocates a unique whole-rupee offset (e.g. 0, +1, -1, +2, -2 rupees) for an active order
 * so that each buyer has a distinct whole-rupee amount with ZERO decimal paise.
 * This completely avoids bank decimal-paise filters (e.g. SBI) while enabling
 * 100% automated Zero-UTR matching from Bank SMS!
 */
export async function allocateUniquePaise(basePriceInrPaisa: number): Promise<{
  totalPaisa: number;
  amountRupees: number;
  paiseOffset: number;
}> {
  const db = getAdminFirestore();

  // 5-slot pool of whole-rupee offsets in paise (0, +₹1, -₹1, +₹2, -₹2)
  const WHOLE_RUPEE_OFFSETS_PAISE = [0, 100, -100, 200, -200];

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
        if (WHOLE_RUPEE_OFFSETS_PAISE.includes(offset)) {
          usedOffsets.add(offset);
        }
      }
    }
  }

  // Find available offsets in priority order: [0, +100, -100, +200, -200]
  const availableOffsets = WHOLE_RUPEE_OFFSETS_PAISE.filter((offset) => !usedOffsets.has(offset));

  // Pick first available slot, or fallback to 0 (base price) if all 5 slots are simultaneously active
  const chosenOffset = availableOffsets.length > 0 ? availableOffsets[0] : 0;

  const totalPaisa = basePriceInrPaisa + chosenOffset;
  const amountRupees = Math.round(totalPaisa / 100);

  return {
    totalPaisa,
    amountRupees,
    paiseOffset: chosenOffset,
  };
}
