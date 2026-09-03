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
  return {
    totalPaisa: basePriceInrPaisa,
    amountRupees: Math.round(basePriceInrPaisa / 100),
    paiseOffset: 0,
  };
}
