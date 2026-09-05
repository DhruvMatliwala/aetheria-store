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

  // ── 4. Social Media & Video Streams (X/Twitter, YouTube, Facebook, Threads, Instagram) ─
  const socialQueries = config.socialSearchQueries && config.socialSearchQueries.length > 0
    ? config.socialSearchQueries
    : [
        'site:x.com OR site:twitter.com ("buy pgsharp" OR "pgsharp key" OR "pgsharp slot")',
        'site:youtube.com ("pgsharp key" OR "buy pgsharp" OR "pgsharp standard")',
        'site:facebook.com ("pgsharp key" OR "buy pgsharp" OR "pgsharp slot")',
        'site:threads.net ("pgsharp key" OR "pgsharp")',
        'site:instagram.com ("pgsharp key")',
      ];

  for (const sq of socialQueries) {
    feedUrls.push({
      url: `https://www.bing.com/search?q=${encodeURIComponent(sq)}&format=rss`,
      label: `Social Search`,
    });
  }

  // ── 5. Process Each Feed ──────────────────────────────────────────────────
  for (const feedEntry of feedUrls) {
    const feedUrl = feedEntry.url;
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items || [];

      for (const item of items) {
        const rawId = item.id || item.guid || item.link || '';
        const itemUrl = item.link || feedUrl;
        const lowerUrl = itemUrl.toLowerCase();

        let source: LeadItem['source'] = 'web';
        let subSource = feedEntry.label || 'Open Web';
        let author = item.creator || 'Web User';

        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
          source = 'twitter';
          subSource = 'X / Twitter';
          author = item.creator || 'Twitter User';
        } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
          source = 'youtube';
          subSource = 'YouTube';
          author = item.creator || 'YouTube User';
        } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
          source = 'facebook';
          subSource = 'Facebook Group/Post';
          author = item.creator || 'Facebook User';
        } else if (lowerUrl.includes('threads.net')) {
          source = 'threads';
          subSource = 'Threads';
          author = item.creator || 'Threads User';
        } else if (lowerUrl.includes('instagram.com')) {
          source = 'instagram';
          subSource = 'Instagram';
          author = item.creator || 'Instagram User';
        } else if (lowerUrl.includes('discord.gg') || lowerUrl.includes('discord.com') || lowerUrl.includes('disboard.org')) {
          source = 'discord';
          subSource = 'Discord Community';
          author = item.creator || 'Discord Member';
        } else if (
          feedEntry.isForum ||
          lowerUrl.includes('ownedcore.com') ||
          lowerUrl.includes('elitepvpers.com') ||
          lowerUrl.includes('epicnpc.com') ||
          lowerUrl.includes('playerup.com') ||
          lowerUrl.includes('forum')
        ) {
          source = 'forum';
          subSource = feedEntry.forumName || 'Gaming Forum';
          author = item.creator || `${subSource} Member`;
        } else if (lowerUrl.includes('reddit.com')) {
          source = 'reddit';
          subSource = 'Reddit';
          author = item.creator || 'Reddit User';
        }

        const leadId = `${source}_${Buffer.from(rawId).toString('base64').substring(0, 32)}`;

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
          leads.push({
            id: leadId,
            source,
            subSource,
            author,
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

