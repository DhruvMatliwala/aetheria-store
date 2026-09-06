import {
  TelegramUpdate,
  sendTelegramMessage,
  sendTelegramPhoto,
  editTelegramMessage,
  deleteTelegramMessage,
  answerTelegramCallbackQuery,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from './bot';
import {
  PLANS,
  PLAN_MAP,
  OFFICIAL_GPAY_URI,
  UPI_VPA,
  UPI_PAYEE_NAME,
  PAYPAL_ME_URL,
  PAYPAL_EMAIL,
  TELEGRAM_URL,
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_CHANNEL_URL,
  DISCORD_URL,
} from '@/lib/constants';
import { Order } from '@/types/order';
import { getAvailableCount } from '@/lib/firestore/keys';
import { createOrder, getOrderById } from '@/lib/firestore/orders';
import { getBankCredit, claimBankCredit } from '@/lib/firestore/bankCredits';
import { getPaypalCredit, claimPaypalCredit } from '@/lib/firestore/paypalCredits';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendAdminOrderAlert, sendPaymentVerificationAlert } from '@/lib/notifications/discordAdmin';
import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { randomUUID } from 'crypto';
import { broadcastOrderProof } from './proofs';
import {
  getReferralStats,
  validateReferralEligibility,
  saveUserReferral,
  getUserDiscountState,
  getDiscountedPricing,
  setUserCoupon,
  processReferralReward,
} from './referrals';
import { validateAndApplyCoupon, incrementCouponUsage } from '@/lib/firestore/coupons';
import {
  getPokemonEvents,
  formatEventsOverview,
  formatRaidsMessage,
  formatCommDaysMessage,
} from '@/lib/pokemon/events';

const STORE_URL =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://aetheria-store.vercel.app';

/**
 * Persistent Bottom Keyboard (Always visible below chat input box)
 * Styled like high-converting VIP digital store bots
 */
export function getPersistentKeyboard(): ReplyKeyboardMarkup {
  return {
    keyboard: [
      [
        { text: '🛒 Buy Standard Key' },
        { text: '👤 My Keys' },
      ],
      [
        { text: '📦 Live Stock' },
        { text: '📅 Live Events' },
      ],
      [
        { text: '📢 Proofs Channel' },
        { text: '👥 Refer & Earn' },
      ],
      [
        { text: '💬 Support' },
        { text: '🌐 Open Web Store', web_app: { url: STORE_URL } },
      ],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/**
 * Interactive navigation bar for Pokemon GO live events & raid calendar
 */
export function getEventsInlineKeyboard(activeTab: 'overview' | 'raids' | 'commday' = 'overview'): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: activeTab === 'overview' ? '• 📅 Overview •' : '📅 Overview', callback_data: 'cb_events_overview' },
        { text: activeTab === 'raids' ? '• ⚔️ Raids •' : '⚔️ Raids', callback_data: 'cb_events_raids' },
        { text: activeTab === 'commday' ? '• 🌟 Comm Day •' : '🌟 Comm Day', callback_data: 'cb_events_commday' },
      ],
      [
        { text: '⚡ Buy Key for Raids / Events', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '🔄 Refresh Schedule', callback_data: 'cb_events_refresh' },
        { text: '📢 Proofs Channel', url: TELEGRAM_CHANNEL_URL },
      ],
    ],
  };
}

function getPlanPickerContent(discountLabel?: string) {
  const text = discountLabel
    ? `${discountLabel}\n\n👇 <b>Select a plan:</b>`
    : `👇 <b>Select a plan:</b>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '📱 1 Device (30 Days)', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '🔋 2 Devices (30 Days)', callback_data: 'cb_buy_1_month_2_device' },
      ],
      [
        { text: '📅 Pokémon GO Live Events', callback_data: 'cb_events_overview' },
      ],
      [
        { text: '📢 Live Proofs Channel', url: TELEGRAM_CHANNEL_URL },
      ],
      [
        { text: '🌐 Web Store (Cart)', web_app: { url: STORE_URL } },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Welcome Message Card
 */
function getWelcomeMessage(firstName: string = 'Trainer'): string {
  return `👋 Welcome <b>${firstName}</b> to <b>PGSharp Key Store</b>!`;
}

/**
 * Handle incoming Telegram Update
 */
export async function handleTelegramUpdate(update: TelegramUpdate) {
  try {
    // ── 1. Handle Callback Queries (Inline Button Taps) ───────────────────────
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // ── 2. Handle Text Messages ──────────────────────────────────────────────
    if (update.message && update.message.text) {
      await handleTextMessage(update.message);
      return;
    }
  } catch (err) {
    console.error('[TelegramHandler] Unhandled error:', err);
  }
}

/**
 * Handle Inline Button Clicks
 */
async function handleCallbackQuery(query: NonNullable<TelegramUpdate['callback_query']>) {
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  const data = query.data || '';
  const firstName = query.from.first_name || 'Trainer';

  if (!chatId) return;

  // Dismiss loading spinner on button
  await answerTelegramCallbackQuery(query.id);

  // Main menu navigation
  if (data === 'menu_main') {
    const { text, keyboard } = getPlanPickerContent();
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    }
    return;
  }

  // My Keys / My Profile
  if (data === 'cb_my_keys') {
    await handleMyKeys(chatId, query.from.username);
    return;
  }

  // Refer & Earn Dashboard
  if (data === 'cb_refer_earn') {
    await handleReferAndEarn(chatId);
    return;
  }

  // Stock Checker
  if (data === 'cb_stock') {
    const stock1 = await getAvailableCount('1_month_1_device');
    const stock2 = await getAvailableCount('1_month_2_device');

    const stockText =
      `📦 <b>Live Stock</b>\n\n` +
      `• <b>1 Device :</b> ${stock1 > 0 ? `${stock1} in stock` : '0 in stock'}\n` +
      `• <b>2 Devices :</b> ${stock2 > 0 ? `${stock2} in stock` : '0 in stock'}`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '📱 Buy 1 Device', callback_data: 'cb_buy_1_month_1_device' },
          { text: '🔋 Buy 2 Devices', callback_data: 'cb_buy_1_month_2_device' },
        ],
        [
          { text: '⬅️ Back', callback_data: 'menu_main' },
        ],
      ],
    };

    if (messageId) {
      await editTelegramMessage(chatId, messageId, stockText, { reply_markup: keyboard });
    } else {
      await sendTelegramMessage(chatId, stockText, { reply_markup: keyboard });
    }
    return;
  }

  // ── Pokemon GO Live Events & Raids Navigation ─────────────────────────────
  if (data.startsWith('cb_events_')) {
    const subAction = data.replace('cb_events_', '');
    const forceRefresh = subAction === 'refresh';
    const events = await getPokemonEvents(forceRefresh);

    let text = '';
    let tab: 'overview' | 'raids' | 'commday' = 'overview';

    if (subAction === 'raids') {
      text = formatRaidsMessage(events);
      tab = 'raids';
    } else if (subAction === 'commday') {
      text = formatCommDaysMessage(events);
      tab = 'commday';
    } else {
      text = formatEventsOverview(events);
      tab = 'overview';
    }

    const keyboard = getEventsInlineKeyboard(tab);

    if (subAction === 'refresh') {
      await answerTelegramCallbackQuery(query.id, '✅ Schedule refreshed with live events!');
    }

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (!editRes.ok) {
        await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    }
    return;
  }

  // ── Step 1: Buy Plan Selected -> Show Payment Method Choices ─────────────
  if (data.startsWith('cb_buy_')) {
    const planId = data.replace('cb_buy_', '');
    const plan = PLAN_MAP[planId] || PLANS[0];
    const available = await getAvailableCount(plan.id);

    if (available <= 0) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Sorry!</b> ${plan.name} is temporarily sold out.`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }]],
          },
        }
      );
      return;
    }

    const discountState = await getUserDiscountState(chatId);
    const pricing = getDiscountedPricing(plan.id, discountState.hasDiscount);
    const amountInr = pricing.priceInrRupees;
    const amountUsd = pricing.priceUsdDollars;

    const discountHeader = discountState.hasDiscount
      ? `${discountState.discountLabel}\n\n`
      : '';

    const paymentChoiceText =
      `${discountHeader}📱 <b>${plan.name} (${plan.duration})</b>\n\n` +
      `Choose payment method:`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: `⚡ Pay via UPI (₹${amountInr})`, callback_data: `cb_pay_upi_${plan.id}` },
        ],
        [
          { text: `💳 Pay via PayPal ($${amountUsd})`, callback_data: `cb_pay_paypal_${plan.id}` },
        ],
        [
          { text: '🌐 Web Store (Cart)', web_app: { url: STORE_URL } },
        ],
        [
          { text: '⬅️ Back', callback_data: 'menu_main' },
        ],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, paymentChoiceText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, paymentChoiceText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, paymentChoiceText, { reply_markup: keyboard });
    }
    return;
  }

  // ── Step 2A: User Selected UPI Payment ────────────────────────────────────
  if (data.startsWith('cb_pay_upi_')) {
    const planId = data.replace('cb_pay_upi_', '');
    const plan = PLAN_MAP[planId] || PLANS[0];
    const discountState = await getUserDiscountState(chatId);
    const pricing = getDiscountedPricing(plan.id, discountState.hasDiscount);
    const amountInr = pricing.priceInrRupees;

    // Create pending order
    const orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const db = getAdminFirestore();

    const orderDoc: Record<string, any> = {
      order_id: orderId,
      customer_email: query.from.username
        ? `${query.from.username.toLowerCase()}@telegram.user`
        : `tg_${query.from.id}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: pricing.priceInrPaise,
      currency: 'INR',
      payment_gateway: 'upi_direct',
      payment_status: 'pending',
      delivered_key: null,
      gateway_order_id: `upi_${orderId}`,
      telegram_chat_id: chatId,
      telegram_username: query.from.username || '',
      telegram_user_id: query.from.id,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (discountState.hasDiscount && discountState.discountType === 'referral' && discountState.referrerChatId) {
      orderDoc.applied_referral_from = discountState.referrerChatId;
    }
    if (discountState.hasDiscount && discountState.discountType === 'coupon' && discountState.couponCode) {
      orderDoc.coupon_code = discountState.couponCode;
    }

    await db.collection('orders').doc(orderId).set(orderDoc);

    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      OFFICIAL_GPAY_URI
    )}`;

    const discountMsg = discountState.hasDiscount ? `\n🎉 <i>Discount applied: Saved ₹${pricing.savingsInr}!</i>` : '';

    const upiText =
      `⚡ <b>Pay ₹${amountInr} via UPI</b>${discountMsg}\n\n` +
      `UPI ID (tap to copy):\n` +
      `<code>${UPI_VPA}</code>\n\n` +
      `Pay exact <b>₹${amountInr}</b> in GPay, PhonePe, or Paytm.\n` +
      `Your key will be sent here automatically in seconds!`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '💬 Support', url: TELEGRAM_URL },
          { text: '⬅️ Back', callback_data: `cb_buy_${plan.id}` },
        ],
      ],
    };

    if (messageId) {
      await deleteTelegramMessage(chatId, messageId);
    }

    await sendTelegramPhoto(chatId, upiQrUrl, {
      caption: upiText,
      reply_markup: keyboard,
    });
    return;
  }

  // ── Step 2B: User Selected PayPal Payment ─────────────────────────────────
  if (data.startsWith('cb_pay_paypal_')) {
    const planId = data.replace('cb_pay_paypal_', '');
    const plan = PLAN_MAP[planId] || PLANS[0];
    const discountState = await getUserDiscountState(chatId);
    const pricing = getDiscountedPricing(plan.id, discountState.hasDiscount);
    const amountUsd = pricing.priceUsdDollars;

    // Create pending order
    const orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const db = getAdminFirestore();

    const orderDoc: Record<string, any> = {
      order_id: orderId,
      customer_email: query.from.username
        ? `${query.from.username.toLowerCase()}@telegram.user`
        : `tg_${query.from.id}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: pricing.priceUsdCents,
      currency: 'USD',
      payment_gateway: 'paypal_direct',
      payment_status: 'pending',
      delivered_key: null,
      gateway_order_id: `paypal_${orderId}`,
      telegram_chat_id: chatId,
      telegram_username: query.from.username || '',
      telegram_user_id: query.from.id,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (discountState.hasDiscount && discountState.discountType === 'referral' && discountState.referrerChatId) {
      orderDoc.applied_referral_from = discountState.referrerChatId;
    }
    if (discountState.hasDiscount && discountState.discountType === 'coupon' && discountState.couponCode) {
      orderDoc.coupon_code = discountState.couponCode;
    }

    await db.collection('orders').doc(orderId).set(orderDoc);

    const paypalUrl = `${PAYPAL_ME_URL}/${amountUsd}USD`;
    const discountMsg = discountState.hasDiscount ? `\n🎉 <i>Discount applied: Saved $${pricing.savingsUsd}!</i>` : '';

    const paypalText =
      `💳 <b>Pay $${amountUsd} USD via PayPal</b>${discountMsg}\n\n` +
      `Send <b>$${amountUsd} USD</b> to:\n` +
      `<code>${PAYPAL_EMAIL}</code>\n\n` +
      `After paying, reply here with your <b>PayPal Transaction ID</b> or <b>PayPal Email</b> to get your key automatically!`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: `💳 Open PayPal ($${amountUsd})`, url: paypalUrl },
        ],
        [
          { text: '💬 Support', url: TELEGRAM_URL },
          { text: '⬅️ Back', callback_data: `cb_buy_${plan.id}` },
        ],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, paypalText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, paypalText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, paypalText, { reply_markup: keyboard });
    }
    return;
  }

  // FAQ & Guide
  if (data === 'cb_faq') {
    const faqText =
      `🔑 <b>Key Activation:</b>\n` +
      `Open PGSharp ➔ Settings ⚙️ ➔ Activate ➔ Paste key.\n\n` +
      `• <b>1 Device:</b> Use on 1 phone\n` +
      `• <b>2 Devices:</b> Use on 2 phones simultaneously`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '💬 Support', url: TELEGRAM_URL }],
        [{ text: '⬅️ Back', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, faqText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, faqText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, faqText, { reply_markup: keyboard });
    }
    return;
  }

  // Live Support
  if (data === 'cb_support') {
    const supportText =
      `💬 <b>Support</b>\n\n` +
      `Need help or have questions?\n` +
      `Direct message: @sleekfx3`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '💬 Message @sleekfx3', url: TELEGRAM_URL }],
        [{ text: '⬅️ Back', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, supportText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, supportText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, supportText, { reply_markup: keyboard });
    }
    return;
  }
}

/**
 * Handle My Keys / My Profile
 */
async function handleMyKeys(chatId: number, username?: string) {
  const db = getAdminFirestore();

  try {
    const snap = await db
      .collection('orders')
      .where('telegram_chat_id', '==', chatId)
      .where('payment_status', '==', 'paid')
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();

    if (snap.empty) {
      await sendTelegramMessage(
        chatId,
        `👤 <b>My Keys</b>\n\nYou have no active keys yet.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }],
            ],
          },
        }
      );
      return;
    }

    const nowMs = Date.now();
    let keysList = '';
    snap.docs.forEach((doc, idx) => {
      const order = doc.data();
      const plan = PLAN_MAP[order.plan_type] || PLANS[0];
      const key = order.delivered_key || 'Processing';

      const createdAtMs =
        order.created_at?.toDate?.()?.getTime?.() ||
        (typeof order.created_at === 'number' ? order.created_at : nowMs);
      const expiresAtMs = createdAtMs + 30 * 24 * 60 * 60 * 1000;
      const daysLeft = Math.ceil((expiresAtMs - nowMs) / (1000 * 60 * 60 * 24));

      let statusBadge = '';
      if (daysLeft <= 0) {
        statusBadge = '🔴 <i>Expired (30 days completed)</i>';
      } else if (daysLeft <= 3) {
        statusBadge = `⚠️ <b>Expiring soon: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left!</b>`;
      } else {
        statusBadge = `🟢 <i>Active (${daysLeft} days remaining)</i>`;
      }

      keysList += `\n${idx + 1}. <b>${plan.name} (${plan.duration}):</b>\n<code>${key}</code>\n${statusBadge}\n`;
    });

    const profileText =
      `🔑 <b>Your Purchased Keys:</b>\n` +
      `${keysList}\n` +
      `<i>(Tap key code to copy)</i>`;

    await sendTelegramMessage(chatId, profileText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Buy Another Key', callback_data: 'cb_buy_1_month_1_device' }],
          [{ text: '💬 Support', url: TELEGRAM_URL }],
        ],
      },
    });
  } catch (err) {
    console.error('[Telegram] My Keys error:', err);
    await sendTelegramMessage(
      chatId,
      `👤 <b>My Keys</b>\n\nTap below to purchase a key:`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }]],
        },
      }
    );
  }
}

/**
 * Handle Refer & Earn Dashboard
 */
async function handleReferAndEarn(chatId: number) {
  const stats = await getReferralStats(chatId);
  const botUsername = TELEGRAM_BOT_USERNAME || 'pgsharpkeystorebot';
  const refLink = `https://t.me/${botUsername}?start=ref_${chatId}`;
  const shareText = encodeURIComponent(
    `⚡ Get your PGSharp Standard Key with ₹30 / $0.50 OFF instant discount here: ${refLink}`
  );

  const message =
    `👥 <b>Refer & Earn</b>\n\n` +
    `Invite fellow trainers and save together!\n` +
    `• 🎁 <b>Your Friend Gets:</b> ₹30 / $0.50 OFF their first key\n` +
    `• 🎟️ <b>You Get:</b> ₹30 / $0.50 OFF coupon for your next key purchase\n\n` +
    `🔗 <b>Your Personal Referral Link:</b>\n` +
    `<code>${refLink}</code>\n` +
    `<i>(Tap link above to copy)</i>\n\n` +
    `📊 <b>Your Referral Stats:</b>\n` +
    `• Friends Clicked: <b>${stats.invitedCount}</b>\n` +
    `• Completed Orders: <b>${stats.completedOrdersCount}</b>\n` +
    `• Coupons Earned: <b>${stats.rewardsEarned}</b>\n\n` +
    `<i>Coupons are delivered automatically via DM once your friend's payment is confirmed!</i>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: '📤 Share Link to Telegram',
          url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`,
        },
      ],
      [
        { text: '🛒 Buy A Key', callback_data: 'cb_buy_1_month_1_device' },
        { text: '⬅️ Back to Menu', callback_data: 'menu_main' },
      ],
    ],
  };

  await sendTelegramMessage(chatId, message, { reply_markup: keyboard });
}

/**
 * Handle Inbound Text Messages (Persistent Keyboard buttons, Commands, UTR submissions)
 */
async function handleTextMessage(message: NonNullable<TelegramUpdate['message']>) {
  const chatId = message.chat.id;
  const rawText = (message.text || '').trim();
  const firstName = message.from?.first_name || 'Trainer';
  const username = message.from?.username;

  // ── 1. Persistent Keyboard Actions ────────────────────────────────────────
  if (rawText === '🛒 Buy Standard Key' || rawText.startsWith('/buy')) {
    const { text, keyboard } = getPlanPickerContent();
    await sendTelegramMessage(chatId, text, {
      reply_markup: keyboard,
    });
    return;
  }

  if (rawText === '👤 My Keys' || rawText === '👤 My profile' || rawText.startsWith('/keys') || rawText.startsWith('/profile')) {
    await handleMyKeys(chatId, username);
    return;
  }

  if (rawText === '📦 Live Stock' || rawText.startsWith('/stock')) {
    const stock1 = await getAvailableCount('1_month_1_device');
    const stock2 = await getAvailableCount('1_month_2_device');
    await sendTelegramMessage(
      chatId,
      `📦 <b>Live Stock</b>\n\n` +
        `• <b>1 Device :</b> ${stock1 > 0 ? `${stock1} in stock` : '0 in stock'}\n` +
        `• <b>2 Devices :</b> ${stock2 > 0 ? `${stock2} in stock` : '0 in stock'}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 Buy 1 Device', callback_data: 'cb_buy_1_month_1_device' },
              { text: '🔋 Buy 2 Devices', callback_data: 'cb_buy_1_month_2_device' },
            ],
          ],
        },
      }
    );
    return;
  }

  if (rawText === '💬 Support' || rawText.startsWith('/help') || rawText.startsWith('/support')) {
    await sendTelegramMessage(
      chatId,
      `💬 <b>Support</b>\n\n` +
        `Need help or have questions?\n` +
        `Direct contact: @sleekfx3`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Message @sleekfx3', url: TELEGRAM_URL }],
          ],
        },
      }
    );
    return;
  }

  if (rawText === '👥 Refer & Earn' || rawText.startsWith('/refer')) {
    await handleReferAndEarn(chatId);
    return;
  }

  if (
    rawText === '📢 Proofs Channel' ||
    rawText === '📢 Live Proofs' ||
    rawText.startsWith('/channel') ||
    rawText.startsWith('/proofs')
  ) {
    await sendTelegramMessage(
      chatId,
      `📢 <b>Official Proofs & Vouches Channel</b>\n\n` +
        `Every completed order is verified and posted live with transaction timestamps, masked customer tags, and live inventory count!\n\n` +
        `👉 Join our official channel to see 100% genuine live order proofs and stock alerts:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👉 Join Proofs Channel 📢', url: TELEGRAM_CHANNEL_URL }],
            [{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }],
          ],
        },
      }
    );
    return;
  }

  // ── Pokemon GO Live Events & Raid Calendar ────────────────────────────────
  if (
    rawText === '📅 Live Events' ||
    rawText === '📅 Events' ||
    rawText.startsWith('/events') ||
    rawText.startsWith('/raids') ||
    rawText.startsWith('/calendar') ||
    rawText.startsWith('/spotlight') ||
    rawText.startsWith('/community')
  ) {
    const isRaidsOnly = rawText.startsWith('/raids');
    const isCommDayOnly = rawText.startsWith('/spotlight') || rawText.startsWith('/community');
    const events = await getPokemonEvents();

    let text = formatEventsOverview(events);
    let tab: 'overview' | 'raids' | 'commday' = 'overview';

    if (isRaidsOnly) {
      text = formatRaidsMessage(events);
      tab = 'raids';
    } else if (isCommDayOnly) {
      text = formatCommDaysMessage(events);
      tab = 'commday';
    }

    const keyboard = getEventsInlineKeyboard(tab);
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // ── 2. Commands ───────────────────────────────────────────────────────────
  if (rawText.startsWith('/start')) {
    const startParam = rawText.replace('/start', '').trim();
    let discountBanner: string | undefined;

    if (startParam.startsWith('ref_')) {
      const referrerId = parseInt(startParam.replace('ref_', ''), 10);
      if (!isNaN(referrerId)) {
        const eligibility = await validateReferralEligibility(chatId, referrerId);
        if (eligibility.eligible) {
          await saveUserReferral(chatId, referrerId);
          discountBanner =
            `🎁 <b>SPECIAL REFERRAL DISCOUNT APPLIED!</b>\n` +
            `Your friend invited you to PGSharp Store. You get an exclusive discount on your first key:\n` +
            `• 📱 <b>1 Device:</b> <s>₹180 / $1.99</s> ➔ <b>₹150 / $1.50</b>\n` +
            `• 🔋 <b>2 Devices:</b> <s>₹350 / $3.50</s> ➔ <b>₹320 / $3.00</b>`;
        } else if (eligibility.reason === 'self_referral') {
          await sendTelegramMessage(
            chatId,
            `⚠️ <b>Self-referrals are not allowed!</b>\nShare your link with other trainers in <b>👥 Refer & Earn</b> to earn ₹30 / $0.50 discount coupons on your next key purchase.`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `👋 <b>Welcome back!</b>\nReferral discounts are reserved for new trainers' first purchase. Use <b>👥 Refer & Earn</b> below to invite friends and earn discount coupons on your next key purchase!`
          );
        }
      }
    }

    if (!discountBanner) {
      const userDiscount = await getUserDiscountState(chatId);
      if (userDiscount.hasDiscount) {
        discountBanner = userDiscount.discountLabel;
      }
    }

    // Send short welcome and attach persistent keyboard
    await sendTelegramMessage(chatId, getWelcomeMessage(firstName), {
      reply_markup: getPersistentKeyboard(),
    });
    // Send clean plan picker
    const { text, keyboard } = getPlanPickerContent(discountBanner);
    await sendTelegramMessage(chatId, text, {
      reply_markup: keyboard,
    });
    return;
  }

  // ── 3. Detect 12-digit UPI Reference Number / UTR ──────────────────────────
  const utrMatch = rawText.match(/\b(\d{12})\b/);
  if (utrMatch) {
    const cleanUtr = utrMatch[1];
    await processTelegramUtrSubmission(chatId, cleanUtr, username);
    return;
  }

  // ── 4. Detect PayPal Email Address ─────────────────────────────────────────
  const emailMatch = rawText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (emailMatch) {
    const cleanEmail = emailMatch[1].toLowerCase();
    await processTelegramPaypalSubmission(chatId, cleanEmail, true, username);
    return;
  }

  // ── 5. Detect PayPal Transaction ID (alphanumeric 13-22 characters) ─────────
  const paypalTxMatch = rawText.match(/\b([A-Za-z0-9]{13,22})\b/);
  if (paypalTxMatch && /[a-zA-Z]/.test(paypalTxMatch[1]) && /[0-9]/.test(paypalTxMatch[1])) {
    const cleanTx = paypalTxMatch[1].toUpperCase();
    await processTelegramPaypalSubmission(chatId, cleanTx, false, username);
    return;
  }

  // ── 6. Detect Coupon / Promo Code (e.g. REF30_ABCDEF, VIPDHRUV, /coupon ...) ──
  const couponMatch = rawText.match(/^(?:\/coupon\s+)?(REF30_[A-Za-z0-9]+|VIPDHRUV|DISCORDMEMBER|[A-Za-z0-9_]{5,15})$/i);
  if (couponMatch) {
    const candidateCode = couponMatch[1].toUpperCase();
    const couponValidation = await validateAndApplyCoupon(candidateCode, PLANS[0], 'INR');
    if (couponValidation.valid) {
      await setUserCoupon(chatId, candidateCode);
      const discountText =
        `🎟️ <b>Promo Code "${candidateCode}" Applied!</b>\n\n` +
        `• 📱 <b>1 Device:</b> <s>₹180 / $1.99</s> ➔ <b>₹150 / $1.50</b>\n` +
        `• 🔋 <b>2 Devices:</b> <s>₹350 / $3.50</s> ➔ <b>₹320 / $3.00</b>\n\n` +
        `Choose your plan below:`;
      const { keyboard } = getPlanPickerContent();
      await sendTelegramMessage(chatId, discountText, { reply_markup: keyboard });
      return;
    }
  }

  // ── 4. Default Friendly Fallback with Persistent Keyboard ──────────────────
  await sendTelegramMessage(
    chatId,
    `👋 Use the buttons below to browse keys, view stock, or contact support.`,
    {
      reply_markup: getPersistentKeyboard(),
    }
  );
}

/**
 * Process a 12-digit UTR sent by the customer in chat
 */
async function processTelegramUtrSubmission(
  chatId: number,
  cleanUtr: string,
  username?: string
) {
  const db = getAdminFirestore();

  // Find recent pending or verifying order for this chat ID
  const ordersSnap = await db
    .collection('orders')
    .where('telegram_chat_id', '==', chatId)
    .where('payment_status', 'in', ['pending', 'verifying'])
    .limit(1)
    .get();

  let targetOrder: Record<string, any> | null = null;
  let orderId: string;

  if (!ordersSnap.empty) {
    targetOrder = ordersSnap.docs[0].data();
    orderId = ordersSnap.docs[0].id;
  } else {
    // If no pending order exists, create one for the 1-device plan by default
    const plan = PLANS[0];
    orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    targetOrder = {
      order_id: orderId,
      customer_email: username ? `${username.toLowerCase()}@telegram.user` : `tg_${chatId}@telegram.user`,
      plan_type: plan.id,
      amount: plan.price_inr,
      currency: 'INR',
      payment_gateway: 'upi_direct',
      payment_status: 'pending',
      delivered_key: null,
      gateway_order_id: `upi_${orderId}`,
      telegram_chat_id: chatId,
      telegram_username: username || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('orders').doc(orderId).set(targetOrder);
  }

  // Check duplicate UTR
  const dupSnap = await db
    .collection('orders')
    .where('utr_number', '==', cleanUtr)
    .limit(1)
    .get();

  if (!dupSnap.empty && dupSnap.docs[0].id !== orderId) {
    const dupData = dupSnap.docs[0].data();
    if (dupData.payment_status === 'paid' || dupData.payment_status === 'verifying') {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>UTR Already Used</b>\n\n` +
          `The UTR number <code>${cleanUtr}</code> has already been submitted for another order.\n` +
          `If you believe this is an error, please contact @sleekfx3.`
      );
      return;
    }
  }

  // Check automated Bank SMS Bridge credit match
  const bankCredit = await getBankCredit(cleanUtr);

  if (bankCredit && bankCredit.status === 'unclaimed') {
    // ── Instant Automated Match! ───────────────────────────────────────────
    try {
      const allocation = await allocateKeySlot(orderId, `TG_AUTO_BANK_${cleanUtr}`);

      await db.collection('orders').doc(orderId).update({
        payment_status: 'paid',
        utr_number: cleanUtr,
        updated_at: new Date(),
      });

      await claimBankCredit(cleanUtr, orderId);

      const plan = PLAN_MAP[targetOrder.plan_type] || PLANS[0];

      const deliveryMessage =
        `🎉 <b>PAYMENT VERIFIED! YOUR KEY HAS BEEN DISPATCHED:</b>\n\n` +
        `🔑 <b>License Key:</b>\n` +
        `<code>${allocation.decryptedKey}</code>\n` +
        `<i>(Tap key above to copy to clipboard)</i>\n\n` +
        `📱 <b>Plan:</b> ${plan.name} (${plan.duration})\n` +
        `⚡ <b>Device Slots:</b> ${plan.device_slots} Android Device(s)\n` +
        `🆔 <b>Order ID:</b> <code>${orderId}</code>\n\n` +
        `<b>How to Activate:</b>\n` +
        `1. Open PGSharp on your Android device.\n` +
        `2. Tap the floating Star icon ⭐ -> Go to <b>Settings ⚙️</b>.\n` +
        `3. Tap <b>Activate</b>, paste your key, and tap OK!\n\n` +
        `Need a new key next month or assistance? We're always here at @sleekfx3!`;

      await sendTelegramMessage(chatId, deliveryMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👤 View All My Keys', callback_data: 'cb_my_keys' }],
            [{ text: '💬 Support & Questions', url: TELEGRAM_URL }],
            [{ text: '🌐 Visit Web Store', web_app: { url: STORE_URL } }],
          ],
        },
      });

      // Send admin alert
      sendAdminOrderAlert({
        orderId,
        customerEmail: targetOrder.customer_email,
        planType: targetOrder.plan_type,
        amount: targetOrder.amount,
        currency: 'INR',
        gateway: 'upi_direct',
        transactionId: cleanUtr,
        deliveredKey: allocation.decryptedKey,
      }).catch((err) => console.error('[Telegram] Admin alert error:', err));

      // Broadcast proof to official channel
      broadcastOrderProof({
        orderId,
        planType: targetOrder.plan_type,
        gateway: 'upi_direct',
        amount: targetOrder.amount,
        currency: 'INR',
        customerUsername: username,
      }).catch((err) => console.error('[Telegram] Proof broadcast error:', err));

      // Process referral reward if order was referred
      processReferralReward({
        ...targetOrder,
        order_id: orderId,
        utr_number: cleanUtr,
        payment_status: 'paid',
      } as Order).catch((err) => console.error('[Telegram] Referral reward error:', err));

      return;
    } catch (allocErr) {
      console.error('[Telegram] Key allocation error:', allocErr);
    }
  }

  // ── Bank credit not yet received or awaiting admin review ─────────────────
  await db.collection('orders').doc(orderId).update({
    payment_status: 'verifying',
    utr_number: cleanUtr,
    updated_at: new Date(),
  });

  await sendTelegramMessage(
    chatId,
    `⏳ <b>UTR Received:</b> <code>${cleanUtr}</code>\n\n` +
      `We are currently verifying your payment with the bank.\n` +
      `Once confirmed (typically within 1–5 minutes), your <b>PGSharp Standard Key</b> will be delivered automatically right here in this chat!\n\n` +
      `<i>Order ID: <code>${orderId}</code></i>`
  );

  // Send high-priority verification alert to Discord Admin
  sendPaymentVerificationAlert({
    orderId,
    customerEmail: targetOrder.customer_email,
    planType: targetOrder.plan_type,
    amount: targetOrder.amount,
    currency: 'INR',
    gateway: 'upi_direct',
    transactionId: cleanUtr,
    customerPhone: username ? `@${username}` : `Telegram ID: ${chatId}`,
  }).catch((err) => console.error('[Telegram] Verification alert error:', err));
}

/**
 * Process a PayPal Transaction ID or Payer Email sent by the customer in chat
 */
async function processTelegramPaypalSubmission(
  chatId: number,
  cleanInput: string,
  isEmail: boolean,
  username?: string
) {
  const db = getAdminFirestore();

  // Find recent pending or verifying order for this chat ID
  const ordersSnap = await db
    .collection('orders')
    .where('telegram_chat_id', '==', chatId)
    .where('payment_status', 'in', ['pending', 'verifying'])
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();

  let targetOrder: Record<string, any> | null = null;
  let orderId: string;

  if (!ordersSnap.empty) {
    targetOrder = ordersSnap.docs[0].data();
    orderId = ordersSnap.docs[0].id;
  } else {
    // If no pending order exists, create one for the 1-device plan by default
    const plan = PLANS[0];
    orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    targetOrder = {
      order_id: orderId,
      customer_email: isEmail
        ? cleanInput.toLowerCase()
        : username
        ? `${username.toLowerCase()}@telegram.user`
        : `tg_${chatId}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: plan.price_usd,
      currency: 'USD',
      payment_gateway: 'paypal_direct',
      payment_status: 'pending',
      delivered_key: null,
      gateway_order_id: `paypal_${orderId}`,
      telegram_chat_id: chatId,
      telegram_username: username || '',
      telegram_user_id: chatId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('orders').doc(orderId).set(targetOrder);
  }

  // Check duplicate Tx ID usage across other orders
  if (!isEmail) {
    const dupSnap = await db
      .collection('orders')
      .where('paypal_tx_id', '==', cleanInput)
      .limit(1)
      .get();

    if (!dupSnap.empty && dupSnap.docs[0].id !== orderId) {
      const dupData = dupSnap.docs[0].data();
      if (dupData.payment_status === 'paid' || dupData.payment_status === 'verifying') {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>PayPal Transaction ID Already Used</b>\n\n` +
            `The Transaction ID <code>${cleanInput}</code> has already been submitted for another order.\n` +
            `If you believe this is an error, please contact @sleekfx3.`
        );
        return;
      }
    }
  }

  // Check automated PayPal IPN credit match
  let matchedCredit: { txn_id: string } | null = null;

  if (!isEmail) {
    const credit = await getPaypalCredit(cleanInput);
    if (credit && credit.status === 'unclaimed') {
      matchedCredit = credit;
    }
  } else {
    // Search verified_paypal_credits by payer_email
    const creditSnap = await db
      .collection('verified_paypal_credits')
      .where('payer_email', '==', cleanInput.toLowerCase())
      .where('status', '==', 'unclaimed')
      .limit(1)
      .get();
    if (!creditSnap.empty) {
      matchedCredit = creditSnap.docs[0].data() as { txn_id: string };
    }
  }

  if (matchedCredit) {
    // ── Instant Automated Match! ───────────────────────────────────────────
    try {
      const allocation = await allocateKeySlot(orderId, `TG_AUTO_PAYPAL_${matchedCredit.txn_id}`);

      const updatePayload: Record<string, any> = {
        payment_status: 'paid',
        paypal_tx_id: matchedCredit.txn_id,
        payment_gateway: 'paypal_direct',
        updated_at: new Date(),
      };
      if (isEmail) {
        updatePayload.customer_email = cleanInput.toLowerCase();
      }

      await db.collection('orders').doc(orderId).update(updatePayload);
      await claimPaypalCredit(matchedCredit.txn_id, orderId);

      const plan = PLAN_MAP[targetOrder.plan_type] || PLANS[0];

      const deliveryMessage =
        `🎉 <b>PAYMENT VERIFIED! YOUR KEY HAS BEEN DISPATCHED:</b>\n\n` +
        `🔑 <b>License Key:</b>\n` +
        `<code>${allocation.decryptedKey}</code>\n` +
        `<i>(Tap key above to copy to clipboard)</i>\n\n` +
        `📱 <b>Plan:</b> ${plan.name} (${plan.duration})\n` +
        `⚡ <b>Device Slots:</b> ${plan.device_slots} Android Device(s)\n` +
        `🆔 <b>Order ID:</b> <code>${orderId}</code>\n\n` +
        `<b>How to Activate:</b>\n` +
        `1. Open PGSharp on your Android device.\n` +
        `2. Tap the floating Star icon ⭐ -> Go to <b>Settings ⚙️</b>.\n` +
        `3. Tap <b>Activate</b>, paste your key, and tap OK!\n\n` +
        `Need a new key next month or assistance? We're always here at @sleekfx3!`;

      await sendTelegramMessage(chatId, deliveryMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👤 View All My Keys', callback_data: 'cb_my_keys' }],
            [{ text: '💬 Support & Questions', url: TELEGRAM_URL }],
            [{ text: '🌐 Visit Web Store', web_app: { url: STORE_URL } }],
          ],
        },
      });

      sendAdminOrderAlert({
        orderId,
        customerEmail: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
        planType: targetOrder.plan_type,
        amount: targetOrder.amount,
        currency: 'USD',
        gateway: 'paypal_direct',
        transactionId: matchedCredit.txn_id,
        deliveredKey: allocation.decryptedKey,
      }).catch((err) => console.error('[Telegram] Admin alert error:', err));

      // Broadcast proof to official channel
      broadcastOrderProof({
        orderId,
        planType: targetOrder.plan_type,
        gateway: 'paypal_direct',
        amount: targetOrder.amount,
        currency: 'USD',
        customerEmail: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
        customerUsername: username,
      }).catch((err) => console.error('[Telegram] Proof broadcast error:', err));

      // Process referral reward if order was referred
      processReferralReward({
        ...targetOrder,
        order_id: orderId,
        customer_email: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
        paypal_tx_id: matchedCredit.txn_id,
        payment_status: 'paid',
      } as Order).catch((err) => console.error('[Telegram] Referral reward error:', err));

      return;
    } catch (allocErr) {
      console.error('[Telegram] Key allocation error:', allocErr);
    }
  }

  // ── PayPal credit not yet received or awaiting IPN/admin review ───────────
  const updateData: Record<string, any> = {
    payment_status: 'verifying',
    payment_gateway: 'paypal_direct',
    updated_at: new Date(),
  };
  if (isEmail) {
    updateData.customer_email = cleanInput.toLowerCase();
  } else {
    updateData.paypal_tx_id = cleanInput;
  }

  await db.collection('orders').doc(orderId).update(updateData);

  await sendTelegramMessage(
    chatId,
    `⏳ <b>PayPal Proof Received:</b> <code>${cleanInput}</code>\n\n` +
      `We are confirming your payment with PayPal.\n` +
      `Once confirmed (typically within 1–5 minutes), your <b>PGSharp Standard Key</b> will be delivered automatically right here in this chat!\n\n` +
      `<i>Order ID: <code>${orderId}</code></i>`
  );

  // Send high-priority verification alert to Discord Admin with 1-click Approve
  sendPaymentVerificationAlert({
    orderId,
    customerEmail: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
    planType: targetOrder.plan_type,
    amount: targetOrder.amount,
    currency: 'USD',
    gateway: 'paypal_direct',
    transactionId: cleanInput,
    customerPhone: username ? `@${username}` : `Telegram ID: ${chatId}`,
  }).catch((err) => console.error('[Telegram] Verification alert error:', err));
}
