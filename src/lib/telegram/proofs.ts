import { sendTelegramMessage } from '@/lib/telegram/bot';
import {
  TELEGRAM_PROOF_CHANNEL,
  TELEGRAM_BOT_USERNAME,
  PLAN_MAP,
  PLANS,
} from '@/lib/constants';

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
    const isPhone = /^\+?[0-9\s-]{7,}$/.test(clean);
    if (!isPhone) {
      if (clean.length <= 2) return `@${clean}*`;
      return `@${clean.slice(0, 2)}***`;
    }
  }
  if (email && email.includes('@') && !email.includes('@telegram.user')) {
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? `${name}*` : `${name.slice(0, 2)}***`;
    return `${maskedName}@${domain}`;
  }
  return 'Verified Trainer 🎮';
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
    const planDesc = plan.device_slots === 2 ? '30-Day PGSharp Key (2 Devices)' : '30-Day PGSharp Key';

    const maskedUser = anonymizeIdentity(
      payload.customerEmail,
      payload.customerUsername
    );

    const proofText =
      `✅ <b>ORDER COMPLETED</b>\n\n` +
      `📦 <b>${planDesc}</b> dispatched to <b>${maskedUser}</b>\n` +
      `🛡️ Key verified and activated successfully.`;

    await sendTelegramMessage(channelTarget, proofText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚡ Order via Bot',
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
