# AETHERIA — Complete Technical & Engineering Manual

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
8. **Telegram Live Group Radar (`telegram-key-notifier`)**: Standalone MTProto listener microservice monitoring 9 high-traffic Indian Pokemon GO and PGSharp trading groups in real time, routing high-intent buyer leads directly to the owner's Telegram.

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
- **Direct Human Connection**: Provides a clean 1-tap modal connecting buyers directly to the owner on Telegram (`@sleekfx3`), Discord (`dhruv_emperor` / ID `503233296134832149`), or Reddit (`u/dhruv_emperor`), completely eliminating trust friction.
- **Natural One-Line Pre-Filled Order Text**: Automatically pre-fills natural conversational text:
  - 1 Device: `Hey Dhruv, I want to buy a PGSharp Standard key for 1 Device.`
  - 2 Devices: `Hey Dhruv, I want to buy a PGSharp Standard key for 2 Devices.`
- **Zero-Loss Reversible Toggle**: Controlled via `ENABLE_DIRECT_DISPATCH_MODAL` in `src/lib/constants.ts`. Setting to `false` instantly restores the automated UPI QR code and PayPal checkout modals without losing any underlying logic.
- **Focused Navigation**: The "My Keys" customer vault header button is automatically hidden while direct modal mode is enabled to keep the interface streamlined.

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
- Direct delivery via Gmail SMTP (`service: 'gmail'`) authenticated through the owner's Gmail account (`dhruvmatliwala336@gmail.com`).
- Eliminates custom domain verification barriers and delivers reliably to all customer domains.
- Powers automated restock notices, license deliveries, and 48-hour expiration reminders.

### 5.2 Automated Restock Waitlist Notification System
- **Captures Demand**: Visitors enter their email on the storefront waitlist modal when keys are sold out, saved in `restock_requests`.
- **Automatic Upload Dispatch (`/api/admin/keys`)**: When new keys are added, the server queries pending waitlist subscribers for that plan and automatically sends them a branded restock email (*"PGSharp Keys Are Back in Stock!"*) with direct order links.
- **One-Click Admin Blast Button (`/api/admin/waitlist/notify`)**: The Waitlist & Demand tab in `/admin` includes an interactive **`[ Notify All Waiting (X) ]`** button with confirmation prompts and live progress metrics.
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

A dedicated standalone Node.js microservice running 24/7 on the cloud (`https://youtube-key-notifier.onrender.com`):
- **Automated Channel & Shorts Discovery**: Ingests uploads from target Pokemon GO / PGSharp channels via zero-quota public RSS feeds, eliminating the need to manually hunt through thousands of Shorts.
- **Auto-Aging & Watchlist Pruning**: Automatically monitors new uploads for 7 days during their peak viewer engagement window, then auto-prunes them to keep the active pool fresh.
- **Refined Buyer Intent Filter (33 Keywords)**: Detects high-intent English and Hinglish phrases (`pgsharp key`, `standard key`, `buy key`, `kitne ka`, `kaise milegi`, `kahan se lu`, `kaise buy kare`, `key chahiye`) with word-boundary regex. Generic non-key terms (`price`, `cost`, `how much`) were purged to prevent false alerts.
- **Self-Comment Filter**: Automatically detects and ignores comments posted by `@dhruv_emperor` and `Aetheria Store`.
- **Strict Timestamp Cut-Off**: Only comments and replies posted after **16-Sep-2026 5:36:00 PM IST** (`2026-09-16T12:06:00Z`) trigger alerts. All older comments are ignored.
- **Instant Telegram Mobile Alerts**: Sends clean alerts to the owner's Telegram (`741838315`) with commenter name, video title, comment text excerpt, and direct 1-tap jump link to open and reply on YouTube.
- **24/7 Cloud Engine**: Deployed to Render with UptimeRobot 5-minute HTTP ping to guarantee perpetual uptime with zero local PC dependency.

---

## 8. Telegram Live Group Radar (`telegram-key-notifier`)

A dedicated standalone Node.js microservice running 24/7 on the cloud (`https://telegram-key-notifier.onrender.com`):
- **Direct MTProto Client Connection**: Utilizes GramJS MTProto client authenticated via secure session string to passively listen in real time across 9 joined Indian Pokemon GO and PGSharp trading groups:
  1. `PoGoGuideYT12` (PoGoGuide YT)
  2. `INDIANPOGO` (Indian Pokemon go Community)
  3. `UnofficialCreators` (Unofficial Creator)
  4. `Pokeprince79` (Poke Prince)
  5. `memberpgsharp` (Pgsharp Keys)
  6. `free_pgsharp_keys_old` (POKEMON GO TRAINER'S)
  7. `pgsharpkeyfree1` (Pokemon Go Official)
  8. `Lakshya0712345` (Pgsharp free keys Chat)
  9. `membersofpgsharpkeys` (Pgsharp chat group for key)
- **Strict Timestamp Cut-Off**: Only messages posted after **17-Sep-2026 10:53:00 PM IST** (`2026-09-17T17:23:00Z`) are evaluated. All historical messages are ignored.
- **33 High-Intent Buyer Keywords**: Word-boundary regex matching for English and Hinglish buyer signals (`key`, `pgsharp key`, `standard key`, `buy key`, `kitne ka`, `kaise milegi`, `kahan se lu`, `kaise buy kare`, `key chahiye`).
- **Self-Sender Exclusion**: Automatically detects and ignores messages sent by the owner (`@sleekfx3` / ID `741838315`).
- **Zero-Emoji Mobile Alerts**: Immediately pushes formatted alert cards to the owner's Telegram with group title, commenter name/username, exact message snippet, and a 1-tap direct jump link (`https://t.me/{chat}/{messageId}`).
- **Automated Discord Vouch Mirroring**: Continuously monitors the owner's Telegram vouches channel (`@AetheriaStoreVouches`). Whenever a new vouch with customer screenshot proof is posted in Telegram, the microservice automatically downloads the media, cleans the caption (stripping promotional footers and emojis), and instantly mirrors it directly into the Discord `#vouches` channel via the Discord bot API.
- **24/7 Cloud Engine**: Deployed to Render with UptimeRobot 5-minute keep-awake ping to guarantee perpetual uptime.

---

## 9. Reddit Real-Time Lead Radar (F5Bot & Telegram Bridge)

A dedicated continuous surveillance pipeline monitoring Reddit communities (including `r/PoGoAndroidSpoofing`, `r/PokemonGoSpoofing`, and related forums):
- **Continuous Subreddit & Comment Ingestion**: Powered by F5Bot's background ingestion pipeline to bypass Reddit's API restrictions and datacenter rate-limit blocking.
- **5 High-Intent Buyer Monitors**:
  1. `pgsharp key` (Matches all direct key requests, buying threads, and sharing queries)
  2. `standard key` (Matches users specifically seeking the paid Standard edition)
  3. `buy pgsharp` (Matches high-intent purchase inquiries and card bypass questions)
  4. `pgsharp payment` (Detects customers experiencing card declines on the official site)
  5. `pgsharp license` (Catches license renewals, questions, and expiration help)
- **Zero-False-Positive Filtering**: Configured with strict "Whole words only" matching and restricted strictly to Reddit domains to prevent non-gaming or tech news false positives.
- **Isolated Secondary Gmail Architecture**: Utilizes an isolated alert email address disconnected from personal inboxes, ensuring complete personal data security and privacy.
- **Instant Telegram Push Routing (`@GmailBot`)**: Integrated with Telegram's official `@GmailBot` bridge. Alert emails trigger instantaneous mobile push notifications in Telegram containing the post title, excerpt, and 1-tap direct link to reply or send a private chat.

---

## 10. Telegram Bot & Channel Announcement Architecture

### 10.1 Minimal 4-Line QR Screen & Progressive Disclosure
To eliminate customer intimidation, hesitation, and text overload:
- **Clean 4-Line Layout**:
  ```text
  PGSharp Standard (~30 Days) — ₹160
  UPI ID: dhruvmatliwala123@oksbi
  Order ID: ord_tg_xxxx

  Scan QR or pay ₹160. Key is auto-delivered here within 1–2 minutes!
  ```
- **Primary Fallback Button**: `[ Paid but didn't get key? ]`
- **Progressive Disclosure on Demand**: Clicking the button reveals comforting guidance without technical jargon:
  ```text
  Awaiting Bank Confirmation...
  Bank SMS alerts usually arrive within 1–2 minutes.

  If you paid and want your key right away without waiting:
  Send a screenshot of your Transaction Details (in Google Pay/FamPay, tap on the payment to view full details with the 12-digit UPI ID) or reply with the 12 digits directly!
  ```
- **Tap-Payment Guidance**: Educates customers to tap their completed payment in Google Pay / FamPay to find the 12-digit **UPI transaction ID** rather than confusing banking terms like "UTR".

### 10.2 Viral Telegram Referral & Reward Engine ("Refer & Earn")
- **Deep Tracking Links**: Unique referral links (`https://t.me/AetheriaStoreOfficialBot?start=ref_<chatId>`) with real-time conversion stats.
- **Automated Friend Discount (Zero Coupon Required)**: Friends joining via referral automatically receive **₹30 OFF** on their first purchase (Standard: **₹130**; Duo: **₹270**).
- **Reward Coupon Issuance**: When the friend completes an order, the referrer automatically receives a single-use ₹30 coupon (`REF30_XXXXXX`) redeemable on future renewals.
- **Milestone Rewards**: Scaled milestone rewards (3 invites = 50% Off, 5 invites = 1 Free Standard Key for 30 Days).
- **Anti-Fraud Protections**: Device and IP fingerprinting, strict chat ID deduplication, and self-referral blocks.

### 10.3 Community Announcements & Dedicated Vouches Architecture
- **Automated Restock Flash Alerts**: Whenever fresh keys are uploaded to the vault via `/admin`, `broadcastRestockAlert` automatically announces the restock in `@AetheriaStoreOfficial` with a direct 1-tap purchase button (`KEYS ARE BACK IN STOCK!`).
- **Clean Main Channel Policy**: Automated bot purchase messages (`ORDER COMPLETED dispatched to...`) were decommissioned to keep the main channel sleek and free from repetitive notification spam.
- **Dedicated Vouches Channel (`@AetheriaStoreVouches`)**: Authentic customer proof screenshots (UPI transfers, PayPal receipts, Discord chat confirmations, and in-game PGSharp activation screens) are published in a separate vouches channel with key details properly redacted, establishing unshakeable social proof without cluttering announcements.

---

## 11. Admin Command Center & Vercel Storage Optimization
- **Unified Inventory Dashboard (`/admin`)**: Real-time stats on available keys, low-stock threshold alerts, pending orders, and restock waitlist count.
- **Manual Key Allocation System**: Dedicated UI tab to directly allocate standard or duo keys to custom customer identifiers (Discord, Telegram, Reddit, Email) without website payment friction.
- **Automated Waitlist Blast**: One-click and auto-on-upload restock alerts emailed to all waiting customers via direct Gmail SMTP.
- **Storage Optimization**: Firestore indexing and bounded document queries to minimize database read/write costs.
- **Ghost Admin Camouflage**: Direct visits to `/admin` without authorization display an authentic `404 - Page Not Found`. Accessible only via secret bookmark (`/admin?key=YOUR_SECRET_KEY`) or triple-clicking the 404 badge.
- **Anti-Brute-Force Rate Limiting**: Client IP locked after 5 failed passcode attempts for 15 minutes.
- **Live Firestore Coupon Engine**: Interactive CRUD for promotional coupons with 1-click permanent deletion.
- **Vercel Deployment Storage Optimization**: Automated cleanup tooling (`cleanup_deployments.js`) purges historical preview builds via the Vercel REST API, reducing deployment storage from 16.91 GB to ~0.65 GB (well under the 10 GB free ceiling).

---

## 12. Sales Conversion Assets, Cooldown Guide & Live Events

- **Free vs Standard Comparison Engine (`/features`, `/compare`)**: High-converting sales comparison detailing the limitations of PGSharp Free (15-second catch animations, blind catches without stats, no shiny scanner, manual joystick fatigue) vs the advantages of PGSharp Standard (1-second Quick Catch, 100% IV encounter preview, block non-shiny encounters, hands-free GPX auto-walk, instant skip cutscenes, guaranteed 100% excellent throws).
- **Anti-Ban Cooldown & Safety Guide (`/cooldown`, `/safety`)**: Comprehensive reference guide with distance cooldown chart (1 km to 1,350+ km global max of 120 mins), explicit breakdown of cooldown-triggering actions (balls, berries, gym battles, spins) versus safe actions (teleporting, IV inspection, egg hatching, trading).
- **Direct Scanner Webhook (`/api/pokemon/spawns`)**: High-performance ingestion endpoint for raw scanner telemetry (Golbat, Poracle, MAD, RDM formats) with 20-minute in-memory de-duplication cache.
- **National Pokedex Database (1,025 Species) & Fuzzy Search**: Typo-tolerant Levenshtein search supporting natural queries (`Greyninja` -> `Greninja`, `Swampert 1/14/15`).
- **Live Events Calendar (`/api/pokemon/events`)**: Real-time event and raid boss rotations accessible via `/events`.

---

## 13. Production Route Summary

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
| `/api/admin/crm/sales` | GET/POST/PUT/DELETE | Dynamic | Google Cloud Firestore Persistence Bridge for CRM Sales Records |
| `/crm` | GET | Protected HTML | Customer Renewal CRM Dashboard: Gated by Master Passcode Lock Screen |
| `/api/crm/login` | POST | Dynamic | CRM Master Passcode Authentication & 1-Year Session Cookie Dispenser |
| `/api/crm/logout` | POST | Dynamic | CRM Session Invalidation & Cookie Revocation Endpoint |
| `/api/sales` | GET | Dynamic | CRM Sales Retrieval API with Pending Days Ordering (Requires Auth Token) |
| `/api/sales/update` | POST | Dynamic | CRM Record Update Endpoint for Customer, Plan, Email, and Expiry Edits |
| `/api/renew` | POST | Dynamic | Interactive Key Renewal Endpoint: Updates Devices, Source Email, and Expiry |
| `/api/delete` | POST | Dynamic | Permanent CRM Record Deletion & Cloud Archival Endpoint |
| `/googlec8c6c8ae927a0074.html` | GET | Static | Google Search Console Site Ownership Verification Protocol |
| `/sitemap.xml` | GET | Dynamic | Dynamic SEO Sitemap Feed for Google Search Console Indexing |
| `/robots.txt` | GET | Dynamic | Crawler Access Directives & Sitemap Declarations |

---

## 14. Customer Renewal & Expiration CRM Engine (`/crm`)

A dedicated, standalone customer lifecycle and license retention dashboard hosted on Render within `telegram-key-notifier` (`https://telegram-key-notifier.onrender.com/crm`), providing complete visibility over all customer keys across platforms:

### 14.1 Multi-Account Source Email Tracking & Key Distribution
- **Source Email Inventory Tracking**: Tracks which of the owner's 11+ PGSharp/Patreon Google accounts holds each customer key, preventing overselling or slot confusion across distributed keys.
- **Real-Time Distribution Overview Bar**: Positioned above the table, an interactive distribution card displays key load per email account with color-coded load badges (e.g. `dhruvmatliwala336+5@gmail.com: 4 keys`).
- **1-Click Email Isolation**: Clicking any email pill or table email badge immediately filters the entire table to show only keys provisioned under that specific account.
- **Source Email Filter Dropdown**: Filter dropdown in the controls bar displays dynamic key count metrics alongside account addresses.

### 14.2 Pending Days Dynamic Ordering & Clustered Grouping
- **Pending Days Ordering (Default View)**: Automatically orders licenses by pending days remaining (Lowest First / Expiring Soonest) so the owner immediately spots expiring keys at the top of the interface.
- **Group Same Emails Together**: Sort mode that clusters all customer rows sharing the identical source email address consecutively, sub-sorted internally by fewest pending days remaining.
- **Interactive Column Header Sorting**: Clicking the 'Expiry / Days Left' column header toggles between ascending (fewest days left first) and descending sort orders with visual indicators.

### 14.3 Interactive Renewal Modal Engine
- **Contextual Pre-filling**: Clicking 'Renew' on any row launches a dedicated modal pre-populated with customer name, current device plan, platform, source email, and contact handle.
- **Flexible Account Reassignment**: Allows updating the source email account during renewal, enabling smooth migration to accounts with available slots.
- **Device Plan Flexibility**: Easily switches or upgrades customer tiers between 1 Device (Standard - Rs 160) and 2 Devices (Duo - Rs 300).
- **Custom Date Presets & Manual Calendar**: Provides 1-click extension buttons (+30D, +25D, +20D, +15D, +10D, +7D, Today + 30D) or a manual calendar picker with live renewal and reminder preview calculation.

### 14.4 Automated Day-27 Proactive Telegram Reminders
- **3-Day Advance Retention Radar**: A background cron scans active customer licenses every 30 minutes. Exactly 3 days before expiration (Day 27 on 30-day keys), an automated notification is dispatched to Dhruv's Telegram (ID: 741838315).
- **Actionable Notification Payload**: Alert message provides customer name, contact handle, plan, source account email, exact expiry date, and days remaining with direct renewal prompts.

### 14.5 Slot-Proportional Profit & Revenue Engine
- **Slot-Proportional Cost Architecture**: Calculates profit based on Patreon's flat Rs 200 cost for a 3-device key (Rs 67 per slot). 1 Device costs Rs 67 (Profit: +Rs 93 / +Rs 63 ref), 2 Devices costs Rs 133 (Profit: +Rs 167 / +Rs 137 ref), and 3 Devices costs Rs 200 (Profit: +Rs 200 / +Rs 170 ref).
- **3-Device Plan Support (Rs 400)**: Added full 3-Device key plan to Log Sale, Edit, and Renew modals alongside 1 Device (Standard - Rs 160) and 2 Devices (Duo - Rs 300).
- **1-Click Pricing & Discount Presets**: Modal controls include [ Standard Price ], [ -30 Referral ], and custom amount inputs with live real-time net profit and margin calculation banners.
- **Top Financial Analytics Card**: Dedicated dashboard banner above the CRM table tracking Total Revenue, Patreon Inventory Costs, Net Profit, and Overall Margin across all tracked sales.
- **Historical Baseline Isolation**: All pre-existing records entered prior to launch are flagged as untracked legacy records, preserving their reminder schedules while keeping the new profit ledger 100% accurate.

### 14.6 CRM Security Lock & Persistent Master Passcode Gate
- **Restricted Obsidian Lock Screen**: Unauthenticated visitors navigating to `/crm` are blocked by a secure dark-mode login gate that prevents unauthorized viewing or extraction of customer names, emails, contact handles, and profit data.
- **High-Entropy Master Passcode**: Protected via high-entropy 28-character security passcode (`Aeth$9xK!7mP_2vQ-8zL4.dY~2026`), with fallback validation against `ADMIN_API_SECRET`.
- **1-Year Persistent Browser Session**: Authenticating sets a 1-year SameSite cookie and synchronizes with localStorage, allowing seamless access across device restarts without needing to re-type the passcode every time.
- **1-Click Bookmark URL Authentication**: Visiting `/crm?auth=PASSCODE` instantly authenticates the browser, saves credentials, and strips the secret from the address bar for effortless 1-click access.
- **API Endpoint Security Shield**: All backend endpoints (`/api/sales`, `/api/sales/update`, `/api/renew`, `/api/delete`) enforce token validation and reject unauthenticated requests with HTTP 401 Unauthorized.

---

## 15. Google Cloud Firestore Persistent CRM Storage Bridge

To guarantee zero data loss on Render's ephemeral container filesystem, the CRM is wired directly to Google Cloud Firestore (`pgsharp-4587b`):
- **Container Rebuild Immunity**: Because Docker containers reset on redeployments, local `sales.json` storage is automatically backed by Firestore collection `crm_sales`, ensuring no customer record is ever lost on git pushes or server restarts.
- **Dedicated REST API Bridge (`/api/admin/crm/sales`)**: High-performance endpoint in the Next.js storefront backend handling GET, POST, PUT, and DELETE operations against Firestore.
- **Cryptographic API Secret Authorization**: Secured via constant-time SHA-256 header authentication (`x-admin-secret`) matching `ADMIN_API_SECRET`.
- **Bi-directional Startup Hydration**: On container boot, `initCrmDatabase` queries Firestore and populates memory and local disk. When sales are entered or renewed, updates are synchronously applied locally and pushed asynchronously to Firestore.

---

## 16. Discord Interactive Order Ticket Bot & Vouches Synchronization

### 16.1 Persistent Gateway WebSocket Ticket Bot
- **Gateway Architecture**: Persistent WebSocket connection (`gateway.discord.gg v10`) running 24/7 on Render within `telegram-key-notifier`.
- **Interactive Button Component**: Message `1550381786234626081` in `#pricing-and-keys` (`1550381744509685901`) features an interactive green `[ Open Order Ticket ]` button.
- **Private Mutual Ticket Rooms**: Dynamically provisions private channel `#ticket-<username>` hidden from `@everyone` with explicit read/write permission overwrites for the buyer, Dhruv (`503233296134832149` / `@dhruv_emperor`), and the bot.
- **Profile Transparency & Trust**: Both the customer and owner see each other's verified profiles, avatar, and direct chat within the room, completely resolving off-platform trust friction.
- **Instant Telegram Mobile Jump Alert**: Dispatches an immediate Telegram alert to Dhruv (`741838315`) with an inline button URL opening Discord directly into the ticket room.
- **Self-Closing Architecture**: Interactive `[ Close Ticket ]` button allows either party to close and delete the ticket channel upon transaction completion.

### 16.2 Cross-Platform Vouches Mirroring Engine
- **Autonomous Telegram-to-Discord Forwarding**: Monitors approved proof screenshots posted in Telegram channel `@AetheriaStoreVouches`.
- **Rich Discord Embeds**: Automatically forwards customer receipts, bank confirmations, and activation screenshots into Discord channel `#vouches` (`1550381748506988584`) with styled embeds.

---

## 17. Google Search Console Verification & SEO Optimization

- **Dual-Layer Ownership Verification**: Verified via static HTML verification file (`/googlec8c6c8ae927a0074.html`) and layout metadata tag (`<meta name="google-site-verification" content="googlec8c6c8ae927a0074" />`).
- **Dynamic XML Sitemap (`/sitemap.xml`)**: Generates dynamic URL index with daily crawl frequency for root storefront and monthly indexing for legal compliance routes.
- **Crawler Directives (`/robots.txt`)**: Allows global indexing for public storefront routes while disallowing sensitive `/admin` and `/api` endpoints.
- **Rich Structured Schema JSON-LD**: Embeds Schema.org OnlineStore and Product schemas with localized INR and USD pricing, stock availability, and verified customer review aggregates.

---

## 18. Operational Runbook & CI/CD Deployment Guide

Instructions for running, maintaining, and deploying AETHERIA in production:
- **Environment Configuration (`.env.local`)**: Configure all required keys: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `KEY_ENCRYPTION_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_PROOF_CHANNEL`, and `ADMIN_API_SECRET`.
- **Local Development Server**: Execute `npm run dev` to launch on `http://localhost:3000`.
- **Production Verification Build**: Execute `npm run build` — verifies compilation and TypeScript validity across all routes.
- **Automated Vercel Deployment**: Pushing commits to branch `main` automatically triggers Vercel CI/CD pipeline, deploying to `https://aetheria-store.vercel.app` with zero downtime.
- **Automated Render Deployment**: Pushing commits to branch `main` in `telegram-key-notifier` automatically triggers Render container build and deployment with automatic Firestore synchronization.

---

*AETHERIA Systems • Complete Technical Manual • Updated September 2026*

