import {
  TelegramUpdate,
  sendTelegramMessage,
  sendTelegramPhoto,
  editTelegramMessage,
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
  TELEGRAM_URL,
  DISCORD_URL,
} from '@/lib/constants';
import { getAvailableCount } from '@/lib/firestore/keys';
import { createOrder, getOrderById } from '@/lib/firestore/orders';
import { getBankCredit, claimBankCredit } from '@/lib/firestore/bankCredits';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendAdminOrderAlert, sendPaymentVerificationAlert } from '@/lib/notifications/discordAdmin';
import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { randomUUID } from 'crypto';

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
        { text: '🌐 Open Web Store', web_app: { url: STORE_URL } },
      ],
      [
        { text: '💬 Support' },
      ],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/**
 * Plan Picker Message (Styled exactly like the VIP membership menu)
 */
function getPlanPickerContent() {
  const text =
    `⚡ <b>PGSharp Standard Edition</b>\n\n` +
    `🎬 <b>Premium Features Included:</b>\n` +
    `1️⃣ <b>Auto-Walk, Virtual Joystick & Teleport</b>\n` +
    `2️⃣ <b>100% IV Checker & Quick Catch</b>\n` +
    `3️⃣ <b>Enhanced Throw (100% Curve & Excellent)</b>\n` +
    `4️⃣ <b>Live Coordinates Radar & 100 IV Feeds</b>\n` +
    `5️⃣ <b>Spawn Booster & Auto-Transfer</b>\n` +
    `🛡️ <i>...and 100% replacement warranty & anti-ban protection!</i>\n\n` +
    `⭐ <b>Best verified PGSharp key service in the whole market!</b>\n\n` +
    `👇 <b>Choose Your Plan Below:</b>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '📱 1 Device (30 Days) — ₹180', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '🔋 2 Devices (30 Days) [BEST VALUE] — ₹350', callback_data: 'cb_buy_1_month_2_device' },
      ],
      [
        { text: '🌐 Pay on Web Store (Cart)', web_app: { url: STORE_URL } },
      ],
      [
        { text: '⬅️ Back', callback_data: 'menu_main' },
        { text: '🏠 Home', callback_data: 'menu_main' },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Welcome Message Card
 */
function getWelcomeMessage(firstName: string = 'Trainer'): string {
  return (
    `⚡ <b>Welcome to PGSharp Key Store!</b>\n\n` +
    `Hello <b>${firstName}</b>! Get instant, verified <b>PGSharp Standard Edition</b> keys delivered directly into this chat 24/7.\n\n` +
    `🛡️ <b>Why Buy From Us?</b>\n` +
    `• <b>100% Anti-Ban Verified</b> — Legitimate, fresh keys\n` +
    `• <b>Instant Auto-Delivery</b> — Key sent to your chat immediately\n` +
    `• <b>All Payment Methods</b> — UPI (GPay/PhonePe/Paytm), Cards & PayPal\n` +
    `• <b>Full Standard Features</b> — Teleport, 100% IV, Quick Catch, Auto-Walk\n\n` +
    `👇 <b>Tap an option on your keyboard below or select a plan:</b>`
  );
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
      await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
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

  // Stock Checker
  if (data === 'cb_stock') {
    const stock1 = await getAvailableCount('1_month_1_device');
    const stock2 = await getAvailableCount('1_month_2_device');

    const stockText =
      `📦 <b>Live Real-Time PGSharp Inventory</b>\n\n` +
      `📱 <b>1 Device Plan (30 Days):</b>\n` +
      `${stock1 > 0 ? `🟢 <b>${stock1} Slots Available</b>` : '🔴 <b>Out of Stock</b>'} — ₹180 / $1.99\n\n` +
      `🔋 <b>2 Devices Plan (30 Days):</b>\n` +
      `${stock2 > 0 ? `🟢 <b>${stock2} Full Keys Available</b>` : '🔴 <b>Out of Stock</b>'} — ₹350 / $3.50\n\n` +
      `⚡ <i>All keys come with 100% replacement warranty and instant dispatch.</i>`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '📱 Buy 1 Device (₹180)', callback_data: 'cb_buy_1_month_1_device' },
          { text: '🔋 Buy 2 Devices (₹350)', callback_data: 'cb_buy_1_month_2_device' },
        ],
        [
          { text: '⬅️ Back', callback_data: 'menu_main' },
          { text: '🏠 Home', callback_data: 'menu_main' },
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

  // ── Step 1: Buy Plan Selected -> Show Payment Method Choices ─────────────
  if (data.startsWith('cb_buy_')) {
    const planId = data.replace('cb_buy_', '');
    const plan = PLAN_MAP[planId] || PLANS[0];
    const available = await getAvailableCount(plan.id);

    if (available <= 0) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Sorry!</b> ${plan.name} is temporarily sold out.\n\nPlease check back soon or contact support.`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }]],
          },
        }
      );
      return;
    }

    const amountInr = (plan.price_inr / 100).toFixed(0);
    const amountUsd = (plan.price_usd / 100).toFixed(2);

    const paymentChoiceText =
      `🛒 <b>Selected Plan: ${plan.name} (${plan.duration})</b>\n\n` +
      `⚡ <b>Device Slots:</b> ${plan.device_slots} Android Device(s)\n` +
      `💰 <b>Price (INR):</b> ₹${amountInr}\n` +
      `💵 <b>Price (USD):</b> $${amountUsd}\n` +
      `🛡️ <b>Warranty:</b> 100% replacement guarantee & anti-ban protection\n\n` +
      `👇 <b>Choose your payment method below:</b>`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '⚡ Pay via UPI (GPay/PhonePe/Paytm)', callback_data: `cb_pay_upi_${plan.id}` },
        ],
        [
          { text: '💳 Pay via PayPal / Card ($' + amountUsd + ')', callback_data: `cb_pay_paypal_${plan.id}` },
        ],
        [
          { text: '🌐 Open Web Store (Mini App)', web_app: { url: STORE_URL } },
        ],
        [
          { text: '⬅️ Back to Plans', callback_data: 'menu_main' },
        ],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, paymentChoiceText, { reply_markup: keyboard });
      if (!editRes.ok) {
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
    const amountInr = (plan.price_inr / 100).toFixed(0);

    // Create pending order
    const orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const db = getAdminFirestore();

    const orderDoc = {
      order_id: orderId,
      customer_email: query.from.username
        ? `${query.from.username.toLowerCase()}@telegram.user`
        : `tg_${query.from.id}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: plan.price_inr,
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

    await db.collection('orders').doc(orderId).set(orderDoc);

    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      OFFICIAL_GPAY_URI
    )}`;

    const upiText =
      `⚡ <b>UPI Payment — ${plan.name} (${plan.duration})</b>\n\n` +
      `💰 <b>Exact Amount:</b> <b>₹${amountInr}</b>\n` +
      `💳 <b>UPI ID (Tap to Copy):</b>\n` +
      `<code>${UPI_VPA}</code>\n\n` +
      `🆔 <b>Order ID:</b> <code>${orderId}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📝 <b>How it works (Zero-UTR Instant Key):</b>\n` +
      `1. Tap the UPI ID above to copy it (or scan QR code).\n` +
      `2. Pay exact <b>₹${amountInr}</b> in GPay, PhonePe, Paytm, or BHIM.\n` +
      `3. ⚡ <b>Done!</b> Your key will be sent right here in this chat automatically within seconds!\n\n` +
      `<i>(💡 Note: No UTR needed! If your bank SMS is delayed more than 1 minute, you can optionally reply with your 12-digit UTR as a backup.)</i>`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🌐 Open Web Store (Mini App)', web_app: { url: STORE_URL } },
        ],
        [
          { text: '💬 Chat with Support', url: TELEGRAM_URL },
        ],
        [
          { text: '⬅️ Change Payment Method', callback_data: `cb_buy_${plan.id}` },
        ],
      ],
    };

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
    const amountUsd = (plan.price_usd / 100).toFixed(2);

    // Create pending order
    const orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const db = getAdminFirestore();

    const orderDoc = {
      order_id: orderId,
      customer_email: query.from.username
        ? `${query.from.username.toLowerCase()}@telegram.user`
        : `tg_${query.from.id}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: plan.price_usd,
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

    await db.collection('orders').doc(orderId).set(orderDoc);

    const paypalUrl = `${PAYPAL_ME_URL}/${amountUsd}USD`;

    const paypalText =
      `💳 <b>PayPal Payment — ${plan.name} (${plan.duration})</b>\n\n` +
      `💵 <b>Exact Amount:</b> <b>$${amountUsd} USD</b>\n` +
      `🆔 <b>Order ID:</b> <code>${orderId}</code>\n\n` +
      `🔗 <b>Direct Payment Link:</b>\n` +
      `<a href="${paypalUrl}">${paypalUrl}</a>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📝 <b>How to get your key:</b>\n` +
      `1. Tap the PayPal link above.\n` +
      `2. Send <b>$${amountUsd} USD</b> via Friends & Family or Goods.\n` +
      `3. Reply right here with your <b>PayPal Transaction ID or Sender Email</b>.\n` +
      `4. Your key will be dispatched immediately!`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '💳 Open PayPal ($' + amountUsd + ')', url: paypalUrl },
        ],
        [
          { text: '💬 Chat with Support', url: TELEGRAM_URL },
        ],
        [
          { text: '⬅️ Change Payment Method', callback_data: `cb_buy_${plan.id}` },
        ],
      ],
    };

    if (messageId) {
      await editTelegramMessage(chatId, messageId, paypalText, { reply_markup: keyboard });
    } else {
      await sendTelegramMessage(chatId, paypalText, { reply_markup: keyboard });
    }
    return;
  }

  // FAQ & Guide
  if (data === 'cb_faq') {
    const faqText =
      `🛡️ <b>PGSharp Setup & Safe Spoofing Guide</b>\n\n` +
      `1️⃣ <b>What is a Standard Key?</b>\n` +
      `A Standard Key activates all premium PGSharp features: Auto-Walk, Teleport, 100% IV Quick Catch, Enhanced Throw, Spawn Booster, and Gym Feeds.\n\n` +
      `2️⃣ <b>How do I activate the key?</b>\n` +
      `Open PGSharp -> Tap the floating Star icon ⭐ -> Go to <b>Settings ⚙️</b> -> Tap <b>Activate</b> -> Paste your key.\n\n` +
      `3️⃣ <b>How does 1-Device vs 2-Device slot work?</b>\n` +
      `• <b>1 Device Slot:</b> Activated on 1 Android phone at a time.\n` +
      `• <b>2 Devices Plan:</b> Dedicated key for 2 Android devices simultaneously.\n\n` +
      `4️⃣ <b>Safe Spoofing Rules (Cooldown):</b>\n` +
      `Always respect the 2-hour cooldown timer when teleporting between distant locations before spinning or catching.\n\n` +
      `💬 Need further help? Contact our direct support below.`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '💬 Chat with Support', url: TELEGRAM_URL }],
        [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      await editTelegramMessage(chatId, messageId, faqText, { reply_markup: keyboard });
    } else {
      await sendTelegramMessage(chatId, faqText, { reply_markup: keyboard });
    }
    return;
  }

  // Live Support
  if (data === 'cb_support') {
    const supportText =
      `💬 <b>Direct Support & Verification</b>\n\n` +
      `Need help with key activation, have questions, or prefer custom payment methods (Crypto, Gift Cards)?\n\n` +
      `• <b>Telegram:</b> @sleekfx3\n` +
      `• <b>Discord:</b> <a href="${DISCORD_URL}">Official Discord Support</a>\n` +
      `• <b>Response Time:</b> Usually within 5–15 minutes\n\n` +
      `Tap below to message directly:`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '💬 Open Chat with @sleekfx3', url: TELEGRAM_URL }],
        [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      await editTelegramMessage(chatId, messageId, supportText, { reply_markup: keyboard });
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
      const emptyText =
        `👤 <b>My Account & Keys</b>\n\n` +
        `🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
        `👤 <b>Username:</b> ${username ? `@${username}` : 'Trainer'}\n` +
        `📦 <b>Active Keys:</b> 0\n\n` +
        `<i>You have not purchased any keys yet.</i>\n\n` +
        `Tap <b>🛒 Buy Standard Key</b> below to get your instant key!`;

      await sendTelegramMessage(chatId, emptyText, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }],
            [{ text: '📦 Check Live Stock', callback_data: 'cb_stock' }],
          ],
        },
      });
      return;
    }

    let keysList = '';
    snap.docs.forEach((doc, idx) => {
      const order = doc.data();
      const plan = PLAN_MAP[order.plan_type] || PLANS[0];
      const key = order.delivered_key || 'Processing';
      keysList += `\n${idx + 1}️⃣ <b>${plan.name} (${plan.duration}):</b>\n<code>${key}</code>\n<i>Order: ${order.order_id}</i>\n`;
    });

    const profileText =
      `👤 <b>My Account & Keys</b>\n\n` +
      `🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
      `👤 <b>Username:</b> ${username ? `@${username}` : 'Trainer'}\n` +
      `📦 <b>Total Purchased Keys:</b> ${snap.size}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔑 <b>Your License Keys:</b>\n` +
      `${keysList}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 <i>Tap any key code above to copy to clipboard.</i>\n\n` +
      `<b>How to activate:</b> Open PGSharp -> Star ⭐ -> Settings ⚙️ -> Activate.`;

    await sendTelegramMessage(chatId, profileText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Renew / Buy Another Key', callback_data: 'cb_buy_1_month_1_device' }],
          [{ text: '💬 Support', url: TELEGRAM_URL }],
        ],
      },
    });
  } catch (err) {
    console.error('[Telegram] My Keys error:', err);
    await sendTelegramMessage(
      chatId,
      `👤 <b>My Account</b>\n\n🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n\nTap below to buy a key:`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }]],
        },
      }
    );
  }
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
      `📦 <b>Current Live Stock:</b>\n\n` +
        `• 📱 <b>1 Device Plan:</b> <b>${stock1}</b> slots available (₹180 / $1.99)\n` +
        `• 🔋 <b>2 Devices Plan:</b> <b>${stock2}</b> keys available (₹350 / $3.50)\n\n` +
        `⚡ <i>Instant auto-delivery 24/7!</i>`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 Buy 1 Device (₹180)', callback_data: 'cb_buy_1_month_1_device' },
              { text: '🔋 Buy 2 Devices (₹350)', callback_data: 'cb_buy_1_month_2_device' },
            ],
            [{ text: '🌐 Open Web Store', web_app: { url: STORE_URL } }],
          ],
        },
      }
    );
    return;
  }

  if (rawText === '💬 Support' || rawText.startsWith('/help') || rawText.startsWith('/support')) {
    await sendTelegramMessage(
      chatId,
      `💬 <b>Direct Support & Verification</b>\n\n` +
        `Need help with key activation, have questions, or need custom payment?\n\n` +
        `• <b>Telegram:</b> @sleekfx3\n` +
        `• <b>Discord:</b> <a href="${DISCORD_URL}">Official Discord Support</a>\n` +
        `• <b>Response Time:</b> Usually within 5–15 minutes\n\n` +
        `Tap below to message directly:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Chat with @sleekfx3', url: TELEGRAM_URL }],
            [{ text: '🌐 Visit Web Store', web_app: { url: STORE_URL } }],
          ],
        },
      }
    );
    return;
  }

  // ── 2. Commands ───────────────────────────────────────────────────────────
  if (rawText.startsWith('/start')) {
    // Send welcome message and attach the persistent bottom keyboard
    await sendTelegramMessage(chatId, getWelcomeMessage(firstName), {
      reply_markup: getPersistentKeyboard(),
    });
    // Immediately show the plan picker card (like in the screenshot)
    const { text, keyboard } = getPlanPickerContent();
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

  // ── 4. Default Friendly Fallback with Persistent Keyboard ──────────────────
  await sendTelegramMessage(
    chatId,
    `👋 Hello <b>${firstName}</b>! To purchase a PGSharp key, view your keys, or check stock, use the menu buttons below.\n\n` +
      `<i>If you recently sent a UPI payment, reply with your 12-digit UTR number.</i>`,
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
        `Need assistance or renewal? We're always here at @sleekfx3!`;

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
