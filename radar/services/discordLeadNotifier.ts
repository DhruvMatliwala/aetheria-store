import { LeadItem, RadarConfig } from '../types';

export async function dispatchDiscordLead(
  lead: LeadItem,
  config: RadarConfig
): Promise<boolean> {
  const webhookUrl = config.discordWebhookUrl;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.warn('[Radar:Discord] No valid discordWebhookUrl provided. Skipping dispatch.');
    return false;
  }

  const isHot = lead.intentLevel === 'HOT';
  const urgencyEmoji = isHot ? '🔥' : '⚡';

  const platformIcons: Record<string, { emoji: string; color: number }> = {
    twitter: { emoji: '🐦', color: 0x1d9bf0 },
    youtube: { emoji: '▶️', color: 0xff0000 },
    facebook: { emoji: '📘', color: 0x1877f2 },
    threads: { emoji: '🧵', color: 0x222222 },
    instagram: { emoji: '📸', color: 0xe1306c },
    telegram: { emoji: '✈️', color: 0x229ed9 },
    forum: { emoji: '🎮', color: 0xa855f7 },
    reddit: { emoji: '🔴', color: 0xff4500 },
    web: { emoji: '🌐', color: 0x06b6d4 },
  };

  const platform = platformIcons[lead.source] || { emoji: '🌐', color: isHot ? 0xf43f5e : 0x06b6d4 };
  const color = isHot ? 0xf43f5e : platform.color;
  const badgeTitle = `${urgencyEmoji} [${lead.intentLevel} LEAD] ${platform.emoji} ${lead.subSource || lead.source.toUpperCase()}`;

  // Craft personalized pitch
  const rawTemplate = isHot
    ? config.pitchTemplates.hot
    : config.pitchTemplates.warm;

  const customizedPitch = rawTemplate
    .replace('{author}', lead.author || 'there')
    .replace('{storeUrl}', config.storeUrl);

  // Clean snippet
  const snippet = lead.body
    ? lead.body.length > 350
      ? lead.body.substring(0, 347) + '...'
      : lead.body
    : lead.title;

  const payload = {
    username: 'Aetheria Lead Radar',
    avatar_url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=128&auto=format&fit=crop&q=80',
    embeds: [
      {
        title: badgeTitle,
        url: lead.url,
        description: `**"${lead.title}"**\n\n${snippet}`,
        color,
        fields: [
          {
            name: '👤 Poster',
            value: `\`${lead.author || 'Anonymous'}\``,
            inline: true,
          },
          {
            name: '🎯 Matched Keywords',
            value: lead.matchedKeywords.length > 0 ? lead.matchedKeywords.map((k) => `\`${k}\``).join(' ') : 'None',
            inline: true,
          },
          {
            name: '🔗 Direct Link',
            value: `[Open Post / DM](${lead.url})`,
            inline: false,
          },
          {
            name: '📋 1-Tap Copy Sales Pitch (Tap/Copy Below)',
            value: `\`\`\`text\n${customizedPitch}\n\`\`\``,
            inline: false,
          },
        ],
        footer: {
          text: 'Aetheria Lead Radar • 24/7 Internet Intelligence',
        },
        timestamp: new Date(lead.timestamp).toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Radar:Discord] Webhook returned status ${res.status}:`, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Radar:Discord] Failed to send webhook:', err);
    return false;
  }
}
