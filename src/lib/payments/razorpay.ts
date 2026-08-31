import crypto from 'crypto';

// ── Razorpay REST API client (no SDK dependency for server routes) ─────────────

function getRazorpayHeaders(): HeadersInit {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay keys are not configured.');
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Creates a Razorpay order via REST API.
 * @param amountPaise  Amount in the smallest currency unit (paise for INR).
 * @param receipt      Your internal order ID.
 */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string
): Promise<RazorpayOrderResponse> {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: getRazorpayHeaders(),
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      payment_capture: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay createOrder failed: ${err}`);
  }

  return res.json() as Promise<RazorpayOrderResponse>;
}

/**
 * Verifies the Razorpay webhook signature.
 * Razorpay signs webhooks with HMAC-SHA256 using your webhook secret.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured.');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Verifies the Razorpay payment signature for client-side verification.
 * Used to confirm payment on the client before showing success page.
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured.');

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}
