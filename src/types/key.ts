export type KeySource = 'patreon_2slot' | 'web_3slot';
export type KeyStatus = 'available' | 'full' | 'revoked';

export interface LicenseKeyDoc {
  id?: string;
  license_key: string;                  // AES-256-GCM encrypted in Firestore
  key?: string;                         // Raw license code alias
  source: KeySource;                    // 'patreon_2slot' | 'web_3slot'
  totalSlots: number;                   // 2 or 3
  usedSlots: number;                    // Currently claimed slots (starts at 0)
  remainingSlots: number;               // totalSlots - usedSlots
  assignedOrders: string[];             // Array of associated order IDs
  status: KeyStatus;                    // 'available' | 'full' | 'revoked'
  createdAt: number;                    // Epoch timestamp (ms)
  updatedAt: number;                    // Epoch timestamp (ms)
  
  // Backwards compatibility / legacy fields:
  plan_type?: string;
  order_id?: string | null;
  patreon_email?: string;               // Patreon account that owns this key (for clearing devices)
  created_at?: FirebaseFirestore.Timestamp | null;
  sold_at?: FirebaseFirestore.Timestamp | null;
}

export type LicenseKey = LicenseKeyDoc;

export interface LicenseKeyPublic {
  id: string;
  source: KeySource;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
  status: KeyStatus;
  patreon_email?: string;
}
