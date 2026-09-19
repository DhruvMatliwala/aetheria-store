# Aetheria Store - Project Context & Operational Handover

This document preserves the complete architectural context, active configurations, credentials, channel identifiers, and ongoing background services for Aetheria Store. Any fresh AI session should read this document first.

---

## 1. Core Repositories & Deployment Architecture

### A. Next.js Web Storefront (`f:\Pgsharp`)
- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons.
- **Production URL**: https://aetheria-store.vercel.app
- **Deployment**: Automated CI/CD via Vercel on git push to branch `main`.
- **Database**: Google Cloud Firestore (`pgsharp-4587b`).
- **Storage**: Key allocation, waitlist alerts, coupon validation, UPI/PayPal checkout.

### B. Background Services Daemon (`f:\telegram-key-notifier`)
- **Runtime**: Node.js 18+ daemon running 24/7 on Render (`https://telegram-key-notifier.onrender.com`).
- **Deployment**: Automated build on git push to branch `main`.
- **Active Subsystems Running Simultaneously**:
  1. **Telegram MTProto Lead Radar**: Monitors 9 Telegram target groups for spoofer buyer keywords and sends instant alerts to Dhruv (`741838315`).
  2. **Discord 1-Click Ticket Bot**: Gateway WebSocket bot listening on `#pgsharp-keys` (`1550381744509685901`) with button `1550381786234626081` (`open_order_ticket`), provisioning private mutual channels `#ticket-<username>`.
  3. **Dual-Engine Vouches Mirroring**: Monitors Telegram channel `@AetheriaVouches` (`4497586435`) via live WebSocket and 60-second polling catch-up worker, downloading screenshots, stripping promotional text, and posting to Discord `#vouches` (`1550381748506988584`).
  4. **Automated Event Infographics Publisher**: Scrapes ScrapedDuck/LeekDuck feed every 4 hours, formats high-resolution poster embeds with dynamic local timestamps (`<t:TIMESTAMP:F>`), and posts to Discord `#events` (`1550381765099786263`).
  5. **Automated Day-27 Renewal Radar**: Scans customer licenses every 30 minutes and dispatches proactive expiration alerts to Telegram 3 days in advance.
  6. **Obsidian Renewal CRM Dashboard**: Full-featured web dashboard at `/crm`, secured by master passcode (`Aeth$9xK!7mP_2vQ-8zL4.dY~2026`) with dual tabs (Customer Licenses and Financial Profit Tracker), synchronized with Google Cloud Firestore (`crm_sales` collection).

---

## 2. Discord Server Hierarchy & Channel Snowflakes

**Guild ID**: `1544078068803440774`
**Bot User**: `Aetheria Manager` (`1550380088921424002`) with Administrator privileges.

### Category: INFORMATION (`1550381711991382069`)
- `#welcome` (`1550381740563107840`): Server rules, store guidelines, owner contact.
- `#pgsharp-keys` (`1550381744509685901`): Pricing (1 Device Rs 199, 2 Devices Rs 370, 3 Devices Rs 549) + interactive green `[ Open Order Ticket ]` button (`1550381786234626081`).
- `#vouches` (`1550381748506988584`): Live automated customer vouches feed synced from `@AetheriaVouches`.

### Category: COMMUNITY (`1550381720363343922`)
- `#general` (`1544078072687362121`): Community chat and general Pokemon GO spoofing talk.
- `#events` (`1550381765099786263`): Automated LeekDuck infographics, raid days, spotlight hours, and local countdowns.
- `#flex` (`1550381769759522886`): Member catches and rare shiny trophy gallery.
- `#support-help` (`1550381773710561301`): Troubleshooting and activation help.

### Category: INTERNAL RADAR (`1550381724234682378`) [Staff Only]
- `#order-alerts` (`1544078629368238150`): Automated storefront checkout notifications.
- `#buyer-leads` (`1545593292564078695`): Discord lead scanner feed.

*(Note: #100iv, #clips-and-highlights, and #cooldown-guide have been permanently deleted to keep the server ultra-clean and eliminate scanner ban risks).*

---

## 3. Critical Behavioral & Technical Constraints

1. **STRICTLY ZERO EMOJIS**:
   - Under NO circumstances output emoji characters in chat responses, code comments, commit messages, documentation, or Discord embeds.
2. **Pricing Structure**:
   - 1 Device (Standard): Rs 199 (Cost: Rs 160, Profit: +Rs 39 / Referral: Rs 169, Profit: +Rs 9).
   - 2 Devices (Duo): Rs 370 (Cost: Rs 320, Profit: +Rs 50 / Referral: Rs 340, Profit: +Rs 20).
   - 3 Devices (Full Key): Rs 549 (Cost: Rs 480, Profit: +Rs 69 / Referral: Rs 519, Profit: +Rs 39).
3. **Official Store Key Cost**:
   - Official PGSharp store charges $5.00 USD (~Rs 480 INR) for a 3-device key (Rs 160.00 per slot).
4. **CRM Endpoints & Authentication**:
   - Master Passcode: `Aeth$9xK!7mP_2vQ-8zL4.dY~2026`
   - Direct 1-click bookmark URL: `/crm?auth=Aeth$9xK!7mP_2vQ-8zL4.dY~2026`
   - APIs: `/api/sales`, `/api/sales/update`, `/api/renew`, `/api/delete`, `/api/crm/login`, `/api/crm/logout`.

---

## 4. Key File Locations

- Comprehensive Architecture: `f:\Pgsharp\docs\DOCUMENTATION.md`
- Word Documentation: `f:\Pgsharp\docs\Documentation.docx`
- Docx Generator Script: `f:\Pgsharp\scripts\update_documentation_docx.py`
- Discord Event Publisher: `f:\telegram-key-notifier\lib\discordEventPublisher.js`
- Vouches Forwarder: `f:\telegram-key-notifier\lib\vouchForwarder.js`
- Discord Ticket Gateway: `f:\telegram-key-notifier\lib\discordTicketBot.js`
- Sales CRM Core & Firestore Sync: `f:\telegram-key-notifier\lib\salesCrm.js`
- CRM Web Interface: `f:\telegram-key-notifier\lib\crmDashboardHtml.js`
- Main Background Daemon: `f:\telegram-key-notifier\index.js`

---

## 5. Previous Conversation Reference
- **Conversation ID**: `599c224f-f89f-4a7b-80ae-42abd30ec087`
- **Transcript Logs**: `C:\Users\Dhruv\.gemini\antigravity-ide\brain\599c224f-f89f-4a7b-80ae-42abd30ec087\.system_generated\logs\transcript.jsonl`
