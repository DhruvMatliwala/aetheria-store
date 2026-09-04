import Parser from 'rss-parser';
import { LeadItem, RadarConfig } from '../types';
import { evaluateBuyerIntent } from './intentFilter';
import { leadStorage } from '../store/leadStorage';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AetheriaRadar/1.0',
  },
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

export async function scanWebRssFeeds(config: RadarConfig): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

  // Combine custom Google Alerts RSS feeds and public search RSS streams
  const feedUrls: { url: string; label: string }[] = [];

  for (const url of config.googleAlertRssUrls) {
    if (url && url.startsWith('http') && !url.includes('placeholder')) {
      feedUrls.push({ url, label: 'Google Alerts' });
    }
  }

  // Add live search RSS streams for Reddit queries
  for (const query of config.redditSearchQueries.slice(0, 2)) {
    feedUrls.push({
      url: `https://www.bing.com/search?q=${encodeURIComponent('site:reddit.com ' + query)}&format=rss`,
      label: `Web/Reddit Search: "${query}"`,
    });
  }

  for (const feedEntry of feedUrls) {
    const feedUrl = feedEntry.url;
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items || [];

      for (const item of items) {
        const rawId = item.id || item.guid || item.link || '';
        const leadId = `web_${Buffer.from(rawId).toString('base64').substring(0, 32)}`;

        if (leadStorage.has(leadId)) {
          continue;
        }

        const title = stripHtml(item.title || '');
        const snippet = stripHtml(item.contentSnippet || item.content || '');
        const fullText = `${title} ${snippet}`;

        const pubTime = item.pubDate ? new Date(item.pubDate).getTime() : 0;
        const maxAgeHours = config.maxLeadAgeHours || 24;
        const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

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
          leads.push({
            id: leadId,
            source: 'web',
            subSource: feedEntry.label || (feed.title ? `Web: ${feed.title}` : 'Web Monitor'),
            author: item.creator || 'Web User',
            title,
            body: snippet,
            url: item.link || feedUrl,
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
