import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'seen_leads.json');
const MAX_SEEN_HISTORY = 2000;

export class LeadStorage {
  private seenIds: Set<string>;

  constructor() {
    this.seenIds = new Set<string>();
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.seenIds = new Set(parsed);
        }
      }
    } catch (err) {
      console.error('[Radar:LeadStorage] Error loading seen_leads.json:', err);
    }
  }

  public has(id: string): boolean {
    return this.seenIds.has(id);
  }

  public add(id: string): void {
    this.seenIds.add(id);
    this.persist();
  }

  public addBatch(ids: string[]): void {
    for (const id of ids) {
      this.seenIds.add(id);
    }
    this.persist();
  }

  private persist(): void {
    try {
      // Trim to MAX_SEEN_HISTORY if necessary
      const arr = Array.from(this.seenIds);
      const trimmed = arr.length > MAX_SEEN_HISTORY ? arr.slice(arr.length - MAX_SEEN_HISTORY) : arr;

      fs.writeFileSync(STORAGE_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Radar:LeadStorage] Error saving seen_leads.json:', err);
    }
  }
}

export const leadStorage = new LeadStorage();
