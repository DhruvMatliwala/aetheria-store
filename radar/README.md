# 🛰️ Aetheria Lead Radar

An autonomous, 24/7 background lead generator that continuously monitors **Reddit**, **The Open Web / Forums (via Google Alerts RSS)**, and **Telegram** for high-intent potential customers searching for PGSharp keys, and instantly delivers them to your private Discord channel with ready-to-paste sales pitches.

---

## 🚀 Quick Start Commands

From the project root (`f:\Pgsharp`):

### 1. Test your Discord Webhook with a Sample Lead
```bash
npm run radar:test
```
This dispatches a simulated 🔥 **HOT Lead** to your Discord channel so you can see exactly what the notification, direct post link, and 1-tap pitch template look like on your phone or desktop.

### 2. Run a Single Scan Cycle
```bash
npm run radar:once
```
Scans all configured subreddits, Reddit search streams, Google Alert RSS feeds, and Telegram public channels once, displays any found leads in the terminal, dispatches alerts to Discord, and exits.

### 3. Start 24/7 Continuous Background Monitoring
```bash
npm run radar
```
Runs continuously, scanning streams every 60 seconds (customizable).

---

## 🌐 How to Monitor the "Whole Internet" (Google Alerts Setup)

Google Alerts allows turning Google's entire global web crawler into a real-time RSS feed for gaming forums, blogs, Twitter, Quora, and Q&A sites:

1. Go to [Google Alerts](https://www.google.com/alerts) in your browser.
2. In the search box, enter:
   ```text
   "pgsharp key" OR "buy pgsharp" OR "pgsharp standard key"
   ```
3. Click **Show options**:
   - **How often**: `As-it-happens`
   - **Sources**: `Automatic` (or check Forums, Blogs)
   - **How many**: `All results`
   - **Deliver to**: Select **`RSS feed`** *(important!)*
4. Click **Create Alert**.
5. Right-click the RSS icon next to your new alert and select **Copy Link Address**.
6. Open `radar/radar.config.json` and paste your RSS feed link into `googleAlertRssUrls`:
   ```json
   "googleAlertRssUrls": [
     "https://www.google.com/alerts/feeds/YOUR_UNIQUE_FEED_ID/YOUR_ALERT_ID"
   ]
   ```

Now whenever Google discovers a new mention of PGSharp keys anywhere on the internet, your Lead Radar bot catches it within minutes!

---

## ⚙️ Configuration (`radar/radar.config.json`)

| Setting | Description |
| :--- | :--- |
| `discordWebhookUrl` | Discord Webhook URL. If left empty, automatically uses `DISCORD_ADMIN_WEBHOOK_URL` from `.env.local`. |
| `storeUrl` | Your public store link (e.g. `https://aetheria-store.vercel.app`). Automatically inserted into pitch templates. |
| `scanIntervalSeconds` | Polling interval (default: `60` seconds). |
| `subreddits` | List of target subreddits (e.g. `PoGoAndroids`, `PokemonGoSpoofing`, `PGSharp`). |
| `redditSearchQueries` | Global search queries to monitor on Reddit (e.g. `"pgsharp key"`, `"buy pgsharp"`). |
| `highIntentKeywords` | Keywords that trigger a 🔥 **HOT LEAD** (`"need"`, `"buy"`, `"spare"`, `"slot"`, `"paypal"`, `"upi"`). |
| `generalKeywords` | Keywords that trigger a ⚡ **WARM LEAD** (`"standard edition"`, `"activation key"`). |
| `excludeKeywords` | Negative terms to filter out spam or non-buyers (`"ban wave"`, `"patch notes"`, `"mod apk"`). |
| `pitchTemplates` | Pre-written responses dynamically filled with the user's handle and your store URL. |

---

## 🛡️ Anti-Ban & Rate-Limit Safety
- **No API credentials required**: Uses public endpoints with custom descriptive `User-Agent` headers.
- **Polite Jitter**: Inserts 1-second pauses between requests to respect Reddit and feed rate limits.
- **Deduplication (`seen_leads.json`)**: Keeps track of recently seen post IDs so you will never get notified twice for the same thread.
