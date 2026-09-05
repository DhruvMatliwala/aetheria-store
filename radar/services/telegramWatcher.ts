import { LeadItem, RadarConfig } from '../types';
import { evaluateBuyerIntent } from './intentFilter';
import { leadStorage } from '../store/leadStorage';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AetheriaRadar/2.0';

export async function scanTelegramChannels(config: RadarConfig): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];
  const channels = config.telegramChannels && config.telegramChannels.length > 0
    ? config.telegramChannels
    : ['PGSharpkeyss', 'pgsharp', 'PoGoSpoofing'];

  for (const channel of channels) {
    if (!channel || channel.trim() === '') continue;

    const cleanChannel = channel.replace(/^@/, '').trim();
    const previewUrl = `https://t.me/s/${cleanChannel}`;

    try {
      const res = await fetch(previewUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const maxAgeHours = config.maxLeadAgeHours || 72;
      const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

      // Extract message containers
      // Matches data-post="channel/123" and inner content
      const msgRegex = /data-post="([^"]+)"([\s\S]*?)(?=data-post="|<\/section>|$)/gi;
      let match: RegExpExecArray | null;

      while ((match = msgRegex.exec(html)) !== null) {
        const postDataPost = match[1];
        const blockContent = match[2];

        // Extract message text
        const textMatch = /class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(blockContent);
        if (!textMatch) continue;

        const rawText = textMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();

        if (rawText.length < 10) continue;

        const leadId = `tg_${postDataPost.replace('/', '_')}`;
        if (leadStorage.has(leadId)) continue;

        // Extract datetime
        const timeMatch = /datetime="([^"]+)"/i.exec(blockContent);
        let postTimeMs = Date.now();
        if (timeMatch) {
          const parsed = new Date(timeMatch[1]).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            postTimeMs = parsed;
          }
        }

        if (postTimeMs < cutoffMs) {
          leadStorage.add(leadId);
          continue;
        }

        const filter = evaluateBuyerIntent(
          rawText,
          config.highIntentKeywords,
          config.generalKeywords,
          config.excludeKeywords
        );

        if (filter.isMatch) {
          leads.push({
            id: leadId,
            source: 'telegram',
            subSource: `Telegram: @${cleanChannel}`,
            author: `@${cleanChannel}`,
            title: `Telegram @${cleanChannel} Message`,
            body: rawText,
            url: `https://t.me/${postDataPost}`,
            timestamp: postTimeMs,
            matchedKeywords: filter.matchedKeywords,
            intentLevel: filter.intentLevel,
          });
        } else {
          leadStorage.add(leadId);
        }
      }
    } catch (err) {
      console.warn(`[Radar:Telegram] Error scanning @${cleanChannel}:`, err);
    }
  }

  return leads;
}
