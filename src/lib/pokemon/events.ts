/**
 * Pokemon GO Live Events & Raid Schedule Engine
 *
 * Sources real-time event, raid, and community day data from the ScrapedDuck
 * open community feed (powered by LeekDuck). Includes in-memory caching
 * and rich Telegram HTML formatting with interactive navigation.
 */

export interface RawDuckEvent {
  eventID: string;
  name: string;
  eventType: string;
  heading: string;
  link: string;
  image?: string;
  start: string;
  end: string;
  extraData?: {
    raidbattles?: {
      bosses?: Array<{
        name: string;
        image?: string;
        canBeShiny?: boolean;
      }>;
      shinies?: Array<{
        name: string;
        image?: string;
      }>;
    };
    spotlighthour?: {
      pokemon?: string;
      bonus?: string;
    };
    communityday?: {
      pokemon?: string;
      bonuses?: string[];
    };
    generic?: {
      hasSpawns?: boolean;
      hasFieldResearchTasks?: boolean;
    };
  };
}

export interface ParsedEvent {
  id: string;
  name: string;
  type: string;
  heading: string;
  link: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isUpcoming: boolean;
  bosses?: Array<{ name: string; canBeShiny: boolean }>;
  extraNote?: string;
}

export interface GroupedPokemonEvents {
  activeRaids: ParsedEvent[];
  upcomingRaids: ParsedEvent[];
  communityDays: ParsedEvent[];
  spotlightHours: ParsedEvent[];
  specialEvents: ParsedEvent[];
  lastUpdated: Date;
}

const SCRAPED_DUCK_URL = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

let cachedData: GroupedPokemonEvents | null = null;
let cacheTimestamp = 0;

/**
 * Format relative time remaining / time until start
 */
function formatTimeDiff(target: Date, from: Date = new Date()): string {
  const diffMs = target.getTime() - from.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);
    if (absDays >= 1) return `${absDays}d ago`;
    return `${absHours}h ago`;
  }

  if (diffDays >= 1) {
    const remHours = diffHours % 24;
    return remHours > 0 ? `${diffDays}d ${remHours}h` : `${diffDays} days`;
  }
  if (diffHours >= 1) {
    return `${diffHours} hours`;
  }
  const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
  return `${diffMins} mins`;
}

/**
 * Clean and humanize date string
 */
function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);

  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr} – ${endStr}`;
}

/**
 * Fetch and parse Pokemon GO events
 */
export async function getPokemonEvents(forceRefresh: boolean = false): Promise<GroupedPokemonEvents> {
  const now = Date.now();

  if (!forceRefresh && cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(SCRAPED_DUCK_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PGSharpKeyStoreBot/2.0' },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to fetch event feed: ${res.status} ${res.statusText}`);
    }

    const rawList: RawDuckEvent[] = await res.json();
    const parsed = processRawEvents(rawList);

    cachedData = parsed;
    cacheTimestamp = now;
    return parsed;
  } catch (err: any) {
    console.error('[pokemon/events] Failed to fetch live events:', err?.message || err);

    if (cachedData) {
      return cachedData;
    }

    // Fallback if network fails and cache is empty
    return getFallbackEvents();
  }
}

/**
 * Categorize raw events into active raids, comm days, spotlights, etc.
 */
function processRawEvents(rawList: RawDuckEvent[]): GroupedPokemonEvents {
  const now = new Date();

  const activeRaids: ParsedEvent[] = [];
  const upcomingRaids: ParsedEvent[] = [];
  const communityDays: ParsedEvent[] = [];
  const spotlightHours: ParsedEvent[] = [];
  const specialEvents: ParsedEvent[] = [];

  for (const raw of rawList) {
    const startDate = new Date(raw.start);
    const endDate = new Date(raw.end);

    // Skip events that already finished
    if (endDate < now) {
      continue;
    }

    const isActive = startDate <= now && endDate >= now;
    const isUpcoming = startDate > now;

    const bosses: Array<{ name: string; canBeShiny: boolean }> = [];
    if (raw.extraData?.raidbattles?.bosses) {
      for (const b of raw.extraData.raidbattles.bosses) {
        bosses.push({
          name: b.name,
          canBeShiny: Boolean(b.canBeShiny),
        });
      }
    }

    let extraNote = '';
    if (raw.extraData?.spotlighthour?.bonus) {
      extraNote = `Bonus: ${raw.extraData.spotlighthour.bonus}`;
    } else if (raw.extraData?.communityday?.bonuses?.length) {
      extraNote = `Bonuses: ${raw.extraData.communityday.bonuses.join(', ')}`;
    }

    const item: ParsedEvent = {
      id: raw.eventID,
      name: raw.name,
      type: raw.eventType,
      heading: raw.heading || raw.eventType,
      link: raw.link || 'https://leekduck.com/events/',
      startDate,
      endDate,
      isActive,
      isUpcoming,
      bosses: bosses.length > 0 ? bosses : undefined,
      extraNote: extraNote || undefined,
    };

    // Filter by type
    if (raw.eventType === 'raid-battles' || raw.eventType === 'raid-day' || raw.eventType === 'raid-hour') {
      if (isActive) {
        activeRaids.push(item);
      } else {
        upcomingRaids.push(item);
      }
    } else if (raw.eventType === 'community-day') {
      communityDays.push(item);
    } else if (raw.eventType === 'pokemon-spotlight-hour') {
      spotlightHours.push(item);
    } else if (
      raw.eventType === 'event' ||
      raw.eventType === 'pokemon-go-fest' ||
      raw.eventType === 'max-mondays' ||
      raw.eventType === 'max-battles'
    ) {
      specialEvents.push(item);
    }
  }

  // Sort upcoming chronologically
  upcomingRaids.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  communityDays.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  spotlightHours.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  specialEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return {
    activeRaids,
    upcomingRaids,
    communityDays,
    spotlightHours,
    specialEvents,
    lastUpdated: new Date(),
  };
}

/**
 * Format the Main Overview Message
 */
export function formatEventsOverview(data: GroupedPokemonEvents): string {
  const now = new Date();
  let text = `📅 <b>POKÉMON GO LIVE EVENTS & RAIDS</b>\n\n`;

  // 1. Current Active Raids
  text += `⚔️ <b>CURRENT RAID ROTATION:</b>\n`;
  if (data.activeRaids.length === 0) {
    text += `• <i>No special 5-star / Mega raids currently active.</i>\n`;
  } else {
    for (const raid of data.activeRaids.slice(0, 4)) {
      const endsIn = formatTimeDiff(raid.endDate, now);
      const bossStr = raid.bosses
        ? raid.bosses.map((b) => `${b.name}${b.canBeShiny ? ' ✨' : ''}`).join(', ')
        : raid.name;
      text += `• <b>${bossStr}</b>\n  └ ⏳ Ends in: <code>${endsIn}</code>\n`;
    }
  }
  text += `\n`;

  // 2. Upcoming Community Days
  text += `🌟 <b>COMMUNITY DAYS:</b>\n`;
  if (data.communityDays.length === 0) {
    text += `• <i>Next Community Day announcement pending.</i>\n`;
  } else {
    for (const cd of data.communityDays.slice(0, 2)) {
      const startsIn = cd.isActive ? '🟢 LIVE NOW!' : `In ${formatTimeDiff(cd.startDate, now)}`;
      const dateStr = formatDateRange(cd.startDate, cd.endDate);
      text += `• <b>${cd.name}</b>\n  └ 🗓️ ${dateStr} (${startsIn})\n`;
    }
  }
  text += `\n`;

  // 3. Next Spotlight Hour
  text += `🔦 <b>NEXT SPOTLIGHT HOUR:</b>\n`;
  if (data.spotlightHours.length === 0) {
    text += `• <i>Check back next Tuesday!</i>\n`;
  } else {
    const nextSpotlight = data.spotlightHours[0];
    const startsIn = nextSpotlight.isActive ? '🟢 LIVE NOW!' : `In ${formatTimeDiff(nextSpotlight.startDate, now)}`;
    const dateStr = formatDateRange(nextSpotlight.startDate, nextSpotlight.endDate);
    text += `• <b>${nextSpotlight.name}</b>\n  └ 🗓️ ${dateStr} (${startsIn})\n`;
    if (nextSpotlight.extraNote) {
      text += `  └ 🎁 <i>${nextSpotlight.extraNote}</i>\n`;
    }
  }
  text += `\n`;

  // 4. Special & Rocket Events
  if (data.specialEvents.length > 0) {
    text += `🚀 <b>FEATURED EVENTS:</b>\n`;
    for (const ev of data.specialEvents.slice(0, 2)) {
      const status = ev.isActive ? '🟢 LIVE' : `Starts in ${formatTimeDiff(ev.startDate, now)}`;
      text += `• <b>${ev.name}</b> (${status})\n`;
    }
    text += `\n`;
  }

  // 5. FOMO Call-to-action
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `⚡ <b>Need to Spoof to Raids & Hundo Spawns?</b>\n`;
  text += `Get your <b>PGSharp Standard Key</b> now:\n`;
  text += `• Instant Joystick + Teleport anywhere\n`;
  text += `• 100% IV Shiny Sniper & Auto-Catch\n`;
  text += `• <b>₹180 / $1.99</b> (Auto-delivered in 15 seconds!)\n`;

  return text;
}

/**
 * Format Detailed Raids Card
 */
export function formatRaidsMessage(data: GroupedPokemonEvents): string {
  const now = new Date();
  let text = `⚔️ <b>POKÉMON GO RAID BOSSES</b>\n\n`;

  text += `🟢 <b>CURRENTLY ACTIVE IN GYMS:</b>\n`;
  if (data.activeRaids.length === 0) {
    text += `<i>No raid rotation found. Check upcoming raids below.</i>\n\n`;
  } else {
    for (const r of data.activeRaids) {
      const endsIn = formatTimeDiff(r.endDate, now);
      const shinyNote = r.bosses?.some((b) => b.canBeShiny) ? ' ✨ (Shiny Eligible)' : '';
      text += `• <b>${r.name}</b>${shinyNote}\n`;
      text += `  └ ⏳ Remaining: <code>${endsIn}</code>\n`;
      text += `  └ 🌐 <a href="${r.link}">View Counters & CP</a>\n\n`;
    }
  }

  if (data.upcomingRaids.length > 0) {
    text += `⏳ <b>NEXT RAID ROTATIONS:</b>\n`;
    for (const r of data.upcomingRaids.slice(0, 3)) {
      const startsIn = formatTimeDiff(r.startDate, now);
      const dateStr = formatDateRange(r.startDate, r.endDate);
      text += `• <b>${r.name}</b>\n`;
      text += `  └ 🗓️ ${dateStr} (Starts in ${startsIn})\n\n`;
    }
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👉 <i>Use PGSharp Teleport & Raid coordinates to join raids in Zaragoza, New York & Tokyo without leaving your couch!</i>`;
  return text;
}

/**
 * Format Community Day & Spotlight Breakdown
 */
export function formatCommDaysMessage(data: GroupedPokemonEvents): string {
  const now = new Date();
  let text = `🌟 <b>COMMUNITY DAYS & SPOTLIGHT HOURS</b>\n\n`;

  text += `🌟 <b>UPCOMING COMMUNITY DAYS:</b>\n`;
  if (data.communityDays.length === 0) {
    text += `<i>No announced dates. Niantic updates monthly.</i>\n\n`;
  } else {
    for (const cd of data.communityDays.slice(0, 3)) {
      const startsIn = cd.isActive ? '🟢 LIVE RIGHT NOW!' : `Starts in ${formatTimeDiff(cd.startDate, now)}`;
      const dateStr = formatDateRange(cd.startDate, cd.endDate);
      text += `• <b>${cd.name}</b>\n`;
      text += `  └ 🗓️ <b>Date:</b> ${dateStr}\n`;
      text += `  └ ⏳ <b>Status:</b> ${startsIn}\n`;
      if (cd.extraNote) {
        text += `  └ 🎁 ${cd.extraNote}\n`;
      }
      text += `\n`;
    }
  }

  text += `🔦 <b>UPCOMING SPOTLIGHT HOURS (TUESDAYS 6PM):</b>\n`;
  if (data.spotlightHours.length === 0) {
    text += `<i>Check back next week for spotlight hours!</i>\n\n`;
  } else {
    for (const sh of data.spotlightHours.slice(0, 3)) {
      const startsIn = sh.isActive ? '🟢 LIVE RIGHT NOW!' : `Starts in ${formatTimeDiff(sh.startDate, now)}`;
      const dateStr = formatDateRange(sh.startDate, sh.endDate);
      text += `• <b>${sh.name}</b>\n`;
      text += `  └ 🗓️ ${dateStr} (${startsIn})\n`;
      if (sh.extraNote) {
        text += `  └ 🎁 <i>${sh.extraNote}</i>\n`;
      }
      text += `\n`;
    }
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🎯 <b>Tip:</b> Auto-Catch & Fast Catch features in PGSharp let you catch 300+ shiny Pokémon during Community Days effortlessly!`;
  return text;
}

/**
 * Static Fallback when feed is completely offline
 */
function getFallbackEvents(): GroupedPokemonEvents {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    activeRaids: [
      {
        id: 'fallback-raid-5star',
        name: '5-Star Legendary Raids',
        type: 'raid-battles',
        heading: 'Raid Battles',
        link: 'https://leekduck.com/bosses/',
        startDate: now,
        endDate: nextWeek,
        isActive: true,
        isUpcoming: false,
        bosses: [{ name: 'Legendary Boss', canBeShiny: true }],
      },
    ],
    upcomingRaids: [],
    communityDays: [
      {
        id: 'fallback-comm-day',
        name: 'Monthly Community Day',
        type: 'community-day',
        heading: 'Community Day',
        link: 'https://leekduck.com/events/',
        startDate: nextWeek,
        endDate: nextWeek,
        isActive: false,
        isUpcoming: true,
      },
    ],
    spotlightHours: [
      {
        id: 'fallback-spotlight',
        name: 'Tuesday Pokémon Spotlight Hour',
        type: 'pokemon-spotlight-hour',
        heading: 'Spotlight Hour',
        link: 'https://leekduck.com/events/',
        startDate: nextWeek,
        endDate: nextWeek,
        isActive: false,
        isUpcoming: true,
        extraNote: 'Bonus: 2x Catch Stardust or XP',
      },
    ],
    specialEvents: [],
    lastUpdated: now,
  };
}
