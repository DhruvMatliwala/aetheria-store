import { getAdminFirestore } from '@/lib/firebase/admin';
import { decryptKey } from '@/lib/crypto';
import { incrementCouponUsage } from '@/lib/firestore/coupons';
import { LicenseKeyDoc } from '@/types/key';
import { Order } from '@/types/order';

/**
 * Returns the number of device slots consumed by a given plan ID.
 */
export function getRequiredSlotsForPlan(planId: string): number {
  if (planId === '1_month_1_device' || planId.includes('1_device') || planId.includes('standard')) {
    return 1;
  }
  if (planId === '1_month_2_device' || planId.includes('2_device') || planId === '3_month') {
    return 2;
  }
  if (planId === '1_month_3_device' || planId.includes('3_device')) {
    return 3;
  }
  return 1;
}

export interface SlotAllocationResult {
  keyId: string;
  decryptedKey: string;
  assignedSlots: number;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
  status: 'available' | 'full';
}

/**
 * Atomically allocates device slot(s) for a paid order from inventory.
 *
 * Sourcing & Slot Strategy:
 * - Sourced keys have 2 slots (Patreon) or 3 slots (Official Web).
 * - Priority rule: Sort available candidate keys by `remainingSlots ASC`.
 *   This ensures partially-used keys (e.g. 1 slot remaining) are packed first
 *   before opening a fresh key.
 * - Single-field query + in-memory ASC sort ensures zero composite index dependencies.
 */
export async function allocateKeySlot(
  orderId: string,
  gatewayOrderId: string
): Promise<SlotAllocationResult> {
  const db = getAdminFirestore();
  const orderRef = db.collection('orders').doc(orderId);
  const keysRef = db.collection('keys');

  return await db.runTransaction(async (txn) => {
    // ── 1. Validate Order State ──────────────────────────────────────────────
    const orderSnap = await txn.get(orderRef);
    if (!orderSnap.exists) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const orderData = orderSnap.data() as Order;
    const requiredSlots = getRequiredSlotsForPlan(orderData.plan_type);

    // Idempotency check: if order is already paid & fulfilled, return existing assignment
    if (orderData.payment_status === 'paid' && orderData.delivered_key) {
      return {
        keyId: orderData.key_id || 'already_assigned',
        decryptedKey: orderData.delivered_key,
        assignedSlots: orderData.slots_assigned ?? requiredSlots,
        totalSlots: 2,
        usedSlots: 2,
        remainingSlots: 0,
        status: 'full',
      };
    }

    if (orderData.payment_status === 'failed') {
      throw new Error(`Order ${orderId} is in failed state.`);
    }

    // ── 2. Query Candidate Keys (Index-Independent) ──────────────────────────
    // Fetch available keys and sort in-memory (remainingSlots ASC) to pack partially-filled keys first.
    const availableDocsSnap = await keysRef
      .where('status', '==', 'available')
      .get();

    const candidates = availableDocsSnap.docs
      .map((doc) => {
        const d = doc.data() as LicenseKeyDoc;
        const total = d.totalSlots ?? (d.source === 'web_3slot' ? 3 : 2);
        const used = d.usedSlots ?? 0;
        const remaining = d.remainingSlots ?? Math.max(0, total - used);
        return { doc, data: d, total, used, remaining };
      })
      .filter((item) => item.remaining >= requiredSlots)
      .sort((a, b) => a.remaining - b.remaining); // ASC packing

    if (candidates.length === 0) {
      throw new Error(
        `Out of inventory: No license keys with at least ${requiredSlots} available slot(s).`
      );
    }

    // Select the best candidate (least remaining slots that satisfies requirement)
    const selected = candidates[0];
    const keyDocRef = selected.doc.ref;

    // Read candidate document inside transaction to lock it
    const keySnap = await txn.get(keyDocRef);
    if (!keySnap.exists) {
      throw new Error('Selected license key document not found during transaction.');
    }

    const keyData = keySnap.data() as LicenseKeyDoc;
    const currentTotal = keyData.totalSlots ?? selected.total;
    const currentUsed = keyData.usedSlots ?? selected.used;
    const currentRemaining = keyData.remainingSlots ?? Math.max(0, currentTotal - currentUsed);

    // Double check capacity under transaction lock
    if (currentRemaining < requiredSlots || keyData.status !== 'available') {
      throw new Error('Key slot capacity changed during transaction. Please retry.');
    }

    // ── 3. Calculate New Slot State ──────────────────────────────────────────
    const newUsedSlots = currentUsed + requiredSlots;
    const newRemainingSlots = currentTotal - newUsedSlots;
    const newStatus: 'available' | 'full' = newRemainingSlots <= 0 ? 'full' : 'available';

    const assignedOrders = [
      ...(keyData.assignedOrders || []),
      {
        orderId,
        customerEmail: orderData.customer_email,
        slots: requiredSlots,
        assignedAt: Date.now(),
      },
    ];

    // Decrypt the raw license key
    const decryptedKey = decryptKey(keyData.license_key);

    // ── 4. Update Key Document ───────────────────────────────────────────────
    txn.update(keyDocRef, {
      usedSlots: newUsedSlots,
      remainingSlots: newRemainingSlots,
      status: newStatus,
      assignedOrders,
      last_allocated_at: Date.now(),
      // Legacy compatibility fields
      order_id: orderId,
      sold_at: Date.now(),
    });

    // ── 5. Update Order Document ─────────────────────────────────────────────
    txn.update(orderRef, {
      payment_status: 'paid',
      delivered_key: decryptedKey,
      gateway_order_id: gatewayOrderId || orderData.gateway_order_id,
      slots_assigned: requiredSlots,
      key_id: keyDocRef.id,
      updated_at: Date.now(),
    });

    // ── 6. Increment Coupon Usage If Applicable (Only on genuine payment) ─────
    if (orderData.coupon_code) {
      incrementCouponUsage(orderData.coupon_code).catch((couponErr) => {
        console.warn('[keyAllocator] Failed to increment coupon usage:', couponErr);
      });
    }

    return {
      keyId: keyDocRef.id,
      decryptedKey,
      assignedSlots: requiredSlots,
      totalSlots: currentTotal,
      usedSlots: newUsedSlots,
      remainingSlots: newRemainingSlots,
      status: newStatus,
    };
  });
}

/**
 * Backward compatibility alias for webhook handlers.
 */
export async function assignKeyToOrder(
  orderId: string,
  _planType?: string,
  gatewayOrderId?: string
): Promise<string> {
  const result = await allocateKeySlot(orderId, gatewayOrderId || '');
  return result.decryptedKey;
}
