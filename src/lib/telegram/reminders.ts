import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { sendTelegramMessage } from '@/lib/telegram/bot';
import { sendKeyExpiryReminderEmail } from '@/lib/email/resend';
import { Order } from '@/types/order';
import { PLAN_MAP, PLANS } from '@/lib/constants';
import { getUserDiscountState } from './referrals';

export interface ReminderRunResult {
  totalScanned: number;
  remindedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Checks for orders approaching key expiry (Day 28: 48h before 30-day expiry)
 * and dispatches friendly renewal prompts via Telegram DM and/or transactional Email.
 */
export async function checkAndSendExpiryReminders(): Promise<ReminderRunResult> {
  const db = getAdminFirestore();
  const nowMs = Date.now();
  const thirtyFiveDaysAgoMs = nowMs - 35 * 24 * 60 * 60 * 1000;

  const result: ReminderRunResult = {
    totalScanned: 0,
    remindedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Look for paid orders in Firestore
    const ordersSnap = await db
      .collection('orders')
      .where('payment_status', '==', 'paid')
      .get();

    result.totalScanned = ordersSnap.size;

    for (const doc of ordersSnap.docs) {
      const order = doc.data() as Order;
      const orderRef = doc.ref;

      // Skip already reminded
      if (order.expiry_reminder_sent) {
        result.skippedCount++;
        continue;
      }

      // Must have had a delivered key
      if (!order.delivered_key) {
        result.skippedCount++;
        continue;
      }

      const createdAtMs =
        order.created_at?.toDate?.()?.getTime?.() ||
        (typeof order.created_at === 'number' ? order.created_at : 0);

      if (!createdAtMs || createdAtMs < thirtyFiveDaysAgoMs) {
        // Ancient orders (> 35 days old) - mark sent so we don't scan repeatedly
        if (createdAtMs && createdAtMs < thirtyFiveDaysAgoMs) {
          await orderRef.update({ expiry_reminder_sent: true });
        }
        result.skippedCount++;
        continue;
      }

      const ageInDays = (nowMs - createdAtMs) / (1000 * 60 * 60 * 24);

      // Sweet Spot: Day 27.5 to Day 31.0 (~48 hours before 30 days are up)
      if (ageInDays < 27.5) {
        result.skippedCount++;
        continue;
      }

      // Check if user already bought another fresh key in the last 7 days
      if (order.telegram_chat_id) {
        const recentOrdersSnap = await db
          .collection('orders')
          .where('telegram_chat_id', '==', order.telegram_chat_id)
          .where('payment_status', '==', 'paid')
          .limit(5)
          .get();

        const hasNewerActiveOrder = recentOrdersSnap.docs.some((d) => {
          if (d.id === doc.id) return false;
          const otherTime = d.data().created_at?.toDate?.()?.getTime?.() || 0;
          return otherTime > createdAtMs && (nowMs - otherTime) < 25 * 24 * 60 * 60 * 1000;
        });

        if (hasNewerActiveOrder) {
          await orderRef.update({
            expiry_reminder_sent: true,
            expiry_reminder_skipped_reason: 'already_purchased_new_key',
          });
          result.skippedCount++;
          continue;
        }
      }

      const plan = PLAN_MAP[order.plan_type] || PLANS[0];
      const hoursRemaining = Math.max(12, Math.round((30 - ageInDays) * 24));
      const timeBadge = hoursRemaining <= 24 ? '🚨 <b>Expires in ~24 hours!</b>' : '⏳ <b>Expires in ~48 hours!</b>';

      let sent = false;

      // ── Dispatch Telegram DM Reminder ─────────────────────────────────────
      if (order.telegram_chat_id) {
        const chatId = Number(order.telegram_chat_id);
        const discountState = await getUserDiscountState(chatId);

        const discountLine = discountState.hasDiscount
          ? `\n🎉 <i>You have a discount coupon active! Save ₹30 / $0.50 on your next key.</i>\n`
          : '';

        const reminderMessage =
          `⏳ <b>EXPIRY ALERT: YOUR PGSHARP KEY IS EXPIRING!</b>\n\n` +
          `Hey Trainer! Your <b>${plan.name} (${plan.duration})</b> key is nearing the end of its 30-day period.\n` +
          `${timeBadge}\n${discountLine}\n` +
          `⚠️ <b>Don't lose your spoofing joystick & 100% IV scanner mid-event!</b>\n` +
          `Get your fresh 30-day key now in 10 seconds:\n\n` +
          `• 📱 <b>1 Device:</b> ₹160 / $2.00 <i>(or ₹130 / $1.70 with coupon)</i>\n` +
          `• 🔋 <b>2 Devices:</b> ₹300 / $3.60 <i>(or ₹270 / $3.00 with coupon)</i>\n\n` +
          `Tap below to get your fresh key instantly:`;

        try {
          await sendTelegramMessage(chatId, reminderMessage, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Buy 1 Device Key', callback_data: 'cb_buy_1_month_1_device' }],
                [{ text: '🔋 Buy 2 Devices Key', callback_data: 'cb_buy_1_month_2_device' }],
                [{ text: '👥 Refer & Earn (Get ₹30 OFF)', callback_data: 'cb_refer_earn' }],
              ],
            },
          });
          sent = true;
          console.log(`[reminders] Telegram expiry reminder sent to chat ${chatId} for order #${order.order_id}`);
        } catch (tgErr: any) {
          result.errors.push(`Telegram send error for order #${order.order_id}: ${tgErr?.message}`);
        }
      }

      // ── Dispatch Email Reminder for Web Buyers ─────────────────────────────
      if (
        order.customer_email &&
        !order.customer_email.includes('@telegram.user') &&
        order.customer_email.includes('@')
      ) {
        try {
          await sendKeyExpiryReminderEmail({
            to: order.customer_email,
            orderId: order.order_id,
            planType: order.plan_type,
          });
          sent = true;
          console.log(`[reminders] Email expiry reminder sent to ${order.customer_email} for order #${order.order_id}`);
        } catch (emailErr: any) {
          result.errors.push(`Email send error for order #${order.order_id}: ${emailErr?.message}`);
        }
      }

      if (sent) {
        await orderRef.update({
          expiry_reminder_sent: true,
          expiry_reminder_sent_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: new Date(),
        });
        result.remindedCount++;
      } else {
        result.skippedCount++;
      }
    }
  } catch (err: any) {
    console.error('[reminders] Check error:', err);
    result.errors.push(err?.message || 'Unknown reminder check error');
  }

  return result;
}
