import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalIpn } from '@/lib/payments/paypalIpn';
import { verifyPayPalWebhookSignature } from '@/lib/payments/paypal';
import { recordPaypalCredit, claimPaypalCredit } from '@/lib/firestore/paypalCredits';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getOrderById } from '@/lib/firestore/orders';
import { Order } from '@/types/order';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { sendKeyDeliveryEmail } from '@/lib/email/resend';
import { sendAdminOrderAlert } from '@/lib/notifications/discordAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Cannot read request body.' }, { status: 400 });
  }

  const contentType = request.headers.get('content-type') || '';

  // ════════════════════════════════════════════════════════════════════════════
  // 1. HANDLE PAYPAL IPN (Instant Payment Notification - urlencoded)
  // ════════════════════════════════════════════════════════════════════════════
  if (contentType.includes('application/x-www-form-urlencoded') || rawBody.includes('payment_status=')) {
    const isSandbox = (process.env.PAYPAL_MODE || '').toLowerCase() === 'sandbox';

    // Verify IPN payload with PayPal servers
    const isVerified = await verifyPayPalIpn(rawBody, isSandbox);
    if (!isVerified) {
      console.warn('[webhook/paypal] IPN verification failed or invalid message.');
      // Return 200 to PayPal so it doesn't keep retrying bad notifications
      return new Response('IPN Invalid', { status: 200 });
    }

    const params = new URLSearchParams(rawBody);
    const paymentStatus = params.get('payment_status') || '';
    const txnId = (params.get('txn_id') || '').trim();
    const mcGross = params.get('mc_gross') ? parseFloat(params.get('mc_gross')!) : null;
    const payerEmail = (params.get('payer_email') || '').toLowerCase().trim();
    const customOrderId = (params.get('custom') || '').trim();

    console.log(`[webhook/paypal] IPN Received: status=${paymentStatus}, txn_id=${txnId}, gross=${mcGross}, payer=${payerEmail}`);

    if (paymentStatus !== 'Completed') {
      return new Response('OK - Non-Completed Status', { status: 200 });
    }

    if (!txnId) {
      return new Response('OK - Missing Txn ID', { status: 200 });
    }

    // Record verified PayPal credit
    await recordPaypalCredit(txnId, mcGross, payerEmail);

    // Look for matching pending/verifying order
    const db = getAdminFirestore();
    let matchedDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    // Match Strategy A: custom field has order ID
    if (customOrderId) {
      const doc = await db.collection('orders').doc(customOrderId).get();
      if (doc.exists && doc.data()?.payment_status !== 'paid') {
        matchedDoc = doc as unknown as FirebaseFirestore.QueryDocumentSnapshot;
      }
    }

    // Match Strategy B: customer already submitted this PayPal Tx ID
    if (!matchedDoc) {
      const txQuery = await db
        .collection('orders')
        .where('paypal_tx_id', '==', txnId)
        .where('payment_status', 'in', ['verifying', 'pending'])
        .limit(1)
        .get();

      if (!txQuery.empty) {
        matchedDoc = txQuery.docs[0];
      }
    }

    // Match Strategy C: match by customer email
    if (!matchedDoc && payerEmail) {
      const emailQuery = await db
        .collection('orders')
        .where('customer_email', '==', payerEmail)
        .where('payment_gateway', '==', 'paypal_direct')
        .where('payment_status', 'in', ['verifying', 'pending'])
        .limit(1)
        .get();

      if (!emailQuery.empty) {
        matchedDoc = emailQuery.docs[0];
      }
    }

    if (matchedDoc) {
      const orderDoc = matchedDoc;
      const orderData = orderDoc.data() as Order;

      try {
        const allocation = await allocateKeySlot(orderData.order_id, `PAYPAL_IPN_${txnId}`);

        await orderDoc.ref.update({
          payment_status: 'paid',
          paypal_tx_id: txnId,
          payment_gateway: 'paypal_direct',
          updated_at: new Date(),
        });

        await claimPaypalCredit(txnId, orderData.order_id);

        sendKeyDeliveryEmail({
          to: orderData.customer_email,
          orderId: orderData.order_id,
          planType: orderData.plan_type,
          licenseKey: allocation.decryptedKey,
        }).catch((err) => console.error('[webhook/paypal] Resend email error:', err));

        sendAdminOrderAlert({
          orderId: orderData.order_id,
          customerEmail: orderData.customer_email,
          customerPhone: orderData.customer_phone,
          planType: orderData.plan_type,
          amount: orderData.amount,
          currency: orderData.currency,
          gateway: 'PayPal IPN (24/7 Auto)',
          transactionId: `PayPal Tx: ${txnId}`,
          deliveredKey: allocation.decryptedKey,
        }).catch((err) => console.error('[webhook/paypal] Discord alert error:', err));

        console.log(`[webhook/paypal] ⚡ 24/7 AUTO-FULFILLED PayPal Order #${orderData.order_id} via IPN Tx: ${txnId}`);
      } catch (allocErr: any) {
        console.error('[webhook/paypal] IPN allocation error:', allocErr);
      }
    }

    return new Response('OK', { status: 200 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. HANDLE PAYPAL REST API WEBHOOKS (JSON format)
  // ════════════════════════════════════════════════════════════════════════════
  const authAlgo = request.headers.get('paypal-auth-algo') ?? '';
  const certUrl = request.headers.get('paypal-cert-url') ?? '';
  const transmissionId = request.headers.get('paypal-transmission-id') ?? '';
  const transmissionSig = request.headers.get('paypal-transmission-sig') ?? '';
  const transmissionTime = request.headers.get('paypal-transmission-time') ?? '';

  if (transmissionSig) {
    let isValid = false;
    try {
      isValid = await verifyPayPalWebhookSignature({
        authAlgo,
        certUrl,
        transmissionId,
        transmissionSig,
        transmissionTime,
        rawBody,
      });
    } catch (err) {
      console.error('[webhook/paypal] Signature error:', err);
    }

    if (isValid) {
      try {
        const event = JSON.parse(rawBody);
        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
          const internalOrderId =
            event.resource.custom_id ??
            event.resource.purchase_units?.[0]?.custom_id;

          if (internalOrderId) {
            const order = await getOrderById(internalOrderId);
            if (order && order.payment_status !== 'paid') {
              const allocation = await allocateKeySlot(order.order_id, `PAYPAL_REST_${event.resource.id}`);
              const db = getAdminFirestore();
              await db.collection('orders').doc(order.order_id).update({
                payment_status: 'paid',
                paypal_tx_id: event.resource.id,
                updated_at: new Date(),
              });
              sendKeyDeliveryEmail({
                to: order.customer_email,
                orderId: order.order_id,
                planType: order.plan_type,
                licenseKey: allocation.decryptedKey,
              }).catch(() => {});
            }
          }
        }
      } catch (jsonErr) {
        console.error('[webhook/paypal] JSON error:', jsonErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
