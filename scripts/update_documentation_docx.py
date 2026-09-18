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
    add_bullet("One-Click Admin Blast Button:", "WaitlistWidget in /admin features an interactive '[ Notify All Waiting (X) ]' button with confirmation dialog and live progress feedback, backed by POST /api/admin/waitlist/notify.")
    add_bullet("Automatic De-duplication:", "Successfully notified recipients are immediately cleared from Firestore to prevent duplicate or spam emails.")

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Telegram Bot Engine & Progressive Disclosure UPI Flow
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("7. Telegram Bot Engine & Progressive Disclosure UPI Flow")
    add_h2("7.1 Minimal 4-Line QR Screen & Delivery Expectation")
    add_body(
        "To eliminate text fatigue, hesitation, and customer intimidation during Telegram checkouts, the initial QR payment card was streamlined to 4 lines:"
    )
    add_bullet("Clean Card Copy:", "PGSharp Standard (~30 Days) — ₹160 | UPI ID: dhruvmatliwala123@oksbi | Order ID: ord_tg_xxxx | Scan QR or pay ₹160. Key is auto-delivered here within 1–2 minutes!")
    add_bullet("Primary Action Button:", "[ Paid but didn't get key? ] — cleanly conceals technical instructions until requested.")
    add_bullet("Progressive Disclosure Fallback:", "Tapping reveals comforting guidance: 'Awaiting Bank Confirmation... Bank SMS alerts usually arrive within 1–2 minutes. If you paid and want your key right away without waiting: Send a screenshot of your Transaction Details (in Google Pay/FamPay, tap on the payment to view full details with the 12-digit UPI ID) or reply with the 12 digits directly!'")
    add_bullet("Transaction Details vs UTR:", "Replaced obscure banking jargon ('UTR') with clear visual directions: tap the payment to view Transaction Details / 12-digit UPI ID.")

    add_h2("7.2 Viral Referral & Reward Engine ('Refer & Earn')")
    add_bullet("Deep Tracking Links:", "Generates unique links (https://t.me/AetheriaStoreOfficialBot?start=ref_<chatId>) with real-time conversion stats.")
    add_bullet("Automated Friend Discount:", "Referred friends automatically receive ₹30 OFF on their first purchase without entering any promo code.")
    add_bullet("Reward Coupon Issuance:", "Upon friend purchase verification, referrer receives a single-use ₹30 coupon (REF30_XXXXXX) stackable on future renewals.")

    add_h2("7.3 Public Telegram Proof Channel (@AetheriaStoreOfficial)")
    add_bullet("Restock Announcements:", "Flash restock alerts with direct bot checkout links.")
    add_bullet("Privacy-Masked Order Vouches:", "Automated social proof posts (e.g. '30-Day PGSharp Key dispatched to dh***@gmail.com') with atomic idempotency locks.")

    # ─────────────────────────────────────────────────────────────────────────
    # 8. Sales Conversion Assets, Cooldown Guide & Live Events
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("8. Sales Conversion Assets, Cooldown Guide & Live Events")
    add_body(
        "Direct sales enablement tooling and ban-prevention utility for the Telegram bot:"
    )
    add_bullet("Free vs Standard Comparison Engine:", "High-converting sales comparison matrix detailing the limitations of PGSharp Free (15-second animations, blind catches without stats, no shiny scanner, manual joystick fatigue) vs the advantages of PGSharp Standard (1-second Quick Catch, 100% IV preview, block non-shiny encounters, hands-free GPX auto-walk, instant skip cutscenes, 100% excellent throws).")
    add_bullet("Anti-Ban Cooldown & Safety Guide:", "Comprehensive reference guide with distance cooldown chart (1 km to 1,350+ km global max of 120 mins), explicit breakdown of cooldown-triggering actions (balls, berries, gym battles, spins) versus safe actions (teleporting, IV inspection, egg hatching, trading).")
    add_bullet("Live Events Calendar (/api/pokemon/events):", "Fetches active 5-star raids, mega raids, and spotlight hours via /events command.")
    add_bullet("20-Minute De-duplication Cache:", "In-memory cache prevents repeat alerts for the same spawn.")
    add_bullet("1,025 Species National Pokedex:", "Fuzzy typo-tolerant search (Levenshtein distance) supporting natural typing ('Greyninja' -> 'Greninja').")

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
        ["/api/admin/crm/sales", "Dynamic API (Firestore)", "Google Cloud Firestore Persistence Bridge for CRM Sales Records (CRUD & Bulk Sync)"],
        ["/crm", "Protected HTML", "Customer Renewal CRM Dashboard: Gated by Master Passcode Lock Screen"],
        ["/api/crm/login", "Dynamic API (Node)", "CRM Master Passcode Authentication & 1-Year Session Cookie Dispenser"],
        ["/api/crm/logout", "Dynamic API (Node)", "CRM Session Invalidation & Cookie Revocation Endpoint"],
        ["/api/sales", "Protected API (Node)", "CRM Sales Retrieval API with Pending Days Ordering (Requires Auth Token)"],
        ["/api/sales/update", "Protected API (Node)", "CRM Record Update Endpoint for Customer, Plan, Email, and Expiry Edits"],
        ["/api/renew", "Protected API (Node)", "Interactive Key Renewal Endpoint: Updates Devices, Source Email, and Expiry"],
        ["/api/delete", "Protected API (Node)", "Permanent CRM Record Deletion & Cloud Archival Endpoint"],
        ["/googlec8c6c8ae927a0074.html", "Static HTML", "Google Search Console Site Ownership Verification Protocol"],
        ["/sitemap.xml", "Dynamic XML", "Dynamic SEO Sitemap Feed for Google Search Console Indexing"],
        ["/robots.txt", "Dynamic Text", "Crawler Access Directives & Sitemap Declarations"],
        ["/api/reviews", "Dynamic API", "Verified Customer Reviews Ingestion & Aggregate Rating Feed"],
    ]
    format_table(tbl_routes, routes_widths, routes_headers, routes_rows)

    # ─────────────────────────────────────────────────────────────────────────
    # 11. Customer Renewal & Expiration CRM Engine (/crm)
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("11. Customer Renewal & Expiration CRM Engine (/crm)")
    add_body(
        "A dedicated, standalone customer lifecycle and license retention dashboard hosted on Render within telegram-key-notifier "
        "(https://telegram-key-notifier.onrender.com/crm), providing complete visibility over all customer keys across platforms:"
    )
    add_h2("11.1 Multi-Account Source Email Tracking & Key Distribution")
    add_bullet("Source Email Inventory Tracking:", "Tracks which of the owner's 11+ PGSharp/Patreon Google accounts holds each customer key, preventing overselling or slot confusion across distributed keys.")
    add_bullet("Real-Time Distribution Overview Bar:", "Positioned above the table, an interactive distribution card displays key load per email account with color-coded load badges (e.g. dhruvmatliwala336+5@gmail.com: 4 keys).")
    add_bullet("1-Click Email Isolation:", "Clicking any email pill or table email badge immediately filters the entire table to show only keys provisioned under that specific account.")
    add_bullet("Source Email Filter Dropdown:", "Filter dropdown in the controls bar displays dynamic key count metrics alongside account addresses.")

    add_h2("11.2 Pending Days Dynamic Ordering & Clustered Grouping")
    add_bullet("Pending Days Ordering (Default View):", "Automatically orders licenses by pending days remaining (Lowest First / Expiring Soonest) so the owner immediately spots expiring keys at the top of the interface.")
    add_bullet("Group Same Emails Together:", "Sort mode that clusters all customer rows sharing the identical source email address consecutively, sub-sorted internally by fewest pending days remaining.")
    add_bullet("Interactive Column Header Sorting:", "Clicking the 'Expiry / Days Left' column header toggles between ascending (fewest days left first) and descending sort orders with visual indicators.")

    add_h2("11.3 Interactive Renewal Modal Engine")
    add_bullet("Contextual Pre-filling:", "Clicking 'Renew' on any row launches a dedicated modal pre-populated with customer name, current device plan, platform, source email, and contact handle.")
    add_bullet("Flexible Account Reassignment:", "Allows updating the source email account during renewal, enabling smooth migration to accounts with available slots.")
    add_bullet("Device Plan Flexibility:", "Easily switches or upgrades customer tiers between 1 Device (Standard - Rs 160) and 2 Devices (Duo - Rs 300).")
    add_bullet("Custom Date Presets & Manual Calendar:", "Provides 1-click extension buttons (+30D, +25D, +20D, +15D, +10D, +7D, Today + 30D) or a manual calendar picker with live renewal and reminder preview calculation.")

    add_h2("11.4 Automated Day-27 Proactive Telegram Reminders")
    add_bullet("3-Day Advance Retention Radar:", "A background cron scans active customer licenses every 30 minutes. Exactly 3 days before expiration (Day 27 on 30-day keys), an automated notification is dispatched to Dhruv's Telegram (ID: 741838315).")
    add_bullet("Actionable Notification Payload:", "Alert message provides customer name, contact handle, plan, source account email, exact expiry date, and days remaining with direct renewal prompts.")

    add_h2("11.5 Slot-Proportional Profit & Revenue Engine")
    add_bullet("Slot-Proportional Cost Architecture:", "Calculates profit based on Patreon's flat Rs 200 cost for a 3-device key (Rs 67 per slot). 1 Device costs Rs 67 (Profit: +Rs 93 / +Rs 63 ref), 2 Devices costs Rs 133 (Profit: +Rs 167 / +Rs 137 ref), and 3 Devices costs Rs 200 (Profit: +Rs 200 / +Rs 170 ref).")
    add_bullet("3-Device Plan Support (Rs 400):", "Added full 3-Device key plan to Log Sale, Edit, and Renew modals alongside 1 Device (Standard - Rs 160) and 2 Devices (Duo - Rs 300).")
    add_bullet("1-Click Pricing & Discount Presets:", "Modal controls include [ Standard Price ], [ -30 Referral ], and custom amount inputs with live real-time net profit and margin calculation banners.")
    add_bullet("Top Financial Analytics Card:", "Dedicated dashboard banner above the CRM table tracking Total Revenue, Patreon Inventory Costs, Net Profit, and Overall Margin across all tracked sales.")
    add_bullet("Historical Baseline Isolation:", "All pre-existing 30 records entered prior to launch are flagged as untracked legacy records, preserving their reminder schedules while keeping the new profit ledger 100% accurate.")

    add_h2("11.6 CRM Security Lock & Persistent Master Passcode Gate")
    add_bullet("Restricted Obsidian Lock Screen:", "Unauthenticated visitors navigating to /crm are blocked by a secure dark-mode login gate that prevents unauthorized viewing or extraction of customer names, emails, contact handles, and profit data.")
    add_bullet("High-Entropy Master Passcode:", "Protected via high-entropy 28-character security passcode (Aeth$9xK!7mP_2vQ-8zL4.dY~2026), with fallback validation against ADMIN_API_SECRET.")
    add_bullet("1-Year Persistent Browser Session:", "Authenticating sets a 1-year SameSite cookie and synchronizes with localStorage, allowing seamless access across device restarts without needing to re-type the passcode every time.")
    add_bullet("1-Click Bookmark URL Authentication:", "Visiting /crm?auth=PASSCODE instantly authenticates the browser, saves credentials, and strips the secret from the address bar for effortless 1-click access.")
    add_bullet("API Endpoint Security Shield:", "All backend endpoints (/api/sales, /api/sales/update, /api/renew, /api/delete) enforce token validation and reject unauthenticated requests with HTTP 401 Unauthorized.")

    add_h2("11.7 Dual-Tab Architecture: Combined Licenses & Accounts with Dedicated Profit Tracker")
    add_bullet("Combined Operational Workspace:", "Merges the customer renewal management table directly with the Patreon sourced email distribution bar and quick-click load pills on a single screen. This gives the owner immediate visibility over account key loads (e.g. 11+ accounts) and enables 1-click account filtering without needing to switch away from the license table.")
    add_bullet("Isolated Profit & Financial Tracker Tab:", "Isolates the financial tracking dashboard into its own dedicated tab, eliminating financial clutter from daily operations while retaining 5 KPI cards (Tracked Sales, Total Revenue, Patreon Inventory Costs, Net Profit, Margin %), Device Tier margin breakdowns (1, 2, and 3 Devices), and Acquisition Channel performance (Discord, Telegram, Reddit).")
    add_bullet("Streamlined 8-Column Table Design:", "Consolidates redundant columns into 8 high-density columns: Customer & Contact (combined name + handle), Plan, Amount / Profit (selling price + net profit badge), Platform, Source Account Email, Expiry / Days Left (timeline + pending days), Status, and Actions.")
    add_bullet("Persistent Tab State & Smart Switching:", "Active tab state is saved to localStorage (crm_active_tab) and restored on page refresh. Contextual actions such as clicking quick-filter cards or account badges automatically navigate to the Customer Licenses view and apply filters synchronously.")

    # ─────────────────────────────────────────────────────────────────────────
    # 12. Google Cloud Firestore Persistent CRM Storage Bridge
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("12. Google Cloud Firestore Persistent CRM Storage Bridge")
    add_body(
        "To guarantee zero data loss on Render's ephemeral container filesystem, the CRM is wired directly to Google Cloud Firestore (pgsharp-4587b):"
    )
    add_bullet("Container Rebuild Immunity:", "Because Docker containers reset on redeployments, local sales.json storage is automatically backed by Firestore collection 'crm_sales', ensuring no customer record is ever lost on git pushes or server restarts.")
    add_bullet("Dedicated REST API Bridge (/api/admin/crm/sales):", "High-performance endpoint in the Next.js storefront backend handling GET, POST, PUT, and DELETE operations against Firestore.")
    add_bullet("Cryptographic API Secret Authorization:", "Secured via constant-time SHA-256 header authentication (x-admin-secret) matching ADMIN_API_SECRET.")
    add_bullet("Bi-directional Startup Hydration:", "On container boot, initCrmDatabase queries Firestore and populates memory and local disk. When sales are entered or renewed, updates are synchronously applied locally and pushed asynchronously to Firestore.")

    # ─────────────────────────────────────────────────────────────────────────
    # 13. Discord Interactive Order Ticket Bot & Vouches Synchronization
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("13. Discord Interactive Order Ticket Bot & Vouches Synchronization")
    add_h2("13.1 Persistent Gateway WebSocket Ticket Bot")
    add_bullet("Gateway Architecture:", "Persistent WebSocket connection (gateway.discord.gg v10) running 24/7 on Render within telegram-key-notifier.")
    add_bullet("Interactive Button Component:", "Message 1550381786234626081 in #pgsharp-keys (1550381744509685901) features an interactive green '[ Open Order Ticket ]' button.")
    add_bullet("Private Mutual Ticket Rooms:", "Dynamically provisions private channel #ticket-<username> hidden from @everyone with explicit read/write permission overwrites for the buyer, Dhruv (503233296134832149 / @dhruv_emperor), and the bot.")
    add_bullet("Profile Transparency & Trust:", "Both the customer and owner see each other's verified profiles, avatar, and direct chat within the room, completely resolving off-platform trust friction.")
    add_bullet("Instant Telegram Mobile Jump Alert:", "Dispatches an immediate Telegram alert to Dhruv (741838315) with an inline button URL opening Discord directly into the ticket room.")
    add_bullet("Self-Closing Architecture:", "Interactive '[ Close Ticket ]' button allows either party to close and delete the ticket channel upon transaction completion.")

    add_h2("13.2 Cross-Platform Vouches Mirroring Engine")
    add_bullet("Autonomous Telegram-to-Discord Forwarding:", "Monitors approved proof screenshots posted in Telegram channel @AetheriaStoreVouches.")
    add_bullet("Rich Discord Embeds:", "Automatically forwards customer receipts, bank confirmations, and activation screenshots into Discord channel #vouches (1550381748506988584) with styled embeds.")

    add_h2("13.3 Streamlined Channel Architecture & 100iv Coordinate Hub")
    add_bullet("Decluttered Channel Hierarchy:", "Removed noisy and unused channels (#clips-and-highlights, #cooldown-guide) to center community focus on key purchasing, instant fulfillment, and game utility.")
    add_bullet("Short & Intuitive Channel Naming:", "Replaced lengthy titles with industry-standard short identifiers: #welcome-and-rules to #welcome, #pricing-and-keys to #pgsharp-keys, #events-calendar to #events, #flex-catches to #flex, and #hundo-coords to #100iv.")
    add_bullet("100IV Coordinate Hub Architecture:", "The dedicated #100iv channel provides a streamlined, mobile-friendly hub for verified 100% IV Pokemon coordinates featuring 1-tap raw coordinates, despawn countdowns, IV breakdown (15/15/15), CP, level, and regional tags.")

    # ─────────────────────────────────────────────────────────────────────────
    # 14. Google Search Console Verification & SEO Optimization
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("14. Google Search Console Verification & SEO Optimization")
    add_bullet("Dual-Layer Ownership Verification:", "Verified via static HTML verification file (/googlec8c6c8ae927a0074.html) and layout metadata tag (<meta name='google-site-verification' content='googlec8c6c8ae927a0074' />).")
    add_bullet("Dynamic XML Sitemap (/sitemap.xml):", "Generates dynamic URL index with daily crawl frequency for root storefront and monthly indexing for legal compliance routes.")
    add_bullet("Crawler Directives (/robots.txt):", "Allows global indexing for public storefront routes while disallowing sensitive /admin and /api endpoints.")
    add_bullet("Rich Structured Schema JSON-LD:", "Embeds Schema.org OnlineStore and Product schemas with localized INR and USD pricing, stock availability, and verified customer review aggregates.")

    # ─────────────────────────────────────────────────────────────────────────
    # 15. Operational Runbook & CI/CD Deployment Guide
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("15. Operational Runbook & CI/CD Deployment Guide")
    add_body("Instructions for running, maintaining, and deploying AETHERIA in production:")
    add_bullet("Environment Configuration (.env.local):", "Configure all required keys: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, KEY_ENCRYPTION_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD, RESEND_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_PROOF_CHANNEL, and ADMIN_API_SECRET.")
    add_bullet("Local Development Server:", "Execute 'npm run dev' to launch on http://localhost:3000.")
    add_bullet("Production Verification Build:", "Execute 'npm run build' — verifies compilation and TypeScript validity across all routes.")
    add_bullet("Automated Vercel Deployment:", "Pushing commits to branch 'main' automatically triggers Vercel CI/CD pipeline, deploying to https://aetheria-store.vercel.app with zero downtime.")
    add_bullet("Automated Render Deployment:", "Pushing commits to branch 'main' in telegram-key-notifier automatically triggers Render container build and deployment with automatic Firestore synchronization.")

    doc.save(output_path)
    print(f"Documentation saved successfully to: {output_path}")

if __name__ == '__main__':
    build_documentation_docx()
