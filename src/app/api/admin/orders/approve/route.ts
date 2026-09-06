import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/firestore/orders';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { sendTelegramMessage } from '@/lib/telegram/bot';
import { PLAN_MAP, PLANS, TELEGRAM_URL } from '@/lib/constants';
import { broadcastOrderProof } from '@/lib/telegram/proofs';
import { processReferralReward } from '@/lib/telegram/referrals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest): boolean {
  const adminSecret = request.headers.get('x-admin-secret');
  return Boolean(
    adminSecret &&
    process.env.ADMIN_API_SECRET &&
    adminSecret.trim() === process.env.ADMIN_API_SECRET.trim()
  );
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { orderId?: string };
    const orderId = body.orderId?.trim();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (existingOrder.payment_status === 'paid' && existingOrder.delivered_key) {
      return NextResponse.json({
        success: true,
        message: 'Order was already approved and fulfilled.',
        deliveredKey: existingOrder.delivered_key,
      });
    }

    // Allocate Key Slot
    const txRef = existingOrder.utr_number ? `UTR_${existingOrder.utr_number}` : `PAYPAL_${existingOrder.paypal_tx_id || 'DIRECT'}`;
    const allocation = await allocateKeySlot(orderId, txRef);

    // Mark as paid
    const db = getAdminFirestore();
    await db.collection('orders').doc(orderId).update({
      payment_status: 'paid',
      updated_at: new Date(),
    });

    // Send transactional email
    sendKeyDeliveryEmail({
      to: existingOrder.customer_email,
      orderId: existingOrder.order_id,
      planType: existingOrder.plan_type,
      licenseKey: allocation.decryptedKey,
    }).catch((err) => console.error('[admin/orders/approve] Email send error:', err));

    // Send Telegram key delivery if order originated from Telegram bot
    if (existingOrder.telegram_chat_id) {
      const plan = PLAN_MAP[existingOrder.plan_type] || PLANS[0];
      const deliveryMessage =
        `🎉 <b>PAYMENT APPROVED! YOUR KEY HAS BEEN DISPATCHED:</b>\n\n` +
        `🔑 <b>License Key:</b>\n` +
        `<code>${allocation.decryptedKey}</code>\n` +
        `<i>(Tap key above to copy to clipboard)</i>\n\n` +
        `📱 <b>Plan:</b> ${plan.name} (${plan.duration})\n` +
        `⚡ <b>Device Slots:</b> ${plan.device_slots} Android Device(s)\n` +
        `🆔 <b>Order ID:</b> <code>${existingOrder.order_id}</code>\n\n` +
        `<b>How to Activate:</b>\n` +
        `1. Open PGSharp on your Android device.\n` +
        `2. Tap the floating Star icon ⭐ -> Go to <b>Settings ⚙️</b>.\n` +
        `3. Tap <b>Activate</b>, paste your key, and tap OK!\n\n` +
        `Need assistance or renewal? We're always here at @sleekfx3!`;

      sendTelegramMessage(existingOrder.telegram_chat_id, deliveryMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Support & Questions', url: TELEGRAM_URL }],
          ],
        },
      }).catch((err) => console.error('[admin/orders/approve] Telegram send error:', err));
    }

    // Send Discord notification
    sendAdminOrderAlert({
      orderId: existingOrder.order_id,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      planType: existingOrder.plan_type,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      gateway: existingOrder.payment_gateway,
      transactionId: existingOrder.utr_number || existingOrder.paypal_tx_id || 'N/A',
      deliveredKey: allocation.decryptedKey,
      patreonEmail: allocation.patreonEmail,
    }).catch((err) => console.error('[admin/orders/approve] Discord alert error:', err));

    // Broadcast proof to official channel
    broadcastOrderProof({
      orderId: existingOrder.order_id,
      planType: existingOrder.plan_type,
      gateway: existingOrder.payment_gateway,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      customerEmail: existingOrder.customer_email,
      customerUsername: existingOrder.telegram_username || existingOrder.customer_phone,
    }).catch((err) => console.error('[admin/orders/approve] Proof broadcast error:', err));

    // Process referral reward if order was referred
    processReferralReward(existingOrder).catch((err) =>
      console.error('[admin/orders/approve] Referral reward processing error:', err)
    );

    return NextResponse.json({
      success: true,
      deliveredKey: allocation.decryptedKey,
      message: 'Order approved successfully.',
    });
  } catch (err: any) {
    console.error('[admin/orders/approve]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to approve order.' },
      { status: 500 }
    );
  }
}
