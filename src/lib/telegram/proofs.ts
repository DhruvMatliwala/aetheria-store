import { sendTelegramMessage } from '@/lib/telegram/bot';
import {
  TELEGRAM_PROOF_CHANNEL,
  TELEGRAM_BOT_USERNAME,
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
 * Automated order completion broadcast to the Telegram channel has been removed
 * to keep the channel clean. Customer vouches and screenshots are handled separately.
 */
export async function broadcastOrderProof(_payload: OrderProofPayload): Promise<boolean> {
  // Disabled as requested: no automatic message is sent to the channel on key purchases
  return false;
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
