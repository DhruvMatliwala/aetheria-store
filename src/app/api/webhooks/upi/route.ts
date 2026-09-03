import { NextRequest, NextResponse } from 'next/server';
import { parseBankSms } from '@/lib/sms/bankSmsParser';
import { recordBankCredit, claimBankCredit } from '@/lib/firestore/bankCredits';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Order } from '@/types/order';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidSecret(providedSecret: string | null): boolean {
  if (!providedSecret) return false;
  const expected = (process.env.SMS_BRIDGE_SECRET || process.env.ADMIN_API_SECRET || 'aetheria-sms-bridge-secret').trim();
  return providedSecret.trim() === expected;
}

/**
 * Android Bank SMS Bridge Receiver (POST & GET supported)
 * Accepts incoming bank SMS notifications from MacroDroid / SMS Forwarder apps.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    return handleIncomingSms(body);
  } catch (err: any) {
    console.error('[webhooks/upi] Error processing POST webhook:', err);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return handleIncomingSms(params);
}

async function handleIncomingSms(data: Record<string, any>) {
  const secret = data.secret || data.key || data.token || '';
  if (!isValidSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized. Invalid secret.' }, { status: 401 });
  }

  // Extract raw message or pre-parsed fields (supports SMS and notification triggers)
  const rawMessage = (
    data.message ||
    data.body ||
    data.text ||
    data.sms ||
    data.notification ||
    data.not_text ||
    data.notification_text ||
    ''
  ).toString();

  let utr = (data.utr || data.reference || data.ref || '').toString().trim();
  let amount = data.amount ? parseFloat(data.amount.toString()) : null;

  // If raw SMS or notification text is provided, parse it
  if (rawMessage) {
    const parsed = parseBankSms(rawMessage);
    if (!utr && parsed.utr) utr = parsed.utr;
    if (!amount && parsed.amount) amount = parsed.amount;
  }

  // Clean UTR
  utr = utr.replace(/\D/g, '').trim();

  console.log('[webhooks/upi] Inbound bridge received:', {
    rawLength: rawMessage.length,
    rawPreview: rawMessage.slice(0, 100),
    parsedAmount: amount,
    parsedUtr: utr || null,
  });

  // Handle MacroDroid test pings
  const isTestPing =
    rawMessage.includes('[sms_body]') ||
    rawMessage.includes('[not_text]') ||
    rawMessage.toLowerCase().includes('test') ||
    rawMessage === '';

  if (isTestPing && (!amount || amount <= 0)) {
    return NextResponse.json({
      success: true,
      isTestPing: true,
      message: 'MacroDroid Test Ping Received Successfully! Your phone is officially connected to AETHERIA.',
    });
  }

  // Require either a valid 12-digit UTR OR a credited amount for Zero-UTR matching
  if ((!utr || utr.length !== 12) && (!amount || amount <= 0)) {
    return NextResponse.json(
      {
        error: 'Neither a valid 12-digit UTR nor a credited amount was found in the SMS/notification payload.',
        parsedUtr: utr || null,
        parsedAmount: amount || null,
      },
      { status: 400 }
    );
  }

  // ── 1. Record authentic bank credit in Firestore ───────────────────────────
  const creditDocId = utr && utr.length === 12 ? utr : `PAISE_${Math.round((amount || 0) * 100)}_${Date.now()}`;
  await recordBankCredit(creditDocId, amount, rawMessage);

  // ── 2. Dual-Engine Order Matching ─────────────────────────────────────────
  const db = getAdminFirestore();
  let matchedDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let matchMethod = 'UTR';

  // Strategy A: Zero-UTR Exact Amount Match (if amount with paise is present)
  if (amount && amount > 0) {
    const targetPaisa = Math.round(amount * 100);
    // Single-field index on amount, filter status in memory
    const amountQuery = await db
      .collection('orders')
      .where('amount', '==', targetPaisa)
      .limit(10)
      .get();

    matchedDoc =
      amountQuery.docs.find((d) =>
        ['pending', 'verifying'].includes(d.data().payment_status)
      ) || null;

    if (matchedDoc) {
      matchMethod = 'Zero-UTR (Exact Paise)';
    }
  }

  // Strategy B: Fallback to UTR Match (if customer entered UTR manually)
  if (!matchedDoc && utr && utr.length === 12) {
    // Single-field index on utr_number, filter status in memory
    const utrQuery = await db
      .collection('orders')
      .where('utr_number', '==', utr)
      .limit(5)
      .get();

    matchedDoc =
      utrQuery.docs.find((d) =>
        ['verifying', 'pending'].includes(d.data().payment_status)
      ) || null;

    if (matchedDoc) {
      matchMethod = 'UTR';
    }
  }

  let matchedOrderId: string | null = null;

  if (matchedDoc) {
    const orderDoc = matchedDoc;
    const orderData = orderDoc.data() as Order;
    matchedOrderId = orderData.order_id;

    // ── 3. Auto-allocate key slot instantly ──────────────────────────────────
    try {
      const claimIdentifier = utr && utr.length === 12 ? utr : creditDocId;
      const allocation = await allocateKeySlot(orderData.order_id, `AUTO_BANK_${claimIdentifier}`);

      // Mark order as paid and record the real bank reference
      await orderDoc.ref.update({
        payment_status: 'paid',
        utr_number: utr || claimIdentifier,
        payment_gateway: 'upi_direct',
        updated_at: new Date(),
      });

      // Mark bank credit as claimed
      await claimBankCredit(creditDocId, orderData.order_id);

      // Send transactional email
      sendKeyDeliveryEmail({
        to: orderData.customer_email,
        orderId: orderData.order_id,
        planType: orderData.plan_type,
        licenseKey: allocation.decryptedKey,
      }).catch((err) => console.error('[webhooks/upi] Email send error:', err));

      // Dispatch real-time Discord notification
      sendAdminOrderAlert({
        orderId: orderData.order_id,
        customerEmail: orderData.customer_email,
        customerPhone: orderData.customer_phone,
        planType: orderData.plan_type,
        amount: orderData.amount,
        currency: orderData.currency,
        gateway: 'Bank SMS Bridge (24/7 Auto)',
        transactionId: `Verified UTR: ${utr}`,
        deliveredKey: allocation.decryptedKey,
      }).catch((err) => console.error('[webhooks/upi] Discord alert error:', err));

      console.log(`[webhooks/upi] ⚡ 24/7 AUTO-FULFILLED Order #${orderData.order_id} via Bank SMS UTR: ${utr}`);
    } catch (allocErr: any) {
      console.error('[webhooks/upi] Allocation error for matched order:', allocErr);
    }
  }

  return NextResponse.json({
    success: true,
    message: matchedOrderId
      ? `Bank credit recorded & Order #${matchedOrderId} auto-fulfilled!`
      : 'Bank credit recorded. Ready for customer claim.',
    utr,
    amount,
    matchedOrderId,
  });
}
