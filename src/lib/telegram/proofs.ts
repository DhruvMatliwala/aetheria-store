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
 * to the official public Telegram proofs channel (@pgsharpkeys_official).
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

    const prettyGateway = formatGateway(payload.gateway);
    const buyerDisplay = anonymizeIdentity(payload.customerEmail, payload.customerUsername);
    const shortOrderId = payload.orderId.replace(/^ord_/, '').slice(0, 8).toUpperCase();

    const proofText =
      `⚡ <b>NEW ORDER FULFILLED!</b>\n\n` +
      `📱 <b>Product:</b> PGSharp Standard Key (${plan.name})\n` +
      `💳 <b>Payment:</b> ${prettyGateway}\n` +
      `⚡ <b>Delivery:</b> Instant (~15s Auto-Dispatched)\n` +
      `👤 <b>Customer:</b> <code>${buyerDisplay}</code>\n` +
      `🆔 <b>Order:</b> <code>#${shortOrderId}</code>\n\n` +
      `📦 <b>Live Stock:</b>\n` +
      `• 1 Device : ${stock1 > 0 ? `${stock1} in stock` : '0 in stock'}\n` +
      `• 2 Devices : ${stock2 > 0 ? `${stock2} in stock` : '0 in stock'}\n\n` +
      `👉 <b>Order your key instantly:</b> @${TELEGRAM_BOT_USERNAME}`;

    await sendTelegramMessage(channelTarget, proofText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚡ Get Your Key Now | 24/7 Bot',
              url: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=channel_proof`,
            },
          ],
        ],
      },
    });

    console.log(`[proofs] Successfully broadcast order #${payload.orderId} to ${channelTarget}`);
    return true;
  } catch (err: any) {
    // Non-blocking: order fulfillment must never fail if channel post fails
    console.warn(`[proofs] Failed to post proof to ${channelTarget}:`, err?.message || err);
    return false;
  }
}

/**
 * Broadcasts an automated, flashy "Restock Alert" announcement
 * to the official public Telegram channel (@pgsharpkeys_official)
 * whenever fresh keys are uploaded to the vault.
 */
export async function broadcastRestockAlert(insertedCount: number = 0): Promise<boolean> {
  const channelTarget = TELEGRAM_PROOF_CHANNEL?.trim();
  if (!channelTarget) {
    return false;
  }

  try {
    const [stock1, stock2] = await Promise.all([
      getAvailableCount('1_month_1_device').catch(() => 0),
      getAvailableCount('1_month_2_device').catch(() => 0),
    ]);

    const botUsername = TELEGRAM_BOT_USERNAME || 'pgsharpkeystorebot';
    const countBadge = insertedCount > 0 ? ` (+${insertedCount} new slots added)` : '';

    const restockText =
      `🚨 <b>RESTOCK ALERT!</b>\n\n` +
      `📦 <b>Fresh batch of 1-Device & 2-Device PGSharp keys just loaded!</b>${countBadge}\n\n` +
      `📊 <b>Live Stock in Vault:</b>\n` +
      `• 📱 <b>1 Device (30 Days):</b> ${stock1 > 0 ? `${stock1} keys available` : 'Limited'}\n` +
      `• 🔋 <b>2 Devices (30 Days):</b> ${stock2 > 0 ? `${stock2} keys available` : 'Limited'}\n\n` +
      `⚡ <b>Fast Auto-Delivery via UPI & PayPal:</b>\n` +
      `• UPI (Instant Auto-Match): <b>₹180 / ₹350</b>\n` +
      `• PayPal (Direct): <b>$1.99 / $3.50</b>\n` +
      `<i>(First-time buyers get ₹30 / $0.50 OFF referral discount!)</i>\n\n` +
      `👉 <b>Order now before stock sells out:</b> @${botUsername}`;

    await sendTelegramMessage(channelTarget, restockText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚡ Order Key Now | 24/7 Auto Bot 🤖',
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
