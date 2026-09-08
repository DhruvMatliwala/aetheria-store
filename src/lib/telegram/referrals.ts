import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { sendTelegramMessage } from '@/lib/telegram/bot';
import { Order } from '@/types/order';
import { randomBytes } from 'crypto';

export interface ReferralStats {
  invitedCount: number;
  completedOrdersCount: number;
  rewardsEarned: number;
}

/**
 * Creates a unique single-use coupon in Firestore (coupons collection)
 * Worth ₹30 INR (3000 paise) or $0.50 USD (50 cents)
 */
export async function createReferralCoupon(referrerChatId: number): Promise<string> {
  const db = getAdminFirestore();
  const randomSuffix = randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  const code = `REF30_${randomSuffix}`;

  await db.collection('coupons').doc(code).set({
    code,
    discount_type: 'flat',
    discount_value_inr: 3000, // ₹30 in paise
    discount_value_usd: 50,   // $0.50 in cents
    times_used: 0,
    max_uses: 1,
    active: true,
    created_for_chat_id: referrerChatId,
    description: 'Referral Reward (₹30 / $0.50 OFF)',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return code;
}

/**
 * Validates whether a customer is eligible to receive a referral discount:
 * - Must not be referring themselves (chatId !== referrerChatId)
 * - Must be a first-time buyer (no prior paid orders in Firestore)
 */
export async function validateReferralEligibility(
  chatId: number,
  referrerChatId: number
): Promise<{ eligible: boolean; reason?: 'self_referral' | 'existing_customer' }> {
  if (chatId === referrerChatId) {
    return { eligible: false, reason: 'self_referral' };
  }

  const db = getAdminFirestore();

  // Check if this chat ID already has paid orders
  const existingOrdersSnap = await db
    .collection('orders')
    .where('telegram_chat_id', '==', chatId)
    .where('payment_status', '==', 'paid')
    .limit(1)
    .get();

  if (!existingOrdersSnap.empty) {
    return { eligible: false, reason: 'existing_customer' };
  }

  return { eligible: true };
}

/**
 * Fetch referral statistics for a given user
 */
export async function getReferralStats(chatId: number): Promise<ReferralStats> {
  const db = getAdminFirestore();

  const [referredOrdersSnap, rewardsSnap] = await Promise.all([
    db
      .collection('orders')
      .where('applied_referral_from', '==', chatId)
      .get(),
    db
      .collection('coupons')
      .where('created_for_chat_id', '==', chatId)
      .get(),
  ]);

  const uniqueUsers = new Set<string>();
  let completedOrdersCount = 0;

  referredOrdersSnap.docs.forEach((d) => {
    const data = d.data();
    if (data.telegram_chat_id) {
      uniqueUsers.add(String(data.telegram_chat_id));
    }
    if (data.payment_status === 'paid') {
      completedOrdersCount++;
    }
  });

  return {
    invitedCount: uniqueUsers.size,
    completedOrdersCount,
    rewardsEarned: rewardsSnap.size,
  };
}

/**
 * Processes the referral reward when an order is fulfilled.
 * Anti-Abuse:
 * - Ensures applied_referral_from is set
 * - Verifies not self-dealing (different UPI / PayPal than referrer's previous orders)
 * - Ensures reward is issued only once per order
 */
export async function processReferralReward(order: Order): Promise<boolean> {
  const referrerChatId = order.applied_referral_from;
  if (!referrerChatId || typeof referrerChatId !== 'number') {
    return false;
  }

  // Idempotency: don't reward twice
  if (order.referral_reward_processed) {
    return false;
  }

  const db = getAdminFirestore();
  const orderRef = db.collection('orders').doc(order.order_id);

  // Self-referral guard
  if (String(order.telegram_chat_id) === String(referrerChatId)) {
    console.warn(`[referrals] Blocked self-referral reward for order #${order.order_id}`);
    await orderRef.update({ referral_reward_processed: true });
    return false;
  }

  // Cross-check payment details against referrer's own history
  const referrerOrdersSnap = await db
    .collection('orders')
    .where('telegram_chat_id', '==', referrerChatId)
    .where('payment_status', '==', 'paid')
    .limit(10)
    .get();

  for (const doc of referrerOrdersSnap.docs) {
    const refData = doc.data();
    // Same UPI UTR
    if (order.utr_number && refData.utr_number && order.utr_number === refData.utr_number) {
      console.warn(`[referrals] Blocked reward: matching UTR detected for order #${order.order_id}`);
      await orderRef.update({ referral_reward_processed: true });
      return false;
    }
    // Same PayPal Tx ID
    if (order.paypal_tx_id && refData.paypal_tx_id && order.paypal_tx_id === refData.paypal_tx_id) {
      console.warn(`[referrals] Blocked reward: matching PayPal Tx ID detected for order #${order.order_id}`);
      await orderRef.update({ referral_reward_processed: true });
      return false;
    }
    // Same Customer Email (excluding generic telegram user emails)
    if (
      order.customer_email &&
      refData.customer_email &&
      !order.customer_email.includes('@telegram.user') &&
      order.customer_email.toLowerCase() === refData.customer_email.toLowerCase()
    ) {
      console.warn(`[referrals] Blocked reward: matching email detected for order #${order.order_id}`);
      await orderRef.update({ referral_reward_processed: true });
      return false;
    }
  }

  // Generate single-use reward coupon
  const couponCode = await createReferralCoupon(referrerChatId);

  // Mark order as processed
  await orderRef.update({
    referral_reward_processed: true,
    referral_reward_coupon: couponCode,
    updated_at: new Date(),
  });

  // Notify the referrer in Telegram
  const rewardMessage =
    `🎉 <b>REFERRAL REWARD EARNED!</b>\n\n` +
    `Your friend just purchased a PGSharp key!\n` +
    `Here is your exclusive <b>₹30 / $0.30 OFF</b> discount coupon for your next key purchase:\n\n` +
    `🎟️ Coupon Code:\n` +
    `<code>${couponCode}</code>\n` +
    `<i>(Tap code above to copy to clipboard)</i>\n\n` +
    `• <b>UPI Discount:</b> ₹30 OFF (₹130 ➔ ₹100 / ₹250 ➔ ₹220)\n` +
    `• <b>PayPal Discount:</b> $0.30 / $0.50 OFF ($1.79 ➔ $1.49 / $3.50 ➔ $3.00)\n` +
    `• Single-use coupon — simply enter it in chat when buying your next key!\n\n` +
    `Keep inviting friends to earn more coupons! 🚀`;

  try {
    await sendTelegramMessage(referrerChatId, rewardMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👥 View My Referral Stats', callback_data: 'cb_refer_earn' }],
          [{ text: '📱 Buy My Next Key', callback_data: 'cb_buy_1_month_1_device' }],
        ],
      },
    });
    console.log(`[referrals] Successfully rewarded referrer ${referrerChatId} with coupon ${couponCode}`);
    return true;
  } catch (err: any) {
    console.error(`[referrals] Failed to send reward DM to ${referrerChatId}:`, err?.message);
    return false;
  }
}

/**
 * Computes exact discounted prices (₹100 / $1.49 for 1 Device; ₹220 / $3.00 for 2 Devices)
 */
export function getDiscountedPricing(planId: string, hasDiscount: boolean) {
  const is2Device = planId.includes('2_device');
  if (hasDiscount) {
    return {
      priceInrPaise: is2Device ? 22000 : 10000,
      priceInrRupees: is2Device ? '220' : '100',
      priceUsdCents: is2Device ? 300 : 149,
      priceUsdDollars: is2Device ? '3.00' : '1.49',
      savingsInr: '30',
      savingsUsd: is2Device ? '0.50' : '0.30',
    };
  }
  return {
    priceInrPaise: is2Device ? 25000 : 13000,
    priceInrRupees: is2Device ? '250' : '130',
    priceUsdCents: is2Device ? 350 : 179,
    priceUsdDollars: is2Device ? '3.50' : '1.79',
    savingsInr: '0',
    savingsUsd: '0',
  };
}

export async function saveUserReferral(chatId: number, referrerChatId: number): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('telegram_users').doc(String(chatId)).set(
    {
      applied_referral_from: referrerChatId,
      referred_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function setUserCoupon(chatId: number, couponCode: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('telegram_users').doc(String(chatId)).set(
    {
      active_coupon: couponCode,
      coupon_applied_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserDiscountState(chatId: number): Promise<{
  hasDiscount: boolean;
  discountType: 'none' | 'referral' | 'coupon';
  referrerChatId?: number;
  couponCode?: string;
  discountLabel?: string;
}> {
  const db = getAdminFirestore();
  const userDoc = await db.collection('telegram_users').doc(String(chatId)).get();

  if (!userDoc.exists) {
    return { hasDiscount: false, discountType: 'none' };
  }

  const data = userDoc.data() || {};

  // Check active coupon
  if (data.active_coupon) {
    return {
      hasDiscount: true,
      discountType: 'coupon',
      couponCode: data.active_coupon,
      discountLabel: `🎟️ Coupon ${data.active_coupon} Applied (₹30 / $0.50 OFF)`,
    };
  }

  // Check referral eligibility
  if (data.applied_referral_from && typeof data.applied_referral_from === 'number') {
    const existingOrders = await db
      .collection('orders')
      .where('telegram_chat_id', '==', chatId)
      .where('payment_status', '==', 'paid')
      .limit(1)
      .get();

    if (existingOrders.empty) {
      return {
        hasDiscount: true,
        discountType: 'referral',
        referrerChatId: data.applied_referral_from,
        discountLabel: `🎁 Referral Discount Applied (₹30 / $0.50 OFF)`,
      };
    }
  }

  return { hasDiscount: false, discountType: 'none' };
}
