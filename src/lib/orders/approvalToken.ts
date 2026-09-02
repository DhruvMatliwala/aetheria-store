import crypto from 'crypto';

/**
 * Generates an HMAC-SHA256 signature for 1-click secure order approvals via Discord.
 * Prevents unauthorized approvals while allowing frictionless mobile 1-tap verification.
 */
export function generateApprovalToken(orderId: string): string {
  const secret =
    process.env.ADMIN_API_SECRET ||
    process.env.KEY_ENCRYPTION_SECRET ||
    'aetheria-vault-internal-secure-key';
  return crypto.createHmac('sha256', secret).update(`approve_${orderId}`).digest('hex').slice(0, 32);
}

export function verifyApprovalToken(orderId: string, token: string): boolean {
  if (!orderId || !token) return false;
  try {
    const expected = generateApprovalToken(orderId);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
