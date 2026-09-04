import { LeadItem, RadarConfig } from '../types';
import { evaluateBuyerIntent } from './intentFilter';
import { leadStorage } from '../store/leadStorage';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AetheriaRadar/1.0';

export async function scanTelegramChannels(config: RadarConfig): Promise<LeadItem[]> {
  const leads: LeadItem[] = [];

  for (const channel of config.telegramChannels) {
    if (!channel || channel.trim() === '') continue;

    const cleanChannel = channel.replace(/^@/, '').trim();
    const previewUrl = `https://t.me/s/${cleanChannel}`;

    try {
      const res = await fetch(previewUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!res.ok) {
        continue;
      }

      const html = await res.text();
      // Extract tgme_widget_message blocks
      const msgRegex = /<div class="tgme_widget_message\b[^"]*" data-post="([^"]+)"([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;

      const maxAgeHours = config.maxLeadAgeHours || 24;
      const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

      let match: RegExpExecArray | null;
      while ((match = msgRegex.exec(html)) !== null) {
        const postDataPost = match[1]; // e.g. "pgsharp/1234"
        const blockContent = match[2];

        // Extract message text
        const textMatch = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(blockContent);
        if (!textMatch) continue;

        const rawText = textMatch[1].replace(/<[^>]*>?/gm, ' ').trim();
        const leadId = `tg_${postDataPost.replace('/', '_')}`;
        if (leadStorage.has(leadId)) {
          continue;
        }

        // Extract datetime if available
        const timeMatch = /<time[^>]*datetime="([^"]+)"/i.exec(blockContent);
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
            subSource: `Telegram @${cleanChannel}`,
            author: `@${cleanChannel}`,
            title: `New post in @${cleanChannel}`,
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
      console.error(`[Radar:Telegram] Error scanning channel @${cleanChannel}:`, err);
    }
  }

  return leads;
}
