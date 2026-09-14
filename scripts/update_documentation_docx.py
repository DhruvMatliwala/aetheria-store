import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_documentation_docx(output_path="f:/Pgsharp/docs/Documentation.docx"):
    doc = docx.Document()

    # Configure Margins: 1 inch on all sides
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    COLOR_TITLE = RGBColor(0x0F, 0x17, 0x2A)     # Slate 900
    COLOR_TEAL = RGBColor(0x0E, 0x74, 0x90)      # Cyan 700 / Deep Teal
    COLOR_TEXT = RGBColor(0x0F, 0x17, 0x2A)      # Slate 900
    COLOR_MUTED = RGBColor(0x64, 0x74, 0x8B)     # Slate 500

    def add_doc_title(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(24)
        run.font.bold = True
        run.font.color.rgb = COLOR_TITLE
        return p

    def add_doc_subtitle(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(13)
        run.font.bold = False
        run.font.color.rgb = COLOR_TEAL
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = COLOR_TEAL
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_TITLE
        return p

    def add_body(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_TEXT
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r1 = p.add_run(bold_prefix + ' ')
            r1.font.name = 'Arial'
            r1.font.size = Pt(10)
            r1.font.bold = True
            r1.font.color.rgb = COLOR_TEXT
        r2 = p.add_run(text)
        r2.font.name = 'Arial'
        r2.font.size = Pt(10)
        r2.font.bold = False
        r2.font.color.rgb = COLOR_TEXT
        return p

    def format_table(table, col_widths, headers, rows_data):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table, color="CBD5E1", sz="4", val="single")

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], "0E7490")
            set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
            hdr_cells[i].width = col_widths[i]
            p = hdr_cells[i].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(9)
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Data Rows
        for r_idx, row_values in enumerate(rows_data):
            row_cells = table.add_row().cells
            bg_color = "F8FAFC" if (r_idx % 2 == 0) else "FFFFFF"
            for c_idx, val in enumerate(row_values):
                row_cells[c_idx].text = val
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
                row_cells[c_idx].width = col_widths[c_idx]
                p = row_cells[c_idx].paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.1
                for r in p.runs:
                    r.font.name = 'Arial'
                    r.font.size = Pt(8.5)
                    r.font.color.rgb = COLOR_TEXT

    # ─────────────────────────────────────────────────────────────────────────
    # 0. Document Header & Metadata Block
    # ─────────────────────────────────────────────────────────────────────────
    add_doc_title("AETHERIA — PGSharp Digital Storefront")
    add_doc_subtitle("Comprehensive Technical, Architectural & Engineering Production Manual")

    # Table 0: Metadata Badge
    tbl_meta = doc.add_table(rows=1, cols=4)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_meta, color="CBD5E1", sz="4", val="single")
    meta_cells = tbl_meta.rows[0].cells
    meta_headers = [
        "Version: 2.5.0 Prod",
        "Framework: Next.js 14 App Router",
        "Security: AES-256-GCM Vault",
        "Updated: September 2026",
    ]
    for idx, text in enumerate(meta_headers):
        meta_cells[idx].text = text
        set_cell_background(meta_cells[idx], "F1F5F9")
        set_cell_margins(meta_cells[idx], top=80, bottom=80, left=100, right=100)
        p = meta_cells[idx].paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        for r in p.runs:
            r.font.name = 'Arial'
            r.font.size = Pt(8)
            r.font.bold = True
            r.font.color.rgb = COLOR_MUTED

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Executive Summary & System Architecture
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("1. Executive Summary & System Architecture")
    add_body(
        "AETHERIA is an institutional-grade, high-performance digital commerce platform engineered specifically for official "
        "PGSharp Standard Edition (~30 Days) license key distribution. It merges luxury dark-mode aesthetics (Obsidian Glassmorphism, "
        "Neon Cyber Cyan & Emerald accoutrements) with an interactive 550vh image-sequence scrollytelling runway, clean whole-rupee "
        "UPI settlement, direct Gmail SMTP delivery, autonomous Telegram bot transactions, and AES-256-GCM key encryption."
    )
    add_bullet("Core Brand Proposition:", "Institutional-grade reliability, instantaneous automated key dispatch (< 10 seconds), zero ban risk advisory, and 1-on-1 VIP concierge support on Discord, Telegram, and Reddit.")
    add_bullet("Technology Stack:", "Next.js 14 App Router, TypeScript, Tailwind CSS, GSAP 3 (ScrollTrigger), HTML5 Canvas Particle Engine, Firebase Firestore / Admin SDK, Clean Whole-Rupee UPI Rails, Bank SMS Auto-Bridge Webhook, PayPal v2 & Direct Rails, Nodemailer (Direct Gmail SMTP), and Telegram Bot API.")
    add_bullet("Multi-Channel Reach:", "Web Storefront (aetheria-store.vercel.app), Admin Command Center (/admin), Telegram Shop Bot (@AetheriaStoreOfficialBot), Telegram Proof Channel (@AetheriaStoreOfficial), and Discord Real-Time Buyer Radar.")

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Official Pricing Architecture & Device Slot Matrix
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("2. Official Pricing Architecture & Device Slot Matrix")
    add_body(
        "Pricing is centrally defined in src/lib/constants.ts and dynamically cascades across storefront cards, modal checkouts, "
        "PayPal payment links, automated Telegram bot messages, and SEO schemas. Strikethrough pricing reinforces high perceived value."
    )

    tbl_pricing = doc.add_table(rows=1, cols=6)
    pricing_widths = [Inches(1.2), Inches(0.9), Inches(1.0), Inches(1.0), Inches(1.1), Inches(1.3)]
    pricing_headers = ["Plan Tier", "Device Capacity", "Standard Price (INR)", "Standard Price (USD)", "Referral Price (INR)", "Referral Price (USD)"]
    pricing_rows = [
        ["Standard Tier", "1 Android Device", "₹160 (Fixed Whole)", "$2.00 (Fixed USD)", "₹130 (₹30 OFF)", "$1.70 ($0.30 OFF)"],
        ["Duo Tier (Best Value)", "2 Android Devices", "₹300 (was ₹320)", "$3.60 (was $4.00)", "₹270 (₹30 OFF)", "$3.10 ($0.50 OFF)"],
    ]
    format_table(tbl_pricing, pricing_widths, pricing_headers, pricing_rows)

    add_body(
        "Approximate Duration (~30 Days): To accommodate slight upstream Patreon key variances (rare 28-29 day cycles), "
        "all public copy explicitly denotes '~30 Days', preventing disputes while maintaining customer satisfaction."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Patreon 3-Device Key Slot Allocation Engine
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("3. Patreon 3-Device Key Slot Allocation Engine")
    add_body(
        "AETHERIA operates on official 3-device Patreon Standard Edition keys (source: 'patreon_3slot'). A single physical key "
        "authorizes up to 3 concurrent Android devices. A virtual slot bin-packing engine partitions physical keys across customer orders:"
    )
    add_bullet("1 Device Plan (1 Slot):", "Consumes 1 slot. Prioritizes partially-filled active keys (e.g. 1/3 or 2/3 filled) to maximize inventory density, leaving remaining slots available for future buyers.")
    add_bullet("2 Devices Plan (2 Slots):", "Consumes 2 slots. Selects keys with >= 2 available slots, packing them without waste.")
    add_bullet("Dedicated Private Key (3 Slots):", "Pulls a 100% virgin untouched key (0/3 used) and immediately locks it as status: 'full'. Guarantees zero strangers can ever share the key.")
    add_bullet("Atomic Concurrency Lock:", "Firestore transactions run inside db.runTransaction with strict read-before-write validation, preventing double-allocation race conditions during high-traffic drops.")

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Payment Rails & Whole-Rupee Verification Engine
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("4. Payment Rails & Whole-Rupee Verification Engine")
    add_h2("4.1 Clean Whole-Rupee Architecture")
    add_body(
        "Eradication of Decimal Paise: Fractional paise amounts (.14, .28) were completely eliminated. Customers pay exact whole "
        "rupees (₹160 or ₹300), preventing bank app rejections (Google Pay, PhonePe, Paytm, SBI) and simplifying manual entry."
    )
    add_bullet("Smart-Routing UPI VPAs:", "dhruvmatliwala123@oksbi (Primary), dhruvmatliwala123@okicici, dhruvmatliwala123@okaxis, dhruvmatliwala123@okhdfcbank.")

    add_h2("4.2 24/7 Automated Bank SMS Bridge (/api/webhooks/upi)")
    add_bullet("Incoming SMS Ingestion:", "Listens for bank credit alerts forwarded by Android SMS Forwarder apps.")
    add_bullet("Anti-Fraud Guard:", "Rejects and flags payloads originating from personal 10-digit mobile numbers.")
    add_bullet("Security & OTP Filter:", "Strictly drops sensitive authentication OTPs and 2FA messages to maintain complete banking privacy.")
    add_bullet("Instant Dual Matching:", "Matches either via the 12-digit banking UTR / UPI transaction ID or whole-rupee FIFO order matching.")

    add_h2("4.3 International PayPal Direct Rail")
    add_body("Direct integration (/api/checkout/paypal & /api/checkout/paypal/capture) with automated transaction capture and key reveal.")

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Direct Key Dispatch (Manual Allocation System)
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("5. Direct Key Dispatch (Manual Allocation System)")
    add_body(
        "Direct Key Dispatch in /admin empowers administrators to fulfill off-platform sales (e.g. Telegram/Discord DMs, cash/direct UPI):"
    )
    add_bullet("Inventory Reservation:", "Instantly reserves 1, 2, or 3 slots atomically in Firestore, preventing website buyers from receiving the same slot.")
    add_bullet("Record Keeping:", "Stores recipient handle (@sleekfx3, email) and admin notes in the order ledger for auditability.")
    add_bullet("Instant Fulfillment Screen:", "Decrypts and displays the license key code and customer fulfillment link with 1-click 'Copy' buttons so the admin can paste them directly into customer DMs.")
    add_bullet("Telegram /givekey Command:", "Superadmin (ID: 741838315) can dispatch keys directly via mobile using /givekey 1 @customer.")

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Direct Gmail SMTP Delivery & Automated Restock Waitlist
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("6. Direct Gmail SMTP Delivery & Automated Restock Waitlist")
    add_h2("6.1 Direct Gmail SMTP Integration (Nodemailer)")
    add_body(
        "To bypass third-party transactional email sandbox restrictions (e.g. Resend's onboarding@resend.dev limit of only emailing the account owner) "
        "without requiring a custom domain, AETHERIA integrates authenticated Gmail SMTP via Nodemailer:"
    )
    add_bullet("Zero Domain Overhead:", "Authenticated via Google 16-character App Password (GMAIL_USER & GMAIL_APP_PASSWORD). Sends directly from dhruvmatliwala336@gmail.com to any customer email (Gmail, Yahoo, Outlook, etc.).")
    add_bullet("Storefront Display Name:", "Emails display 'Aetheria Store' as the sender title in inboxes, with customer replies routing directly to the admin's Gmail.")
    add_bullet("Unified Dispatcher (resend.ts):", "Prioritizes Gmail SMTP; automatically falls back to Resend API if Gmail credentials are absent.")
    add_bullet("Customer Email Types:", "Powers License Key Delivery, 48-Hour Expiry Reminders, and Automated Restock Waitlist Alerts.")

    add_h2("6.2 Automated Restock Waitlist Notification System")
    add_body(
        "When a plan is sold out, storefront visitors can enter their email on the Restock Notification modal. Stored in the 'restock_requests' collection:"
    )
    add_bullet("Automated Key Upload Trigger:", "When keys are uploaded in /admin, the server automatically queries pending waitlist requests for that plan and dispatches branded restock alert emails in the background.")
    add_bullet("One-Click Admin Blast Button:", "WaitlistWidget in /admin features an interactive '[ 📧 Notify All Waiting (X) ]' button with confirmation dialog and live progress feedback, backed by POST /api/admin/waitlist/notify.")
    add_bullet("Automatic De-duplication:", "Successfully notified recipients are immediately cleared from Firestore to prevent duplicate or spam emails.")

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Telegram Bot Engine & Progressive Disclosure UPI Flow
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("7. Telegram Bot Engine & Progressive Disclosure UPI Flow")
    add_h2("7.1 Minimal 4-Line QR Screen & Delivery Expectation")
    add_body(
        "To eliminate text fatigue, hesitation, and customer intimidation during Telegram checkouts, the initial QR payment card was streamlined to 4 lines:"
    )
    add_bullet("Clean Card Copy:", "📦 PGSharp Standard (~30 Days) — ₹160 | 🔑 UPI ID: dhruvmatliwala123@oksbi | 🔖 Order ID: ord_tg_xxxx | ⚡ Scan QR or pay ₹160. Key is auto-delivered here within 1–2 minutes!")
    add_bullet("Primary Action Button:", "[ ❓ Paid but didn't get key? ] — cleanly conceals technical instructions until requested.")
    add_bullet("Progressive Disclosure Fallback:", "Tapping reveals comforting guidance: '⏳ Awaiting Bank Confirmation... Bank SMS alerts usually arrive within 1–2 minutes. 💡 If you paid and want your key right away without waiting: Send a screenshot of your Transaction Details (in Google Pay/FamPay, tap on the payment to view full details with the 12-digit UPI ID) or reply with the 12 digits directly!'")
    add_bullet("Transaction Details vs UTR:", "Replaced obscure banking jargon ('UTR') with clear visual directions: tap the payment to view Transaction Details / 12-digit UPI ID.")

    add_h2("7.2 Viral Referral & Reward Engine ('Refer & Earn')")
    add_bullet("Deep Tracking Links:", "Generates unique links (https://t.me/AetheriaStoreOfficialBot?start=ref_<chatId>) with real-time conversion stats.")
    add_bullet("Automated Friend Discount:", "Referred friends automatically receive ₹30 OFF on their first purchase without entering any promo code.")
    add_bullet("Reward Coupon Issuance:", "Upon friend purchase verification, referrer receives a single-use ₹30 coupon (REF30_XXXXXX) stackable on future renewals.")

    add_h2("7.3 Public Telegram Proof Channel (@AetheriaStoreOfficial)")
    add_bullet("Restock Announcements:", "Flash restock alerts with direct bot checkout links.")
    add_bullet("Privacy-Masked Order Vouches:", "Automated social proof posts (e.g. '30-Day PGSharp Key dispatched to dh***@gmail.com') with atomic idempotency locks.")

    # ─────────────────────────────────────────────────────────────────────────
    # 8. Verified Global Spoofing Hotspots & Live Scanner Telemetry
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("8. Verified Global Spoofing Hotspots & Live Scanner Telemetry")
    add_body(
        "Integrated spoofing directory and scanner webhook (/api/pokemon/spawns) provide 100% verified gameplay coordinates:"
    )
    add_bullet("100% Verified Global Spoofing Hotspots:", "Replaced synthetic/random math coordinates with 10 permanent, real-world verified premier spoofing hubs (Zaragoza Plaza del Pilar, Pier 39 SF, NYC Times Square, Tokyo Shinjuku, Sydney Circular Quay, São Paulo, Taipei, Dubai, London, Chicago Navy Pier). Features 1-tap copyable coordinates, PokéStop density metrics, local timezones, PGSharp pro-tips, and Google Maps jump links.")
    add_bullet("20-Minute De-duplication Cache:", "In-memory cache prevents repeat alerts for the same spawn.")
    add_bullet("1,025 Species National Pokédex:", "Fuzzy typo-tolerant search (Levenshtein distance) supporting natural typing ('Greyninja' -> 'Greninja').")
    add_bullet("Live Events Calendar (/api/pokemon/events):", "Fetches active 5-star raids, mega raids, and spotlight hours via /events command.")

    # ─────────────────────────────────────────────────────────────────────────
    # 9. Admin Command Center & Vercel Storage Optimization
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("9. Admin Command Center & Vercel Storage Optimization")
    add_bullet("Ghost Admin Camouflage:", "Unauthorized visits to /admin yield an authentic 404 error page. Accessible via secret bookmark (?key=SECRET) or triple-clicking the 404 badge.")
    add_bullet("Anti-Brute-Force Rate Limiting:", "Locks client IP after 5 failed passcode attempts for 15 minutes.")
    add_bullet("Live Firestore Coupon Engine:", "Interactive CRUD for promotional coupons with 1-click permanent deletion.")
    add_bullet("Vercel Deployment Storage Optimization:", "Automated cleanup script (cleanup_deployments.js) purges historical builds via Vercel REST API, reducing storage from 16.91 GB to ~0.65 GB (well under the 10 GB free ceiling).")

    # ─────────────────────────────────────────────────────────────────────────
    # 10. Complete Production Route Architecture Map
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("10. Complete Production Route Architecture Map")
    add_body("Overview of all verified production routes across the web storefront and backend API:")

    tbl_routes = doc.add_table(rows=1, cols=3)
    routes_widths = [Inches(2.1), Inches(1.3), Inches(3.1)]
    routes_headers = ["Route / Endpoint", "Rendering Mode", "Purpose & Functionality"]
    routes_rows = [
        ["/", "Static / Client", "Main 3-Scene Cinematic Storefront, Scrollytelling Runway, Preloader & HUD"],
        ["/order-success/[orderId]", "Dynamic SSR", "Holographic Encrypted Key Vault, Confetti Burst & 4-Step Activation Guide"],
        ["/admin", "Static / Client", "Admin Command Center: Key Ingestion, Slot Tier Analytics & Waitlist Manager"],
        ["/contact, /terms, /refund", "Static", "Legal Compliance, Terms of Service, Privacy Policy & Concierge Support"],
        ["/api/stock", "Dynamic API (Edge Cached)", "Real-time Tier Stock, Usable Slots & Active Inventory Counts (s-maxage=10)"],
        ["/api/stock/[planId]", "Dynamic API", "Individual Plan Stock Availability Query"],
        ["/api/checkout/upi", "Dynamic API", "Clean Whole-Rupee Payment Intent & Native Dynamic QR Code Generation"],
        ["/api/checkout/upi/verify", "Dynamic API", "Direct UPI 12-Digit Transaction ID Submission & Verification"],
        ["/api/webhooks/upi", "Dynamic API", "Bank SMS Auto-Bridge Webhook: Parses credit alerts for <2s auto-fulfillment"],
        ["/api/checkout/paypal", "Dynamic API", "PayPal.me Pre-filled Direct URL Generator ($2.00 / $3.60) & Order Creation"],
        ["/api/checkout/paypal/capture", "Dynamic API", "PayPal JS SDK Order Capture & Instant Key Allocation"],
        ["/api/checkout/paypal/verify", "Dynamic API", "PayPal Direct Transaction ID Verification & Key Reveal"],
        ["/api/webhooks/paypal", "Dynamic API", "PayPal IPN Asynchronous Webhook Verification"],
        ["/api/coupons/validate", "Dynamic API", "Real-Time Coupon Validation (Fixed Rupee & Percentage Discounts)"],
        ["/api/admin/coupons", "Dynamic API", "Live Admin Coupon CRUD with Instant Permanent Deletion"],
        ["/api/cron/expiry-reminders", "Dynamic API (Cron)", "Daily Retention Cron: Scans Day 28 keys, dispatches DMs & renewal links"],
        ["/api/pokemon/events", "Dynamic API", "Live Pokémon GO Raids, Max Battles & Spotlight Hours Calendar Feed"],
        ["/api/pokemon/spawns", "Dynamic API", "Live Pokémon Scanner Webhook Ingestion & Alert Dispatch"],
        ["/api/telegram/webhook", "Dynamic API", "Telegram Bot Webhook: Handles /start, /buy, /keys, /ref, /givekey, Radar"],
        ["/api/telegram/setup", "Dynamic API", "Automated Telegram Webhook Registration & Command Menu Setup"],
        ["/api/restock-notify", "Dynamic API", "Customer Restock Notification Waitlist Ingestion"],
        ["/api/admin/waitlist/notify", "Dynamic API", "Dispatches Restock Alert Emails to Waiting Customers via Gmail SMTP"],
        ["/api/admin/keys", "Dynamic API", "Batch Key Ingestion with 3-Slot Tagging, Channel Broadcast & Waitlist Alert"],
        ["/api/admin/keys/dispatch", "Dynamic API", "Manual 1, 2, or 3-Slot Direct Customer Key Dispatch"],
        ["/api/admin/stats", "Dynamic API", "Administrative Inventory Metrics, Revenue Totals & Slot Analytics"],
        ["/api/admin/orders/approve", "Dynamic API", "Manual Order Approval with Atomic Slot Allocation & Email Dispatch"],
        ["/api/admin/orders/reject", "Dynamic API", "Manual Order Rejection & Reason Logging"],
        ["/api/admin/orders/quick-approve", "Dynamic API", "Discord 1-Click Quick Approval Action Endpoint"],
        ["/api/admin/orders/quick-reject", "Dynamic API", "Discord 1-Click Quick Rejection Action Endpoint"],
        ["/api/reviews", "Dynamic API", "Verified Customer Reviews Ingestion & Aggregate Rating Feed"],
    ]
    format_table(tbl_routes, routes_widths, routes_headers, routes_rows)

    # ─────────────────────────────────────────────────────────────────────────
    # 11. Operational Runbook & CI/CD Deployment Guide
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("11. Operational Runbook & CI/CD Deployment Guide")
    add_body("Instructions for running, maintaining, and deploying AETHERIA in production:")
    add_bullet("Environment Configuration (.env.local):", "Configure all required keys: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, KEY_ENCRYPTION_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD, RESEND_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_PROOF_CHANNEL, and ADMIN_API_SECRET.")
    add_bullet("Local Development Server:", "Execute 'npm run dev' to launch on http://localhost:3000.")
    add_bullet("Production Verification Build:", "Execute 'npm run build' — verifies compilation and TypeScript validity across all routes.")
    add_bullet("Automated Vercel Deployment:", "Pushing commits to branch 'main' automatically triggers Vercel CI/CD pipeline, deploying to https://aetheria-store.vercel.app with zero downtime.")

    doc.save(output_path)
    print(f"Documentation saved successfully to: {output_path}")

if __name__ == '__main__':
    build_documentation_docx()
