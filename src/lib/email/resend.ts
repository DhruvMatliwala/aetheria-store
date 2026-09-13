import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { PLAN_MAP, TELEGRAM_BOT_USERNAME } from '@/lib/constants';

function getGmailTransporter() {
  const user = process.env.GMAIL_USER?.trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD?.trim();
  // Strip any spaces from 16-character Google App Password (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const pass = rawPass?.replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY || 're_placeholder_key';
  return new Resend(apiKey);
}

/**
 * Unified email sender:
 * 1. Prioritizes direct Gmail SMTP (if GMAIL_USER & GMAIL_APP_PASSWORD configured)
 * 2. Falls back to Resend API
 */
async function sendMailUnified(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailTransporter = getGmailTransporter();

  if (gmailTransporter && gmailUser) {
    try {
      await gmailTransporter.sendMail({
        from: `Aetheria Store <${gmailUser}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return;
    } catch (gmailErr: any) {
      console.warn('[email/gmail] Gmail SMTP delivery failed, attempting Resend fallback:', gmailErr?.message || gmailErr);
    }
  }

  // Fallback to Resend
  const from = process.env.EMAIL_FROM || 'Aetheria Store <onboarding@resend.dev>';
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (error) {
    console.error('[email/resend] Resend delivery failed:', error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
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

Thank you for buying from aetheria-store, this is your license details.

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
<body style="margin:0;padding:24px;background:#ffffff;color:#222222;font-family:'Times New Roman', Times, serif;font-size:16px;line-height:1.6;">
  <div style="max-width:620px;margin:0 auto;padding:12px;font-family:'Times New Roman', Times, serif;">
    <p style="margin:0 0 18px;color:#222222;font-family:'Times New Roman', Times, serif;">Dear ${name},</p>
    
    <p style="margin:0 0 20px;color:#222222;font-family:'Times New Roman', Times, serif;">Thank you for buying from aetheria-store, this is your license details.</p>

    <div style="border-top:1px dashed #cccccc;margin:20px 0;"></div>

    <p style="margin:0 0 6px;color:#333333;font-weight:bold;font-size:15px;font-family:'Times New Roman', Times, serif;">License:</p>
    <p style="margin:0 0 22px;font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:#000000;letter-spacing:1px;background:#f8f9fa;padding:12px 14px;border:1px solid #e5e7eb;border-radius:6px;word-break:break-all;">${params.licenseKey}</p>

    <p style="margin:0 0 6px;color:#333333;font-weight:bold;font-size:15px;font-family:'Times New Roman', Times, serif;">Due Date:</p>
    <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:600;color:#000000;">${dueDate}</p>

    <div style="border-top:1px dashed #cccccc;margin:20px 0;"></div>

    <p style="margin:0 0 10px;font-weight:bold;color:#222222;font-family:'Times New Roman', Times, serif;">Notes:</p>

    <p style="margin:0 0 14px;color:#333333;font-family:'Times New Roman', Times, serif;">This license allows you to activate the full features on ${devices} device${devices > 1 ? 's' : ''}.</p>

    <p style="margin:0 0 14px;color:#333333;font-family:'Times New Roman', Times, serif;">This service cannot give you ability to bypass the 2 hours cooldown. Please always respect the cooldown rules to avoid strikes.</p>

    <p style="margin:0 0 14px;color:#b91c1c;font-weight:bold;font-family:'Times New Roman', Times, serif;">IMPORTANT: <span style="font-weight:normal;color:#333333;">Please do not share your license key with others, this may lead to your license being terminated without notice.</span></p>

    <p style="margin:0 0 20px;color:#333333;font-family:'Times New Roman', Times, serif;">If you find any difficulties, please feel free to contact us.</p>

    <p style="margin:0 0 4px;color:#222222;font-family:'Times New Roman', Times, serif;">Regards,</p>
    <p style="margin:0;font-weight:bold;color:#0e7490;font-family:'Times New Roman', Times, serif;">Aetheria-store</p>
  </div>
</body>
</html>
  `.trim();
}

export async function sendKeyDeliveryEmail(params: KeyDeliveryEmailParams): Promise<void> {
  await sendMailUnified({
    to: params.to,
    subject: 'Your PGSharp Standard Patron is activated!',
    text: buildPlainText(params),
    html: buildEmailHtml(params),
  });
}

export interface KeyExpiryReminderEmailParams {
  to: string;
  orderId: string;
  planType: string;
  customerName?: string;
}

export async function sendKeyExpiryReminderEmail(params: KeyExpiryReminderEmailParams): Promise<void> {
  const name = extractName(params.to, params.customerName);
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app';

  const text = `Dear ${name},

Your 30-day PGSharp Standard key from Aetheria Store is expiring in 48 hours.

To avoid losing your teleport, auto-walk, and 100% IV scanner mid-event, visit our store to get your next key:
${storeUrl}

Or order directly via our 24/7 Telegram bot: https://t.me/${TELEGRAM_BOT_USERNAME}

Need assistance? Feel free to contact our support on Telegram: @sleekfx3

Regards,
Aetheria-store`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#ffffff;color:#222222;font-family:'Times New Roman', Times, serif;font-size:16px;line-height:1.6;">
  <div style="max-width:620px;margin:0 auto;padding:12px;">
    <p>Dear ${name},</p>
    <p>Your 30-day PGSharp Standard key is <strong>expiring in 48 hours</strong>.</p>
    <p>To avoid losing your teleport, auto-walk, and 100% IV scanner mid-event, grab your next fresh key now:</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${storeUrl}" style="background:#0e7490;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">🛒 Get My Next Key</a>
    </div>
    <p>Or order directly on Telegram via our 24/7 bot: <a href="https://t.me/${TELEGRAM_BOT_USERNAME}">@${TELEGRAM_BOT_USERNAME}</a></p>
    <p>Regards,<br><strong>Aetheria-store</strong></p>
  </div>
</body>
</html>`;

  await sendMailUnified({
    to: params.to,
    subject: '⏳ Reminder: Your PGSharp Key expires in 48 hours!',
    text,
    html,
  });
}

export interface RestockAlertEmailParams {
  to: string;
  planId: string;
  planName?: string;
  customerName?: string;
}

export async function sendRestockAlertEmail(params: RestockAlertEmailParams): Promise<void> {
  const name = extractName(params.to, params.customerName);
  const planInfo = PLAN_MAP[params.planId];
  const planDisplayName = params.planName || planInfo?.name || (params.planId.includes('2_device') ? 'PGSharp Standard (2 Devices)' : 'PGSharp Standard (1 Device)');
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aetheria-store.vercel.app';
  const botUsername = TELEGRAM_BOT_USERNAME || 'AetheriaStoreOfficialBot';

  const text = `Dear ${name},

Great news! License keys are officially back in stock!

Restocked Tier: ${planDisplayName}

Grab your key before this batch sells out:
${storeUrl}

You can also order directly 24/7 on Telegram:
https://t.me/${botUsername}?start=restock

Regards,
Aetheria-store

---
You received this one-time notification because you requested a restock alert on our website. You have now been automatically removed from the waitlist.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PGSharp Keys Are Back in Stock!</title>
</head>
<body style="margin:0;padding:24px;background:#ffffff;color:#222222;font-family:'Times New Roman', Times, serif;font-size:16px;line-height:1.6;">
  <div style="max-width:620px;margin:0 auto;padding:12px;font-family:'Times New Roman', Times, serif;">
    <p style="margin:0 0 18px;color:#222222;font-family:'Times New Roman', Times, serif;">Dear ${name},</p>
    
    <p style="margin:0 0 16px;color:#222222;font-family:'Times New Roman', Times, serif;">
      Great news! Fresh <strong>PGSharp Standard (~30 Days)</strong> license keys are officially back in stock in the vault!
    </p>

    <div style="border-top:1px dashed #cccccc;margin:20px 0;"></div>

    <p style="margin:0 0 8px;color:#333333;font-weight:bold;font-size:15px;font-family:'Times New Roman', Times, serif;">Restocked Tier:</p>
    <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:17px;font-weight:700;color:#0e7490;background:#f8f9fa;padding:12px 14px;border:1px solid #e5e7eb;border-radius:6px;">
      ${planDisplayName}
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${storeUrl}" style="background:#0e7490;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;letter-spacing:0.5px;">
        ⚡ Get Your Key Now
      </a>
    </div>

    <div style="border-top:1px dashed #cccccc;margin:20px 0;"></div>

    <p style="margin:0 0 10px;font-weight:bold;color:#222222;font-family:'Times New Roman', Times, serif;">Notes:</p>
    <p style="margin:0 0 10px;color:#555555;font-size:14px;font-family:'Times New Roman', Times, serif;">
      • Keys are allocated on a first-come, first-served basis. If demand is high, keys may sell out quickly.
    </p>
    <p style="margin:0 0 14px;color:#555555;font-size:14px;font-family:'Times New Roman', Times, serif;">
      • You can also order directly 24/7 on Telegram via our bot: <a href="https://t.me/${botUsername}?start=restock" style="color:#0e7490;font-weight:bold;">@${botUsername}</a>
    </p>

    <p style="margin:20px 0 4px;color:#222222;font-family:'Times New Roman', Times, serif;">Best regards,</p>
    <p style="margin:0;font-weight:bold;color:#0e7490;font-family:'Times New Roman', Times, serif;">Aetheria-store</p>

    <p style="margin:30px 0 0;font-size:11px;color:#888888;border-top:1px solid #eeeeee;padding-top:12px;">
      You received this one-time email because you requested a restock notification on our website. You have now been automatically removed from the waitlist.
    </p>
  </div>
</body>
</html>`.trim();

  await sendMailUnified({
    to: params.to,
    subject: `⚡ PGSharp Keys Are Back in Stock! — ${planDisplayName}`,
    text,
    html,
  });
}
