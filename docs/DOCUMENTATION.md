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
2. **Admin Command Center (`/admin`)**: Protected dashboard for inventory metrics, direct key dispatch, bulk key ingestion, waitlist blast notifications, order approvals, and automated renewal triggers.
3. **Telegram Bot Engine (`@AetheriaStoreOfficialBot`)**: Autonomous conversational bot supporting multi-tier checkout, clean 4-line UPI QR cards with progressive disclosure fallback, automated key delivery in DMs, and viral referral tracking (`/ref`).
4. **Telegram Official Channel (`@AetheriaStoreOfficial`)**: Real-time restock announcements, clean pricing cards, feature comparisons, and official updates.
5. **Telegram Dedicated Vouches Channel (`@AetheriaStoreVouches`)**: Authentic customer delivery screenshots, UPI/PayPal receipts, Discord trade confirmations, and in-game PGSharp activation proofs kept in a dedicated channel to maintain a clean main community.
6. **Discord Real-Time Buyer Radar (`discord-key-notifier`)**: Standalone gateway microservice monitoring 23 Discord servers in real time, routing high-intent buyer alerts directly to the owner's Telegram.
7. **YouTube Live Comment Radar (`youtube-key-notifier`)**: Standalone comment crawler microservice monitoring target creator channels and viral Shorts in real time, routing high-intent buyer leads directly to the owner's Telegram.

---

## 2. Active Pricing & License Tier Structure

| Tier Name | Device Capacity | Price (INR) | Price (USD) | Included Features |
|---|---|---|---|---|
| **Standard Tier** | 1 Android Device | **₹160** | **$2.00** | ~30 Days • Joystick, Teleport, 100% IV Checker, Quick Catch, Auto-Walk |
| **Duo Tier (Best Value)** | 2 Android Devices | **₹300** *(was ₹320)* | **$3.60** *(was $4.00)* | ~30 Days • 2 Concurrent Device Slots, Priority Direct Support |

### 2.1 Key Allocation Policies & Dedicated Vault Control
The vault uploader in `/admin` provides configurable slot allocation policies based on your inventory strategy:
- **1 Device Plan (1 Slot)**: Consumes 1 slot. Prioritizes partially filled keys (1/3 or 2/3 used) to maximize stock efficiency, leaving remaining slots available for other buyers.
- **2 Devices Plan (2 Slots)**: Consumes 2 slots. Automatically pairs with keys having >= 2 available slots.
- **Dedicated Private Key (3 Slots)**: Selects a virgin, untouched 3/3 key and locks it immediately as `status: 'full'` with zero remaining slots. Guarantees 100% exclusive private access with zero strangers sharing.

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

### 3.4 Direct Owner Dispatch Modal (`ENABLE_DIRECT_DISPATCH_MODAL`)
- **Direct Human Connection**: Provides a 1-tap modal connecting buyers directly to the owner on Telegram (`@sleekfx3`), Discord (`@sleekfx3`), or Reddit (`u/dhruv_emperor`), completely eliminating trust friction.
- **Dynamic Pre-Filled Order Text**: Automatically pre-fills the message with the selected tier and price: `Hey Dhruv, I want to buy a PGSharp Standard key for [1 Device / 2 Devices] (30 Days). I will pay with: UPI / PayPal. Please share payment details.`
- **Zero-Loss Reversible Toggle**: Controlled via `ENABLE_DIRECT_DISPATCH_MODAL` in `constants.ts`. Setting to `false` instantly restores the automated UPI QR code and PayPal checkout modals without losing any underlying logic.

---

## 4. Direct Key Dispatch (Manual Allocation System)

Allows the administrator to fulfill private off-platform sales directly in Telegram or Discord DMs without requiring the customer to go through public checkout:
- **Inventory Locking**: Directly reserves 1, 2, or 3 slots atomically in Firestore so no website or bot buyer can ever claim or overwrite this slot.
- **Record Keeping**: Stores recipient handle (`@username` or email) and admin notes in the database for support lookups and auditability.
- **Instant On-Screen Reveal**: Decrypts and shows the **License Key Code** and **Customer Receipt Link** with 1-click `[ Copy Key ]` and `[ Copy Link ]` buttons so the administrator can paste them directly into customer DMs.
- **Telegram Mobile Dispatch (`/givekey`)**: The administrator (`ID: 741838315`) can run `/givekey 1 @customer`, `/givekey 2 @customer`, or `/givekey 3` directly inside Telegram for mobile fulfillment.

---

## 5. Email Delivery & Automated Restock Waitlist Subsystem

### 5.1 Direct Gmail SMTP Delivery (Nodemailer)
- **Zero Custom Domain Requirement**: Uses authenticated Gmail SMTP via `nodemailer` using a 16-character Google App Password (`GMAIL_USER` and `GMAIL_APP_PASSWORD`).
- **Universal Reach**: Sends directly from `dhruvmatliwala336@gmail.com` to any customer email address (Gmail, Yahoo, Outlook, etc.) without sandbox limitations.
- **Branded Sender Display**: Customers see **Aetheria Store** as the sender name in their inbox, and any customer replies go directly to the administrator's personal Gmail.
- **Unified Dispatcher (`resend.ts`)**: Automatically prioritizes Gmail SMTP, falling back to Resend API if Gmail credentials are absent. Powers License Key Delivery, 48-Hour Expiry Reminders, and Restock Waitlist Notifications.

### 5.2 Automated Restock Waitlist Notification System
- **Captures Demand**: Visitors enter their email on the storefront waitlist modal when keys are sold out, saved in `restock_requests`.
- **Automatic Upload Dispatch (`/api/admin/keys`)**: When new keys are added, the server queries pending waitlist subscribers for that plan and automatically sends them a branded restock email (*"⚡ PGSharp Keys Are Back in Stock!"*) with direct order links.
- **One-Click Admin Blast Button (`/api/admin/waitlist/notify`)**: The Waitlist & Demand tab in `/admin` includes an interactive **`[ 📧 Notify All Waiting (X) ]`** button with confirmation prompts and live progress metrics.
- **De-duplication**: Notified subscribers are automatically removed from the database to prevent duplicate emails.

---

## 6. Discord Live Buyer Radar (`discord-key-notifier`)

A dedicated standalone Node.js microservice located in `/discord-key-notifier`:
- **Direct WebSocket Gateway**: Connects directly to Discord's live gateway using user credentials, bypassing Cloudflare anti-bot blocks.
- **23-Channel Active Surveillance**: Monitors 23 premier Pokemon GO spoofing, trading, and gaming Discord channels simultaneously.
- **Regex Keyword Matching**: Detects high-intent keywords (`key`, `buy key`, `pgsharp key`, `wtb`) in real time.
- **Telegram Mobile Alerts**: Pushes real-time alerts to the owner's Telegram with user details, matched message snippets, and 1-click "Open in Discord" jump buttons.

---

## 7. YouTube Live Comment Radar (`youtube-key-notifier`)

A dedicated standalone Node.js microservice located in `/youtube-key-notifier`:
- **Automated Channel & Shorts Discovery**: Ingests uploads from target Pokemon GO / PGSharp channels via zero-quota public RSS feeds, eliminating the need to manually hunt through thousands of Shorts.
- **Auto-Aging & Watchlist Pruning**: Automatically monitors new uploads for 7 days during their peak viewer engagement window, then auto-prunes them to keep the active pool fresh.
- **Custom Pinned Watchlist**: Allows pinning specific evergreen viral videos or tutorials indefinitely via `custom_videos.json`.
- **English & Hinglish Intent Matching**: Detects 36 buyer intent signals (`pgsharp key`, `price`, `cost`, `kitne ka`, `kaise milegi`, `kahan se lu`, `kaise buy kare`, `key chahiye`) with word-boundary regex to prevent false positives.
- **Instant Telegram Mobile Alerts**: Sends clean alerts to the owner's Telegram with commenter name, video title, comment text excerpt, and direct 1-tap jump link to open and reply on YouTube.
- **Zero-Emoji Compliance**: Fully conforms to the strict clean text and zero-emoji formatting rules.
- **Local Health Dashboard**: Built-in HTTP dashboard at `http://localhost:3001` reporting uptime, active watchlist, total comments scanned, and leads caught.

---

## 8. Telegram Bot & Channel Announcement Architecture

### 8.1 Minimal 4-Line QR Screen & Progressive Disclosure
To eliminate customer intimidation, hesitation, and text overload:
- **Clean 4-Line Layout**:
  ```text
  📦 PGSharp Standard (~30 Days) — ₹160
  🔑 UPI ID: dhruvmatliwala123@oksbi
  🔖 Order ID: ord_tg_xxxx

  ⚡ Scan QR or pay ₹160. Key is auto-delivered here within 1–2 minutes!
  ```
- **Primary Fallback Button**: `[ ❓ Paid but didn't get key? ]`
- **Progressive Disclosure on Demand**: Clicking the button reveals comforting guidance without technical jargon:
  ```text
  ⏳ Awaiting Bank Confirmation...
  Bank SMS alerts usually arrive within 1–2 minutes.

  💡 If you paid and want your key right away without waiting:
  Send a screenshot of your Transaction Details (in Google Pay/FamPay, tap on the payment to view full details with the 12-digit UPI ID) or reply with the 12 digits directly!
  ```
- **Tap-Payment Guidance**: Educates customers to tap their completed payment in Google Pay / FamPay to find the 12-digit **UPI transaction ID** rather than confusing banking terms like "UTR".

### 8.2 Viral Telegram Referral & Reward Engine ("Refer & Earn")
- **Deep Tracking Links**: Unique referral links (`https://t.me/AetheriaStoreOfficialBot?start=ref_<chatId>`) with real-time conversion stats.
- **Automated Friend Discount (Zero Coupon Required)**: Friends joining via referral automatically receive **₹30 OFF** on their first purchase (Standard: **₹130**; Duo: **₹270**).
- **Reward Coupon Issuance**: When the friend completes an order, the referrer automatically receives a single-use ₹30 coupon (`REF30_XXXXXX`) redeemable on future renewals.

### 8.3 Community Announcements & Dedicated Vouches Architecture
- **Automated Restock Flash Alerts**: Whenever fresh keys are uploaded to the vault via `/admin`, `broadcastRestockAlert` automatically announces the restock in `@AetheriaStoreOfficial` with a direct 1-tap purchase button (`⚡ KEYS ARE BACK IN STOCK!`).
- **Clean Main Channel Policy**: Automated bot purchase messages (`ORDER COMPLETED dispatched to...`) were decommissioned to keep the main channel sleek and free from repetitive notification spam.
- **Dedicated Vouches Channel (`@AetheriaStoreVouches`)**: Authentic customer proof screenshots (UPI transfers, PayPal receipts, Discord chat confirmations, and in-game PGSharp activation screens) are published in a separate vouches channel with key details properly redacted, establishing unshakeable social proof without cluttering announcements.

---

## 8. Admin Command Center & Vercel Storage Optimization

- **Ghost Admin Camouflage**: Direct visits to `/admin` without authorization display an authentic `404 - Page Not Found`. Accessible only via secret bookmark (`/admin?key=YOUR_SECRET_KEY`) or triple-clicking the 404 badge.
- **Anti-Brute-Force Rate Limiting**: Client IP locked after 5 failed passcode attempts for 15 minutes.
- **Live Firestore Coupon Engine**: Interactive CRUD for promotional coupons with 1-click permanent deletion.
- **Vercel Deployment Storage Optimization**: Automated cleanup tooling (`cleanup_deployments.js`) purges historical preview builds via the Vercel REST API, reducing deployment storage from 16.91 GB to ~0.65 GB (well under the 10 GB free ceiling).

---

## 9. Sales Conversion Assets, Cooldown Guide & Live Events

- **Free vs Standard Comparison Engine (`/features`, `/compare`)**: High-converting sales comparison detailing the limitations of PGSharp Free (15-second catch animations, blind catches without stats, no shiny scanner, manual joystick fatigue) vs the advantages of PGSharp Standard (1-second Quick Catch, 100% IV encounter preview, block non-shiny encounters, hands-free GPX auto-walk, instant skip cutscenes, guaranteed 100% excellent throws).
- **Anti-Ban Cooldown & Safety Guide (`/cooldown`, `/safety`)**: Comprehensive reference guide with distance cooldown chart (1 km to 1,350+ km global max of 120 mins), explicit breakdown of cooldown-triggering actions (balls, berries, gym battles, spins) versus safe actions (teleporting, IV inspection, egg hatching, trading).
- **Direct Scanner Webhook (`/api/pokemon/spawns`)**: High-performance ingestion endpoint for raw scanner telemetry (Golbat, Poracle, MAD, RDM formats) with 20-minute in-memory de-duplication cache.
- **National Pokédex Database (1,025 Species) & Fuzzy Search**: Typo-tolerant Levenshtein search supporting natural queries (`Greyninja` ➔ `Greninja`, `Swampert 1/14/15`).
- **Live Events Calendar (`/api/pokemon/events`)**: Real-time event and raid boss rotations accessible via `/events`.

---

## 10. Production Route Summary

| Route Path | Method | Type | Core Functionality |
|---|---|---|---|
| `/` | GET | Static | 3-Scene Pinned Cinematic Scrollytelling Showcase |
| `/order-success/[orderId]` | GET | Dynamic | Instant Key Reveal & AES-256-GCM Decryption Screen |
| `/admin` | GET | Static | Protected Key Management, Dispatch & Analytics Dashboard |
| `/contact, /terms, /refund` | GET | Static | Support & Compliance Pages |
| `/api/stock` | GET | Dynamic | Real-time Stock Counters (Cached, s-maxage=10) |
| `/api/stock/[planId]` | GET | Dynamic | Individual Plan Stock Availability Query |
| `/api/checkout/upi` | POST | Dynamic | Clean Whole-Rupee Intent & Native Dynamic QR Code Generation |
| `/api/checkout/upi/verify` | POST | Dynamic | UPI Payment Verification & Instant Key Allocation |
| `/api/checkout/paypal` | POST | Dynamic | PayPal.me Pre-filled Direct URL Generator ($2.00 / $3.60) |
| `/api/checkout/paypal/capture` | POST | Dynamic | PayPal Order Capture & Key Dispatch |
| `/api/checkout/paypal/verify` | POST | Dynamic | PayPal Transaction ID Verification & Key Reveal |
| `/api/webhooks/paypal` | POST | Dynamic | PayPal IPN Asynchronous Webhook Verification |
| `/api/webhooks/upi` | POST | Dynamic | 24/7 Bank SMS Bridge Webhook with Anti-Fraud Filtering |
| `/api/admin/keys` | POST/GET | Dynamic | Batch Key Ingestion with 3-Slot Tagging & Waitlist Alert Trigger |
| `/api/admin/keys/dispatch` | POST | Dynamic | Manual 1, 2, or 3-Slot Direct Customer Key Dispatch |
| `/api/admin/waitlist/notify` | POST | Dynamic | Dispatches Restock Alert Emails to Waiting Customers via Gmail SMTP |
| `/api/admin/orders/approve` | POST | Dynamic | 1-Click Manual Proof Approval & Instant Key Release |
| `/api/admin/orders/reject` | POST | Dynamic | 1-Click Manual Proof Rejection & Status Update |
| `/api/admin/orders/quick-approve`| POST | Dynamic | Discord 1-Click Quick Approval Action Endpoint |
| `/api/admin/orders/quick-reject` | POST | Dynamic | Discord 1-Click Quick Rejection Action Endpoint |
| `/api/admin/stats` | GET | Dynamic | Administrative Inventory Metrics, Revenue Totals & Slot Analytics |
| `/api/admin/coupons` | GET/POST/DELETE | Dynamic | Live Admin Coupon CRUD with Instant Permanent Deletion |
| `/api/coupons/validate` | POST | Dynamic | Private VIP Promo Code Server-Side Validation |
| `/api/cron/expiry-reminders` | GET | Dynamic | Automated 48h License Expiry Scanner & Renewals |
| `/api/restock-notify` | POST | Dynamic | Customer Out-of-Stock Email Waitlist Registration |
| `/api/pokemon/spawns` | GET/POST | Dynamic | Live Pokémon Scanner Webhook Ingestion & Alert Dispatch |
| `/api/pokemon/events` | GET | Dynamic | Pokémon GO Live Events & Raid Boss Rotation Calendar |
| `/api/telegram/webhook` | POST | Dynamic | Telegram Bot Handler (Checkout, Proofs, Referrals, /givekey, Radar) |
| `/api/telegram/setup` | POST | Dynamic | Automated Telegram Webhook Registration & Command Menu Setup |
| `/api/reviews` | GET/POST | Dynamic | Verified Customer Reviews Ingestion & Aggregate Rating Feed |

---

*AETHERIA Systems • Complete Technical Manual • Updated September 2026*
