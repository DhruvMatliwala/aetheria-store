import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/firestore/orders';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';
import { verifyApprovalToken } from '@/lib/orders/approvalToken';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { sendTelegramMessage } from '@/lib/telegram/bot';
import { PLAN_MAP, PLANS, TELEGRAM_URL } from '@/lib/constants';
import { broadcastOrderProof } from '@/lib/telegram/proofs';
import { processReferralReward } from '@/lib/telegram/referrals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId')?.trim();
  const token = searchParams.get('token')?.trim();

  if (!orderId || !token) {
    return new NextResponse(renderHtml('Missing Parameters', 'Order ID or approval token is missing.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // 1. Verify HMAC Token
  if (!verifyApprovalToken(orderId, token)) {
    return new NextResponse(renderHtml('Unauthorized', 'Invalid or expired approval token.', false), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return new NextResponse(renderHtml('Order Not Found', `No order found for ID: ${orderId}`, false), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (existingOrder.payment_status === 'paid' && existingOrder.delivered_key) {
      return new NextResponse(
        renderHtml(
          'Already Approved',
          `Order #${orderId} was already approved previously.<br><br><strong>Delivered Key:</strong> <code>${existingOrder.delivered_key}</code>`,
          true
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // 2. Allocate Key Slot
    const txRef = existingOrder.utr_number ? `UTR_${existingOrder.utr_number}` : `PAYPAL_${existingOrder.paypal_tx_id || 'DIRECT'}`;
    const allocation = await allocateKeySlot(orderId, txRef);

    // 3. Mark Order as Paid
    const db = getAdminFirestore();
    await db.collection('orders').doc(orderId).update({
      payment_status: 'paid',
      updated_at: new Date(),
    });

    // 4. Send Email
    sendKeyDeliveryEmail({
      to: existingOrder.customer_email,
      orderId: existingOrder.order_id,
      planType: existingOrder.plan_type,
      licenseKey: allocation.decryptedKey,
    }).catch((err) => console.error('[quick-approve] Email send error:', err));

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
      }).catch((err) => console.error('[quick-approve] Telegram send error:', err));
    }

    // 5. Send Discord Confirmation
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
    }).catch((err) => console.error('[quick-approve] Discord alert error:', err));

    // Broadcast proof to official channel
    broadcastOrderProof({
      orderId: existingOrder.order_id,
      planType: existingOrder.plan_type,
      gateway: existingOrder.payment_gateway,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      customerEmail: existingOrder.customer_email,
      customerUsername: existingOrder.telegram_username || existingOrder.customer_phone,
    }).catch((err) => console.error('[quick-approve] Proof broadcast error:', err));

    // Process referral reward if order was referred
    processReferralReward(existingOrder).catch((err) =>
      console.error('[quick-approve] Referral reward processing error:', err)
    );

    return new NextResponse(
      renderHtml(
        'Order Approved Successfully! 🎉',
        `The payment has been verified. The key has been unlocked on the customer's screen and emailed to <strong>${existingOrder.customer_email}</strong>.<br><br><strong>Delivered Key:</strong> <code>${allocation.decryptedKey}</code>`,
        true
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (err: any) {
    console.error('[quick-approve] Error:', err);
    return new NextResponse(renderHtml('Approval Error', err?.message || 'Failed to approve order.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function renderHtml(title: string, message: string, success: boolean): string {
  const accentColor = success ? '#06b6d4' : '#ef4444';
  const icon = success ? '✅' : '⚠️';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — AETHERIA Vault</title>
  <style>
    body {
      background-color: #050508;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #0f111a;
      border: 1px solid ${accentColor}44;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 40px ${accentColor}22;
    }
    .icon {
      font-size: 44px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 20px;
      margin: 0 0 14px 0;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      color: #9ca3af;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    code {
      background: #1e2235;
      color: #38bdf8;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: bold;
      display: inline-block;
      margin-top: 6px;
    }
    .btn {
      display: inline-block;
      background: ${accentColor};
      color: #000;
      font-weight: bold;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/admin" class="btn">Open Admin Dashboard</a>
  </div>
</body>
</html>`;
}
