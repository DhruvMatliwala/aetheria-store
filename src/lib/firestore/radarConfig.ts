import { getAdminFirestore } from '@/lib/firebase/admin';
import { RadarConfig } from '../../../radar/types';
import fs from 'fs';
import path from 'path';

const SETTINGS_COLLECTION = 'site_settings';
const RADAR_CONFIG_DOC = 'radar_config';
const LOCAL_CONFIG_PATH = path.join(process.cwd(), 'radar', 'radar.config.json');

export const DEFAULT_RADAR_CONFIG: RadarConfig = {
  discordWebhookUrl: 'https://discord.com/api/webhooks/1545593335471677440/nqnvpczvQfSPIh3yrMZh8HF4jurgy046ygx8-YwYiYiOCinQwqD6GRp0eupCgS9TeQ6m',
  storeUrl: 'https://aetheria-store.vercel.app',
  scanIntervalSeconds: 60,
  maxLeadAgeHours: 24,
  subreddits: ['PoGoAndroids', 'PokemonGoSpoofing', 'PGSharp', 'PokemonGoSpoofing_'],
  redditSearchQueries: ['pgsharp key', 'buy pgsharp', 'pgsharp standard key', 'pgsharp slot'],
  googleAlertRssUrls: [],
  telegramChannels: ['pgsharp', 'pgsharpofficial'],
  highIntentKeywords: [
    'need',
    'want',
    'buy',
    'buying',
    'spare',
    'sell',
    'selling',
    'purchase',
    'purchasing',
    'slot',
    'slots',
    'cheap',
    'how to buy',
    'looking for key',
    'spare key',
    'where can i buy',
    'who sells',
    'anyone selling',
    'paypal',
    'upi',
  ],
  generalKeywords: [
    'pgsharp key',
    'pgsharp standard',
    'activation key',
    'standard edition',
    'license key',
    'pgsharp license',
  ],
  excludeKeywords: [
    'ban wave',
    'i got banned',
    'update v',
    'changelog',
    'apk download',
    'patch notes',
    'virus',
    'mod apk',
    'cracked apk',
  ],
  pitchTemplates: {
    hot: "Hey @{author}! Saw you're looking for an instant PGSharp Standard key. I have verified keys available with instant auto-delivery, UPI/PayPal, and 24/7 activation support: {storeUrl}",
    warm: "Hey @{author}! If you need a verified PGSharp Standard key or slot, check out our instant key dispatch store: {storeUrl}",
  },
};

export async function getLiveRadarConfig(): Promise<RadarConfig> {
  // 1. Try Firestore first (Production cloud persistence)
  try {
    const db = getAdminFirestore();
    const doc = await db.collection(SETTINGS_COLLECTION).doc(RADAR_CONFIG_DOC).get();
    if (doc.exists) {
      const data = doc.data() as RadarConfig;
      if (data && typeof data === 'object') {
        const merged: RadarConfig = { ...DEFAULT_RADAR_CONFIG, ...data };
        if (!merged.discordWebhookUrl) {
          merged.discordWebhookUrl = process.env.DISCORD_LEADS_WEBHOOK_URL || DEFAULT_RADAR_CONFIG.discordWebhookUrl;
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('[RadarConfig] Firestore read fallback:', err);
  }

  // 2. Try local radar.config.json
  try {
    if (fs.existsSync(LOCAL_CONFIG_PATH)) {
      const raw = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      const merged: RadarConfig = { ...DEFAULT_RADAR_CONFIG, ...parsed };
      if (!merged.discordWebhookUrl) {
        merged.discordWebhookUrl = process.env.DISCORD_LEADS_WEBHOOK_URL || DEFAULT_RADAR_CONFIG.discordWebhookUrl;
      }
      return merged;
    }
  } catch {}

  return {
    ...DEFAULT_RADAR_CONFIG,
    discordWebhookUrl: process.env.DISCORD_LEADS_WEBHOOK_URL || DEFAULT_RADAR_CONFIG.discordWebhookUrl,
  };
}

export async function saveLiveRadarConfig(newConfig: Partial<RadarConfig>): Promise<RadarConfig> {
  const current = await getLiveRadarConfig();
  const merged: RadarConfig = {
    ...current,
    ...newConfig,
    discordWebhookUrl:
      typeof newConfig.discordWebhookUrl === 'string'
        ? newConfig.discordWebhookUrl.trim()
        : current.discordWebhookUrl,
  };

  // 1. Persist to Firestore (Works in Vercel Cloud Serverless)
  try {
    const db = getAdminFirestore();
    await db.collection(SETTINGS_COLLECTION).doc(RADAR_CONFIG_DOC).set(merged, { merge: true });
  } catch (err) {
    console.error('[RadarConfig] Error writing to Firestore:', err);
  }

  // 2. Try writing local file if filesystem is writable (local dev)
  try {
    fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch {
    // Expected on Vercel read-only filesystem
  }

  return merged;
}
