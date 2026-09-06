import {
  TelegramUpdate,
  sendTelegramMessage,
  sendTelegramPhoto,
  editTelegramMessage,
  answerTelegramCallbackQuery,
  InlineKeyboardMarkup,
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

const STORE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app';

/**
 * Main Menu Keyboard Markup
 */
function getMainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🛒 Buy 1 Device (₹180 / $1.99)', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '🔥 Buy 2 Devices (₹350 / $3.50)', callback_data: 'cb_buy_1_month_2_device' },
      ],
      [
        { text: '📦 Live Stock Checker', callback_data: 'cb_stock' },
        { text: '🌐 Open Web Store', web_app: { url: STORE_URL } },
      ],
      [
        { text: '🛡️ Anti-Ban & Setup Guide', callback_data: 'cb_faq' },
        { text: '💬 Live Support', callback_data: 'cb_support' },
      ],
    ],
  };
}

/**
 * Format the welcome card
 */
function getWelcomeMessage(firstName: string = 'Trainer'): string {
  return (
    `⚡ <b>Welcome to PGSharp Official Key Dispatch!</b>\n\n` +
    `Hello <b>${firstName}</b>! Get instant, verified <b>PGSharp Standard Edition</b> activation keys delivered directly into this chat 24/7.\n\n` +
    `🛡️ <b>Why Buy From Us?</b>\n` +
    `• <b>100% Anti-Ban Guarantee</b> — Fresh, legitimate keys\n` +
    `• <b>Instant Auto-Delivery</b> — No waiting, key delivered in chat\n` +
    `• <b>All Payment Methods</b> — UPI (GPay/PhonePe/Paytm), Cards & PayPal\n` +
    `• <b>Full Features</b> — Auto-walk, Teleport, 100% IV, Quick Catch\n\n` +
    `👇 <b>Select an option below to get started:</b>`
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
    await sendTelegramMessage(chatId, getWelcomeMessage(firstName), {
      reply_markup: getMainMenuKeyboard(),
    });
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
      `📱📱 <b>2 Devices Plan (30 Days):</b>\n` +
      `${stock2 > 0 ? `🟢 <b>${stock2} Full Keys Available</b>` : '🔴 <b>Out of Stock</b>'} — ₹350 / $3.50\n\n` +
      `⚡ <i>All keys come with 100% replacement warranty and instant dispatch.</i>`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🛒 Buy 1 Device', callback_data: 'cb_buy_1_month_1_device' },
          { text: '🔥 Buy 2 Devices', callback_data: 'cb_buy_1_month_2_device' },
        ],
        [{ text: '⬅️ Back to Main Menu', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      await editTelegramMessage(chatId, messageId, stockText, { reply_markup: keyboard });
    } else {
      await sendTelegramMessage(chatId, stockText, { reply_markup: keyboard });
    }
    return;
  }

  // Buy Plan Selected
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

    // Create a pending order in Firestore
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

    const amountInr = (plan.price_inr / 100).toFixed(0);
    const amountUsd = (plan.price_usd / 100).toFixed(2);
    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      OFFICIAL_GPAY_URI
    )}`;

    const paymentText =
      `🛒 <b>Order Summary: ${plan.name} (${plan.duration})</b>\n\n` +
      `⚡ <b>Slots:</b> ${plan.device_slots} Android Device(s)\n` +
      `💰 <b>Price (INR):</b> ₹${amountInr}\n` +
      `💵 <b>Price (USD):</b> $${amountUsd}\n` +
      `🆔 <b>Order ID:</b> <code>${orderId}</code>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 <b>Payment Option 1: Direct UPI (India - 0% Fee)</b>\n` +
      `• UPI ID: <code>${UPI_VPA}</code> <i>(tap to copy)</i>\n` +
      `• Payee Name: <b>${UPI_PAYEE_NAME}</b>\n` +
      `• Apps: Google Pay, PhonePe, Paytm, BHIM, Cred\n\n` +
      `💳 <b>Payment Option 2: International (PayPal / Card)</b>\n` +
      `• PayPal.Me: <a href="${PAYPAL_ME_URL}/${amountUsd}USD">${PAYPAL_ME_URL}/${amountUsd}USD</a>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📝 <b>HOW TO GET YOUR KEY INSTANTLY:</b>\n` +
      `1. Pay <b>₹${amountInr}</b> using UPI or <b>$${amountUsd}</b> via PayPal.\n` +
      `2. After paying, <b>send your 12-digit UPI Reference Number / UTR</b> right here in this chat (e.g. <code>423456789012</code>).\n` +
      `3. Our automated system will verify and dispatch your key immediately!`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '⚡ Pay via UPI App (GPay/PhonePe)', url: OFFICIAL_GPAY_URI },
        ],
        [
          { text: '💳 Pay via PayPal ($' + amountUsd + ')', url: `${PAYPAL_ME_URL}/${amountUsd}USD` },
        ],
        [
          { text: '🌐 Pay on Web Store (Cart Checkout)', web_app: { url: STORE_URL } },
        ],
        [{ text: '⬅️ Cancel / Back to Menu', callback_data: 'menu_main' }],
      ],
    };

    // Send QR Code photo with payment details
    await sendTelegramPhoto(chatId, upiQrUrl, {
      caption: paymentText,
      reply_markup: keyboard,
    });
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
 * Handle Inbound Text Messages (Commands, UTR submissions)
 */
async function handleTextMessage(message: NonNullable<TelegramUpdate['message']>) {
  const chatId = message.chat.id;
  const rawText = (message.text || '').trim();
  const firstName = message.from?.first_name || 'Trainer';

  // ── Commands ─────────────────────────────────────────────────────────────
  if (rawText.startsWith('/start')) {
    await sendTelegramMessage(chatId, getWelcomeMessage(firstName), {
      reply_markup: getMainMenuKeyboard(),
    });
    return;
  }

  if (rawText.startsWith('/stock')) {
    const stock1 = await getAvailableCount('1_month_1_device');
    const stock2 = await getAvailableCount('1_month_2_device');
    await sendTelegramMessage(
      chatId,
      `📦 <b>Current Live Stock:</b>\n\n` +
        `• 1 Device: <b>${stock1}</b> slots available (₹180)\n` +
        `• 2 Devices: <b>${stock2}</b> keys available (₹350)\n\n` +
        `Type /buy to order immediately!`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛒 Buy 1 Device', callback_data: 'cb_buy_1_month_1_device' },
              { text: '🔥 Buy 2 Devices', callback_data: 'cb_buy_1_month_2_device' },
            ],
          ],
        },
      }
    );
    return;
  }

  if (rawText.startsWith('/buy')) {
    await sendTelegramMessage(chatId, `👇 <b>Choose your desired PGSharp Standard plan:</b>`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Buy 1 Device (₹180 / $1.99)', callback_data: 'cb_buy_1_month_1_device' }],
          [{ text: '🔥 Buy 2 Devices (₹350 / $3.50)', callback_data: 'cb_buy_1_month_2_device' }],
          [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
        ],
      },
    });
    return;
  }

  if (rawText.startsWith('/help') || rawText.startsWith('/support')) {
    await sendTelegramMessage(
      chatId,
      `💬 <b>Need assistance?</b>\nDirect support is available on Telegram: @sleekfx3`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Chat with @sleekfx3', url: TELEGRAM_URL }],
            [{ text: '⬅️ Main Menu', callback_data: 'menu_main' }],
          ],
        },
      }
    );
    return;
  }

  // ── Detect 12-digit UPI Reference Number / UTR ────────────────────────────
  const utrMatch = rawText.match(/\b(\d{12})\b/);
  if (utrMatch) {
    const cleanUtr = utrMatch[1];
    await processTelegramUtrSubmission(chatId, cleanUtr, message.from?.username);
    return;
  }

  // ── Default Friendly Fallback ─────────────────────────────────────────────
  await sendTelegramMessage(
    chatId,
    `👋 Hello <b>${firstName}</b>! To purchase a PGSharp key or check stock, please choose an option from the menu below.\n\n` +
      `<i>If you recently sent a payment, please reply with your 12-digit UPI Ref/UTR number.</i>`,
    {
      reply_markup: getMainMenuKeyboard(),
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
