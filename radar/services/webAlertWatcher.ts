import Parser from 'rss-parser';
import { LeadItem, RadarConfig } from '../types';
import { evaluateBuyerIntent } from './intentFilter';
import { leadStorage } from '../store/leadStorage';

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AetheriaRadar/2.0',
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

interface FeedTarget {
  url: string;
  label: string;
  isForum?: boolean;
  forumName?: string;
}

export async function scanWebRssFeeds(config: RadarConfig): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

  const feedUrls: FeedTarget[] = [];

  // ── 1. Google Alerts Feeds (Direct Google Search Indexing) ────────────────
  for (const url of config.googleAlertRssUrls || []) {
    if (url && url.startsWith('http') && !url.includes('placeholder')) {
      feedUrls.push({ url, label: 'Google Alerts' });
    }
  }

  // ── 2. Open Web Search Streams (Entire Internet via Live Search RSS) ───────
  const webQueries = config.webSearchQueries && config.webSearchQueries.length > 0
    ? config.webSearchQueries
    : config.redditSearchQueries || ['buy pgsharp key', 'pgsharp standard key'];

  for (const query of webQueries.slice(0, 4)) {
    feedUrls.push({
      url: `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss`,
      label: `🌐 Web Search: "${query}"`,
    });
  }

  // ── 3. Premier Gaming & Spoofing Forums ────────────────────────────────────
  const targetForums = config.gamingForums && config.gamingForums.length > 0
    ? config.gamingForums
    : ['ownedcore.com', 'elitepvpers.com', 'epicnpc.com', 'playerup.com'];

  for (const forum of targetForums.slice(0, 3)) {
    const cleanForum = forum.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    feedUrls.push({
      url: `https://www.bing.com/search?q=${encodeURIComponent('site:' + cleanForum + ' pgsharp')}&format=rss`,
      label: `🎮 ${cleanForum}`,
      isForum: true,
      forumName: cleanForum,
    });
  }

  // ── 4. Process Each Feed ──────────────────────────────────────────────────
  for (const feedEntry of feedUrls) {
    const feedUrl = feedEntry.url;
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items || [];

      for (const item of items) {
        const rawId = item.id || item.guid || item.link || '';
        const prefix = feedEntry.isForum ? 'forum' : 'web';
        const leadId = `${prefix}_${Buffer.from(rawId).toString('base64').substring(0, 32)}`;

        if (leadStorage.has(leadId)) {
          continue;
        }

        const title = stripHtml(item.title || '');
        const snippet = stripHtml(item.contentSnippet || item.content || '');
        const fullText = `${title} ${snippet}`;

        const pubTime = item.pubDate ? new Date(item.pubDate).getTime() : 0;

        if (pubTime === 0 || pubTime < cutoffMs) {
          leadStorage.add(leadId);
          continue;
        }

        const filter = evaluateBuyerIntent(
          fullText,
          config.highIntentKeywords,
          config.generalKeywords,
          config.excludeKeywords
        );

        if (filter.isMatch) {
          // Detect if URL is from a known forum
          const itemUrl = item.link || feedUrl;
          const isForumPost =
            feedEntry.isForum ||
            itemUrl.includes('ownedcore.com') ||
            itemUrl.includes('elitepvpers.com') ||
            itemUrl.includes('epicnpc.com') ||
            itemUrl.includes('playerup.com') ||
            itemUrl.includes('forum');

          leads.push({
            id: leadId,
            source: isForumPost ? 'forum' : 'web',
            subSource: feedEntry.label || (feed.title ? `Web: ${feed.title}` : 'Open Web'),
            author: item.creator || (feedEntry.forumName ? `${feedEntry.forumName} User` : 'Web User'),
            title,
            body: snippet,
            url: itemUrl,
            timestamp: pubTime,
            matchedKeywords: filter.matchedKeywords,
            intentLevel: filter.intentLevel,
          });
        } else {
          leadStorage.add(leadId);
        }
      }
    } catch (err) {
      console.error(`[Radar:WebAlerts] Error parsing feed ${feedUrl}:`, err);
    }
  }

  return leads;
}

