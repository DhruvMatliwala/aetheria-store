/**
 * PayPal IPN (Instant Payment Notification) Verifier
 * Validates incoming IPN POST messages directly against PayPal's verification server.
 */

export async function verifyPayPalIpn(rawBody: string, isSandbox = false): Promise<boolean> {
  const verifyUrl = isSandbox
    ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
    : 'https://ipnpb.paypal.com/cgi-bin/webscr';

  const verificationBody = `cmd=_notify-validate&${rawBody}`;

  try {
    const res = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Aetheria-Store-IPN-Verifier',
      },
      body: verificationBody,
    });

    const responseText = await res.text();
    return responseText.trim() === 'VERIFIED';
  } catch (err) {
    console.error('[paypalIpn] Verification network error:', err);
    return false;
  }
}
