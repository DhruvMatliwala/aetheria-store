import { Plan } from '@/types/plan';

export const PLANS: Plan[] = [
  {
    id: '1_month_1_device',
    name: '1 Device',
    duration: '30 Days',
    price_inr: 18000,   // ₹180 in paise
    price_usd: 199,     // $1.99 in cents
    device_slots: 1,
    features: [
      'Full PGSharp Standard Features',
      'Auto Walk / Joystick / Teleport',
      '100% IV Checker & Quick Catch',
      'Enhanced Throw (100% Hit & Curve)',
      '1 Android Device Slot',
      'Instant On-Screen & Email Delivery',
      'Discord & Reddit Direct Support',
    ],
  },
  {
    id: '1_month_2_device',
    name: '2 Devices',
    duration: '30 Days',
    price_inr: 35000,           // ₹350 in paise
    price_usd: 350,             // $3.50 in cents
    original_price_inr: 36000,  // ₹360 (2x ₹180) in paise
    original_price_usd: 399,    // $3.99 in cents
    badge: 'Popular',
    discount_badge: 'BEST VALUE',
    device_slots: 2,
    features: [
      'Full PGSharp Standard Features',
      'Auto Walk / Joystick / Teleport',
      '100% IV Checker & Quick Catch',
      'Enhanced Throw & Spawn Booster',
      '2 Android Device Slots',
      'Instant On-Screen & Email Delivery',
      'Priority Discord Direct Support',
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p]));

export const LOW_STOCK_THRESHOLD = 5;

// Direct Support Channels (Discord, Reddit & Telegram)
export const DISCORD_URL =
  process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.com/users/503233296134832149';
export const REDDIT_URL =
  process.env.NEXT_PUBLIC_REDDIT_URL || 'https://www.reddit.com/user/dhruv_emperor/';
export const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/sleekfx3';

export interface SmartRoute {
  id: string;
  vpa: string;
  bank: string;
  badge?: string;
}

export const SMART_ROUTING_UPI_IDS: SmartRoute[] = [
  { id: 'oksbi', vpa: 'dhruvmatliwala123@oksbi', bank: 'SBI', badge: 'Primary' },
  { id: 'okicici', vpa: 'dhruvmatliwala123@okicici', bank: 'ICICI Bank', badge: 'Fastest' },
  { id: 'okaxis', vpa: 'dhruvmatliwala123@okaxis', bank: 'Axis Bank', badge: 'High Uptime' },
  { id: 'okhdfcbank', vpa: 'dhruvmatliwala123@okhdfcbank', bank: 'HDFC Bank', badge: 'Reliable' },
];

// Direct UPI Configuration (Indian Payments)
export const OFFICIAL_GPAY_URI = 'upi://pay?pa=dhruvmatliwala123@oksbi&pn=Dhruv%20-076&aid=uGICAgMC507CUEg';
export const UPI_VPA = process.env.NEXT_PUBLIC_UPI_VPA || SMART_ROUTING_UPI_IDS[0].vpa;
export const UPI_PAYEE_NAME = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || 'Dhruv -076';

// Direct PayPal Configuration (International Payments)
export const PAYPAL_ME_URL = process.env.NEXT_PUBLIC_PAYPAL_ME_URL || 'https://www.paypal.me/MatliwalaYogesh';
export const PAYPAL_EMAIL = process.env.NEXT_PUBLIC_PAYPAL_EMAIL || 'burnerdhruv9@gmail.com';
export const PAYPAL_USERNAME = process.env.NEXT_PUBLIC_PAYPAL_USERNAME || '@MatliwalaYogesh';

// Razorpay / PayPal modes
export const PAYPAL_BASE_URL =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
