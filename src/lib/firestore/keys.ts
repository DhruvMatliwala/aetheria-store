import { createHash } from 'crypto';
import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { encryptKey } from '@/lib/crypto';
import { LicenseKeyDoc, KeySource, KeyStatus } from '@/types/key';
import { getRequiredSlotsForPlan } from '@/lib/services/keyAllocator';

const COLLECTION = 'keys';

export interface TierStockCounts {
  '1_month_1_device': number;
  '1_month_2_device': number;
  [key: string]: number;
}

export interface InventoryStatsSummary {
  totalKeys: number;
  activeKeys: number;
  totalUsableSlots: number;
  fullyAllocatedKeys: number;
  partiallyFilledKeys: number;
  untouchedKeys: number;
  patreonKeys: {
    total: number;
    available: number;
    full: number;
    totalSlots: number;
    usedSlots: number;
    remainingSlots: number;
  };
  tierStock: TierStockCounts;
}

/**
 * Calculates real-time available stock count for a specific plan tier based on available slot capacity.
 *
 * Rules:
 * - 1 Device Plan: Total sum of all remainingSlots across active Patreon keys.
 * - 2 Devices Plan: Total count of Patreon keys with remainingSlots >= 2.
 */
export async function getAvailableCount(planId: string): Promise<number> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTION)
    .where('status', '==', 'available')
    .get();

  const requiredSlots = getRequiredSlotsForPlan(planId);

  let count = 0;

  if (requiredSlots === 1) {
    // 1-Device capacity = sum of all remainingSlots across available keys
    snap.docs.forEach((doc) => {
      const data = doc.data() as LicenseKeyDoc;
      const remaining = data.remainingSlots ?? ((data.totalSlots ?? 2) - (data.usedSlots ?? 0));
      if (remaining > 0) {
        count += remaining;
      }
    });
  } else {
    // 2-Device capacity = count of keys with remainingSlots >= requiredSlots
    snap.docs.forEach((doc) => {
      const data = doc.data() as LicenseKeyDoc;
      const remaining = data.remainingSlots ?? ((data.totalSlots ?? 2) - (data.usedSlots ?? 0));
      if (remaining >= requiredSlots) {
        count++;
      }
    });
  }

  return count;
}

/**
 * Returns comprehensive inventory metrics and slot breakdown for the admin dashboard.
 */
export async function getInventoryStats(): Promise<InventoryStatsSummary> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).get();

  let totalKeys = 0;
  let activeKeys = 0;
  let totalUsableSlots = 0;
  let fullyAllocatedKeys = 0;
  let partiallyFilledKeys = 0;
  let untouchedKeys = 0;

  const patreon = {
    total: 0,
    available: 0,
    full: 0,
    totalSlots: 0,
    usedSlots: 0,
    remainingSlots: 0,
  };

  let count1Device = 0;
  let count2Device = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data() as LicenseKeyDoc;
    totalKeys++;

    const totalSlots = data.totalSlots ?? 2;
    const usedSlots = data.usedSlots ?? 0;
    const remainingSlots = data.remainingSlots ?? Math.max(0, totalSlots - usedSlots);
    const isAvailable = data.status === 'available' && remainingSlots > 0;

    patreon.total++;
    patreon.totalSlots += totalSlots;
    patreon.usedSlots += usedSlots;
    patreon.remainingSlots += remainingSlots;
    if (isAvailable) patreon.available++;
    else patreon.full++;

    if (isAvailable) {
      activeKeys++;
      totalUsableSlots += remainingSlots;

      // Tier capacities
      count1Device += remainingSlots;
      if (remainingSlots >= 2) count2Device++;

      if (usedSlots === 0) {
        untouchedKeys++;
      } else {
        partiallyFilledKeys++;
      }
    } else {
      fullyAllocatedKeys++;
    }
  });

  return {
    totalKeys,
    activeKeys,
    totalUsableSlots,
    fullyAllocatedKeys,
    partiallyFilledKeys,
    untouchedKeys,
    patreonKeys: patreon,
    tierStock: {
      '1_month_1_device': count1Device,
      '1_month_2_device': count2Device,
    },
  };
}

/**
 * Legacy compatibility helper for getAllStockCounts
 */
export async function getAllStockCounts(): Promise<Record<string, { available: number; sold: number; total: number }>> {
  const stats = await getInventoryStats();
  return {
    '1_month_1_device': {
      available: stats.tierStock['1_month_1_device'],
      sold: stats.patreonKeys.usedSlots,
      total: stats.totalUsableSlots + stats.patreonKeys.usedSlots,
    },
    '1_month_2_device': {
      available: stats.tierStock['1_month_2_device'],
      sold: Math.floor(stats.patreonKeys.usedSlots / 2),
      total: stats.patreonKeys.total,
    },
  };
}

export interface BulkUploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export interface KeyUploadEntry {
  key: string;
  patreonEmail?: string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Extracts license key and optional inline email from a raw line.
 * Supports delimiters like ' : ', ' | ', '\t', ',', or space.
 */
function parseKeyEntry(
  item: string | KeyUploadEntry,
  defaultEmail?: string
): { cleanKey: string; patreonEmail?: string } | null {
  if (typeof item === 'object' && item !== null) {
    const cleanKey = item.key?.trim();
    if (!cleanKey) return null;
    const email = item.patreonEmail?.trim().toLowerCase() || defaultEmail?.trim().toLowerCase();
    return { cleanKey, patreonEmail: email || undefined };
  }

  const rawLine = item.trim();
  if (!rawLine) return null;

  const emailMatch = rawLine.match(EMAIL_REGEX);
  if (emailMatch) {
    const inlineEmail = emailMatch[0].toLowerCase();
    // Remove email and common separator characters
    const cleanKey = rawLine
      .replace(emailMatch[0], '')
      .replace(/[:|,\t]/g, ' ')
      .trim();

    if (!cleanKey) return null;
    return { cleanKey, patreonEmail: inlineEmail };
  }

  return {
    cleanKey: rawLine,
    patreonEmail: defaultEmail?.trim().toLowerCase() || undefined,
  };
}

/**
 * Bulk-inserts Patreon 2-slot license keys with optional Patreon account tagging.
 * Keys are encrypted with AES-256-GCM before storage.
 */
export async function bulkInsertKeys(
  _sourceOrPlan: string,
  rawKeys: (string | KeyUploadEntry)[],
  defaultPatreonEmail?: string
): Promise<BulkUploadResult> {
  const db = getAdminFirestore();
  const result: BulkUploadResult = { inserted: 0, skipped: 0, errors: [] };

  const source: KeySource = 'patreon_2slot';
  const totalSlots = 2;

  // Parse and deduplicate by key string
  const parsedEntries: { cleanKey: string; patreonEmail?: string }[] = [];
  const seenKeys = new Set<string>();

  for (const raw of rawKeys) {
    const parsed = parseKeyEntry(raw, defaultPatreonEmail);
    if (parsed && !seenKeys.has(parsed.cleanKey)) {
      seenKeys.add(parsed.cleanKey);
      parsedEntries.push(parsed);
    }
  }

  // Batch writes in chunks of 490 (Firestore limit is 500)
  const BATCH_SIZE = 490;

  for (let i = 0; i < parsedEntries.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = parsedEntries.slice(i, i + BATCH_SIZE);

    for (const entry of chunk) {
      try {
        const { cleanKey, patreonEmail } = entry;
        // Deterministic document ID based on SHA-256 fingerprint prevents duplicate key entries
        const keyHash = createHash('sha256').update(cleanKey).digest('hex').slice(0, 32);
        const docRef = db.collection(COLLECTION).doc(`key_${keyHash}`);
        
        const existingSnap = await docRef.get();
        if (existingSnap.exists) {
          result.skipped++;
          continue;
        }

        const encrypted = encryptKey(cleanKey);
        const newDoc: LicenseKeyDoc = {
          id: docRef.id,
          license_key: encrypted,
          source,
          totalSlots,
          usedSlots: 0,
          remainingSlots: totalSlots,
          assignedOrders: [],
          status: 'available',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          // Legacy backward compatibility fields:
          plan_type: '1_month_1_device',
          order_id: null,
          created_at: admin.firestore.FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
          sold_at: null,
          ...(patreonEmail ? { patreon_email: patreonEmail } : {}),
        };

        batch.set(docRef, newDoc);
        result.inserted++;
      } catch (err) {
        result.errors.push(`Failed to encrypt/queue key: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    try {
      await batch.commit();
    } catch (batchErr) {
      console.error('[bulkInsertKeys] Batch commit failed:', batchErr);
      throw new Error(`Firestore batch write failed: ${batchErr instanceof Error ? batchErr.message : String(batchErr)}`);
    }
  }

  return result;
}

