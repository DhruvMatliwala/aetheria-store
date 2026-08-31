import { Resend } from 'resend';
import { PLAN_MAP, DISCORD_URL, REDDIT_URL } from '@/lib/constants';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY || 're_placeholder_key';
  return new Resend(apiKey);
}

export interface KeyDeliveryEmailParams {
  to: string;
  orderId: string;
  planType: string;
  licenseKey: string;
}

function buildEmailHtml(params: KeyDeliveryEmailParams): string {
  const plan = PLAN_MAP[params.planType];
  const planName = plan ? `${plan.name} (${plan.device_slots} Device${plan.device_slots > 1 ? 's' : ''})` : params.planType;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your PGSharp License Key</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🎮 PGSharp Keys</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:15px;">Your license key is ready!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#16162a;padding:32px;">
              <p style="color:#a5b4fc;margin:0 0 24px;font-size:15px;">
                Hi there! Thank you for your purchase. Your <strong style="color:#e0e7ff;">${planName}</strong> PGSharp license key is below.
              </p>

              <!-- Key Box -->
              <div style="background:#0f0f1a;border:1.5px solid #4f46e5;border-radius:12px;padding:20px 24px;margin:0 0 28px;text-align:center;">
                <p style="margin:0 0 8px;color:#818cf8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your License Key</p>
                <p style="margin:0;color:#ffffff;font-family:'Courier New',monospace;font-size:18px;font-weight:700;letter-spacing:2px;word-break:break-all;">${params.licenseKey}</p>
              </div>

              <!-- Order ID -->
              <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 28px;">
                Order ID: <span style="color:#818cf8;">${params.orderId}</span>
              </p>

              <!-- Activation Steps -->
              <h2 style="color:#e0e7ff;font-size:18px;font-weight:700;margin:0 0 16px;">🚀 Activation Guide</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ['1', 'Install PGSharp APK', 'Download the latest PGSharp APK from the official site (pgsharp.com) and install it on your Android device.'],
                  ['2', 'Open PGSharp', 'Launch PGSharp. On the activation screen, tap on the key icon or navigate to Settings → License Key.'],
                  ['3', 'Enter Your Key', 'Paste or type your license key exactly as shown above. Tap Activate.'],
                  ['4', 'Start Playing!', 'Your PGSharp features are now unlocked with joystick, teleport, IV checker, and enhanced throw!'],
                ].map(([num, title, desc]) => `
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36" valign="top">
                          <div style="width:28px;height:28px;background:#4f46e5;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-weight:700;font-size:13px;">${num}</div>
                        </td>
                        <td style="padding-left:12px;">
                          <strong style="color:#e0e7ff;display:block;margin-bottom:4px;">${title}</strong>
                          <span style="color:#9ca3af;font-size:14px;">${desc}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join('')}
              </table>

              <!-- Community Support Box -->
              <div style="background:#1e1e35;border-radius:12px;padding:20px;margin:12px 0 28px;text-align:center;">
                <p style="margin:0 0 8px;color:#e0e7ff;font-size:14px;font-weight:700;">Need Help or Coordinates?</p>
                <p style="margin:0 0 16px;color:#9ca3af;font-size:13px;">Join our official Discord Server and Reddit Community for 24/7 support.</p>
                <div style="text-align:center;">
                  <a href="${DISCORD_URL}" target="_blank" style="display:inline-block;background:#5865F2;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;font-size:12px;margin-right:8px;">Discord Server</a>
                  <a href="${REDDIT_URL}" target="_blank" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;font-size:12px;">Reddit Subreddit</a>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f0f1a;border-radius:0 0 16px 16px;padding:24px;text-align:center;border-top:1px solid #1e1e35;">
              <p style="margin:0;color:#6b7280;font-size:12px;">© 2026 PGSharp Keys Storefront. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendKeyDeliveryEmail(params: KeyDeliveryEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM ?? 'PGSharp Keys <orders@pgsharpkeys.com>';
  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `🎮 Your PGSharp License Key — Order #${params.orderId}`,
    html: buildEmailHtml(params),
  });

  if (error) {
    console.error('[resend] Email delivery failed:', error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}
