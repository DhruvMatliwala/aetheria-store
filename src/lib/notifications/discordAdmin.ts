import { PLAN_MAP } from '@/lib/constants';
import { generateApprovalToken } from '@/lib/orders/approvalToken';

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

export interface AdminVerificationAlertParams {
  orderId: string;
  customerEmail: string;
  customerPhone?: string;
  planType: string;
  amount: number;
  currency: string;
  gateway: string;
  transactionId: string;
}

/**
 * Dispatches an alert to Discord when a customer submits payment proof (UTR or PayPal Tx ID).
 * Includes 1-click Approve and Reject links for instant mobile action.
 */
export async function sendPaymentVerificationAlert(params: AdminVerificationAlertParams): Promise<void> {
  const webhookUrl =
    process.env.DISCORD_ADMIN_WEBHOOK_URL ||
    process.env.ADMIN_DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return;
  }

  try {
    const plan = PLAN_MAP[params.planType];
    const planName = plan ? `${plan.name} (${plan.duration})` : params.planType;
    const formattedAmount =
      params.currency === 'USD'
        ? `$${(params.amount / 100).toFixed(2)}`
        : `₹${(params.amount / 100).toFixed(2)}`;

    const token = generateApprovalToken(params.orderId);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app').replace(/\/+$/, '');
    const approveUrl = `${appUrl}/api/admin/orders/quick-approve?orderId=${params.orderId}&token=${token}`;
    const rejectUrl = `${appUrl}/api/admin/orders/quick-reject?orderId=${params.orderId}&token=${token}`;
    const adminUrl = `${appUrl}/admin`;

    const payload = {
      username: 'Aetheria Payment Vault',
      avatar_url: 'https://aetheria-store.vercel.app/logo.png',
      embeds: [
        {
          title: '🚨 NEW PAYMENT PROOF SUBMITTED — Action Required',
          description:
            `A customer has submitted payment proof. Verify your bank/PayPal notification and choose an action below:\n\n` +
            `👉 **[✅ 1-CLICK APPROVE & SEND KEY](${approveUrl})**\n` +
            `👉 **[❌ 1-CLICK REJECT FAKE](${rejectUrl})**\n` +
            `👉 **[Open Store Admin Portal](${adminUrl})**`,
          color: 0xf59e0b, // Amber #F59E0B
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
              name: '💰 Amount Claimed',
              value: `**${formattedAmount}** (${params.gateway.toUpperCase()})`,
              inline: true,
            },
            {
              name: '🆔 Reference / UTR Number',
              value: `\`${params.transactionId || 'N/A'}\``,
              inline: true,
            },
          ],
          footer: {
            text: 'Aetheria Store • 1-Click Verification System',
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
    console.error('[discordAdmin] Failed to send verification alert:', err);
  }
}

/**
 * Dispatches an instant, real-time rich notification to a private Discord channel.
 * Serves as an immutable backup log when an order is completed.
 */
export async function sendAdminOrderAlert(params: AdminOrderAlertParams): Promise<void> {
  const webhookUrl =
    process.env.DISCORD_ADMIN_WEBHOOK_URL ||
    process.env.ADMIN_DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
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
      avatar_url: 'https://aetheria-store.vercel.app/logo.png',
      embeds: [
        {
          title: '✅ Order Approved & Key Dispatched',
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
