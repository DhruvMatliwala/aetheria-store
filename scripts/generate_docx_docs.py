import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import datetime

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # Page Margins (1 inch all sides)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styling Palette
    COLOR_PRIMARY = RGBColor(14, 116, 144)    # Cyan / Deep Teal (#0E7490)
    COLOR_SECONDARY = RGBColor(5, 150, 105)   # Emerald (#059669)
    COLOR_DARK = RGBColor(15, 23, 42)         # Slate 900 (#0F172A)
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 (#64748B)

    # ── Title & Header ──────────────────────────────────────────────────────────
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("AETHERIA — PGSharp Digital Key Distribution Platform")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_DARK

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub = p_sub.add_run("Comprehensive Technical, Operational & System Architecture Documentation")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = COLOR_PRIMARY

    # Metadata banner table
    meta_table = doc.add_table(rows=1, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    col_widths = [Inches(1.6), Inches(1.6), Inches(1.6), Inches(1.7)]
    headers = ["Version: 3.2.0 Prod", "Framework: Next.js 14", "Security: AES-256-GCM", f"Updated: {datetime.datetime.now().strftime('%B %Y')}"]
    
    for i, cell in enumerate(meta_table.rows[0].cells):
        cell.width = col_widths[i]
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(headers[i])
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_MUTED

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ── Helper Functions ────────────────────────────────────────────────────────
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(11)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_DARK
        return p

    def add_body(text, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r_bold = p.add_run(bold_prefix)
        r_bold.font.name = "Arial"
        r_bold.font.size = Pt(9.5)
        r_bold.font.bold = True
        r_bold.font.color.rgb = COLOR_DARK
        
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = COLOR_DARK
        return p

    def format_table(table, col_widths, headers, data):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        
        hdr_row = table.rows[0]
        for i, h_text in enumerate(headers):
            cell = hdr_row.cells[i]
            cell.width = col_widths[i]
            set_cell_background(cell, "0E7490")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(h_text)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            
        for row_idx, row_data in enumerate(data):
            row = table.add_row()
            bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
            for col_idx, cell_value in enumerate(row_data):
                cell = row.cells[col_idx]
                cell.width = col_widths[col_idx]
                set_cell_background(cell, bg_color)
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                p = cell.paragraphs[0]
                r = p.add_run(cell_value)
                r.font.name = "Arial"
                r.font.size = Pt(8.5)
                r.font.color.rgb = COLOR_DARK

    # ── 1. Executive Summary & Ecosystem Overview ──────────────────────────────
    add_h1("1. Executive Summary & Multi-Channel Ecosystem")
    add_body("AETHERIA is a high-performance, automated digital distribution engine engineered specifically for official PGSharp Standard Edition license keys. The platform operates across multiple synchronous channels:")
    add_bullet("Web Storefront: ", "Cyberpunk luxury dark-mode experience featuring a 550vh GSAP scrollytelling visual runway, ambient spatial audio, and an instant client-side key delivery modal.")
    add_bullet("Admin Command Center (/admin): ", "Encrypted portal for live vault monitoring, direct key dispatch, bulk license ingestion, order proof management, and automated expiry reminders.")
    add_bullet("Telegram Bot Engine (@AetheriaStoreOfficialBot): ", "Autonomous multi-device purchasing bot supporting instant UPI/PayPal checkouts, key delivery in DMs, and an integrated viral referral reward program.")
    add_bullet("Telegram Proof Channel (@AetheriaStoreOfficial): ", "Real-time automated restock announcements and privacy-masked order verification proofs.")
    add_bullet("Discord Lead Notifier (discord-key-notifier): ", "Dedicated gateway microservice monitoring 23 Discord servers in real time, routing high-intent buyer alerts directly to the owner's Telegram.")

    # ── 2. Pricing & Plan Structure ───────────────────────────────────────────
    add_h1("2. Active Pricing & License Tier Structure")
    add_body("The store offers two distinct consumer editions, priced dynamically in INR and USD:")

    plan_table = doc.add_table(rows=1, cols=5)
    format_table(
        plan_table,
        [Inches(1.3), Inches(1.3), Inches(1.1), Inches(1.1), Inches(1.7)],
        ["Tier Name", "Device Capacity", "Price (INR)", "Price (USD)", "Duration & Features"],
        [
            ["Standard Tier", "1 Android Device", "₹160", "$2.00", "30 Days • Joystick, Teleport, 100% IV Checker, Auto-Walk"],
            ["Duo Tier (Best Value)", "2 Android Devices", "₹300 (was ₹320)", "$3.60 (was $4.00)", "30 Days • 2 Concurrent Device Slots, Priority Support"]
        ]
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    add_bullet("Cryptographic Slot Partitioning: ", "Raw keys (3-device Patreon licenses) are safely segmented into 1-slot or 2-slot allocations. Keys are only retired from the vault when all 3 usable slots are consumed, guaranteeing zero device-sharing collisions between buyers.")

    # ── 3. Payment Processing & Whole-Rupee Matching Engine ───────────────────
    add_h1("3. Payment Rails & Whole-Rupee Automated Verification")
    add_body("AETHERIA operates on a dual-rail payment architecture combining domestic Indian UPI with international PayPal checkouts:")
    add_bullet("Clean Whole-Rupee Architecture: ", "Completely eliminated fractional decimal paise (e.g., .14 paise). Customers pay exact whole rupee figures (₹160 or ₹300), preventing bank payment filters (e.g. SBI, Google Pay, PhonePe) from rejecting transfers.")
    add_bullet("Smart-Routing UPI VPAs: ", "Direct integration with four resilient banking handles: dhruvmatliwala123@oksbi (Primary), okicici (Fastest), okaxis (High Uptime), and okhdfcbank (Reliable).")
    add_bullet("24/7 Bank SMS Bridge (/api/webhooks/upi): ", "Automated Android forwarder integration that parses incoming credit SMS notifications in real time. Features strict anti-fraud rules blocking personal 10-digit mobile senders and automatic suppression of sensitive 2FA/OTPs.")
    add_bullet("International PayPal Rail: ", "Integrated PayPal.me direct checkout with automated capture and customer vault fulfillment.")

    # ── 4. Direct Key Dispatch (Manual Allocation System) ─────────────────────
    add_h1("4. Direct Key Dispatch (Manual Allocation System)")
    add_body("To enable the administrator to fulfill private sales directly in Telegram or Discord DMs without forcing customers through public checkout:")
    add_bullet("Web Admin Dispatcher: ", "Available in the admin portal under 'Direct Dispatch'. Allows 1-click allocation of 1 Slot, 2 Slots, or a 100% Dedicated Private Key (3 Slots). Decrypts the key instantly on screen, generates an official order record, and decrements vault stock.")
    add_bullet("Telegram Admin Command (/givekey): ", "The owner (Telegram ID: 741838315) can execute '/givekey 1 @username', '/givekey 2 @username', or '/givekey 3' directly inside Telegram for instant mobile fulfillment.")

    # ── 5. Automated 48-Hour Expiry Reminders ─────────────────────────────────
    add_h1("5. Automated License Expiry & Renewal Subsystem")
    add_body("To maximize customer retention and lifetime value (LTV), an automated reminder engine tracks order lifecycles:")
    add_bullet("Automated Cron (/api/cron/expiry-reminders): ", "Scans active orders nearing the 30-day mark (specifically 48 hours before license expiration).")
    add_bullet("Direct Customer Notification: ", "Dispatches renewal reminders to Telegram buyers with 1-click renewal links and priority renewal instructions.")
    add_bullet("Admin 1-Click Trigger: ", "Integrated 'RUN REMINDERS' button in the Admin Portal header enables instant on-demand scanning with live toast statistics.")

    # ── 6. Discord Gateway Notifier Microservice ──────────────────────────────
    add_h1("6. Discord Live Buyer Radar (discord-key-notifier)")
    add_body("A dedicated standalone Node.js microservice (located in /discord-key-notifier) operating independently from website serverless limitations:")
    add_bullet("Direct WebSocket Gateway: ", "Maintains a persistent authenticated WebSocket connection to Discord's live gateway, bypassing Cloudflare anti-bot blocks.")
    add_bullet("23-Channel Active Surveillance: ", "Monitors 23 premier Pokemon GO spoofing, trading, and gaming Discord channels simultaneously.")
    add_bullet("Regex Keyword Matching: ", "Detects high-intent keywords ('key', 'buy key', 'pgsharp key', 'wtb', 'need key') and instantly formats rich alerts.")
    add_bullet("Telegram Mobile Alerts: ", "Pushes real-time alerts to the owner's Telegram with user details, matched message snippets, and 1-click 'Open in Discord' jump buttons.")

    # ── 7. Telegram Bot & Channel Announcement Architecture ───────────────────
    add_h1("7. Telegram Bot & Automated Proof Broadcasting")
    add_body("The public Telegram infrastructure (@AetheriaStoreOfficial and @AetheriaStoreOfficialBot) features automated community broadcast hooks:")
    add_bullet("Streamlined Restock Flash Alerts: ", "Whenever keys are uploaded, broadcastRestockAlert posts a punchy, high-urgency announcement: '⚡ KEYS ARE BACK IN STOCK! 📦 Fresh 30-Day keys just loaded into the vault. Grab yours before this batch runs out! 🚀'")
    add_bullet("Intentional Price-Free Copy: ", "Pricing figures were intentionally eliminated from announcement posts. This eliminates message clutter, avoids repetitive price spam (since prices are prominently pinned in the channel and website), and ensures restock alerts never become outdated if store pricing evolves.")
    add_bullet("1-Tap Conversion CTA: ", "Includes an interactive inline button linking directly to 'https://t.me/AetheriaStoreOfficialBot?start=restock', taking customers straight into checkout with 0 friction.")
    add_bullet("Streamlined Order Completed Proofs: ", "Real-time purchase proofs are automatically dispatched upon payment capture to @AetheriaStoreOfficial with zero receipt clutter: '✅ ORDER COMPLETED 📦 30-Day PGSharp Key dispatched to dh***@gmail.com (or @sl*** for bot buyers) 🛡️ Key verified and activated successfully.' Includes a direct '⚡ Order via Bot' inline button.")
    add_bullet("Dual Storefront Channel Synchronization: ", "Both Telegram bot purchases and website purchases (automated Bank SMS Bridge UPI, website UTR verification, PayPal Express capture, and PayPal IPN direct matching) are unified and trigger live social proofs in the channel automatically.")

    add_h2("7.1 Viral Telegram Referral & Reward Engine ('Refer & Earn')")
    add_body("The bot features a self-sustaining viral growth loop designed for zero checkout friction:")
    add_bullet("Personal Tracking Links: ", "Tapping '👥 Refer & Earn' provides the user with their personalized deep link ('https://t.me/AetheriaStoreOfficialBot?start=ref_<chatId>') alongside real-time metrics tracking clicks, paid orders, and reward coupons earned.")
    add_bullet("100% Automated Friend Discount (No Code Needed): ", "When an invited friend clicks the referral link and taps Start, the bot records the referrer attribution in Firestore. The friend automatically receives ₹30 OFF their first key (₹130 for 1 Device / ₹270 for 2 Devices). No coupon entry or promo codes are required; the discount is applied directly to their checkout intent.")
    add_bullet("Automated Single-Use Reward Coupon Issuance: ", "Upon completion and verification of the friend's order, an anti-fraud check verifies unique payment identifiers and generates a single-use coupon in Firestore ('REF30_XXXXXX', ₹30 / $0.50 OFF, max_uses: 1).")
    add_bullet("Direct Telegram Notification: ", "The bot dispatches a private DM to the referrer with their coupon code. Referrers can stack multiple earned coupons and redeem them on future key renewals simply by sending or tapping the code in chat.")
    add_bullet("Centralized Admin Visibility & Deletion: ", "All issued referral coupons are stored in Firestore and sync live to the Admin Coupons panel, giving the administrator real-time monitoring and 1-click permanent deletion capabilities.")

    add_h2("7.2 Native In-Chat UPI QR Delivery & Session Reuse")
    add_body("To guarantee seamless, zero-friction mobile checkouts in Telegram:")
    add_bullet("Dynamic Native QR Photo Delivery: ", "Rather than relying on fragile 3rd-party UPI intent deep links (which often trigger bank app limits or browser blocks on mobile), the bot dynamically generates and delivers a native high-resolution QR photo PNG buffer directly inside the Telegram chat.")
    add_bullet("Compact Non-Redundant Card Copy: ", "Single clean card featuring UPI ID, key details, auto-delivery instructions, and 'Support' / 'Back' buttons without repetitive amount spam.")
    add_bullet("Approximate Duration (~30 Days) Notation: ", "Acknowledges rare 28–29 day upstream vendor key duration variances to set accurate customer expectations and prevent false disputes.")
    add_bullet("Pending Order Session Reuse: ", "Prevents database clutter by checking for existing active pending orders for that user/chat before creating a new order. Repeated button clicks update the existing order session instead of generating duplicate abandoned rows in Firestore.")

    # ── 8. Admin Portal Modernization & Optimization ──────────────────────────
    add_h1("8. Admin Portal Architecture & Clean-up")
    add_body("The administrative center has been thoroughly refined, optimized, and de-bloated:")
    add_bullet("Decommissioned Obsolete Lead Radar: ", "Completely removed web/Reddit scrapers that were experiencing 429/403 rate limiting. Deleted over 3,000 lines of dead code, dropping the admin bundle size from 32.8 kB down to 23.9 kB.")
    add_bullet("Stealth 404 Camouflage ('Ghost Admin'): ", "Anyone navigating directly to /admin without authorization is presented with a convincing, realistic 404 Page Not Found error, keeping the admin portal invisible to automated bots and scanners.")
    add_bullet("Dual Unlock Vectors: ", "Secret URL bookmark (?key=...) for 1-click device authorization with automatic address-bar cleanup, plus emergency unlock via triple-click or Ctrl+Shift+A keyboard shortcut.")
    add_bullet("Anti-Brute-Force Rate Limiter: ", "Failed passcode attempts are tracked per client IP. Reaching 5 failed attempts locks the IP out for 15 minutes with HTTP 429 Too Many Requests.")
    add_bullet("Timing-Safe Cryptographic Verification: ", "All admin operations use constant-time crypto.timingSafeEqual with SHA-256 digests.")
    add_bullet("Pending Approvals Verification Filter: ", "Restricted the admin pending approvals queue to strictly display orders with payment_status == 'verifying' or orders where proof/UTR was submitted, eliminating casual abandoned clicks from cluttering the queue.")
    add_bullet("Live Firestore Coupon Engine & Deletion: ", "Completely eliminated static mock data and hardcoded coupon fallbacks (VIPDHRUV, DISCORDMEMBER). Built a real-time Firestore synchronization engine with an interactive [ Delete ] button, live creation modal, and empty-state notifications.")
    add_bullet("Streamlined Tab Layout: ", "Dashboard, Inventory & Stock, Direct Dispatch, Bulk Key Uploader, Orders & Deliveries, 24/7 UPI Bridge, Coupons (Live Firestore CRUD & Deletion), Waitlist & Demand, and Buyer Reviews.")

    # ── 9. Complete Route & API Architecture Map ──────────────────────────────
    add_h1("9. Complete Route & API Architecture Map")
    add_body("Summary of all 18 active production routes and API endpoints:")

    route_table = doc.add_table(rows=1, cols=3)
    format_table(
        route_table,
        [Inches(2.0), Inches(1.4), Inches(3.1)],
        ["Route / Endpoint", "Rendering Type", "Purpose & Functionality"],
        [
            ["/", "Static / Client", "Main 3-Scene Scrollytelling Storefront, Preloader & HUD"],
            ["/order-success/[orderId]", "Dynamic SSR", "Encrypted Key Vault, Confetti Reveal & Activation Guide"],
            ["/admin", "Static / Client", "Admin Key Ingestion, Slot Tier Analytics & Waitlist Manager"],
            ["/contact, /refund, /terms", "Static", "Customer Support, Refund Policy & Terms of Service"],
            ["/api/stock", "Dynamic API (Cached)", "Real-time Tier Stock, Usable Slots & Active Inventory Counts"],
            ["/api/checkout/upi", "Dynamic API", "UPI Smart Routing & Clean Whole-Rupee Intent Generation"],
            ["/api/checkout/upi/verify", "Dynamic API", "UPI Payment Verification & Instant Key Allocation"],
            ["/api/checkout/paypal", "Dynamic API", "PayPal v2 Order Creation Endpoint"],
            ["/api/checkout/paypal/capture", "Dynamic API", "PayPal Order Capture & Key Dispatch"],
            ["/api/webhooks/upi", "Dynamic API", "24/7 Bank SMS Bridge Webhook with Anti-Fraud Filtering"],
            ["/api/admin/keys/dispatch", "Dynamic API", "Manual 1, 2, or 3-Slot Direct Customer Key Dispatch"],
            ["/api/admin/orders/approve", "Dynamic API", "1-Click Manual Proof Approval & Instant Key Release"],
            ["/api/admin/orders/reject", "Dynamic API", "1-Click Manual Proof Rejection & Status Update"],
            ["/api/cron/expiry-reminders", "Dynamic API", "Automated 48h License Expiry Scanner & Renewals"],
            ["/api/telegram/webhook", "Dynamic API", "Telegram Bot Handler (Checkout, Proofs, Referrals, /givekey)"],
            ["/api/coupons/validate", "Dynamic API", "Private VIP Promo Code Server-Side Validation"],
            ["/api/admin/coupons", "Dynamic API", "Live Admin Coupon CRUD with Instant Permanent Deletion"],
            ["/api/restock-notify", "Dynamic API", "Customer Out-of-Stock Email Waitlist Registration"]
        ]
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ── 10. Security & Cryptographic Specifications ───────────────────────────
    add_h1("10. Security & Cryptographic Specifications")
    add_body("Institutional-grade data protection standards enforced across all transactions:")
    add_bullet("AES-256-GCM Encryption: ", "All raw license keys stored in Firestore collection 'keys' are encrypted at rest using unique 12-byte IVs and 16-byte authentication tags.")
    add_bullet("Zero Sensitive Data Retention: ", "The SMS Bridge explicitly drops all incoming OTPs and login codes, storing only validated bank credit references.")
    add_bullet("Admin Secret Authentication: ", "Admin API endpoints require authenticated 'x-admin-secret' headers matching ADMIN_API_SECRET in environment variables.")

    doc.save("F:/Pgsharp/docs/Documentation.docx")
    print("Successfully generated master documentation at: F:/Pgsharp/docs/Documentation.docx")

if __name__ == "__main__":
    create_document()
