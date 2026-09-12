import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { decryptKey } from '@/lib/crypto';
import { LicenseKeyDoc } from '@/types/key';
import { Order } from '@/types/order';
import { randomUUID } from 'crypto';

export interface ManualDispatchParams {
  recipient?: string;
  slots: 1 | 2 | 3;
  note?: string;
  adminIdentifier?: string;
}

export interface ManualDispatchResult {
  orderId: string;
  decryptedKey: string;
  slotsAssigned: number;
  planType: string;
  recipient: string;
  keyId: string;
  remainingSlotsOnKey: number;
  keyStatus: 'available' | 'full';
  orderUrl: string;
  createdAt: number;
  patreonEmail?: string;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://aetheria-store.vercel.app';

/**
 * Directly allocates a key for a specific customer from inventory.
 *
 * Sourcing & Privacy Guarantees:
 * - 1 Slot: Consumes 1 slot from shared pool (prioritizes partially used keys).
 * - 2 Slots: Consumes 2 slots from shared pool (requires key with >= 2 remaining slots).
 * - 3 Slots (Private / Dedicated): Selects a virgin, untouched key (3/3 remaining) and
 *   immediately locks it to `status: 'full', usedSlots: 3, remainingSlots: 0`.
 *   This ensures 100% exclusive access: NO ONE on the website or bot can ever share this key.
 */
export async function dispatchManualKey(params: ManualDispatchParams): Promise<ManualDispatchResult> {
  const { recipient = 'Direct Buyer', slots, note, adminIdentifier = 'Admin' } = params;

  if (slots !== 1 && slots !== 2 && slots !== 3) {
    throw new Error('Invalid slot count. Must be 1, 2, or 3 device slots.');
  }

  const db = getAdminFirestore();
  const keysRef = db.collection('keys');

  const cleanRecipient = recipient.trim() || 'Direct Buyer';
  const orderId = `ord_manual_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 6)}`;
  const orderRef = db.collection('orders').doc(orderId);

  const planType =
    slots === 1
      ? '1_month_1_device'
      : slots === 2
      ? '1_month_2_device'
      : '1_month_3_device';

  const planName =
    slots === 1
      ? '1 Device'
      : slots === 2
      ? '2 Devices'
      : '3 Devices (Private Dedicated)';

  return await db.runTransaction<ManualDispatchResult>(async (txn) => {
    // ── 1. Query candidate keys ──────────────────────────────────────────────
    const availableSnap = await keysRef.where('status', '==', 'available').get();

    if (availableSnap.empty) {
      throw new Error('Out of inventory: No available license keys found in stock.');
    }

    const allKeys = availableSnap.docs.map((doc) => {
      const data = doc.data() as LicenseKeyDoc;
      const total = data.totalSlots ?? 3;
      const used = data.usedSlots ?? 0;
      const remaining = data.remainingSlots ?? Math.max(0, total - used);
      return { doc, data, total, used, remaining };
    });

    let selectedKeyItem: typeof allKeys[0] | undefined;

    if (slots === 3) {
      // For 3-device private key: MUST find an untouched key (0 used slots, 3 remaining)
      const virginKeys = allKeys.filter((k) => k.used === 0 && k.remaining >= 3);
      if (virginKeys.length === 0) {
        throw new Error(
          'No untouched 3-slot private keys available. All current stock has already been partially shared.'
        );
      }
      selectedKeyItem = virginKeys[0];
    } else {
      // For 1 or 2 slots: pack into partially-filled keys first (ASC sort by remaining)
      const eligible = allKeys
        .filter((k) => k.remaining >= slots)
        .sort((a, b) => a.remaining - b.remaining);

      if (eligible.length === 0) {
        throw new Error(`Out of inventory: No keys with at least ${slots} available slot(s).`);
      }
      selectedKeyItem = eligible[0];
    }

    const keyDocRef = selectedKeyItem.doc.ref;

    // ── 2. Read inside transaction to lock document ──────────────────────────
    const keySnap = await txn.get(keyDocRef);
    if (!keySnap.exists) {
      throw new Error('Selected license key document was not found during transaction.');
    }

    const keyData = keySnap.data() as LicenseKeyDoc;
    const currentTotal = keyData.totalSlots ?? selectedKeyItem.total;
    const currentUsed = keyData.usedSlots ?? selectedKeyItem.used;
    const currentRemaining = keyData.remainingSlots ?? Math.max(0, currentTotal - currentUsed);

    if (currentRemaining < slots || keyData.status !== 'available') {
      throw new Error('Key slot capacity changed during transaction. Please try again.');
    }

    if (slots === 3 && currentUsed > 0) {
      throw new Error('Key was partially used concurrently. Please try again.');
    }

    // ── 3. Calculate new slot allocations ────────────────────────────────────
    const newUsedSlots = currentUsed + slots;
    const newRemainingSlots = currentTotal - newUsedSlots;
    const newStatus: 'available' | 'full' = newRemainingSlots <= 0 ? 'full' : 'available';

    const decryptedKey = decryptKey(keyData.license_key);
    const patreonEmail = keyData.patreon_email?.trim().toLowerCase() || undefined;
    const now = Date.now();

    const assignedOrders = [
      ...(keyData.assignedOrders || []),
      {
        orderId,
        customerEmail: cleanRecipient,
        slots,
        assignedAt: now,
        notes: note || `Manual dispatch by ${adminIdentifier}`,
      },
    ];

    // ── 4. Update Key Document ───────────────────────────────────────────────
    txn.update(keyDocRef, {
      usedSlots: newUsedSlots,
      remainingSlots: newRemainingSlots,
      status: newStatus,
      assignedOrders,
      last_allocated_at: now,
      sold_at: now,
      order_id: orderId,
    });

    // ── 5. Create Order Document ─────────────────────────────────────────────
    const orderDoc: Partial<Order> & Record<string, any> = {
      order_id: orderId,
      customer_email: cleanRecipient.includes('@')
        ? cleanRecipient.toLowerCase()
        : `${cleanRecipient.replace(/[^a-zA-Z0-9_]/g, '') || 'direct_user'}@manual.admin`,
      customer_phone: '',
      plan_type: planType,
      amount: 0,
      currency: 'INR',
      payment_method: 'manual_admin',
      payment_status: 'paid',
      delivered_key: decryptedKey,
      slots_assigned: slots,
      key_id: keyDocRef.id,
      notes: note || `Direct manual dispatch (${planName}) to ${cleanRecipient}`,
      gateway_order_id: `manual_${now}`,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
      ...(patreonEmail ? { patreon_email: patreonEmail } : {}),
      ...(cleanRecipient.startsWith('@') ? { telegram_username: cleanRecipient.replace('@', '') } : {}),
    };

    txn.set(orderRef, orderDoc);

    return {
      orderId,
      decryptedKey,
      slotsAssigned: slots,
      planType,
      recipient: cleanRecipient,
      keyId: keyDocRef.id,
      remainingSlotsOnKey: newRemainingSlots,
      keyStatus: newStatus,
      orderUrl: `${APP_URL}/order-success/${orderId}`,
      createdAt: now,
      patreonEmail,
    };
  });
}
