# 🌌 AETHERIA — Studio-Grade PGSharp Digital Storefront

A luxury digital license key storefront engineered with **Next.js 14 (App Router)**, **GSAP Scrollytelling**, **Modular Multi-Theme Engine**, and **Atomic AES-256-GCM Digital Key Delivery** across **Direct UPI QR (India)** and **PayPal (International)**.

---

## 📑 Table of Contents
1. [Project Overview & Capabilities](#-project-overview--capabilities)
2. [Multi-Theme Architecture (The 3 Official Themes)](#-multi-theme-architecture)
3. [Payment Systems & Instant Key Dispatch](#-payment-systems--instant-key-dispatch)
4. [Security & Atomic Key Allocation](#-security--atomic-key-allocation)
5. [Complete Tech Stack](#-complete-tech-stack)
6. [Clean Directory Structure](#-clean-directory-structure)
7. [API Route Specifications](#-api-route-specifications)
8. [Setup & Environment Variables](#-setup--environment-variables)
9. [Deployment & Production Build](#-deployment--production-build)

---

## 🚀 Project Overview & Capabilities

**AETHERIA** is engineered to deliver an award-winning user experience for purchasing PGSharp Android Standard 30-day license keys.

### 🌟 Key Highlights
- **Multi-Theme Engine (`src/config/theme.ts` & `src/themes/`)**: 3 fully-isolated storefront themes (Obsidian, Motion, Nexus) switchable via single config variable or instant URL query parameter (`?theme=...`).
- **Direct Native UPI Payment Flow**: Dynamic paise allocation (e.g., ₹180.14) preventing collision, instant QR code rendering via `qrcode.react`, and manual UTR verification or bank SMS auto-match.
- **Discord 1-Click Approval System**: Instant admin webhook notification with cryptographic 1-click `[Approve]` and `[Reject]` action buttons.
- **PayPal Client & Webhook Integration**: Native PayPal JS SDK modal checkout with real-time server capture and IPN webhook listener.
- **Customer Order Vault (`CustomerVaultModal.tsx`)**: Header lookup widget allowing customers to recover their purchased keys and view receipt history using their email or phone number.
- **Full-Screen Cinematic Preloader (`Preloader.tsx`)**: 3-phase GSAP splash intro with glowing delta emblem, character-split reveal, cyber pulse line, and sessionStorage persistence.
- **Ambient Background Audio Subsystem (`AmbientAudioContext.tsx`)**: Global audio singleton (`/audio/ambient.mp3`) capped at 25% target volume with smooth 300ms cross-fading ramps and frosted HUD controls.
- **Post-Purchase Key Reveal (`/order-success/[orderId]`)**: Holographic encrypted key vault with click-to-reveal blur, 1-click copy confetti burst, detailed receipt breakdown, and 4-step PGSharp activation guide.
- **Live Inventory & Smart Restock Waitlist**: Real-time stock counters with auto-purging waitlist lifecycle and admin restock notifications.
- **Admin Command Center (`/admin`)**: Protected dashboard for bulk key uploads, inventory counts, pending payment approvals, coupon management, and transaction audits.

---

## 🎨 Multi-Theme Architecture

The storefront features 3 official theme identities:

| Theme ID | Official Name | Engine / Codename | Best For | Status |
|---|---|---|---|---|
| `obsidian` | **Aetheria Obsidian** | High-Res Frame Scrollytelling Engine | Mobile, budget phones, zero GPU load, instant load | **Active Default** |
| `motion` | **Aetheria Motion** | 1440p Live Video Scrollytelling Runway | Desktop immersion, high-performance GPUs | **Backup 1** |
| `nexus` | **Aetheria Nexus** | Classic Modular Cyber E-Commerce Grid | Traditional direct buyers, classic vertical layout | **Backup 2** |

### Live Preview via URL
Preview any theme in real-time by appending `?theme=<id>`:
- **Obsidian**: `http://localhost:3000/` or `http://localhost:3000/?theme=obsidian`
- **Motion**: `http://localhost:3000/?theme=motion`
- **Nexus**: `http://localhost:3000/?theme=nexus`

### Permanent Theme Switch
In [`src/config/theme.ts`](file:///f:/Pgsharp/src/config/theme.ts):
```typescript
export const ACTIVE_STORE_THEME: StoreThemeId = 'obsidian'; // 'obsidian' | 'motion' | 'nexus'
```

---

## 💳 Payment Systems & Instant Key Dispatch

| Plan Name | Device Slots | Price (INR) | Price (USD) | Delivery Speed | Features |
|---|---|---|---|---|---|
| **1 Device Plan** | 1 Device | ₹180 | $1.99 | < 10 Seconds | Teleport, Joystick, 100% IV Feed, Fast Catch, Auto-Walk |
| **2 Devices Plan** (Popular) | 2 Devices | ₹340 | $3.99 | < 10 Seconds | Multi-device sync, Raid Radar, Spawn Booster, Priority Support |

### 1. Direct UPI Flow (India — INR)
1. User selects plan in `CheckoutModal`.
2. Server allocates dynamic paise offset via `allocateUniquePaise()` (e.g. ₹180.14) to uniquely identify the transfer without third-party gateway fees.
3. User scans dynamic UPI QR or taps deep-link for GPay, PhonePe, or Paytm.
4. User submits 12-digit UTR transaction reference.
5. System verifies transaction via SMS webhook auto-matching or sends instant Discord alert with 1-click `[Approve]` button.
6. Upon approval, an atomic Firestore transaction decrypts and assigns the key, dispatches an HTML email via Resend, and reveals the key on screen.

### 2. PayPal Flow (Worldwide — USD)
1. User switches to USD tab in `CheckoutModal`.
2. PayPal SDK loads native buttons inside the modal.
3. On transaction authorization, `/api/checkout/paypal/capture` captures payment.
4. License key is immediately assigned via atomic Firestore transaction and displayed.

---

## 🔒 Security & Atomic Key Allocation

### 1. Zero-Trust AES-256-GCM Encryption (`crypto.ts`)
- All license keys stored in Firebase Cloud Firestore are encrypted with **AES-256-GCM** using a 32-byte secret key and 16-byte initialization vector.
- Plaintext keys never touch public APIs or client-side storage until verified payment release.

### 2. Race-Condition Proof Atomic Transactions (`keyAllocator.ts`)
- Key assignment runs inside **Firestore Atomic Transactions**:
  1. Verifies order is pending.
  2. Finds available key with matching slot capability.
  3. Locks and marks key as `sold` with timestamp and `orderId`.
  4. Updates order to `paid` with `delivered_key = decryptedKey`.
  5. Guarantees zero double-allocation even during traffic spikes.

### 3. Cryptographic Admin Approval Tokens (`approvalToken.ts`)
- Discord webhook approve/reject buttons use HMAC-SHA256 signed action tokens with 24-hour expiration, preventing replay attacks or unauthorized approvals.

---

## 🛠️ Complete Tech Stack

- **Framework**: Next.js 14.2.5 (App Router, Server Actions, TypeScript)
- **Animation & Motion**: GSAP 3.15 + ScrollTrigger, Canvas Confetti
- **Styling**: Tailwind CSS v3, Lucide Icons, Glassmorphic Tokens
- **Database & Auth**: Firebase Cloud Firestore, Firebase Admin SDK v12, Firebase Auth
- **Payments**: Direct Native UPI QR, PayPal Checkout SDK (`@paypal/paypal-js`)
- **Email Delivery**: Resend API
- **Cryptography**: Node.js `crypto` (AES-256-GCM, HMAC-SHA256)

---

## 📂 Clean Directory Structure

```
src/
├── app/
│   ├── page.tsx                      # Dynamic Suspense Theme Router
│   ├── layout.tsx                    # Root Layout, Metadata & Audio Provider
│   ├── admin/page.tsx                # Admin Dashboard (Keys, Orders, Approvals)
│   ├── order-success/[orderId]/      # Post-Purchase Key Vault & Activation
│   ├── contact/                      # Support Channels (Discord, Telegram, Reddit)
│   ├── privacy/, terms/, refund/     # Legal Policies
│   └── api/                          # REST API Endpoints
├── config/
│   └── theme.ts                      # Central Theme Registry & Switcher
├── themes/
│   ├── index.ts                      # Barrel Export & Theme Resolver
│   ├── AetheriaObsidian.tsx          # Obsidian Theme Wrapper
│   ├── AetheriaMotion.tsx            # Motion Theme Wrapper
│   └── AetheriaNexus.tsx             # Nexus Theme Wrapper
├── components/
│   ├── CinematicScrollExperience.tsx # Core Scrollytelling Engine
│   ├── storefront/
│   │   ├── Header.tsx                # Split HUD Navigation & Audio Controls
│   │   ├── CheckoutModal.tsx         # Unified UPI & PayPal Payment Modal
│   │   ├── RestockNotifyModal.tsx    # Inventory Restock Email Waitlist
│   │   ├── Preloader.tsx             # 3-Phase GSAP Cinematic Intro
│   │   └── StaticStorefrontExperience.tsx # Nexus Cyberpunk Grid Storefront
│   ├── vault/
│   │   └── CustomerVaultModal.tsx    # Header Key Lookup & Order History
│   ├── success/
│   │   ├── OrderSuccessView.tsx      # Success Portal Container
│   │   ├── KeyReveal.tsx             # Holographic Key Reveal Box
│   │   ├── ActivationGuide.tsx       # 4-Step PGSharp Tutorial
│   │   └── ReviewSubmissionWidget.tsx# Post-Purchase Review Box
│   ├── admin/                        # 8 Admin Management Panels
│   └── interactive/
│       ├── AmbientMistParticles.tsx  # Floating Atmosphere Particles
│       └── ParticleBurst.tsx         # Confetti & Click Particles
├── context/
│   └── AmbientAudioContext.tsx       # Global Background Audio Subsystem
├── lib/
│   ├── constants.ts                  # Plans, Bank VPAs, Links
│   ├── crypto.ts                     # AES-256-GCM Encryption Engine
│   ├── services/keyAllocator.ts      # Atomic Key Slot & Pool Service
│   ├── orders/                       # Approval Tokens & Paise Allocator
│   ├── notifications/discordAdmin.ts # Discord Webhook & Alerts
│   ├── email/resend.ts               # Transactional Key Dispatch Email
│   ├── firestore/                    # Cloud Firestore Typed Queries
│   └── sms/bankSmsParser.ts          # Bank SMS Auto-Verification Parser
└── types/                            # TypeScript Type Definitions
```

---

## 🌐 API Route Specifications

| Endpoint | Method | Purpose | Auth / Access |
|---|---|---|---|
| `/api/stock` | `GET` | Returns available key inventory count | Public |
| `/api/stock/[planId]` | `GET` | Returns stock for a specific plan | Public |
| `/api/restock-notify` | `POST` | Registers email for restock notification | Public |
| `/api/checkout/upi` | `POST` | Generates dynamic paise UPI order & pending record | Public |
| `/api/checkout/upi/verify` | `POST` | Submits UTR for verification & admin notification | Public |
| `/api/checkout/paypal` | `POST` | Creates PayPal order | Public |
| `/api/checkout/paypal/capture` | `POST` | Captures authorized PayPal transaction | Public |
| `/api/checkout/paypal/verify` | `POST` | Verifies PayPal transaction status | Public |
| `/api/webhooks/paypal` | `POST` | PayPal IPN webhook listener | IPN Verified |
| `/api/webhooks/upi` | `POST` | Bank SMS forwarder webhook for auto-credit | Secret Key |
| `/api/admin/orders/quick-approve` | `GET` | Discord 1-click instant approval endpoint | HMAC Token |
| `/api/admin/orders/quick-reject` | `GET` | Discord 1-click instant rejection endpoint | HMAC Token |
| `/api/user/keys` | `POST` | Vault lookup: returns customer keys by email/phone | Public (Masked) |
| `/api/coupons/validate` | `POST` | Validates promotional discount codes | Public |
| `/api/reviews` | `GET`/`POST` | Customer review submissions & retrieval | Public |
| `/api/order/[orderId]` | `GET` | Returns sanitized order for Key Reveal screen | Public (ID Masked) |
| `/api/admin/keys` | `GET`/`POST`/`DELETE` | Bulk key pool management | Admin UID |
| `/api/admin/orders/approve` | `POST` | Manual admin order approval | Admin UID |
| `/api/admin/orders/reject` | `POST` | Manual admin order rejection | Admin UID |
| `/api/admin/stats` | `GET` | Financial & stock analytics | Admin UID |

---

## ⚙️ Setup & Environment Variables

### 1. Install Dependencies
```bash
cd f:/Pgsharp
npm install
```

### 2. Configure Environment (`.env.local`)
```env
# Firebase Admin SDK (Service Account)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Security & Key Encryption (32-byte Hex)
KEY_ENCRYPTION_SECRET="generate-with-crypto-randomBytes-32"
APPROVAL_TOKEN_SECRET="your-approval-token-secret"

# Payment Gateways (PayPal)
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"
PAYPAL_WEBHOOK_ID="your-paypal-webhook-id"
PAYPAL_ENVIRONMENT="live" # or sandbox

# Notifications & Automation
DISCORD_ADMIN_WEBHOOK_URL="https://discord.com/api/webhooks/..."
SMS_FORWARDER_SECRET="your-sms-webhook-secret"

# Transactional Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="AETHERIA Vault <keys@yourdomain.com>"

# Admin Portal Access
NEXT_PUBLIC_ADMIN_UIDS="firebase-uid-1,firebase-uid-2"
ADMIN_API_SECRET="your-custom-admin-secret"
```

---

## 🚢 Deployment & Production Build

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

✅ **Verified with 0 errors across all 17 routes.**
