import { PLAN_MAP } from '@/lib/constants';

export interface AdminOrderAlertParams {
  orderId: string;
  customerEmail: string;
  customerPhone?: string;
  planType: string;
  amount: number;
  currency: string;
  gateway: string;
  transactionId: string;
  deliveredKey: string;
}

/**
 * Dispatches an instant, real-time rich notification to a private Discord channel.
 * Serves as an immutable backup log in case customer emails fail or bounce.
 */
export async function sendAdminOrderAlert(params: AdminOrderAlertParams): Promise<void> {
  const webhookUrl =
    process.env.DISCORD_ADMIN_WEBHOOK_URL ||
    process.env.ADMIN_DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    // Webhook not configured yet, skip silently
    return;
  }

  try {
    const plan = PLAN_MAP[params.planType];
    const planName = plan ? `${plan.name} (${plan.duration})` : params.planType;
    const formattedAmount =
      params.currency === 'USD'
        ? `$${(params.amount / 100).toFixed(2)}`
        : `₹${(params.amount / 100).toFixed(2)}`;

    const payload = {
      username: 'Aetheria Order Backup',
      avatar_url: 'https://pgsharp.com/img/logo.png',
      embeds: [
        {
          title: '🔔 Order Paid & Key Fulfilled',
          color: 0x06b6d4, // Cyan #06B6D4
          fields: [
            {
              name: '📋 Order ID',
              value: `\`${params.orderId}\``,
              inline: true,
            },
            {
              name: '👤 Customer Email',
              value: `\`${params.customerEmail}\``,
              inline: true,
            },
            {
              name: '📦 Plan',
              value: `**${planName}**`,
              inline: true,
            },
            {
              name: '💰 Amount Paid',
              value: `**${formattedAmount}** (${params.gateway.toUpperCase()})`,
              inline: true,
            },
            {
              name: '🆔 Transaction Ref',
              value: `\`${params.transactionId || 'N/A'}\``,
              inline: true,
            },
            {
              name: '🔑 Delivered License Key',
              value: `\`\`\`${params.deliveredKey}\`\`\``,
              inline: false,
            },
          ],
          footer: {
            text: 'Aetheria Store • Instant Backup Vault',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[discordAdmin] Failed to send Discord admin alert:', err);
  }
}
