export type IntentLevel = 'HOT' | 'WARM';

export interface LeadItem {
  id: string; // Unique deduplication ID (e.g. "reddit_t3_xyz", "web_hash123")
  source: 'reddit' | 'web' | 'forum' | 'telegram' | 'twitter' | 'youtube' | 'facebook' | 'threads' | 'instagram';
  subSource?: string; // e.g. "r/PoGoAndroids" or "OwnedCore" or "X / Twitter" or "YouTube"
  author: string;
  title: string;
  body: string;
  url: string;
  timestamp: number; // Unix epoch ms
  matchedKeywords: string[];
  intentLevel: IntentLevel;
}

export interface RadarConfig {
  discordWebhookUrl: string;
  storeUrl: string;
  scanIntervalSeconds: number;
  maxLeadAgeHours?: number;
  subreddits: string[];
  redditSearchQueries: string[];
  webSearchQueries?: string[];
  gamingForums?: string[];
  socialSearchQueries?: string[];
  googleAlertRssUrls: string[];
  telegramChannels: string[];
  highIntentKeywords: string[];
  generalKeywords: string[];
  excludeKeywords: string[];
  pitchTemplates: {
    hot: string;
    warm: string;
  };
}
