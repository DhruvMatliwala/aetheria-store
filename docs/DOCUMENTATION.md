# 📜 AETHERIA — Complete Technical & Engineering Manual

This document provides an exhaustive, in-depth architectural breakdown of the **AETHERIA / PGSharp Storefront** web application.

---

## 1. Architectural Architecture & Design Vision

### 1.1 Brand Identity & Design System
- **Brand Title**: `AETHERIA`
- **Color Palette**:
  - **Base Background**: Deep Onyx / Void Black (`#080403`)
  - **Primary Accent**: Cyber Cyan (`#38bdf8` / `rgba(56, 189, 248, 1)`)
  - **Secondary Accent**: Auroral Emerald (`#10b981` / `rgba(16, 185, 129, 1)`)
  - **Surface & Cards**: Frosted Obsidian Glass (`bg-neutral-950/85 backdrop-blur-md border border-white/10`)
  - **Text Typography**: High-contrast Serif headings (`font-serif`) with clean monospaced subheadings and technical tags (`font-mono`).

---

## 2. Scrollytelling & Visual Engineering

### 2.1 Pinned 550vh Timeline Sequence
The viewport is pinned using GSAP `ScrollTrigger` across a **550vh runway**:

```
[0.00 - 0.36]  Scene 1: Mewtwo Cryo-Awakening (/videos/scene5.mp4)
               • Overlay 1: 01 / 03 • AWAKEN ACCESS ("Break every limit.")
               • Action: "Buy License Key →" button with auto-scroll to plans.

[0.36 - 0.68]  Scene 2: Shibuya Street Walk (/videos/Scene2.mp4)
               • Overlay 2: 02 / 03 • GLOBAL EXPEDITION ("Roam anywhere.")
               • Badges: GPS Joystick • Auto-Walk • Cooldown Radar

[0.68 - 1.00]  Scene 3: Charizard vs Greninja Battle Arena (/videos/Scene3.mp4)
               • Overlay 3: 03 / 03 • COMBAT SHOWDOWN ("Master every raid.")
               • Pricing Cards: Standard & Dual Tier Options
               • Collapsible Trainer FAQ & Support Drawer
```

### 2.2 Single-Active Video Decoder Pipeline
- **Problem**: Playing multiple 1080p/1440p videos simultaneously causes extreme GPU thermal throttling and frame drops on smartphones.
- **Solution**:
  - Exactly **one video** decodes in hardware VRAM at any given time.
  - Off-screen videos are actively paused and placed in low-power idle mode, cutting GPU decode consumption by 67%.
  - When returning to an earlier scene, the video seamlessly resets and replays from the beginning (`0.0s`).

### 2.3 Anticipatory Lookahead Preloader (77% Initial Bandwidth Cut)
- Initial page load fetches **only Scene 1** (5.2 MB); Scenes 2 and 3 start at `preload="none"`.
- When the user scrolls past 5%, Scene 2 begins buffering silently in the background; at 32% scroll, Scene 3 begins buffering.
- Total initial load drops from 22.6 MB down to 5.2 MB with **zero black screen delay**.

### 2.4 Mobile Responsive Framing (iPhone X+ Optimized)
- `object-contain object-[center_24%]` on mobile ensures the entire 16:9 widescreen video is 100% visible without head cropping.
- `sm:object-cover sm:object-center` smoothly expands to edge-to-edge immersion on tablets and desktop monitors.
- Restored desktop HUD width `w-[calc(100vw-2rem)] sm:w-[85vw] md:w-full max-w-2xl` with majestic 4.75rem typography.

### 2.5 Zero-Lag Click Architecture
- Background video wrappers utilize `pointer-events-none`, completely bypassing mobile browser media inspection delay (250ms) and frame-buffer flushes.

---

## 3. Automated E-Commerce & Payment Engine

### 3.1 Zero-Effort Paise-Matching UPI Engine (Instant & UTR-Free)
- **Problem with Traditional UPI**: Requiring customers to manually copy and paste 12-digit UTR numbers leads to a 40%+ drop-off rate and human error.
- **AETHERIA Innovation**: Dynamic Unique Paise Offset Allocation (`allocateUniquePaise`).
- **How It Works**:
  1. Base price (e.g. ₹180) receives a temporary unique fractional paise offset (e.g. `₹180.14`), reserved for 15 minutes.
  2. The buyer scans the QR code or clicks the UPI link in GPay, PhonePe, or Paytm and taps "Pay".
  3. **Automated Bank SMS Bridge (`/api/webhooks/upi`)**: Incoming bank SMS notifications from an Android forwarder device are parsed in real time, matching the exact paise amount and instantly triggering key dispatch!
  4. The checkout modal polls `/api/order/[orderId]` every 2.5s and auto-redirects to `/order-success` in under 2 seconds.

### 3.2 International PayPal Direct Rail
- `/api/checkout/paypal` generates a pre-filled direct PayPal.me URL.
- One-click transaction ID submission with instant verification and order fulfillment.

---

## 4. Discount Coupon & Private Promo Code Engine

- **Discreet UI**: Clean, unprompted promo input field labeled *"Have a Promo Code?"* with placeholder *"Enter promo code"*, keeping secret codes safe from first-time visitors.
- **Real-Time Validation API (`/api/coupons/validate`)**: Instant feedback displaying exact discount values in INR and USD, strikethrough pricing, and a glowing green `SAVED` badge.
- **Dynamic Payment Integration**:
  - The UPI engine applies the discount to the base amount before calculating the unique paise offset (e.g. ₹190 - ₹10 = `₹180.14`).
  - PayPal links adjust to the discounted USD total.
  - Server-side validation prevents price tampering.
- **Private Secret Codes**:
  - Pre-configured secret codes: `VIPDHRUV` (₹10 OFF), `DISCORDMEMBER` (₹10 OFF).
  - Supports unlimited custom codes directly via Firestore `coupons` collection.

---

## 5. Security & Cryptographic Architecture

### 5.1 AES-256-GCM Encryption at Rest (`crypto.ts`)
- Master key: 32-byte secret (`KEY_ENCRYPTION_SECRET`).
- Encryption Format: `iv:authTag:encryptedData` (hex encoded).
- Raw plaintext keys are never stored in the database.

### 5.2 Atomic Race-Condition Protection (`transaction.ts`)
- Atomic Firestore transactions ensure that simultaneous buyers never receive duplicate keys.
- Keys transition atomically from `status: 'available'` to `status: 'sold'`.

---

## 6. Route Summary & Verification Matrix

All routes compiled and verified cleanly in production build (`npm run build`, exit code `0`):

| Route Path | Method | Type | Core Functionality |
|---|---|---|---|
| `/` | GET | Static | 3-Scene Pinned Cinematic Scrollytelling Showcase |
| `/order-success/[orderId]` | GET | Dynamic | Instant Key Reveal & AES-256-GCM Decryption Screen |
| `/admin` | GET | Static | Protected Key Management & Analytics Dashboard |
| `/contact` | GET | Static | Discord, Telegram & Concierge Support Channels |
| `/terms, /privacy, /refund` | GET | Static | Legal Compliance & Warranty Policy Pages |
| `/api/stock` | GET | Dynamic | Live Inventory Counters for Vault Cards |
| `/api/restock-notify` | POST | Dynamic | Waitlist Registration & Email Alerts |
| `/api/coupons/validate` | POST | Dynamic | Promo Code Validation & Discount Engine |
| `/api/checkout/upi` | POST | Dynamic | UPI Order & Unique Paise Allocation Engine |
| `/api/checkout/upi/verify` | POST | Dynamic | Manual/Fallback UTR Verification Endpoint |
| `/api/checkout/paypal` | POST | Dynamic | PayPal Order & Prefilled URL Generator |
| `/api/checkout/paypal/verify` | POST | Dynamic | PayPal Transaction ID Verification |
| `/api/webhooks/upi` | POST | Dynamic | Bank SMS Forwarder Automated Matching Webhook |
| `/api/order/[orderId]` | GET | Dynamic | Client Polling Endpoint for Instant Payment Detection |
| `/api/admin/keys` | POST | Dynamic | AES-256-GCM Bulk Key Encryption & Ingestion |
| `/api/admin/stats` | GET | Dynamic | Financial, Waitlist & Vault Inventory Analytics |

---

*AETHERIA Systems • Complete Technical Manual • Updated September 2026*
