import Parser from 'rss-parser';
import { LeadItem, RadarConfig } from '../types';
import { evaluateBuyerIntent } from './intentFilter';
import { leadStorage } from '../store/leadStorage';

const rssParser = new Parser({
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

export async function scanWebRssFeeds(config: RadarConfig): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

  // ── 1. Google Alerts RSS Feeds (High Reliability Real-time Index) ──────────
  for (const url of config.googleAlertRssUrls || []) {
    if (!url || !url.startsWith('http') || url.includes('placeholder')) continue;

    try {
      const feed = await rssParser.parseURL(url);
      const items = feed.items || [];

      for (const item of items) {
        const itemUrl = item.link || '';
        const title = stripHtml(item.title || '');
        const snippet = stripHtml(item.contentSnippet || item.content || '');
        const fullText = `${title} ${snippet}`;

        const pubTime = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
        if (pubTime < cutoffMs) continue;

        const leadId = `ga_${Buffer.from(itemUrl).toString('base64').substring(0, 28)}`;
        if (leadStorage.has(leadId)) continue;

        const filter = evaluateBuyerIntent(
          fullText,
          config.highIntentKeywords,
          config.generalKeywords,
          config.excludeKeywords
        );

        if (filter.isMatch) {
          const platform = detectPlatform(itemUrl);
          leads.push({
            id: leadId,
            source: platform.source,
            subSource: platform.subSource,
            author: item.creator || 'Web Poster',
            title,
            body: snippet || title,
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
      console.warn(`[Radar:Web] Error parsing Google Alert feed ${url}:`, err);
    }
  }

  // ── 2. Live Dynamic Web & Social Crawl (DuckDuckGo Real-Time Search) ────────
  const dynamicQueries: { query: string; label: string }[] = [
    { query: 'pgsharp key buy', label: 'Web (Key Buying)' },
    { query: 'pgsharp "spare key"', label: 'Web (Spare Key)' },
    { query: 'pgsharp standard key', label: 'Web (Standard Key)' },
    { query: 'site:youtube.com pgsharp key', label: 'YouTube Discussion' },
    { query: 'site:x.com pgsharp key', label: 'X / Twitter Post' },
    { query: 'site:itemku.com pgsharp', label: 'Marketplace (Itemku)' },
  ];

  for (const { query, label } of dynamicQueries.slice(0, 4)) {
    try {
      const searchLeads = await crawlDuckDuckGoQuery(query, label, config);
      leads.push(...searchLeads);
      // Brief breather between search engine calls
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.warn(`[Radar:Web] Search error on "${query}":`, err);
    }
  }

  return leads;
}

function detectPlatform(url: string): { source: LeadItem['source']; subSource: string } {
  const lower = url.toLowerCase();
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { source: 'twitter', subSource: 'X / Twitter' };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { source: 'youtube', subSource: 'YouTube' };
  }
  if (lower.includes('facebook.com') || lower.includes('fb.com')) {
    return { source: 'facebook', subSource: 'Facebook' };
  }
  if (lower.includes('threads.net')) {
    return { source: 'threads', subSource: 'Threads' };
  }
  if (lower.includes('instagram.com')) {
    return { source: 'instagram', subSource: 'Instagram' };
  }
  if (lower.includes('discord.gg') || lower.includes('discord.com')) {
    return { source: 'discord', subSource: 'Discord' };
  }
  if (lower.includes('reddit.com')) {
    return { source: 'reddit', subSource: 'Reddit' };
  }
  if (
    lower.includes('ownedcore.com') ||
    lower.includes('elitepvpers.com') ||
    lower.includes('epicnpc.com') ||
    lower.includes('itemku.com') ||
    lower.includes('playerup.com')
  ) {
    const domain = lower.split('/')[2] || 'Forum';
    return { source: 'forum', subSource: domain };
  }
  return { source: 'web', subSource: 'Open Web' };
}

async function crawlDuckDuckGoQuery(
  query: string,
  defaultLabel: string,
  config: RadarConfig
): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const blockRegex = /<div[^>]*class="[^"]*web-result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
    let blockMatch: RegExpExecArray | null;

    while ((blockMatch = blockRegex.exec(html)) !== null) {
      const block = blockMatch[1];
      const linkMatch = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const snippetMatch = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);

      if (linkMatch) {
        let rawHref = linkMatch[1];
        let realUrl = rawHref;
        const uddg = /uddg=([^&]+)/.exec(rawHref);
        if (uddg) {
          realUrl = decodeURIComponent(uddg[1]);
        }

        const title = linkMatch[2].replace(/<[^>]*>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        const fullText = `${title} ${snippet}`;

        const leadId = `web_${Buffer.from(realUrl).toString('base64').substring(0, 24)}`;
        if (leadStorage.has(leadId)) continue;

        const filter = evaluateBuyerIntent(
          fullText,
          config.highIntentKeywords,
          config.generalKeywords,
          config.excludeKeywords
        );

        if (filter.isMatch) {
          const platform = detectPlatform(realUrl);
          leads.push({
            id: leadId,
            source: platform.source,
            subSource: platform.subSource || defaultLabel,
            author: `${platform.subSource} User`,
            title,
            body: snippet || title,
            url: realUrl,
            timestamp: Date.now(),
            matchedKeywords: filter.matchedKeywords,
            intentLevel: filter.intentLevel,
          });
        } else {
          leadStorage.add(leadId);
        }
      }
    }
  } catch (err) {
    console.warn(`[Radar:Web] Search crawl error on "${query}":`, err);
  }

  return leads;
}
