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
  patreonEmail?: string;
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

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
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
    ];

    if (params.patreonEmail) {
      fields.push({
        name: '📧 Patreon Source Account',
        value: `\`${params.patreonEmail}\``,
        inline: true,
      });
    }

    fields.push({
      name: '🔑 Delivered License Key',
      value: `\`\`\`${params.deliveredKey}\`\`\``,
      inline: false,
    });

    const payload = {
      username: 'Aetheria Order Backup',
      avatar_url: 'https://aetheria-store.vercel.app/logo.png',
      embeds: [
        {
          title: '✅ Order Approved & Key Dispatched',
          color: 0x06b6d4, // Cyan #06B6D4
          fields,
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

export interface LowStockAlertParams {
  planType: string;
  remainingKeysOrSlots: number;
  threshold?: number;
}

/**
 * Dispatches an automated high-priority alert to Discord when stock drops below threshold (default: <= 3).
 */
export async function sendLowStockAlert(params: LowStockAlertParams): Promise<void> {
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
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app').replace(/\/+$/, '');
    const adminUrl = `${appUrl}/admin`;

    const isCritical = params.remainingKeysOrSlots <= 1;

    const payload = {
      username: 'Aetheria Stock Guard',
      avatar_url: 'https://aetheria-store.vercel.app/logo.png',
      embeds: [
        {
          title: isCritical
            ? '🚨 CRITICAL: License Key Stock Nearly Sold Out!'
            : '⚠️ LOW INVENTORY WARNING — Restock Recommended',
          description:
            `Available stock for **${planName}** has dropped to **${params.remainingKeysOrSlots} remaining**.\n\n` +
            `👉 **[Click Here to Open Admin Portal & Add Keys](${adminUrl})**`,
          color: isCritical ? 0xef4444 : 0xf59e0b, // Red (#EF4444) or Amber (#F59E0B)
          fields: [
            {
              name: '📦 Plan Tier',
              value: `**${planName}**`,
              inline: true,
            },
            {
              name: '📉 Remaining Capacity',
              value: `**${params.remainingKeysOrSlots} key(s)/slot(s)**`,
              inline: true,
            },
            {
              name: '⚙️ Threshold Rule',
              value: `Alert triggered at ≤ ${params.threshold ?? 3}`,
              inline: true,
            },
          ],
          footer: {
            text: 'Aetheria Store • Autonomous Inventory Monitor',
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
    console.error('[discordAdmin] Failed to send low stock alert:', err);
  }
}

/**
 * Sends a test ping to the configured Discord webhook to verify integration.
 */
export async function sendTestDiscordAlert(): Promise<{ success: boolean; error?: string }> {
  const webhookUrl =
    process.env.DISCORD_ADMIN_WEBHOOK_URL ||
    process.env.ADMIN_DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return {
      success: false,
      error: 'DISCORD_ADMIN_WEBHOOK_URL environment variable is missing or invalid.',
    };
  }

  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app').replace(/\/+$/, '');
    const adminUrl = `${appUrl}/admin`;

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Aetheria Alert Tester',
        avatar_url: 'https://aetheria-store.vercel.app/logo.png',
        embeds: [
          {
            title: '✅ Discord Webhook Connected Successfully!',
            description:
              `Your private Discord alert channel is properly connected to **Aetheria Store**.\n\n` +
              `**You will receive instant alerts for:**\n` +
              `• ⚡ **Manual UPI UTR Submissions** (with instant 1-Click Approve & Reject links)\n` +
              `• 💰 **Completed Orders** (PayPal & Auto-UPI key dispatch logs)\n` +
              `• ⚠️ **Low Inventory Warnings** (whenever stock drops to 3 or fewer keys)\n\n` +
              `👉 **[Access Admin Portal](${adminUrl})**`,
            color: 0x10b981, // Emerald #10B981
            footer: {
              text: 'Aetheria Store • Alert Verification',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Discord webhook rejected request with status ${res.status}: ${res.statusText}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error sending to Discord webhook.' };
  }
}
