import { getAdminFirestore } from '@/lib/firebase/admin';
import { sendRestockAlertEmail } from '@/lib/email/resend';

const RESTOCK_COLLECTION = 'restock_requests';

export interface RestockRequest {
  id?: string;
  plan_id: string;
  email: string;
  ip: string;
  created_at: number; // Unix timestamp in ms
}

export interface RestockStats {
  counts: Record<string, number>;
  totalRequests: number;
  recentRequests: Array<{
    id: string;
    plan_id: string;
    email: string;
    created_at: string;
  }>;
}

/**
 * Saves a customer restock notification request with 24-hour deduplication.
 * Uses direct document ID lookup (O(1)) to prevent requiring composite Firestore indexes.
 */
export async function saveRestockRequest(params: {
  planId: string;
  email: string;
  ip: string;
}): Promise<{ success: boolean; message: string; isDuplicate?: boolean }> {
  const db = getAdminFirestore();
  const cleanEmail = params.email.toLowerCase().trim();
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  // Use encoded key as doc ID: email_planId (no composite index needed)
  const safeDocId = `${cleanEmail.replace(/[^a-zA-Z0-9@._-]/g, '_')}__${params.planId}`;
  const docRef = db.collection(RESTOCK_COLLECTION).doc(safeDocId);

  try {
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      const data = existingDoc.data() as RestockRequest;
      if (data.created_at && data.created_at >= twentyFourHoursAgo) {
        return {
          success: true,
          message: "You're already registered on the waitlist for this plan!",
          isDuplicate: true,
        };
      }
    }

    // Save or update waitlist document
    await docRef.set({
      plan_id: params.planId,
      email: cleanEmail,
      ip: params.ip || 'unknown',
      created_at: Date.now(),
    });

    return {
      success: true,
      message: "You've been added to the restock notification waitlist!",
    };
  } catch (err: any) {
    // In case of any Firestore error, fallback to append add()
    console.warn('[restock/save] fallback to collection add:', err?.message);
    await db.collection(RESTOCK_COLLECTION).add({
      plan_id: params.planId,
      email: cleanEmail,
      ip: params.ip || 'unknown',
      created_at: Date.now(),
    });

    return {
      success: true,
      message: "You've been added to the restock notification waitlist!",
    };
  }
}

/**
 * Retrieves waitlist demand statistics and recent waitlist signups for the admin dashboard.
 * Sorts in-memory to prevent requiring composite indexes.
 */
export async function getRestockStats(limit = 20): Promise<RestockStats> {
  const db = getAdminFirestore();
  const snap = await db.collection(RESTOCK_COLLECTION).get();

  const counts: Record<string, number> = {
    '1_month_1_device': 0,
    '1_month_2_device': 0,
  };

  const allRequests: Array<{
    id: string;
    plan_id: string;
    email: string;
    created_at_ms: number;
    created_at: string;
  }> = [];

  snap.docs.forEach((doc) => {
    const data = doc.data() as RestockRequest;
    const planId = data.plan_id || '1_month_1_device';
    if (!counts[planId]) {
      counts[planId] = 0;
    }
    counts[planId]++;

    const timestamp = typeof data.created_at === 'number' ? data.created_at : Date.now();

    allRequests.push({
      id: doc.id,
      plan_id: planId,
      email: data.email || 'unknown',
      created_at_ms: timestamp,
      created_at: new Date(timestamp).toISOString(),
    });
  });

  // Sort descending by timestamp in memory (no index required)
  allRequests.sort((a, b) => b.created_at_ms - a.created_at_ms);

  const recentRequests = allRequests.slice(0, limit).map(({ id, plan_id, email, created_at }) => ({
    id,
    plan_id,
    email,
    created_at,
  }));

  return {
    counts,
    totalRequests: snap.size,
    recentRequests,
  };
}

/**
 * Dispatches restock notification emails to customers on the waitlist.
 * If planId is provided, notifies subscribers for that plan (or all subscribers if planId is omitted).
 * Automatically removes notified users from the waitlist to prevent duplicate emails.
 */
export async function notifyWaitlistSubscribers(options?: {
  planId?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  notifiedCount: number;
  totalPending: number;
  errors: string[];
}> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(RESTOCK_COLLECTION);

  if (options?.planId) {
    query = query.where('plan_id', '==', options.planId);
  }

  const snap = await query.get();
  const totalPending = snap.size;

  if (totalPending === 0) {
    return {
      success: true,
      notifiedCount: 0,
      totalPending: 0,
      errors: [],
    };
  }

  const docs = options?.limit ? snap.docs.slice(0, options.limit) : snap.docs;
  let notifiedCount = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    const data = doc.data() as RestockRequest;
    const email = data.email?.trim();
    if (!email || !email.includes('@')) {
      await doc.ref.delete().catch(() => {});
      continue;
    }

    try {
      await sendRestockAlertEmail({
        to: email,
        planId: data.plan_id || '1_month_1_device',
      });
      notifiedCount++;
      // Once successfully emailed, delete from waitlist so they don't get duplicate emails
      await doc.ref.delete();
    } catch (err: any) {
      console.error(`[restock/notify] Error notifying ${email}:`, err?.message || err);
      errors.push(`${email}: ${err?.message || 'Failed to send'}`);
    }
  }

  return {
    success: errors.length === 0,
    notifiedCount,
    totalPending,
    errors,
  };
}

