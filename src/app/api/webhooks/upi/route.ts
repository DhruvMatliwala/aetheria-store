import { NextRequest, NextResponse } from 'next/server';
import { parseBankSms } from '@/lib/sms/bankSmsParser';
import { recordBankCredit, claimBankCredit } from '@/lib/firestore/bankCredits';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Order } from '@/types/order';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert, sendPaymentVerificationAlert } from '@/lib/notifications/discordAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidSecret(providedSecret: string | null): boolean {
  if (!providedSecret) return false;
  const validSecrets = [
    process.env.SMS_BRIDGE_SECRET,
    process.env.ADMIN_API_SECRET,
    'DhruvSleekAdminSecret2026',
    'AETHERIA_BANK_SYNC_9942',
    'aetheria-sms-bridge-secret',
  ]
    .filter(Boolean)
    .map((s) => s!.trim());
  return validSecrets.includes(providedSecret.trim());
}

/**
 * Android Bank SMS Bridge Receiver (POST & GET supported)
 * Accepts incoming bank SMS notifications from MacroDroid / SMS Forwarder apps.
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any> = {};
    const rawText = await request.text();

    if (rawText) {
      // 1. Try standard JSON parse
      try {
        body = JSON.parse(rawText);
      } catch {
        // 2. Sanitize raw newlines inside SMS strings
        try {
          const sanitized = rawText.replace(/[\r\n]+/g, ' ');
          body = JSON.parse(sanitized);
        } catch {
          // 3. Try parsing as form-urlencoded (secret=...&message=...)
          try {
            const urlParams = new URLSearchParams(rawText);
            const formObj: Record<string, any> = {};
            urlParams.forEach((v, k) => {
              formObj[k] = v;
            });
            if (formObj.secret || formObj.message) {
              body = formObj;
            }
          } catch {
            // 4. Regex extraction as ultimate fallback
            const secretMatch = rawText.match(/"?secret"?\s*[:=]\s*"?([^"&,\s]+)"?/i);
            const messageMatch = rawText.match(/"?message"?\s*[:=]\s*"([\s\S]*)"/i);
            if (secretMatch) {
              body = {
                secret: secretMatch[1],
                message: messageMatch ? messageMatch[1] : rawText,
              };
            }
          }
        }
      }
    }

    // Also merge URL query parameters (allows passing ?secret=... in webhook URL)
    const { searchParams } = new URL(request.url);
    searchParams.forEach((v, k) => {
      if (!body[k]) {
        body[k] = v;
      }
    });

    // Support Authorization: Bearer <token>, x-secret, and x-api-key headers
    const authHeader = request.headers.get('authorization');
    const bearerSecret = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.substring(7).trim()
      : null;
    const headerSecret = bearerSecret || request.headers.get('x-secret') || request.headers.get('x-api-key');
    if (headerSecret && !body.secret) {
      body.secret = headerSecret;
    }

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

  const authHeader = request.headers.get('authorization');
  const bearerSecret = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.substring(7).trim()
    : null;
  const headerSecret = bearerSecret || request.headers.get('x-secret') || request.headers.get('x-api-key');
  if (headerSecret && !params.secret) {
    params.secret = headerSecret;
  }

  return handleIncomingSms(params);
}

async function handleIncomingSms(data: Record<string, any>) {
  const secret = data.secret || data.key || data.token || '';
  if (!isValidSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized. Invalid secret.' }, { status: 401 });
  }

  // Extract raw message or pre-parsed fields (supports SMS Forwarder, MacroDroid, etc.)
  const rawMessage = (
    data.message ||
    data.content ||
    data.msg ||
    data.body ||
    data.text ||
    data.sms ||
    data.smsContent ||
    data.sms_body ||
    data.text_body ||
    data.notification ||
    data.not_text ||
    data.notification_text ||
    ''
  ).toString();

  // ── Privacy & Security Guard: Never process or store sensitive 2FA / OTPs ──────────
  const lowerMsg = rawMessage.toLowerCase();
  const isOtpOrAuth =
    (lowerMsg.includes('otp') ||
      lowerMsg.includes('verification code') ||
      lowerMsg.includes('security code') ||
      lowerMsg.includes('one time password') ||
      lowerMsg.includes('login code')) &&
    !lowerMsg.includes('credited');

  if (isOtpOrAuth) {
    console.warn('[webhooks/upi] Dropped sensitive OTP/Auth SMS for security.');
    return NextResponse.json(
      { error: 'Security Policy: Authentication/OTP messages are strictly rejected.' },
      { status: 400 }
    );
  }

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
    rawMessage.includes('[sms_message]') ||
    rawMessage.includes('[not_text]') ||
    rawMessage.includes('[not_body]') ||
    rawMessage.includes('[notification]') ||
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

  // Strategy A: Zero-UTR Exact Amount Match with Time-Window FIFO (Whole-Rupee Engine)
  if (amount && amount > 0) {
    const targetPaisa = Math.round(amount * 100);
    // Single-field index on amount, filter status in memory
    const amountQuery = await db
      .collection('orders')
      .where('amount', '==', targetPaisa)
      .limit(20)
      .get();

    // Look for pending or verifying orders created within the last 20 minutes
    const twentyMinutesAgoMs = Date.now() - 20 * 60 * 1000;
    const candidates = amountQuery.docs.filter((d) => {
      const data = d.data();
      if (!['pending', 'verifying'].includes(data.payment_status)) return false;
      const createdAtMs =
        data.created_at?.toDate?.()?.getTime?.() ??
        (typeof data.created_at === 'number' ? data.created_at : 0);
      return !createdAtMs || createdAtMs >= twentyMinutesAgoMs;
    });

    if (candidates.length > 0) {
      // Sort by creation time descending (LIFO: newest active checkout matched first)
      candidates.sort((a, b) => {
        const aTime =
          a.data().created_at?.toDate?.()?.getTime?.() ??
          (typeof a.data().created_at === 'number' ? a.data().created_at : 0);
        const bTime =
          b.data().created_at?.toDate?.()?.getTime?.() ??
          (typeof b.data().created_at === 'number' ? b.data().created_at : 0);
        return bTime - aTime;
      });
      matchedDoc = candidates[0];
      matchMethod = 'Zero-UTR (Whole Rupee LIFO)';
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

    // ── Underpayment Safety Guard: Never deliver key if amount < order.amount ──
    if (amount && amount > 0 && Math.round(amount * 100) < orderData.amount) {
      console.warn(`[Webhook UPI] Underpayment detected: Received ₹${amount}, required ₹${(orderData.amount / 100).toFixed(2)}`);
      try {
        await sendPaymentVerificationAlert({
          orderId: orderData.order_id,
          customerEmail: orderData.customer_email,
          customerPhone: orderData.customer_phone,
          planType: orderData.plan_type,
          amount: Math.round(amount * 100),
          currency: 'INR',
          gateway: 'upi_direct',
          transactionId: utr || creditDocId,
        });
      } catch {}
      return NextResponse.json({ error: 'Underpayment detected. Key withheld.' }, { status: 400 });
    }

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
