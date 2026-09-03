import crypto from 'crypto';
import { PAYPAL_BASE_URL } from '@/lib/constants';

// ── PayPal REST API client ────────────────────────────────────────────────────

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

/**
 * Creates a PayPal order explicitly in USD with a 2-decimal string value.
 * @param amountCents  Amount in cents USD (e.g., 199 for $1.99, 399 for $3.99).
 * @param orderId      Your internal order ID used as custom_id.
 * @param planName     Optional human-readable plan name for transaction description.
 */
export async function createPayPalOrder(
  amountCents: number,
  orderId: string,
  planName?: string
): Promise<PayPalOrderResponse> {
  const token = await getAccessToken();
  
  // Format as exact 2-decimal string in USD (e.g. "1.99", "3.99")
  const amountUsd = (amountCents / 100).toFixed(2);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app';

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': orderId, // idempotency key
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: orderId,
          amount: {
            currency_code: 'USD',
            value: amountUsd,
          },
          description: planName
            ? `PGSharp License Key (${planName}) — 30 Days`
            : 'PGSharp License Key — 30 Days',
        },
      ],
      application_context: {
        brand_name: 'PGSharp Keys',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${appUrl}/order-success/${orderId}`,
        cancel_url: `${appUrl}/?cancelled=true`,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`PayPal createOrder failed: ${await res.text()}`);
  }

  return res.json() as Promise<PayPalOrderResponse>;
}

/**
 * Captures a PayPal order after buyer approval.
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<any> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    // Handle idempotency / already captured states
    if (errorText.includes('ORDER_ALREADY_CAPTURED') || errorText.includes('COMPLETED')) {
      return { status: 'COMPLETED' };
    }
    throw new Error(`PayPal capture failed: ${errorText}`);
  }

  return res.json();
}

/**
 * Verifies a PayPal webhook event signature.
 * Uses PayPal's verify-webhook-signature REST API endpoint.
 */
export async function verifyPayPalWebhookSignature(params: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  rawBody: string;
}): Promise<boolean> {
  const token = await getAccessToken();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error('PAYPAL_WEBHOOK_ID is not configured.');

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: params.authAlgo,
        cert_url: params.certUrl,
        transmission_id: params.transmissionId,
        transmission_sig: params.transmissionSig,
        transmission_time: params.transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(params.rawBody),
      }),
    }
  );

  if (!res.ok) return false;

  const data = await res.json() as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}

export function getPayPalApprovalUrl(order: PayPalOrderResponse): string | null {
  const link = order.links.find((l) => l.rel === 'approve');
  return link?.href ?? null;
}
