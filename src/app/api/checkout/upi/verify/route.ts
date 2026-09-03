import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, toOrderPublic } from '@/lib/firestore/orders';
import { getBankCredit, claimBankCredit } from '@/lib/firestore/bankCredits';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendPaymentVerificationAlert, sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VerifyBody {
  orderId?: string;
  utr?: string;
  utrNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = (body.orderId || '').trim();
    const rawUtr = (body.utr || body.utrNumber || '').trim();
    const cleanUtr = rawUtr.replace(/\D/g, '');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required.' },
        { status: 400 }
      );
    }

    if (!cleanUtr || cleanUtr.length !== 12) {
      return NextResponse.json(
        { error: 'Please enter a valid 12-digit UPI Reference Number / UTR.' },
        { status: 400 }
      );
    }

    // ── 1. Check existing order in Firestore ─────────────────────────────────
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Idempotency: if already processed and key assigned, return immediately
    if (existingOrder.payment_status === 'paid' && existingOrder.delivered_key) {
      return NextResponse.json({
        success: true,
        order: toOrderPublic(existingOrder),
        message: 'Order was already verified and fulfilled.',
      });
    }

    // ── 2. Check for duplicate UTR usage across other orders ─────────────────
    const db = getAdminFirestore();
    const dupSnapshot = await db
      .collection('orders')
      .where('utr_number', '==', cleanUtr)
      .limit(1)
      .get();

    if (!dupSnapshot.empty && dupSnapshot.docs[0].id !== orderId) {
      const dupData = dupSnapshot.docs[0].data();
      if (dupData.payment_status === 'paid' || dupData.payment_status === 'verifying') {
        return NextResponse.json(
          { error: 'This UTR / Reference Number has already been submitted for another order. Please check your bank transaction.' },
          { status: 409 }
        );
      }
    }

    // ── 3. Check if Bank SMS was already received by the Bridge ──────────────
    const bankCredit = await getBankCredit(cleanUtr);

    if (bankCredit && bankCredit.status === 'unclaimed') {
      // ── Instant Match! Real bank credit verified ──────────────────────────
      const allocation = await allocateKeySlot(orderId, `AUTO_BANK_SMS_${cleanUtr}`);

      await db.collection('orders').doc(orderId).update({
        payment_status: 'paid',
        utr_number: cleanUtr,
        payment_gateway: 'upi_direct',
        updated_at: new Date(),
      });

      await claimBankCredit(cleanUtr, orderId);

      sendKeyDeliveryEmail({
        to: existingOrder.customer_email,
        orderId: existingOrder.order_id,
        planType: existingOrder.plan_type,
        licenseKey: allocation.decryptedKey,
      }).catch((err) => console.error('[checkout/upi/verify] Email send error:', err));

      sendAdminOrderAlert({
        orderId: existingOrder.order_id,
        customerEmail: existingOrder.customer_email,
        customerPhone: existingOrder.customer_phone,
        planType: existingOrder.plan_type,
        amount: existingOrder.amount,
        currency: existingOrder.currency,
        gateway: 'Bank SMS Bridge (Instant Match)',
        transactionId: `Verified UTR: ${cleanUtr}`,
        deliveredKey: allocation.decryptedKey,
      }).catch((err) => console.error('[checkout/upi/verify] Discord alert error:', err));

      const updatedOrder = await getOrderById(orderId);
      return NextResponse.json({
        success: true,
        status: 'paid',
        order: updatedOrder ? toOrderPublic(updatedOrder) : null,
        message: 'Payment verified with bank! Key allocated.',
      });
    }

    // ── 4. Fallback: SMS hasn't hit server yet or pending manual approval ────
    await db.collection('orders').doc(orderId).update({
      payment_status: 'verifying',
      utr_number: cleanUtr,
      payment_gateway: 'upi_direct',
      updated_at: new Date(),
    });

    // Dispatch Discord alert with 1-click action links as backup
    sendPaymentVerificationAlert({
      orderId: existingOrder.order_id,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      planType: existingOrder.plan_type,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      gateway: 'UPI (Direct QR)',
      transactionId: `UTR: ${cleanUtr}`,
    }).catch((alertErr) => {
      console.error('[checkout/upi/verify] Discord admin alert error:', alertErr);
    });

    const updatedOrder = await getOrderById(orderId);
    const publicOrder = updatedOrder ? toOrderPublic(updatedOrder) : null;

    return NextResponse.json({
      success: true,
      status: 'verifying',
      order: publicOrder,
      message: 'Payment proof submitted. Verifying transaction with your bank.',
    });
  } catch (err: any) {
    console.error('[checkout/upi/verify] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to submit UPI payment proof.' },
      { status: 500 }
    );
  }
}
