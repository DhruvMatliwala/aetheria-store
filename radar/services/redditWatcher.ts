import { LeadItem, RadarConfig } from '../types';
import { evaluateBuyerIntent } from './intentFilter';
import { leadStorage } from '../store/leadStorage';

interface PullPushItem {
  id: string;
  author: string;
  title?: string;
  selftext?: string;
  body?: string;
  permalink: string;
  created_utc?: number;
  created?: number;
  subreddit: string;
}

interface PullPushResponse {
  data?: PullPushItem[];
}

export async function scanSubreddit(
  subreddit: string,
  config: RadarConfig
): Promise<LeadItem[]> {
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffSeconds = Math.floor((Date.now() - maxAgeHours * 3600 * 1000) / 1000);
  const url = `https://api.pullpush.io/reddit/search/submission/?subreddit=${encodeURIComponent(subreddit)}&size=25&after=${cutoffSeconds}&sort=desc&sort_type=created_utc`;
  return fetchAndFilterPullPush(url, `r/${subreddit}`, config);
}

export async function searchReddit(
  query: string,
  config: RadarConfig
): Promise<LeadItem[]> {
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffSeconds = Math.floor((Date.now() - maxAgeHours * 3600 * 1000) / 1000);
  const leads: LeadItem[] = [];

  const submissionUrl = `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(query)}&size=25&after=${cutoffSeconds}&sort=desc&sort_type=created_utc`;
  const commentUrl = `https://api.pullpush.io/reddit/search/comment/?q=${encodeURIComponent(query)}&size=25&after=${cutoffSeconds}&sort=desc&sort_type=created_utc`;

  const submissionLeads = await fetchAndFilterPullPush(submissionUrl, `Reddit Post: "${query}"`, config);
  await new Promise((resolve) => setTimeout(resolve, 800));
  const commentLeads = await fetchAndFilterPullPush(commentUrl, `Reddit Comment: "${query}"`, config);

  leads.push(...submissionLeads, ...commentLeads);
  return leads;
}

async function fetchAndFilterPullPush(
  endpoint: string,
  subSource: string,
  config: RadarConfig
): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const maxAgeHours = config.maxLeadAgeHours || 24;
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

  try {
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AetheriaRadar/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[Radar:Reddit] HTTP ${res.status} on ${subSource}`);
      return [];
    }

    const json = (await res.json()) as PullPushResponse;
    const items = json.data || [];

    for (const post of items) {
      if (!post || !post.id) continue;

      const leadId = `reddit_${post.id}`;
      if (leadStorage.has(leadId)) {
        continue;
      }

      // Strict Recency Validation: Reject missing timestamps and posts older than cutoff
      const rawUtc = post.created_utc || post.created;
      if (!rawUtc) {
        leadStorage.add(leadId);
        continue;
      }

      const postTimeMs = rawUtc > 1e11 ? rawUtc : rawUtc * 1000;
      if (postTimeMs < cutoffMs) {
        leadStorage.add(leadId);
        continue;
      }

      const postTitle = post.title || 'Reddit Comment';
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
          subSource: `r/${post.subreddit || 'PoGoAndroids'} (${subSource})`,
          author: post.author || 'Anonymous',
          title: postTitle,
          body: postText,
          url: post.permalink.startsWith('http')
            ? post.permalink
            : `https://reddit.com${post.permalink}`,
          timestamp: postTimeMs,
          matchedKeywords: filter.matchedKeywords,
          intentLevel: filter.intentLevel,
        });
      } else {
        leadStorage.add(leadId);
      }
    }
  } catch (err) {
    console.error(`[Radar:Reddit] Error querying ${subSource}:`, err);
  }

  return leads;
}
