import { Resend } from 'resend';
import { PLAN_MAP } from '@/lib/constants';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY || 're_placeholder_key';
  return new Resend(apiKey);
}

export interface KeyDeliveryEmailParams {
  to: string;
  orderId: string;
  planType: string;
  licenseKey: string;
  customerName?: string;
}

function getDueDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDeviceCount(planType: string): number {
  const plan = PLAN_MAP[planType];
  if (plan && plan.device_slots) {
    return plan.device_slots;
  }
  if (planType.includes('2_device')) return 2;
  if (planType.includes('3_device')) return 3;
  return 1;
}

function extractName(email: string, customerName?: string): string {
  if (customerName && customerName.trim()) {
    return customerName.trim();
  }
  const prefix = email.split('@')[0];
  if (!prefix) return 'trainer';
  return prefix.replace(/[._\-0-9]/g, ' ').trim() || prefix;
}

function buildPlainText(params: KeyDeliveryEmailParams): string {
  const name = extractName(params.to, params.customerName);
  const dueDate = getDueDateString();
  const devices = getDeviceCount(params.planType);

  return `Dear ${name},

Thank you for donating PGSharp, this is your license details.

----------------------------------------------------------------

License:



${params.licenseKey}

Due Date:



${dueDate}

----------------------------------------------------------------

Notes:



This license allows you to activate the full features on ${devices} device${devices > 1 ? 's' : ''}.

This service cannot give you ability to bypass the 2 hours cooldown. Please always respect the cooldown rules to avoid strikes.

IMPORTANT: Please do not share your license key with others, this may lead to your license being terminated without notice.

If you find any difficulties, please feel free to contact us.

Regards,

Aetheria-store
`.trim();
}

function buildEmailHtml(params: KeyDeliveryEmailParams): string {
  const name = extractName(params.to, params.customerName);
  const dueDate = getDueDateString();
  const devices = getDeviceCount(params.planType);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your PGSharp Standard Patron is activated!</title>
</head>
<body style="margin:0;padding:24px;background:#ffffff;color:#222222;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:620px;margin:0 auto;padding:12px;">
    <p style="margin:0 0 18px;color:#222222;">Dear ${name},</p>
    
    <p style="margin:0 0 20px;color:#222222;">Thank you for donating PGSharp, this is your license details.</p>

    <div style="border-top:1px dashed #cccccc;margin:20px 0;"></div>

    <p style="margin:0 0 6px;color:#555555;font-weight:600;font-size:14px;">License:</p>
    <p style="margin:0 0 22px;font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:#000000;letter-spacing:1px;background:#f8f9fa;padding:12px 14px;border:1px solid #e5e7eb;border-radius:6px;word-break:break-all;">${params.licenseKey}</p>

    <p style="margin:0 0 6px;color:#555555;font-weight:600;font-size:14px;">Due Date:</p>
    <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:600;color:#000000;">${dueDate}</p>

    <div style="border-top:1px dashed #cccccc;margin:20px 0;"></div>

    <p style="margin:0 0 10px;font-weight:600;color:#222222;">Notes:</p>

    <p style="margin:0 0 14px;color:#333333;">This license allows you to activate the full features on ${devices} device${devices > 1 ? 's' : ''}.</p>

    <p style="margin:0 0 14px;color:#333333;">This service cannot give you ability to bypass the 2 hours cooldown. Please always respect the cooldown rules to avoid strikes.</p>

    <p style="margin:0 0 14px;color:#b91c1c;font-weight:600;">IMPORTANT: <span style="font-weight:normal;color:#333333;">Please do not share your license key with others, this may lead to your license being terminated without notice.</span></p>

    <p style="margin:0 0 20px;color:#333333;">If you find any difficulties, please feel free to contact us.</p>

    <p style="margin:0 0 4px;color:#222222;">Regards,</p>
    <p style="margin:0;font-weight:600;color:#0e7490;">Aetheria-store</p>
  </div>
</body>
</html>
  `.trim();
}

export async function sendKeyDeliveryEmail(params: KeyDeliveryEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM ?? 'PGSharp Team <noreply@pgsharp.com>';
  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: 'Your PGSharp Standard Patron is activated!',
    text: buildPlainText(params),
    html: buildEmailHtml(params),
  });

  if (error) {
    console.error('[resend] Email delivery failed:', error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}
