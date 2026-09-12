import { sendTelegramMessage } from '@/lib/telegram/bot';
import {
  TELEGRAM_PROOF_CHANNEL,
  TELEGRAM_BOT_USERNAME,
  PLAN_MAP,
  PLANS,
} from '@/lib/constants';
import { getAvailableCount } from '@/lib/firestore/keys';

export interface OrderProofPayload {
  orderId: string;
  planType: string;
  gateway?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerUsername?: string;
}

/**
 * Anonymizes email or username for public vouch broadcast:
 * - "dhruvmatliwala@gmail.com" -> "dh***@gmail.com"
 * - "dhruv_emperor" -> "@dh***"
 */
function anonymizeIdentity(email?: string, username?: string): string {
  if (username && username.trim()) {
    const clean = username.replace(/^@/, '').trim();
    if (clean.length <= 2) return `@${clean}*`;
    return `@${clean.slice(0, 2)}***`;
  }
  if (email && email.includes('@') && !email.includes('@telegram.user')) {
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? `${name}*` : `${name.slice(0, 2)}***`;
    return `${maskedName}@${domain}`;
  }
  return 'Verified Trainer 🎮';
}

function formatGateway(gateway?: string): string {
  if (!gateway) return 'Instant Verified';
  const lower = gateway.toLowerCase();
  if (lower.includes('upi')) return 'UPI (Instant Auto-Match)';
  if (lower.includes('paypal')) return 'PayPal (Instant Auto-Match)';
  if (lower.includes('card')) return 'Card (Auto-Verified)';
  return 'Instant Checkout';
}

/**
 * Broadcasts an authentic, high-converting "Order Fulfilled / Vouch" message
 * to the official public Telegram proofs channel (@AetheriaStoreOfficial).
 */
export async function broadcastOrderProof(payload: OrderProofPayload): Promise<boolean> {
  const channelTarget = TELEGRAM_PROOF_CHANNEL?.trim();
  if (!channelTarget) {
    return false;
  }

  try {
    const plan = PLAN_MAP[payload.planType] || PLANS[0];
    const [stock1, stock2] = await Promise.all([
      getAvailableCount('1_month_1_device').catch(() => 0),
      getAvailableCount('1_month_2_device').catch(() => 0),
    ]);

    const formattedAmount =
      payload.amount && payload.currency
        ? payload.currency === 'USD'
          ? `$${(payload.amount / 100).toFixed(2)}`
          : `₹${(payload.amount / 100).toFixed(0)}`
        : `₹${(plan.price_inr / 100).toFixed(0)}`;

    const maskedUser = anonymizeIdentity(
      payload.customerEmail,
      payload.customerUsername
    );

    const gatewayBadge = formatGateway(payload.gateway);
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });

    const proofText =
      `🎉 <b>NEW ORDER FULFILLED!</b>\n\n` +
      `✅ <b>Status:</b> Key Dispatched & Activated\n` +
      `📦 <b>Plan:</b> ${plan.name} (${plan.duration})\n` +
      `👤 <b>Customer:</b> ${maskedUser}\n` +
      `💳 <b>Payment:</b> ${gatewayBadge} (${formattedAmount})\n` +
      `🕒 <b>Timestamp:</b> ${dateStr} UTC\n\n` +
      `📊 <b>Remaining Keys in Stock:</b>\n` +
      `• 📱 1 Device: <b>${stock1 > 0 ? `${stock1} keys` : 'Low Stock'}</b>\n` +
      `• 🔋 2 Devices: <b>${stock2 > 0 ? `${stock2} keys` : 'Low Stock'}</b>\n\n` +
      `👉 <b>Order your key instantly:</b> @${TELEGRAM_BOT_USERNAME}`;

    await sendTelegramMessage(channelTarget, proofText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚡ Buy Instant Key | Auto Delivery 🤖',
              url: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=channel_proof`,
            },
          ],
        ],
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to broadcast order proof to Telegram:', error);
    return false;
  }
}

/**
 * Broadcasts an automated, flashy "Restock Alert" announcement
 * to the official public Telegram channel (@AetheriaStoreOfficial)
 * whenever fresh keys are uploaded to the vault.
 */
export async function broadcastRestockAlert(insertedCount: number = 0): Promise<boolean> {
  const channelTarget = TELEGRAM_PROOF_CHANNEL?.trim();
  if (!channelTarget) {
    return false;
  }

  try {
    const botUsername = TELEGRAM_BOT_USERNAME || 'AetheriaStoreOfficialBot';

    const restockText =
      `⚡ <b>KEYS ARE BACK IN STOCK!</b>\n\n` +
      `📦 <b>Fresh 30-Day keys just loaded into the vault.</b>\n` +
      `Grab yours before this batch runs out! 🚀`;

    await sendTelegramMessage(channelTarget, restockText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Get Your Key Instantly',
              url: `https://t.me/${botUsername}?start=restock`,
            },
          ],
        ],
      },
    });

    console.log(`[proofs] Successfully broadcast restock alert (+${insertedCount}) to ${channelTarget}`);
    return true;
  } catch (err: any) {
    console.warn(`[proofs] Failed to broadcast restock alert to ${channelTarget}:`, err?.message || err);
    return false;
  }
}
