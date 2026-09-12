# 📜 AETHERIA — Complete Technical & Engineering Manual

This document provides an exhaustive, in-depth architectural breakdown of the **AETHERIA / PGSharp Storefront** web platform and multi-channel ecosystem.

---

## 1. Architectural Vision & Multi-Channel Ecosystem

### 1.1 Brand Identity & Design System
- **Brand Title**: `AETHERIA`
- **Color Palette**:
  - **Base Background**: Deep Obsidian Navy / Void Black (`#070B13`, `#0C1424`)
  - **Primary Accent**: Electric Cyber Cyan (`#06B6D4` / `#22D3EE`)
  - **Secondary Accent**: Auroral Emerald (`#10B981` / `#059669`)
  - **Surface & Cards**: Frosted Obsidian Glass (`bg-[#0c1424]/85 backdrop-blur-md border border-[#16243d]`)
  - **Typography**: High-contrast Serif headings (`font-serif`) with clean monospaced technical tags and pricing (`font-mono`).

### 1.2 Multi-Channel Distribution Architecture
AETHERIA operates across multiple synchronous channels:
1. **Web Storefront**: Luxury dark-mode experience featuring a 550vh GSAP scrollytelling visual runway, ambient spatial audio, and an instant key delivery modal.
2. **Admin Command Center (`/admin`)**: Protected dashboard for inventory metrics, direct key dispatch, bulk key ingestion, order approvals, and automated renewal triggers.
3. **Telegram Bot Engine (`@AetheriaStoreOfficialBot`)**: Autonomous conversational bot supporting multi-tier checkout, instant UPI/PayPal payment generation, automated key delivery in DMs, and viral referral tracking (`/ref`).
4. **Telegram Proof Channel (`@AetheriaStoreOfficial`)**: Real-time restock broadcasting and privacy-masked order verification proofs.
5. **Discord Real-Time Buyer Radar (`discord-key-notifier`)**: Standalone gateway microservice monitoring 23 Discord servers in real time, routing high-intent buyer alerts directly to the owner's Telegram.

---

## 2. Active Pricing & License Tier Structure

| Tier Name | Device Capacity | Price (INR) | Price (USD) | Included Features |
|---|---|---|---|---|
| **Standard Tier** | 1 Android Device | **₹160** | **$2.00** | 30 Days • Joystick, Teleport, 100% IV Checker, Quick Catch, Auto-Walk |
| **Duo Tier (Best Value)** | 2 Android Devices | **₹300** *(was ₹320)* | **$3.60** *(was $4.00)* | 30 Days • 2 Concurrent Device Slots, Priority Direct Support |

### 2.1 Key Allocation Policies & Dedicated Vault Control
The vault uploader in `/admin` provides configurable slot allocation policies based on your inventory strategy:
- **1 Device Dedicated (Default & Recommended)**: `1 Key = 1 Customer`. Each key is allocated to exactly one buyer and retired immediately as `full`. Guarantees private, dedicated keys with zero device collisions or sharing between strangers.
- **2 Devices (Duo Tier)**: Key has 2 device slots for 2-device orders or dual-device buyers.
- **3 Devices (Patreon Shared)**: Raw 3-device Patreon licenses dynamically partitioned across up to 3 individual 1-device buyers.

---

## 3. Payment Rails & Whole-Rupee Verification Engine

### 3.1 Clean Whole-Rupee Architecture
- **Eradication of Fractional Paise**: Completely dropped the decimal paise model (`.14`, `.28`). Customers pay clean whole rupees (exact **₹160** or **₹300**), preventing bank payment filters (e.g. SBI, Google Pay, PhonePe, Paytm) from rejecting transactions.
- **Smart-Routing UPI VPAs**:
  - `dhruvmatliwala123@oksbi` (Primary)
  - `dhruvmatliwala123@okicici` (Fastest)
  - `dhruvmatliwala123@okaxis` (High Uptime)
  - `dhruvmatliwala123@okhdfcbank` (Reliable)

### 3.2 24/7 Automated Bank SMS Bridge (`/api/webhooks/upi`)
- Accepts incoming bank credit SMS notifications from Android forwarder apps (e.g., MacroDroid / SMS Forwarder).
- **Anti-Fraud Guard**: Automatically rejects and flags payloads originating from personal 10-digit mobile numbers.
- **Security Guard**: Strictly drops sensitive authentication OTPs and 2FA messages to maintain complete banking privacy.
- **Instant Dual Matching**: Matches either via 12-digit bank UTR reference or whole-rupee FIFO order matching.

### 3.3 International PayPal Direct Rail
- Direct PayPal.me integration (`/api/checkout/paypal` and `/api/checkout/paypal/capture`).
- Instant automated transaction capture and key dispatch.

---

## 4. Direct Key Dispatch (Manual Allocation System)

Allows the administrator to fulfill private sales directly in Telegram or Discord DMs without requiring the customer to go through public checkout:
- **Web Admin Dispatcher**: Available in `/admin` under **Direct Dispatch**. Supports 1-click allocation of 1 Slot, 2 Slots, or 3 Slots (Dedicated Private Key). Instantly decrypts the key on screen, creates an official order record, and updates vault statistics.
- **Telegram Admin Command (`/givekey`)**: The administrator (`ID: 741838315`) can run `/givekey 1 @customer`, `/givekey 2 @customer`, or `/givekey 3` directly inside Telegram for mobile fulfillment.

---

## 5. Automated 48-Hour Expiry & Renewal Subsystem

To maximize customer lifetime value (LTV) and ensure continuous trainer coverage:
- **Automated Cron (`/api/cron/expiry-reminders`)**: Scans active orders nearing the 30-day mark (specifically 48 hours before license expiration).
- **Direct Renewal Links**: Dispatches personalized renewal reminders to Telegram buyers with 1-click renewal instructions.
- **Admin 1-Click Trigger**: Integrated `RUN REMINDERS` button in the Admin Portal header enables instant on-demand scanning with live toast metrics.

---

## 6. Discord Live Buyer Radar (`discord-key-notifier`)

A dedicated standalone Node.js microservice located in `/discord-key-notifier`:
- **Direct WebSocket Gateway**: Connects directly to Discord's live gateway using user credentials, bypassing Cloudflare anti-bot blocks.
- **23-Channel Active Surveillance**: Monitors 23 premier Pokemon GO spoofing, trading, and gaming Discord channels simultaneously.
- **Regex Keyword Matching**: Detects high-intent keywords (`key`, `buy key`, `pgsharp key`, `wtb`) in real time.
- **Telegram Mobile Alerts**: Pushes real-time alerts to the owner's Telegram with user details, matched message snippets, and 1-click "Open in Discord" jump buttons.

## 7. Telegram Bot & Channel Announcement Architecture

The public Telegram infrastructure (`@AetheriaStoreOfficial` and `@AetheriaStoreOfficialBot`) features automated broadcast hooks:
- **Streamlined Restock Flash Alerts**: Whenever keys are uploaded, `broadcastRestockAlert` posts a punchy, high-urgency announcement:
  > ⚡ **KEYS ARE BACK IN STOCK!**
  > 
  > 📦 **Fresh 30-Day keys just loaded into the vault.**
  > Grab yours before this batch runs out! 🚀
  > 
  > **[ Button: 🚀 Get Your Key Instantly ]**
- **Intentional Price-Free Copy**: Pricing was intentionally eliminated from announcement posts to eliminate message clutter, prevent repetitive price spam (since prices are prominently pinned in the channel and website), and ensure restock alerts never become outdated if store pricing evolves.
- **1-Tap Conversion CTA**: Includes an interactive inline button linking directly to `https://t.me/AetheriaStoreOfficialBot?start=restock`, taking customers straight into checkout with 0 friction.
- **Streamlined Order Fulfilled Vouches**: Real-time purchase proofs are automatically dispatched upon payment capture to `@AetheriaStoreOfficial`, masking sensitive buyer tags (e.g. `@sl***` for bot buyers or `dh***@gmail.com` for website buyers) to build community trust while preserving buyer privacy with zero unnecessary receipt clutter:
  > ✅ **ORDER COMPLETED**
  > 
  > 📦 **30-Day PGSharp Key** dispatched to **dh\*\*\*@gmail.com**  
  > 🛡️ Key verified and activated successfully.
  > 
  > **[ Button: ⚡ Order via Bot ]**
- **Dual Storefront Channel Synchronization**: Both Telegram bot purchases and website purchases (automated Bank SMS Bridge UPI, website UTR verification, PayPal Express capture, and PayPal IPN direct matching) are unified and trigger live social proofs in the channel automatically.
- **Atomic Channel Proof Idempotency Guard**: Proof broadcasts are protected by an atomic Firestore transaction lock (`proof_broadcasted: true`). Regardless of webhook retries or multiple manual UTR submissions, each order is guaranteed to broadcast to the channel exactly once.

### 7.1 Viral Telegram Referral & Reward Engine ("Refer & Earn")
The Telegram bot features an autonomous multi-tier customer acquisition and reward engine (`referrals.ts` and `handlers.ts`):
- **Deep Tracking Links**: Any user tapping **`👥 Refer & Earn`** receives their unique personal link (`https://t.me/AetheriaStoreOfficialBot?start=ref_<chatId>`) with 1-tap Telegram native sharing and real-time conversion stats (Friends Clicked, Completed Orders, Rewards Earned).
- **100% Automated Friend Discount (Zero Coupon Required)**: When an invited friend joins via a referral link and hits Start, the bot records the referrer attribution in Firestore. The friend automatically receives **₹30 OFF** on their first purchase (1 Device: **₹130** / $1.70; 2 Devices: **₹270** / $3.00) without needing to copy, paste, or enter any promo code. Both UPI and PayPal payment flows automatically bill the discounted rate.
- **Automated Reward Coupon Issuance**: When the friend's order is verified and completed (via Bank SMS Bridge, PayPal webhook, or manual approval), `processReferralReward` executes anti-abuse validation (blocking self-referral and matching payment identifiers) and creates a unique single-use coupon in Firestore (`REF30_XXXXXX`, ₹30 / $0.50 OFF, `max_uses: 1`).
- **Instant DM Delivery**: The bot instantly messages the referrer with their coupon code.
- **Stackable Renewal Credits**: Referrers can stack multiple earned reward coupons and redeem them on future key renewals by simply sending or tapping the code in the bot chat.
- **Admin Visibility & Deletion**: All referral coupons are stored directly in Firestore, allowing the administrator to inspect, monitor, or permanently delete them from `/admin` at any time.

### 7.2 Native In-Chat UPI QR Delivery & Session Reuse
To guarantee seamless, zero-friction mobile checkouts in Telegram:
- **Dynamic Native QR Photo Delivery**: Rather than relying on fragile 3rd-party UPI intent deep links (which often trigger bank app limits or browser blocks on mobile), the bot dynamically generates and delivers a native high-resolution QR photo PNG buffer directly inside the Telegram chat.
- **Compact Non-Redundant Card Copy**: Features an ultra-clean, minimal checkout interface:
  > **[ 📷 QR Code ]**  
  > 📦 **1 Device (~30 Days)** — **₹160**  
  > 🔑 **UPI ID:** `dhruvmatliwala123@oksbi`  
  > Scan QR or pay via UPI. Key is auto-delivered instantly! ⚡  
  > **[ 💬 Support ]** &nbsp;&nbsp;&nbsp;&nbsp; **[ ⬅️ Back ]**
- **Approximate Duration (~30 Days) Notation**: Acknowledges rare 28–29 day upstream vendor key duration variances to set accurate customer expectations and prevent false disputes.
- **Pending Order Session Reuse**: Prevents database clutter by checking for existing active pending orders for that user/chat before creating a new order. Repeated button clicks update the existing order session instead of generating duplicate abandoned rows in Firestore.

---

## 8. Admin Command Center Modernization & Optimization

- **Decommissioned Obsolete Lead Radar**: Removed rate-limited web/Reddit scrapers. Wiped out 3,086 lines of dead code, dropping the admin bundle size from `32.8 kB` to `23.9 kB` (~27% faster load).
- **Waitlist Timestamp Bug Fix**: Resolved a JavaScript Date parser bug where restock alert dates defaulted to the year 2001. Enforced ISO 8601 timestamps with resilient year-guards for accurate 2026 reporting.
- **Stealth 404 Camouflage ("Ghost Admin")**: Anyone navigating directly to `/admin` without authorization is presented with a convincing, realistic `404 - Page Not Found` error. To automated bots, port scanners, and unauthorized visitors, the admin portal appears non-existent.
- **Dual Unlock Vectors**:
  - **Secret Bookmark (Primary)**: Navigating to `/admin?key=YOUR_SECRET_KEY` validates credentials, persists authorization in secure browser storage, and immediately scrubs the secret parameter from the address bar via `window.history.replaceState`.
  - **Discrete Emergency Modal (Secondary)**: Triple-clicking the "404" badge or pressing `Ctrl + Shift + A` (or `Cmd + Shift + A`) reveals an unobtrusive terminal unlock modal.
- **Anti-Brute-Force IP Rate Limiter (`adminAuth.ts`)**: Failed passcode attempts are tracked per client IP. Reaching 5 failed attempts locks the IP out for 15 minutes (`HTTP 429 Too Many Requests`).
- **Timing-Safe Cryptographic Verification**: All admin authentication comparisons use constant-time `crypto.timingSafeEqual` with SHA-256 digests, eliminating side-channel timing attacks.
- **Pending Approvals Verification Filter**: The admin dashboard's pending approvals queue was refined to strictly display orders with `payment_status == 'verifying'` or orders where the customer actually submitted a UTR / payment proof screenshot. Casual button clicks or abandoned checkout screens are automatically excluded from cluttering the queue.
- **Live Firestore Coupon Engine & Deletion**: Completely eliminated static mock data and hardcoded coupon fallbacks (`VIPDHRUV`, `DISCORDMEMBER`). Built a real-time Firestore synchronization engine with an interactive **`[ Delete ]`** button with confirmation prompts, live creation modal, and empty-state notifications.
- **Streamlined Tab Layout**:
  - Dashboard (Overview & Pending Approvals)
  - Inventory (Tier stock & Usable slots)
  - Direct Dispatch (Manual Key Allocation)
  - Bulk Upload (3-Slot Key Vault Ingestion)
  - Orders & Deliveries (Transaction ledger with 1-click Patreon device clearing)
  - 24/7 UPI Bank Bridge (Live SMS simulation & Webhook status)
  - Coupons (Live Firestore CRUD, promo generation, and 1-click permanent deletion)
  - Waitlist & Demand (Restock notification subscribers)
  - Buyer Reviews (Storefront testimonials moderation)

---

## 9. Cryptographic Vault & API Security

- **AES-256-GCM Encryption at Rest (`crypto.ts`)**: All raw keys stored in Firestore are encrypted using unique 12-byte IVs and 16-byte authentication tags. Raw keys are never stored in plaintext.
- **Atomic Race-Condition Protection**: Firestore transactions guarantee simultaneous buyers never receive the same device slot or duplicate keys.
- **Centralized Constant-Time Admin Guard (`adminAuth.ts`)**: All admin API endpoints (`/api/admin/*`) use constant-time SHA-256 cryptographic verification against `ADMIN_API_SECRET`.
- **UI Information Masking**: Stripped all developer environment variable names and internal IDs from user-facing screens.

---

## 10. Production Route Summary

| Route Path | Method | Type | Core Functionality |
|---|---|---|---|
| `/` | GET | Static | 3-Scene Pinned Cinematic Scrollytelling Showcase |
| `/order-success/[orderId]` | GET | Dynamic | Instant Key Reveal & AES-256-GCM Decryption Screen |
| `/admin` | GET | Static | Protected Key Management, Dispatch & Analytics Dashboard |
| `/contact, /terms, /refund` | GET | Static | Support & Compliance Pages |
| `/api/stock` | GET | Dynamic | Real-time Stock Counters (Cached) |
| `/api/checkout/upi` | POST | Dynamic | Smart Routing & Clean Whole-Rupee Intent Generation |
| `/api/checkout/upi/verify` | POST | Dynamic | UPI Payment Verification & Instant Key Allocation |
| `/api/checkout/paypal` | POST | Dynamic | PayPal v2 Order Creation Endpoint |
| `/api/checkout/paypal/capture` | POST | Dynamic | PayPal Order Capture & Key Dispatch |
| `/api/webhooks/upi` | POST | Dynamic | 24/7 Bank SMS Bridge Webhook with Anti-Fraud Filtering |
| `/api/admin/keys/dispatch` | POST | Dynamic | Manual 1, 2, or 3-Slot Direct Customer Key Dispatch |
| `/api/admin/orders/approve` | POST | Dynamic | 1-Click Manual Proof Approval & Instant Key Release |
| `/api/admin/orders/reject` | POST | Dynamic | 1-Click Manual Proof Rejection & Status Update |
| `/api/cron/expiry-reminders` | GET | Dynamic | Automated 48h License Expiry Scanner & Renewals |
| `/api/telegram/webhook` | POST | Dynamic | Telegram Bot Handler (Checkout, Proofs, Referrals, /givekey) |
| `/api/coupons/validate` | POST | Dynamic | Private VIP Promo Code Server-Side Validation |
| `/api/admin/coupons` | GET/POST/DELETE | Dynamic | Live Admin Coupon CRUD with Instant Permanent Deletion |
| `/api/restock-notify` | POST | Dynamic | Customer Out-of-Stock Email Waitlist Registration |

---

*AETHERIA Systems • Complete Technical Manual • Updated September 2026*
