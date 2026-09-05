import { LeadItem, RadarConfig } from '../types';
import { evaluateBuyerIntent } from './intentFilter';
import { leadStorage } from '../store/leadStorage';

interface RedditPostItem {
  id: string;
  author: string;
  title: string;
  selftext?: string;
  body?: string;
  permalink: string;
  created_utc: number;
  subreddit: string;
}

let cachedRedditToken: { token: string; expiresAt: number } | null = null;

async function getRedditOAuthToken(
  clientId?: string,
  clientSecret?: string
): Promise<string | null> {
  const id = clientId || process.env.REDDIT_CLIENT_ID;
  const secret = clientSecret || process.env.REDDIT_CLIENT_SECRET;

  if (!id || !secret) {
    return null;
  }

  // Reuse token if still valid
  if (cachedRedditToken && cachedRedditToken.expiresAt > Date.now() + 60000) {
    return cachedRedditToken.token;
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${id.trim()}:${secret.trim()}`).toString('base64');
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'node:com.aetheria.radar:v2.0 (by /u/aetheriabot)',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      console.warn(`[Radar:Reddit] OAuth token error: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedRedditToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      };
      return data.access_token;
    }
  } catch (err) {
    console.error('[Radar:Reddit] Failed to obtain OAuth token:', err);
  }

  return null;
}

export async function scanSubreddit(
  subreddit: string,
  config: RadarConfig
): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const token = await getRedditOAuthToken(config.redditClientId, config.redditClientSecret);

  if (token) {
    // 1. Official Reddit OAuth endpoint
    try {
      const url = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/new?limit=25`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'node:com.aetheria.radar:v2.0 (by /u/aetheriabot)',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const posts = (json.data?.children || []).map((c: any) => c.data);
        leads.push(...processRedditPosts(posts, `r/${subreddit}`, config));
      }

      // Also scan latest comments across the subreddit
      try {
        const commentUrl = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/comments?limit=50`;
        const commentRes = await fetch(commentUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'node:com.aetheria.radar:v2.0 (by /u/aetheriabot)',
          },
        });

        if (commentRes.ok) {
          const cJson = await commentRes.json();
          const comments = (cJson.data?.children || []).map((c: any) => ({
            ...c.data,
            title: `Comment in r/${subreddit}`,
          }));
          leads.push(...processRedditPosts(comments, `r/${subreddit} Comments`, config));
        }
      } catch (cErr) {
        console.error(`[Radar:Reddit] Comment fetch error on r/${subreddit}:`, cErr);
      }

      if (leads.length > 0) return leads;
    } catch (err) {
      console.error(`[Radar:Reddit] OAuth error on r/${subreddit}:`, err);
    }
  }

  // 2. Web search fallback for Reddit posts
  const searchQueries = [
    `site:reddit.com/r/${subreddit} pgsharp key`,
    `site:reddit.com/r/${subreddit} pgsharp`,
  ];

  for (const sq of searchQueries) {
    try {
      const ddgLeads = await searchRedditViaDuckDuckGo(sq, `r/${subreddit}`, config);
      leads.push(...ddgLeads);
      if (leads.length > 0) break;
    } catch {
      // ignore
    }
  }

  return leads;
}

export async function searchReddit(
  query: string,
  config: RadarConfig
): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const token = await getRedditOAuthToken(config.redditClientId, config.redditClientSecret);

  if (token) {
    try {
      const url = `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&sort=new&limit=25`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'node:com.aetheria.radar:v2.0 (by /u/aetheriabot)',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const posts = (json.data?.children || []).map((c: any) => c.data);
        leads.push(...processRedditPosts(posts, `Reddit: "${query}"`, config));
        return leads;
      }
    } catch (err) {
      console.error(`[Radar:Reddit] OAuth search error for "${query}":`, err);
    }
  }

  // Web search fallback for query
  try {
    const ddgLeads = await searchRedditViaDuckDuckGo(
      `site:reddit.com ${query}`,
      `Reddit: "${query}"`,
      config
    );
    leads.push(...ddgLeads);
  } catch {
    // ignore
  }

  return leads;
}

function processRedditPosts(
  posts: any[],
  subSource: string,
  config: RadarConfig
): LeadItem[] {
  const leads: LeadItem[] = [];
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

  for (const post of posts) {
    if (!post || !post.id) continue;

    const leadId = `reddit_${post.id}`;
    if (leadStorage.has(leadId)) {
      continue;
    }

    const postTimeMs = (post.created_utc || 0) * 1000;
    if (postTimeMs < cutoffMs) {
      leadStorage.add(leadId);
      continue;
    }

    const postTitle = post.title || 'Reddit Discussion';
    const postText = post.selftext || post.body || '';
    const fullText = `${postTitle} ${postText}`;

    const filter = evaluateBuyerIntent(
      fullText,
      config.highIntentKeywords,
      config.generalKeywords,
      config.excludeKeywords
    );

    if (filter.isMatch) {
      leads.push({
        id: leadId,
        source: 'reddit',
        subSource: `r/${post.subreddit || 'PoGo'} (${subSource})`,
        author: post.author || 'Reddit User',
        title: postTitle,
        body: postText || postTitle,
        url: post.permalink
          ? post.permalink.startsWith('http')
            ? post.permalink
            : `https://reddit.com${post.permalink}`
          : `https://reddit.com/r/${post.subreddit}`,
        timestamp: postTimeMs,
        matchedKeywords: filter.matchedKeywords,
        intentLevel: filter.intentLevel,
      });
    } else {
      leadStorage.add(leadId);
    }
  }

  return leads;
}

async function searchRedditViaDuckDuckGo(
  query: string,
  subSource: string,
  config: RadarConfig
): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
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

        if (!realUrl.includes('reddit.com')) continue;

        const title = linkMatch[2].replace(/<[^>]*>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        const fullText = `${title} ${snippet}`;

        const leadId = `reddit_${Buffer.from(realUrl).toString('base64').substring(0, 24)}`;
        if (leadStorage.has(leadId)) continue;

        const filter = evaluateBuyerIntent(
          fullText,
          config.highIntentKeywords,
          config.generalKeywords,
          config.excludeKeywords
        );

        if (filter.isMatch) {
          leads.push({
            id: leadId,
            source: 'reddit',
            subSource,
            author: 'Reddit Poster',
            title,
            body: snippet,
            url: realUrl,
            timestamp: Date.now(), // Recency estimated from search
            matchedKeywords: filter.matchedKeywords,
            intentLevel: filter.intentLevel,
          });
        } else {
          leadStorage.add(leadId);
        }
      }
    }
  } catch (err) {
    console.error(`[Radar:Reddit] DuckDuckGo fallback error:`, err);
  }

  return leads;
}
