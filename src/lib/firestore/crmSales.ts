import { getAdminFirestore, admin } from '@/lib/firebase/admin';

export interface CrmSale {
  id: string;
  customerName: string;
  plan: string;
  platform: string;
  contact: string;
  sourceEmail: string;
  soldAt: string;
  expiresAt: string;
  reminderAt: string;
  reminded: boolean;
  status: 'active' | 'renewed' | 'expired';
  updatedAt?: string;
  amountPaid?: number;
  cost?: number;
  profit?: number;
  discountType?: string;
  trackProfit?: boolean;
}

const CRM_SALES_COLLECTION = 'crm_sales';

/**
 * Fetch all CRM sales from Firestore
 */
export async function getAllCrmSales(): Promise<CrmSale[]> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(CRM_SALES_COLLECTION).orderBy('soldAt', 'desc').get();
    if (snap.empty) return [];

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        customerName: data.customerName || '',
        plan: data.plan || '1 Device (Standard)',
        platform: data.platform || 'Telegram',
        contact: data.contact || '',
        sourceEmail: data.sourceEmail || '',
        soldAt: data.soldAt || new Date().toISOString(),
        expiresAt: data.expiresAt || new Date().toISOString(),
        reminderAt: data.reminderAt || new Date().toISOString(),
        reminded: Boolean(data.reminded),
        status: (data.status as any) || 'active',
        updatedAt: data.updatedAt,
        amountPaid: typeof data.amountPaid === 'number' ? data.amountPaid : undefined,
        cost: typeof data.cost === 'number' ? data.cost : undefined,
        profit: typeof data.profit === 'number' ? data.profit : undefined,
        discountType: data.discountType || undefined,
        trackProfit: data.trackProfit === true,
      };
    });
  } catch (err: any) {
    console.error('[getAllCrmSales] Firestore fetch error:', err.message);
    return [];
  }
}

/**
 * Save or overwrite a sale in Firestore
 */
export async function saveCrmSale(sale: CrmSale): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(CRM_SALES_COLLECTION).doc(sale.id);
    await docRef.set(
      {
        ...sale,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    console.error(`[saveCrmSale] Error saving sale ${sale.id}:`, err.message);
    return false;
  }
}

/**
 * Update partial fields of a sale in Firestore
 */
export async function updateCrmSale(id: string, updates: Partial<CrmSale>): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection(CRM_SALES_COLLECTION).doc(id);
    await docRef.set(
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    console.error(`[updateCrmSale] Error updating sale ${id}:`, err.message);
    return false;
  }
}

/**
 * Delete a sale record from Firestore
 */
export async function deleteCrmSale(id: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    await db.collection(CRM_SALES_COLLECTION).doc(id).delete();
    return true;
  } catch (err: any) {
    console.error(`[deleteCrmSale] Error deleting sale ${id}:`, err.message);
    return false;
  }
}
