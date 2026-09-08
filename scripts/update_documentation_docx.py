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
        "Version: 2.1.0 Prod",
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
    # 1. Executive Summary & System Overview
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("1. Executive Summary & System Overview")
    add_body(
        "AETHERIA is an institutional-grade, high-performance digital storefront engineered specifically for official "
        "PGSharp Standard Edition license key distribution. It merges luxury dark-mode aesthetics (Obsidian Glassmorphism, "
        "Neon Cyan & Emerald accoutrements) with an interactive 550vh image-sequence scrollytelling runway, dual-rail automated "
        "checkout, zero-fee direct payment allocation, cryptographic key vault security, an automated Telegram retention ecosystem, "
        "and a zero-latency customer fulfillment portal."
    )
    add_bullet("Core Brand Proposition:", "Institutional-grade reliability, instantaneous automated key dispatch (< 10 seconds), zero ban risk advisory, and 1-on-1 VIP concierge support on Discord, Telegram, and Reddit.")
    add_bullet("Technology Stack:", "Next.js 14 App Router, TypeScript, Tailwind CSS, GSAP 3 (ScrollTrigger), HTML5 Canvas Particle Engine, Firebase Firestore / Admin SDK, Native Direct UPI with Dynamic Unique Paise Offset, Bank SMS Auto-Bridge Webhook, PayPal v2 & Direct Rails, and Resend Email API.")
    add_bullet("Multi-Device Inventory Engine:", "Universal 3-device slot allocation architecture, dynamically satisfying 1-Device and 2-Device storefront demand with zero license slot waste.")

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Official Pricing Architecture & Device Slot Matrix
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("2. Official Pricing Architecture & Device Slot Matrix")
    add_body(
        "To maximize conversion while remaining highly competitive across domestic Indian (INR) and international (USD) markets, "
        "AETHERIA implements a standardized, hyper-calibrated pricing structure. Prices are centrally defined in src/lib/constants.ts "
        "and dynamically cascade across storefront cards, modal checkout, PayPal links, automated Telegram bot messages, and SEO schema."
    )

    tbl_pricing = doc.add_table(rows=1, cols=6)
    pricing_widths = [Inches(1.2), Inches(0.9), Inches(1.0), Inches(1.0), Inches(1.1), Inches(1.3)]
    pricing_headers = ["Plan Tier", "Device Slots", "Standard Price (INR)", "Standard Price (USD)", "Discounted (INR)", "Discounted (USD)"]
    pricing_rows = [
        ["1 Device Plan", "1 Android Device", "₹130 (13,000 paise)", "$1.79 (179 cents)", "₹100 (₹30 OFF)", "$1.49 ($0.30 OFF)"],
        ["2 Devices Plan (Popular)", "2 Android Devices", "₹250 (25,000 paise)", "$3.50 (350 cents)", "₹220 (₹30 OFF)", "$3.00 ($0.50 OFF)"],
    ]
    format_table(tbl_pricing, pricing_widths, pricing_headers, pricing_rows)

    add_body(
        "Strikethrough Reference Values: The 2 Devices Plan displays a strikethrough original price of ₹260 (2x ₹130) in INR and $3.58 "
        "(2x $1.79) in USD, visually underscoring a 'BEST VALUE' volume discount. Storefront pricing is strictly limited to 1-Device and "
        "2-Device consumer tiers; 3-device bulk orders are fulfilled behind the scenes through the atomic key allocation engine."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Patreon 3-Device Key Slot Allocation Engine
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("3. Patreon 3-Device Key Slot Allocation Engine")
    add_body(
        "A critical engineering breakthrough in AETHERIA is the transition of the underlying inventory layer from 2-device keys "
        "to official 3-device Patreon Standard Edition keys (source: 'patreon_3slot'). A single physical Patreon key authorizes up to 3 "
        "concurrent Android devices. Rather than forcing customers to buy 3-device plans, AETHERIA maintains a virtual slot bin-packing "
        "engine that slices each physical key into 1-Device and 2-Device customer orders."
    )

    add_h2("3.1 In-Memory ASC Bin-Packing Algorithm")
    add_body(
        "Implemented in src/lib/services/keyAllocator.ts via allocateKeySlot(), the allocation engine queries all non-exhausted candidate keys "
        "from Firestore and sorts them in ascending order of remaining slots (candidates.sort((a, b) => a.remainingSlots - b.remainingSlots))."
    )
    add_bullet("Tightest Fit Priority:", "By sorting ascending, the algorithm prioritizes partially filled keys before touching untouched keys. For example, a key with exactly 1 slot remaining is immediately prioritized for incoming 1-Device orders, closing out the key to 'full' status.")
    add_bullet("Case A: 2-Device Order First:", "When an order for 2 Devices arrives, it is allocated to a fresh 3-slot key (or a partially used key with >= 2 slots). The key's remaining slots decrement to 1 (status: 'partially_used'). The next 1-Device order immediately consumes that final remaining slot, closing the key at 3/3 utilized.")
    add_bullet("Case B: Three 1-Device Orders:", "Three distinct 1-Device orders consecutively consume slots 1, 2, and 3 on the same key. The key transitions available -> partially_used -> full with 100% capacity utilization.")
    add_bullet("Zero Slot Wastage Guarantee:", "Mathematical combinations (1+1+1=3 and 2+1=3) ensure that zero device slots are ever stranded or orphaned.")

    add_h2("3.2 Atomic Firestore Transaction Guarantees")
    add_body(
        "All slot allocations are executed inside an isolated db.runTransaction() atomic block. During high-concurrency traffic surges "
        "(such as Community Day or Raid Hour restocks), simultaneous orders cannot double-allocate the same slot. If two buyers attempt "
        "to claim the final slot of a key simultaneously, Firestore's optimistic concurrency control retries the second transaction "
        "against the next eligible candidate key seamlessly."
    )

    add_h2("3.3 Usable Slots & Stock Calculation")
    add_bullet("Total Usable Slots:", "Calculated via (available_3slot_keys * 3) + sum(partially_used_remaining_slots).")
    add_bullet("1-Device Stock Count:", "Exactly equals Total Usable Slots.")
    add_bullet("2-Device Stock Count:", "Calculated via Math.floor(Total Usable Slots / 2), accounting for pairs of available slots.")

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Direct Native UPI Payment Flow & Zero-Fee Dynamic Paise Offset
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("4. Direct Native UPI Payment Flow & Zero-Fee Dynamic Paise Offset")
    add_body(
        "Traditional payment aggregators (e.g. Razorpay, Cashfree) impose 2–3% + GST gateway fees, chargebacks, rolling reserves, and "
        "frequent KYC suspensions. Furthermore, forcing users to manually copy and paste 12-digit UTR numbers leads to a 40%+ cart abandonment rate. "
        "AETHERIA completely bypasses third-party gateways with its native Direct UPI engine."
    )

    add_h2("4.1 Dynamic Unique Paise Offset Allocation (allocateUniquePaise)")
    add_body(
        "When a buyer initiates checkout on the 1-Device (₹130) or 2-Devices (₹250) plan, the server calls allocateUniquePaise() in "
        "src/lib/payments/paiseAllocator.ts. The engine temporarily reserves an exclusive fractional paise offset for 15 minutes:"
    )
    add_bullet("Collision Prevention:", "For example, Customer A paying ₹130 is assigned ₹130.14, while Customer B is assigned ₹130.38. The exact decimal amount is rendered directly into the dynamic UPI QR code and deep-link intent string.")
    add_bullet("1-Tap Payment Flow:", "Scanning the QR code with GPay, PhonePe, Paytm, CRED, or BHIM automatically populates the exact amount down to the paise. The customer simply enters their UPI PIN and completes the payment.")

    add_h2("4.2 Automated Bank SMS Bridge (/api/webhooks/upi)")
    add_body(
        "An automated Android forwarder app installed on the recipient business device forwards incoming bank SMS alerts (HDFC, SBI, ICICI, Kotak, Paytm Payments Bank) "
        "to the /api/webhooks/upi webhook endpoint via an encrypted JSON payload."
    )
    add_bullet("High-Precision Regex Parsing:", "bankSmsParser.ts strips alphanumeric noise and extracts: (1) Exact Credit Amount with paise, (2) 12-digit UTR transaction reference, and (3) Bank timestamp.")
    add_bullet("Instant Match & Auto-Fulfillment:", "The webhook queries Firestore for pending orders with matching paise amount within the 15-minute reservation window. Upon a match, it immediately triggers allocateKeySlot(), updates order status to 'completed', and reveals the key on the buyer's screen in under 2 seconds!")

    add_h2("4.3 Discord 1-Click Cryptographic Approval Subsystem")
    add_body(
        "If a customer manually enters a UTR reference before bank SMS processing, the system posts an interactive rich embed to a private "
        "Discord administrative channel. The embed features cryptographic 1-click action buttons ('Approve' and 'Reject') signed with an HMAC-SHA256 "
        "token. The admin clicks 'Approve' inside Discord, instantly fulfilling the order without logging into the web dashboard."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 5. International PayPal Direct Rail
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("5. International PayPal Direct Rail")
    add_body(
        "For global trainers outside India, AETHERIA provides a friction-free international payment flow in USD via /api/checkout/paypal."
    )
    add_bullet("Pre-filled Direct Payment Links:", "Generates a clean PayPal.me payment URL pre-filled with the exact plan price: e.g. https://www.paypal.me/MatliwalaYogesh/1.79USD for 1 Device ($1.79) or /3.50USD for 2 Devices ($3.50).")
    add_bullet("Transaction ID Verification:", "Upon completing payment on PayPal, the buyer enters their alphanumeric PayPal Transaction ID. The endpoint validates uniqueness, creates the order in USD, allocates the key slot, and delivers the key immediately.")
    add_bullet("Native PayPal SDK Integration:", "Additionally supports native in-modal PayPal JS SDK checkout (/api/checkout/paypal/capture) with automatic capture and real-time webhook listeners (/api/webhooks/paypal).")

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Telegram Bot Subsystem & Automated Retention Engine
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("6. Telegram Bot Subsystem & Automated Retention Engine")
    add_body(
        "AETHERIA features a fully automated Telegram Bot (@sleekfx3 / Telegram Webhook) built on src/lib/telegram/handlers.ts. "
        "It acts as a 24/7 autonomous sales representative, order lookup vault, customer retention system, and community broadcaster."
    )

    add_h2("6.1 Interactive Customer Bot Menu & Key Lookup")
    add_bullet("Self-Service Key Recovery (/keys):", "Buyers can type /keys or click 'My Keys' to retrieve all active PGSharp license keys, remaining days, and binding instructions associated with their Telegram account or email.")
    add_bullet("Instant Buy Flow (/buy):", "Displays interactive inline buttons for 1 Device (₹130 / $1.79) and 2 Devices (₹250 / $3.50) with direct payment links and instant QR rendering.")

    add_h2("6.2 Automated 28-Day Expiry Reminder Engine (/api/cron/expiry-reminders)")
    add_body(
        "Customer retention is automated via a scheduled daily cron job configured in Vercel (vercel.json) executing at 09:00 UTC daily:"
    )
    add_bullet("Target Window Scan:", "Scans Firestore collection 'orders' for active orders where expires_at falls within the next 48 hours (day 28 of 30).")
    add_bullet("Automated Telegram DM Dispatch:", "Dispatches a personalized, rich HTML reminder message directly to the customer's Telegram chat ID: '⏳ Your PGSharp License Expires in 48 Hours!'")
    add_bullet("1-Click Renewal Coupon (RENEW30):", "Includes an exclusive pre-applied promo code offering ₹30 / $0.30 OFF renewal pricing (₹100 / $1.49 for 1 Device, ₹220 / $3.00 for 2 Devices), maximizing repeat lifetime value (LTV).")
    add_bullet("Dual-Rail Delivery:", "Simultaneously sends a responsive HTML renewal reminder email via Resend to the customer's registered email address.")

    add_h2("6.3 Automated Restock Announcements (src/lib/telegram/proofs.ts)")
    add_body(
        "Whenever an administrator ingests fresh keys via /api/admin/keys, the system automatically triggers postRestockAnnouncement(). "
        "It formats an eye-catching announcement with current stock counts, pricing (₹130 / $1.79 & ₹250 / $3.50), and 1-tap buy buttons, "
        "broadcasting it to connected public Telegram channels and VIP groups instantaneously."
    )

    add_h2("6.4 Viral Referral Subsystem (src/lib/telegram/referrals.ts)")
    add_body(
        "To drive zero-CAC viral growth, every customer receives a unique referral code (e.g. REF30_ABC123):"
    )
    add_bullet("Referee Benefit:", "New buyers entering the referral link receive an instant ₹30 / $0.30–$0.50 discount (₹130 -> ₹100, $1.79 -> $1.49 for 1 Device; ₹250 -> ₹220, $3.50 -> $3.00 for 2 Devices).")
    add_bullet("Referrer Rewards:", "Referrals are tracked in the Firestore 'referrals' collection, accumulating credits toward free 30-day PGSharp keys for top promoters.")

    add_h2("6.5 Live Pokémon GO Events & Raid Calendar (/api/pokemon/events)")
    add_body(
        "Integrated in src/lib/pokemon/events.ts, the bot fetches real-time Pokémon GO event calendars (Active 5-Star Raids, Mega Raids, "
        "Max Battles, Spotlight Hours, and Community Days). Inside the Telegram bot, users type /events to inspect active raid bosses, "
        "complete with recommended spoofer coordinates and an embedded 'Get PGSharp Key' CTA."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Multi-Theme Architecture & Cinematic Scrollytelling Engine
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("7. Multi-Theme Architecture & Cinematic Scrollytelling Engine")
    add_body(
        "AETHERIA features a multi-theme engine configured centrally in src/config/theme.ts, supporting 3 fully isolated storefront experiences:"
    )
    add_bullet("Aetheria Obsidian (Active Default):", "High-res frame scrollytelling engine optimized for mobile devices and budget hardware. Extracts paused frames from scenes, delivering 0% GPU video decoding load, 0ms lag, and instantaneous load times.")
    add_bullet("Aetheria Motion (Backup 1):", "1440p live video scrollytelling runway designed for high-performance desktop displays with dual-player video cross-fading.")
    add_bullet("Aetheria Nexus (Backup 2):", "Classic modular cyber e-commerce grid with vertical layout for traditional direct buyers.")
    add_bullet("Instant URL Theme Preview:", "Administrators and users can preview any theme in real-time by appending '?theme=obsidian', '?theme=motion', or '?theme=nexus' to the storefront URL.")

    add_h2("7.1 3-Scene Cinematic Runway Breakdown")
    tbl_scenes = doc.add_table(rows=1, cols=4)
    scenes_widths = [Inches(1.2), Inches(1.5), Inches(2.2), Inches(1.6)]
    scenes_headers = ["Scene / Scroll Range", "Theme & Asset", "Headline & Narrative", "Key Features & CTAs"]
    scenes_rows = [
        ["Scene 1 (0% – 28%)", "Mewtwo Cryo-Awakening (/images/scenes/scene1.webp)", "BREAK EVERY LIMIT. Official 30-day PGSharp Standard Edition licenses.", "Fast Key Delivery, 30-Day License, 'Buy License Key →'"],
        ["Scene 2 (28% – 62%)", "Shibuya Crossing & Pikachu (/images/scenes/scene2.webp)", "ROAM ANYWHERE. Precision PGSharp GPS joystick and route patrol.", "Dual Obsidian Pricing Cards: ₹130 ($1.79) & ₹250 ($3.50)"],
        ["Scene 3 (62% – 100%)", "Ash-Greninja Stadium Showdown (/images/scenes/scene3.webp)", "MASTER EVERY RAID. Live 100% IV scanner feed and raid radar.", "Trust Vault Guarantee, 7 Interactive FAQs, Discord & Reddit Support"],
    ]
    format_table(tbl_scenes, scenes_widths, scenes_headers, scenes_rows)

    add_h2("7.2 Full-Screen Brand Preloader & Spatial Audio")
    add_bullet("3-Phase GSAP Preloader (Preloader.tsx):", "Phase 1: Glowing frosted Delta emblem scales in. Phase 2: Staggered character reveal of 'AETHERIA' with cyber pulse line. Phase 3: Shutter pulls upward to reveal Scene 1. Uses sessionStorage to ensure single-run per user session.")
    add_bullet("Ambient Spatial Audio (AmbientAudioContext.tsx):", "Global audio singleton loads /audio/ambient.mp3 capped strictly at 25% volume ceiling with smooth 300ms cross-fading ramps.")

    # ─────────────────────────────────────────────────────────────────────────
    # 8. High-Performance Engineering & Profiling
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("8. High-Performance Engineering & Profiling")
    add_body("The storefront has undergone extensive profiling across Chrome DevTools, WebPageTest, and mobile throttles:")
    add_bullet("React Reconciliation Guard:", "handleScrollProgress uses strict equality checks (prev !== newIdx ? newIdx : prev), eliminating hundreds of redundant React reconciliation passes during rapid scrolling.")
    add_bullet("GSAP Overwrite & Pin Safeguards:", "Configured with overwrite: 'auto', clearProps: 'transform', anticipatePin: 1, and invalidateOnRefresh: true, preventing transform collisions.")
    add_bullet("Canvas Visibility Throttling:", "AmbientMistParticles.tsx listens to document.visibilitychange, halting animation loops when the tab is hidden, reducing CPU/GPU usage to 0%.")
    add_bullet("Edge Caching on API Routes:", "/api/stock returns Cache-Control: public, s-maxage=10, stale-while-revalidate=30 for sub-5ms stock availability responses.")
    add_bullet("Static Asset Immutability:", "next.config.mjs serves all media assets with Cache-Control: public, max-age=31536000, immutable.")

    # ─────────────────────────────────────────────────────────────────────────
    # 9. Complete Production Route & API Architecture Map
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("9. Complete Production Route & API Architecture Map")
    add_body("The application features 28 optimized production routes and endpoints:")

    tbl_routes = doc.add_table(rows=1, cols=3)
    routes_widths = [Inches(2.0), Inches(1.3), Inches(3.2)]
    routes_headers = ["Route / Endpoint", "Rendering Mode", "Purpose & Functionality"]
    routes_rows = [
        ["/", "Static / Client", "Main 3-Scene Cinematic Storefront, Scrollytelling Runway, Preloader & HUD"],
        ["/order-success/[orderId]", "Dynamic SSR", "Holographic Encrypted Key Vault, Confetti Burst & 4-Step Activation Guide"],
        ["/admin", "Static / Client", "Admin Command Center: Key Ingestion, Slot Tier Analytics & Waitlist Manager"],
        ["/contact", "Static", "Direct Concierge Contact, Discord, Reddit & Telegram Channels"],
        ["/terms, /privacy, /refund", "Static", "Legal Compliance, Terms of Service, Privacy Policy & Refund Guarantees"],
        ["/api/stock", "Dynamic API (Edge Cached)", "Real-time Tier Stock, Usable Slots & Active Inventory Counts (s-maxage=10)"],
        ["/api/stock/[planId]", "Dynamic API", "Individual Plan Stock Availability Query"],
        ["/api/checkout/upi", "Dynamic API", "Dynamic Unique Paise Offset Allocation (e.g. ₹130.14) & QR Code Generation"],
        ["/api/checkout/upi/verify", "Dynamic API", "Direct UPI UTR Submission & Verification"],
        ["/api/webhooks/upi", "Dynamic API", "Bank SMS Auto-Bridge Webhook: Regex parses paise + UTR for <2s auto-fulfillment"],
        ["/api/checkout/paypal", "Dynamic API", "PayPal.me Pre-filled Direct URL Generator ($1.79 / $3.50) & Internal Order Creation"],
        ["/api/checkout/paypal/capture", "Dynamic API", "PayPal JS SDK Order Capture & Instant Key Allocation"],
        ["/api/checkout/paypal/verify", "Dynamic API", "PayPal Direct Transaction ID Verification & Key Reveal"],
        ["/api/webhooks/paypal", "Dynamic API", "PayPal IPN Asynchronous Webhook Verification"],
        ["/api/coupons/validate", "Dynamic API", "Real-Time Coupon Validation (Fixed Rupee & Percentage Discounts)"],
        ["/api/cron/expiry-reminders", "Dynamic API (Cron)", "Daily 09:00 UTC Retention Cron: Scans Day 28 keys, dispatches DMs & RENEW30 coupon"],
        ["/api/pokemon/events", "Dynamic API", "Live Pokémon GO Raids, Max Battles & Spotlight Hours Calendar Feed"],
        ["/api/telegram/webhook", "Dynamic API", "Telegram Bot Webhook: Handles /start, /buy, /keys, /referral, /events"],
        ["/api/telegram/setup", "Dynamic API", "Automated Telegram Webhook Registration & Command Menu Setup"],
        ["/api/restock-notify", "Dynamic API", "Customer Restock Notification Waitlist Ingestion"],
        ["/api/admin/keys", "Dynamic API", "Secure Batch Key Ingestion with 3-Slot Patreon Tagging & Restock Announcements"],
        ["/api/admin/stats", "Dynamic API", "Administrative Inventory Metrics, Revenue Totals & Slot Analytics"],
        ["/api/admin/orders/approve", "Dynamic API", "Manual Order Approval with Atomic Slot Allocation & Email Dispatch"],
        ["/api/admin/orders/reject", "Dynamic API", "Manual Order Rejection & Reason Logging"],
        ["/api/admin/orders/quick-approve", "Dynamic API", "Discord 1-Click Quick Approval Action Endpoint"],
        ["/api/admin/orders/quick-reject", "Dynamic API", "Discord 1-Click Quick Rejection Action Endpoint"],
        ["/api/admin/radar/scan", "Dynamic API", "Automated Lead Radar: Scans Discord & Reddit for PGSharp Buyers"],
        ["/api/reviews", "Dynamic API", "Verified Customer Reviews Ingestion & Aggregate Rating Feed"],
    ]
    format_table(tbl_routes, routes_widths, routes_headers, routes_rows)

    # ─────────────────────────────────────────────────────────────────────────
    # 10. Operational Runbook & CI/CD Deployment Guide
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("10. Operational Runbook & CI/CD Deployment Guide")
    add_body("Instructions for running, maintaining, and deploying AETHERIA in production:")
    add_bullet("Environment Configuration (.env.local):", "Ensure all required environment keys are set: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, KEY_ENCRYPTION_SECRET (32-byte hex string), NEXT_PUBLIC_APP_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, DISCORD_WEBHOOK_URL, RESEND_API_KEY, and PAYPAL credentials.")
    add_bullet("Local Development Server:", "Execute 'npm run dev' to launch on http://localhost:3000.")
    add_bullet("Production Verification Build:", "Execute 'npm run build' — triggers Next.js compiler, validates TypeScript types (npx tsc --noEmit), and statically optimizes all 28 routes.")
    add_bullet("Automated Vercel Deployment:", "Pushing commits to branch 'main' automatically triggers Vercel's production CI/CD pipeline, building and deploying to https://aetheria-store.vercel.app with zero downtime.")

    doc.save(output_path)
    print(f"Documentation saved successfully to: {output_path}")

if __name__ == '__main__':
    build_documentation_docx()
