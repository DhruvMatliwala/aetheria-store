import {
  TelegramUpdate,
  sendTelegramMessage,
  sendTelegramPhoto,
  editTelegramMessage,
  editTelegramMessageReplyMarkup,
  deleteTelegramMessage,
  answerTelegramCallbackQuery,
  getTelegramFile,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from './bot';
import {
  PLANS,
  PLAN_MAP,
  OFFICIAL_GPAY_URI,
  UPI_VPA,
  UPI_PAYEE_NAME,
  PAYPAL_ME_URL,
  PAYPAL_EMAIL,
  TELEGRAM_URL,
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_CHANNEL_URL,
  DISCORD_URL,
} from '@/lib/constants';
import { Order } from '@/types/order';
import { getAvailableCount } from '@/lib/firestore/keys';
import { createOrder, getOrderById } from '@/lib/firestore/orders';
import { getBankCredit, claimBankCredit } from '@/lib/firestore/bankCredits';
import { getPaypalCredit, claimPaypalCredit } from '@/lib/firestore/paypalCredits';
import { allocateKeySlot } from '@/lib/services/keyAllocator';
import { dispatchManualKey } from '@/lib/services/manualAllocation';
import { sendAdminOrderAlert, sendPaymentVerificationAlert } from '@/lib/notifications/discordAdmin';
import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { randomUUID } from 'crypto';
import { broadcastOrderProof } from './proofs';
import {
  getReferralStats,
  validateReferralEligibility,
  saveUserReferral,
  getUserDiscountState,
  getDiscountedPricing,
  setUserCoupon,
  processReferralReward,
} from './referrals';
import { validateAndApplyCoupon, incrementCouponUsage } from '@/lib/firestore/coupons';
import {
  getPokemonEvents,
  formatEventsOverview,
  formatRaidsMessage,
  formatCommDaysMessage,
} from '@/lib/pokemon/events';
import { saveRadarRule, getRadarRule, toggleRadarRule, updateRadarLastAlert } from '@/lib/firestore/radar';
import { PokemonSpawn, RadarWatchlistRule } from '@/types/pokemon';
import {
  fuzzyMatchPokemon,
  tryFuzzyMatchPokemon,
  TOP_SNIPED_POKEMON,
} from '@/lib/pokemon/names';

const STORE_URL =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://aetheria-store.vercel.app';

const ADMIN_TELEGRAM_IDS = [741838315];

function isTelegramAdmin(chatId: number, username?: string): boolean {
  return (
    ADMIN_TELEGRAM_IDS.includes(chatId) ||
    (Boolean(username) && username!.toLowerCase() === 'sleekfx3')
  );
}

/**
 * Persistent Bottom Keyboard (Always visible below chat input box)
 * Styled like high-converting VIP digital store bots
 */
export function getPersistentKeyboard(): ReplyKeyboardMarkup {
  return {
    keyboard: [
      [
        { text: '🔑 PGSharp Store' },
        { text: '⚡ Free vs Standard' },
      ],
      [
        { text: '📅 Live Events' },
        { text: '⏱️ Cooldown Guide' },
      ],
      [
        { text: '📦 Live Stock' },
        { text: '👤 My Keys' },
      ],
      [
        { text: '👥 Refer & Earn' },
        { text: '📢 Proofs Channel' },
      ],
      [
        { text: '🌐 Open Web Store', web_app: { url: STORE_URL } },
      ],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/**
 * Interactive navigation bar for Pokemon GO live events & raid calendar
 */
export function getEventsInlineKeyboard(activeTab: 'overview' | 'raids' | 'commday' = 'overview'): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: activeTab === 'overview' ? '• 📅 Overview •' : '📅 Overview', callback_data: 'cb_events_overview' },
        { text: activeTab === 'raids' ? '• ⚔️ Raids •' : '⚔️ Raids', callback_data: 'cb_events_raids' },
        { text: activeTab === 'commday' ? '• 🌟 Comm Day •' : '🌟 Comm Day', callback_data: 'cb_events_commday' },
      ],
      [
        { text: '⚡ Buy Key for Raids / Events', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '🔄 Refresh Schedule', callback_data: 'cb_events_refresh' },
        { text: '📢 Proofs Channel', url: TELEGRAM_CHANNEL_URL },
      ],
      [
        { text: '⬅️ Back to Menu', callback_data: 'menu_main' },
      ],
    ],
  };
}

/**
 * Clean 4-Hub Main Menu
 */
function getPlanPickerContent(discountLabel?: string, firstName: string = 'Trainer') {
  const greeting = `👋 Welcome <b>${firstName}</b> to <b>Aetheria Hub</b>!`;
  const text = discountLabel
    ? `${greeting}\n\n${discountLabel}\n\n⚡ <i>Fast automated delivery • Instant PGSharp Standard keys</i>\n\n👇 <b>Select an option below:</b>`
    : `${greeting}\n\n⚡ <i>Fast automated delivery • Instant PGSharp Standard keys</i>\n\n👇 <b>Select an option below:</b>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '🔑 Buy PGSharp Keys', callback_data: 'menu_store' },
      ],
      [
        { text: '⚡ Free vs Standard Features', callback_data: 'cb_features' },
      ],
      [
        { text: '⏱️ Cooldown & Safety Guide', callback_data: 'cb_cooldown' },
        { text: '📅 Events & Raids', callback_data: 'cb_events_overview' },
      ],
      [
        { text: '👥 Refer & Earn', callback_data: 'cb_refer_earn' },
        { text: '📢 Live Proofs Channel', url: TELEGRAM_CHANNEL_URL },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Clean Dedicated Store & Keys Hub
 */
export function getStoreMenuContent(discountLabel?: string) {
  const text =
    `🔑 <b>PGSharp Standard Keys & Store</b>\n\n` +
    `⚡ <i>100% Catch Booster • Instant Quick Catch • Auto Walk • Live IV Encounter Preview</i>\n` +
    (discountLabel ? `\n${discountLabel}\n` : '') +
    `\n👇 <b>Choose your edition or check stock:</b>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '📱 1 Device (30 Days) — ₹160', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '🔋 2 Devices (30 Days) — ₹300', callback_data: 'cb_buy_1_month_2_device' },
      ],
      [
        { text: '📦 Live Stock', callback_data: 'cb_stock' },
        { text: '🔑 My Active Keys', callback_data: 'cb_my_keys' },
      ],
      [
        { text: '🌐 Web Store (Cart)', web_app: { url: STORE_URL } },
      ],
      [
        { text: '⬅️ Back to Main Menu', callback_data: 'menu_main' },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * PGSharp Free vs Standard Comparison Card (High-Converting Sales Asset)
 */
export function getFeaturesComparisonContent() {
  const text =
    `⚡ <b>PGSharp Free vs Standard Edition</b>\n\n` +
    `<i>Why upgrading to Standard unlocks the true spoofing experience:</i>\n\n` +
    `❌ <b>FREE EDITION (Limited):</b>\n` +
    `• <b>Normal Catch:</b> Must wait through full 15-second catch animations\n` +
    `• <b>Blind Catch:</b> Cannot see IV or stats until Pokémon is caught\n` +
    `• <b>No Shiny Scanner:</b> Must manually click every single spawn\n` +
    `• <b>Manual Joystick:</b> Tiring finger dragging (no GPX auto-walk)\n` +
    `• <b>Full Battles:</b> Must fight every Team Rocket battle manually\n` +
    `• <b>Full Cutscenes:</b> Wastes time on raid intros & egg hatches\n\n` +
    `✅ <b>STANDARD EDITION (₹160 / Month):</b>\n` +
    `• ⚡ <b>Quick Catch:</b> Catch in 1 second flat! (Skips 15s animation)\n` +
    `• 🎯 <b>Live IV Preview:</b> See exact 100% IV (15/15/15) before throwing\n` +
    `• ✨ <b>Block Non-Shiny:</b> Only shiny Pokémon trigger encounter!\n` +
    `• 🚶 <b>Auto-Walk & GPX Routes:</b> Auto-hatch 100 eggs 100% hands-free\n` +
    `• 🥊 <b>Instant Beat Team Rocket:</b> Win Rocket battles in 1 second\n` +
    `• ⏭️ <b>Skip Cutscenes:</b> Instantly skip raid, egg & evolution intros\n` +
    `• 🐾 <b>Buddy Assistant:</b> Auto-feed, pet & play with your buddy\n` +
    `• 🎯 <b>100% Excellent Curveball:</b> Guaranteed catch rate & max XP\n\n` +
    `👇 <b>Instant automated delivery right here in chat:</b>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '📱 Buy 1 Device (₹160)', callback_data: 'cb_buy_1_month_1_device' },
        { text: '🔋 Buy 2 Devices (₹300)', callback_data: 'cb_buy_1_month_2_device' },
      ],
      [
        { text: '⏱️ Cooldown & Safety Guide', callback_data: 'cb_cooldown' },
        { text: '📦 Live Stock', callback_data: 'cb_stock' },
      ],
      [
        { text: '📢 Proofs Channel', url: TELEGRAM_CHANNEL_URL },
        { text: '⬅️ Back to Main Menu', callback_data: 'menu_main' },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Teleport Cooldown & Anti-Ban Safety Guide
 */
export function getCooldownGuideContent() {
  const text =
    `⏱️ <b>PGSharp Cooldown & Safety Guide</b>\n\n` +
    `<i>To prevent soft-bans, wait for cooldown before catching or spinning after teleporting:</i>\n\n` +
    `📊 <b>Cooldown Distance Chart:</b>\n` +
    `• <b>1 km:</b> 30 seconds\n` +
    `• <b>5 km:</b> 2 minutes\n` +
    `• <b>10 km:</b> 6 minutes\n` +
    `• <b>25 km:</b> 11 minutes\n` +
    `• <b>50 km:</b> 20 minutes\n` +
    `• <b>100 km:</b> 30 minutes\n` +
    `• <b>250 km:</b> 45 minutes\n` +
    `• <b>500 km:</b> 60 minutes\n` +
    `• <b>1,000 km:</b> 90 minutes\n` +
    `• <b>1,350+ km (Global):</b> 120 minutes (Max 2h)\n\n` +
    `⚠️ <b>Actions that TRIGGER Cooldown:</b>\n` +
    `• Throwing a Pokéball (or berry) at a wild Pokémon\n` +
    `• Spinning a PokéStop or Gym photo disc\n` +
    `• Dropping a Pokémon into a Gym\n` +
    `• Feeding a berry to a Gym defender\n` +
    `• Battling in a Gym\n\n` +
    `✅ <b>SAFE Actions (DO NOT trigger cooldown):</b>\n` +
    `• Teleporting anywhere across the globe\n` +
    `• Encountering a Pokémon (checking IV / shiny)\n` +
    `• Hatching eggs or evolving Pokémon\n` +
    `• Claiming research tasks & raids\n` +
    `• Trading or PVP trainer battles\n\n` +
    `💡 <b>Pro-Tip:</b> Shiny checking does <b>NOT</b> break cooldown! You can safely teleport, check wild spawns with <b>PGSharp Standard's Live IV & Shiny Preview</b>, and only catch once your cooldown timer reaches 0:00 without soft-bans!`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '🔑 Buy PGSharp Key (₹160)', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '⚡ Free vs Standard Features', callback_data: 'cb_features' },
        { text: '⬅️ Main Menu', callback_data: 'menu_main' },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Backward compatibility alias
 */
export async function getRadarMenuContent(chatId?: number) {
  return getFeaturesComparisonContent();
}

export function getHotspotsMenuContent() {
  return getFeaturesComparisonContent();
}

/**
 * Screen 1: All Pokémon or Specific Pokémon Selection
 */
export function getRadarPokemonSelectionContent() {
  const text =
    `🐾 <b>Select Pokémon Target</b>\n\n` +
    `Choose whether you want live alerts for all Pokémon matching your IV, or a specific species:`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '🌐 All Pokémon (Any matching IV)', callback_data: 'radar_set_poke:ALL' },
      ],
      [
        { text: '🔍 Specific Pokémon (Pick or Type)', callback_data: 'radar_specific_poke_menu' },
      ],
      [
        { text: '⬅️ Back to Radar', callback_data: 'menu_radar' },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Screen 2: Specific Pokémon Meta Picks & Custom Type Prompt
 */
export function getRadarSpecificPokemonContent() {
  const text =
    `🔍 <b>Choose a Specific Pokémon</b>\n\n` +
    `Tap a popular meta species below, or send any name directly in chat:\n` +
    `<i>(Typo auto-correction is active: e.g. "charzard" ➔ Charizard)</i>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '🐸 Greninja', callback_data: 'radar_set_poke:Greninja' },
        { text: '🔥 Charizard', callback_data: 'radar_set_poke:Charizard' },
      ],
      [
        { text: '💧 Swampert', callback_data: 'radar_set_poke:Swampert' },
        { text: '🥋 Lucario', callback_data: 'radar_set_poke:Lucario' },
      ],
      [
        { text: '🐲 Garchomp', callback_data: 'radar_set_poke:Garchomp' },
        { text: '⚡ Metagross', callback_data: 'radar_set_poke:Metagross' },
      ],
      [
        { text: '🛡️ Bastiodon', callback_data: 'radar_set_poke:Bastiodon' },
        { text: '🐉 Dragonite', callback_data: 'radar_set_poke:Dragonite' },
      ],
      [
        { text: '👻 Gengar', callback_data: 'radar_set_poke:Gengar' },
        { text: '🔮 Medicham', callback_data: 'radar_set_poke:Medicham' },
      ],
      [
        { text: '✍️ Type Another Pokémon Name', callback_data: 'radar_prompt_poke' },
      ],
      [
        { text: '⬅️ Back to Radar', callback_data: 'menu_radar' },
      ],
    ],
  };

  return { text, keyboard };
}

/**
 * Screen 3: Set Target IV Instruction Prompt
 */
export function getRadarSetIvPromptContent() {
  const text =
    `⚙️ <b>Set Target IV</b>\n\n` +
    `Type the IV of the Pokémon you want in chat:\n\n` +
    `<b>Examples:</b>\n` +
    `• <code>1/14/15</code> (Great / Ultra League PvP spread)\n` +
    `• <code>0/15/14</code> (Top rank PvP stat product)\n` +
    `• <code>15/15/15</code> or <code>100</code> (Universal Hundo)\n` +
    `• <code>0/0/0</code> or <code>0</code> (Universal Nundo)\n` +
    `• <code>any</code> or <code>all</code> (All IVs)\n\n` +
    `👇 <i>Type your numbers in chat below and hit Send:</i>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: '⬅️ Back to Radar', callback_data: 'menu_radar' }],
    ],
  };

  return { text, keyboard };
}

/**
 * Interactive _/_/_ IV Tuner Form (Method B)
 */
export function getRadarIvTunerContent(atk: number, def: number, sta: number, pokeName = 'ALL') {
  const clampedAtk = Math.max(0, Math.min(15, atk));
  const clampedDef = Math.max(0, Math.min(15, def));
  const clampedSta = Math.max(0, Math.min(15, sta));

  const isHundo = clampedAtk === 15 && clampedDef === 15 && clampedSta === 15;
  const isNundo = clampedAtk === 0 && clampedDef === 0 && clampedSta === 0;

  const text =
    `🎯 <b>Target IV: ⚔️ ${clampedAtk} / 🛡️ ${clampedDef} / ❤️ ${clampedSta}</b>\n` +
    `🐾 Target: <b>${pokeName === 'ALL' ? 'All Pokémon' : pokeName}</b>\n` +
    (isHundo ? `✨ <i>Universal 100% IV Hundo</i>\n` : isNundo ? `0️⃣ <i>Universal 0% IV Nundo</i>\n` : '') +
    `\nUse <b>[ ➖ ]</b> and <b>[ ➕ ]</b> to adjust each stat:`;

  const aDown = Math.max(0, clampedAtk - 1);
  const aUp = Math.min(15, clampedAtk + 1);
  const dDown = Math.max(0, clampedDef - 1);
  const dUp = Math.min(15, clampedDef + 1);
  const sDown = Math.max(0, clampedSta - 1);
  const sUp = Math.min(15, clampedSta + 1);

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '➖', callback_data: `radar_tune:${aDown}:${clampedDef}:${clampedSta}` },
        { text: `⚔️ ATK: ${clampedAtk}`, callback_data: 'noop' },
        { text: '➕', callback_data: `radar_tune:${aUp}:${clampedDef}:${clampedSta}` },
      ],
      [
        { text: '➖', callback_data: `radar_tune:${clampedAtk}:${dDown}:${clampedSta}` },
        { text: `🛡️ DEF: ${clampedDef}`, callback_data: 'noop' },
        { text: '➕', callback_data: `radar_tune:${clampedAtk}:${dUp}:${clampedSta}` },
      ],
      [
        { text: '➖', callback_data: `radar_tune:${clampedAtk}:${clampedDef}:${sDown}` },
        { text: `❤️ HP: ${clampedSta}`, callback_data: 'noop' },
        { text: '➕', callback_data: `radar_tune:${clampedAtk}:${clampedDef}:${sUp}` },
      ],
      [
        { text: '💯 15/15/15', callback_data: 'radar_tune:15:15:15' },
        { text: '0️⃣ 0/0/0', callback_data: 'radar_tune:0:0:0' },
      ],
      [
        { text: '💾 Save Target', callback_data: `radar_save:${clampedAtk}:${clampedDef}:${clampedSta}` },
        { text: '⬅️ Back', callback_data: 'menu_radar' },
      ],
    ],
  };

  return { text, keyboard };
}

export interface ParsedIvInput {
  species?: string;
  speciesCorrected?: boolean;
  atk: number;
  def: number;
  sta: number;
  any_iv?: boolean;
  isExplicit: boolean;
}

export function formatPokemonName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.toUpperCase() === 'ALL') return 'ALL';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Parses smart direct chat inputs: "1/14/15", "0 14 15", "Swampert 1/14/15", "any", "hundo", etc.
 */
export function parseDirectIvInput(input: string): ParsedIvInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Standalone "any", "all", "random", "any iv", "all iv", "all ivs"
  const lower = trimmed.toLowerCase();
  if (
    lower === 'any' ||
    lower === 'all' ||
    lower === 'any iv' ||
    lower === 'all iv' ||
    lower === 'all ivs' ||
    lower === 'random' ||
    lower === 'random iv' ||
    lower === 'random ivs'
  ) {
    return { atk: -1, def: -1, sta: -1, any_iv: true, isExplicit: true };
  }

  // 2. Pure IV: "1/14/15", "0 14 15", "1, 14, 15", "1-14-15", "1.14.15"
  const pureIvMatch = trimmed.match(/^(\d{1,2})[\/\s,\.\-](\d{1,2})[\/\s,\.\-](\d{1,2})$/);
  if (pureIvMatch) {
    const a = parseInt(pureIvMatch[1], 10);
    const d = parseInt(pureIvMatch[2], 10);
    const s = parseInt(pureIvMatch[3], 10);
    if (a <= 15 && d <= 15 && s <= 15) {
      return { atk: a, def: d, sta: s, isExplicit: true };
    }
  }

  // 3. Standalone Slang: "100", "100%", "hundo", "4*", "0", "0%", "nundo", "0*"
  if (lower === '100' || lower === '100%' || lower === 'hundo' || lower === '4*') {
    return { atk: 15, def: 15, sta: 15, isExplicit: true };
  }
  if (lower === '0' || lower === '0%' || lower === 'nundo' || lower === '0*') {
    return { atk: 0, def: 0, sta: 0, isExplicit: true };
  }

  // Clean optional track prefix
  const cleanInput = trimmed.replace(/^(?:\/track|track)\s+/i, '');

  // 4. Species + "any" or "all" (e.g. "Swampert any", "Lucario all ivs")
  const speciesAnyMatch = cleanInput.match(/^([a-zA-Z\s\.\-']+?)\s+(any|all|any\s+iv|all\s+iv|all\s+ivs|random)$/i);
  if (speciesAnyMatch) {
    const speciesCandidate = speciesAnyMatch[1].trim();
    const matched = fuzzyMatchPokemon(speciesCandidate);
    return {
      species: matched.name,
      speciesCorrected: matched.corrected,
      atk: -1,
      def: -1,
      sta: -1,
      any_iv: true,
      isExplicit: true,
    };
  }

  // 5. Species + IV: "Swampert 1/14/15", "Lucario 15 15 15", "Deoxys 0/15/14"
  const speciesIvMatch = cleanInput.match(/^([a-zA-Z\s\.\-']+?)\s+(\d{1,2})[\/\s,\.\-](\d{1,2})[\/\s,\.\-](\d{1,2})$/);
  if (speciesIvMatch) {
    const speciesCandidate = speciesIvMatch[1].trim();
    const a = parseInt(speciesIvMatch[2], 10);
    const d = parseInt(speciesIvMatch[3], 10);
    const s = parseInt(speciesIvMatch[4], 10);
    if (a <= 15 && d <= 15 && s <= 15 && speciesCandidate.length >= 2) {
      const matched = fuzzyMatchPokemon(speciesCandidate);
      return {
        species: matched.name,
        speciesCorrected: matched.corrected,
        atk: a,
        def: d,
        sta: s,
        isExplicit: true,
      };
    }
  }

  // 6. Inverted: "1/14/15 Swampert"
  const invertedMatch = cleanInput.match(/^(\d{1,2})[\/\s,\.\-](\d{1,2})[\/\s,\.\-](\d{1,2})\s+([a-zA-Z\s\.\-']+)$/);
  if (invertedMatch) {
    const a = parseInt(invertedMatch[1], 10);
    const d = parseInt(invertedMatch[2], 10);
    const s = parseInt(invertedMatch[3], 10);
    const speciesCandidate = invertedMatch[4].trim();
    if (a <= 15 && d <= 15 && s <= 15 && speciesCandidate.length >= 2) {
      const matched = fuzzyMatchPokemon(speciesCandidate);
      return {
        species: matched.name,
        speciesCorrected: matched.corrected,
        atk: a,
        def: d,
        sta: s,
        isExplicit: true,
      };
    }
  }

  // 7. Species + Slang: "Swampert 100", "Lucario hundo", "Gible 0", "Magikarp nundo"
  const speciesSlangMatch = cleanInput.match(/^([a-zA-Z\s\.\-']+?)\s+(100%|100|hundo|4\*|0%|0|nundo|0\*)$/i);
  if (speciesSlangMatch) {
    const speciesCandidate = speciesSlangMatch[1].trim();
    const slang = speciesSlangMatch[2].toLowerCase();
    const isHundo = slang === '100' || slang === '100%' || slang === 'hundo' || slang === '4*';
    if (speciesCandidate.length >= 2) {
      const matched = fuzzyMatchPokemon(speciesCandidate);
      return {
        species: matched.name,
        speciesCorrected: matched.corrected,
        atk: isHundo ? 15 : 0,
        def: isHundo ? 15 : 0,
        sta: isHundo ? 15 : 0,
        isExplicit: true,
      };
    }
  }

  return null;
}

/**
 * Dispatches real-time spawn alert with Option A high-converting catch booster hook
 */
export async function sendPokemonSpawnAlert(chatId: number, spawn: PokemonSpawn): Promise<boolean> {
  const now = Date.now();
  const despawnMs = spawn.despawn_time > 10000000000 ? spawn.despawn_time : spawn.despawn_time * 1000;
  const minsLeft = Math.max(1, Math.round((despawnMs - now) / 60000));
  const ivPercent = Math.round(((spawn.atk + spawn.def + spawn.sta) / 45) * 100);
  const text =
    `🎯 <b>TARGET DETECTED: ${spawn.name.toUpperCase()}</b>\n` +
    `📊 <b>IV:</b> ${spawn.atk} / ${spawn.def} / ${spawn.sta} (${ivPercent}%) | <b>CP:</b> ${spawn.cp ?? '—'}\n` +
    `📍 <b>Coords:</b> <code>${spawn.latitude.toFixed(6)}, ${spawn.longitude.toFixed(6)}</code>\n` +
    `<i>(Tap coords above to copy & paste into PGSharp Teleport)</i>\n` +
    `⏳ <b>Despawns in:</b> ~${minsLeft} mins${spawn.city ? ` in ${spawn.city}` : ''}\n\n` +
    `💡 <b>Quick Guide:</b>\n` +
    `• <b>[ 📡 Scan Again ]</b> — Get the next live spawn immediately (zero wait)\n` +
    `• <b>[ ⏸️ Pause Alerts ]</b> — Stop background alerts when you stop playing\n` +
    `• <b>Auto-Radar:</b> Automatically scans & sends a new target every 5 mins\n` +
    `─────────────────────────────\n` +
    `🛡️ <b>Don't let it flee!</b>\n` +
    `100% Excellent Throw + Instant Quick Catch:\n` +
    `👉 <b>Unlock PGSharp Standard (₹160)</b>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '📡 Scan Again', callback_data: 'radar_scan_now' },
        { text: '🔑 Buy PGSharp Key (₹160)', callback_data: 'cb_buy_1_month_1_device' },
      ],
      [
        { text: '⏸️ Pause Alerts', callback_data: 'radar_spawn_pause' },
        { text: '🎯 Radar Settings', callback_data: 'menu_radar' },
      ],
    ],
  };

  const res = await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
  return res.ok;
}

/**
 * Dispatches verified global hotspots to subscriber
 */
export async function dispatchFirstLiveSpawnAlert(chatId: number, rule?: any) {
  try {
    const { text, keyboard } = getHotspotsMenuContent();
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
  } catch (err) {
    console.error(`[Hotspots] Failed to dispatch hotspots to ${chatId}:`, err);
  }
}

/**
 * Welcome Message Card
 */
function getWelcomeMessage(firstName: string = 'Trainer'): string {
  return `👋 Welcome <b>${firstName}</b> to <b>Aetheria Store</b>!`;
}

/**
 * Handle incoming Telegram Update
 */
export async function handleTelegramUpdate(update: TelegramUpdate) {
  try {
    // ── 1. Handle Callback Queries (Inline Button Taps) ───────────────────────
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    // ── 2. Handle Photo Messages (Screenshots / UPI Receipts) ─────────────────
    if (update.message && update.message.photo && update.message.photo.length > 0) {
      await handlePhotoMessage(update.message);
      return;
    }

    // ── 3. Handle Text Messages ──────────────────────────────────────────────
    if (update.message && update.message.text) {
      await handleTextMessage(update.message);
      return;
    }
  } catch (err) {
    console.error('[TelegramHandler] Unhandled error:', err);
  }
}

/**
 * Handle Inline Button Clicks
 */
async function handleCallbackQuery(query: NonNullable<TelegramUpdate['callback_query']>) {
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  const data = query.data || '';
  const firstName = query.from.first_name || 'Trainer';

  if (!chatId) return;

  // Dismiss loading spinner on button
  await answerTelegramCallbackQuery(query.id);

  // Main menu navigation
  if (data === 'menu_main') {
    const { text, keyboard } = getPlanPickerContent(undefined, firstName);
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    }
    return;
  }

  // No-op for informational buttons
  if (data === 'noop') {
    await answerTelegramCallbackQuery(query.id);
    return;
  }

  // ── Store & Keys Sub-Menu ────────────────────────────────────────────────
  if (data === 'menu_store') {
    const userDiscount = await getUserDiscountState(chatId);
    const { text, keyboard } = getStoreMenuContent(userDiscount.hasDiscount ? userDiscount.discountLabel : undefined);
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // ── Free vs Standard Features Sub-Menu ──────────────────────────────────
  if (data === 'cb_features' || data === 'menu_hotspots' || data === 'menu_radar') {
    const { text, keyboard } = getFeaturesComparisonContent();
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // ── Cooldown & Safety Rules Sub-Menu ────────────────────────────────────
  if (data === 'cb_cooldown') {
    const { text, keyboard } = getCooldownGuideContent();
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // ── Pokémon Selection & IV Setup Callbacks ───────────────────────────────
  // Screen 1: All Pokémon or Specific Pokémon Selection
  if (data === 'radar_poke_menu') {
    const { text, keyboard } = getRadarPokemonSelectionContent();
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // Screen 2: Specific Pokémon Meta Picks
  if (data === 'radar_specific_poke_menu') {
    const { text, keyboard } = getRadarSpecificPokemonContent();
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // Set Target Pokémon (e.g. ALL or Swampert)
  if (data.startsWith('radar_set_poke:')) {
    const species = data.replace('radar_set_poke:', '').trim();
    const isAll = species === 'ALL';
    const existing = await getRadarRule(chatId);
    const updatedRule = await saveRadarRule(chatId, {
      pokemon_name: species,
      target_atk: existing?.target_atk ?? -1,
      target_def: existing?.target_def ?? -1,
      target_sta: existing?.target_sta ?? -1,
      any_iv: existing?.any_iv ?? true,
      username: query.from.username || '',
      enabled: true,
    });

    await answerTelegramCallbackQuery(
      query.id,
      isAll ? '🌐 Tracking All Pokémon!' : `🐾 Target set to ${species}!`,
      false
    );

    const { text, keyboard } = await getRadarMenuContent(chatId);
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) {
        return;
      }
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // Spawn Alert: Pause Alerts in-place
  if (data === 'radar_spawn_pause') {
    await toggleRadarRule(chatId, false);
    await answerTelegramCallbackQuery(query.id, '⏸️ Live alerts paused. Tap Resume to restart anytime.', true);
    if (messageId && query.message?.reply_markup) {
      const newMarkup: InlineKeyboardMarkup = {
        inline_keyboard: query.message.reply_markup.inline_keyboard.map((row) =>
          row.map((btn) => {
            if (btn.callback_data === 'radar_spawn_pause') {
              return { text: '▶️ Resume Alerts', callback_data: 'radar_spawn_resume' };
            }
            return btn;
          })
        ),
      };
      await editTelegramMessageReplyMarkup(chatId, messageId, newMarkup);
    }
    return;
  }

  // Spawn Alert: Resume Alerts in-place
  if (data === 'radar_spawn_resume') {
    await toggleRadarRule(chatId, true);
    await answerTelegramCallbackQuery(query.id, '🔔 Live alerts resumed! You will receive matching spawns.', true);
    if (messageId && query.message?.reply_markup) {
      const newMarkup: InlineKeyboardMarkup = {
        inline_keyboard: query.message.reply_markup.inline_keyboard.map((row) =>
          row.map((btn) => {
            if (btn.callback_data === 'radar_spawn_resume') {
              return { text: '⏸️ Pause Alerts', callback_data: 'radar_spawn_pause' };
            }
            return btn;
          })
        ),
      };
      await editTelegramMessageReplyMarkup(chatId, messageId, newMarkup);
    }
    return;
  }

  // Set IVs Prompt (Method 1: Smart Direct Chat)
  if (data === 'radar_prompt_iv') {
    const { text: promptText, keyboard } = getRadarSetIvPromptContent();
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, promptText, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, promptText, { reply_markup: keyboard });
    return;
  }

  // Prompt Custom Species Input
  if (data === 'radar_prompt_poke') {
    const promptText =
      `✍️ <b>Type Pokémon Name in Chat</b>\n\n` +
      `Type any Pokémon name in chat below and hit Send:\n` +
      `• <code>Charizard</code>\n` +
      `• <code>Tyranitar</code>\n` +
      `• <code>Rayquaza</code>\n` +
      `• <code>Mewtwo</code>\n\n` +
      `💡 <i>Typo auto-correction is active: Even if you type "charzard" or "swampart", the bot will recognize and correct it!</i>`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '⬅️ Back to Pokémon Selection', callback_data: 'radar_specific_poke_menu' }],
        [{ text: '🎯 Back to Radar', callback_data: 'menu_radar' }],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, promptText, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, promptText, { reply_markup: keyboard });
    return;
  }

  // Interactive IV Tuner Form (_/_/_) - Format 2 Minimal Stepper (Fallback)
  if (data.startsWith('radar_tune:')) {
    const parts = data.replace('radar_tune:', '').split(':');
    const atk = parseInt(parts[0] || '15', 10);
    const def = parseInt(parts[1] || '15', 10);
    const sta = parseInt(parts[2] || '15', 10);

    const rule = await getRadarRule(chatId);
    const { text, keyboard } = getRadarIvTunerContent(atk, def, sta, rule?.pokemon_name || 'ALL');

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      return;
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // Save Target IV
  if (data.startsWith('radar_save:')) {
    const parts = data.replace('radar_save:', '').split(':');
    const atk = parseInt(parts[0] || '15', 10);
    const def = parseInt(parts[1] || '15', 10);
    const sta = parseInt(parts[2] || '15', 10);

    await saveRadarRule(chatId, {
      target_atk: atk,
      target_def: def,
      target_sta: sta,
      username: query.from.username || '',
      enabled: true,
    });

    await answerTelegramCallbackQuery(query.id, '✅ Target IV Saved & Alerts Enabled!', true);

    const { text, keyboard } = await getRadarMenuContent(chatId);
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // Toggle Alerts ON/OFF
  if (data.startsWith('radar_toggle:')) {
    const enable = data.replace('radar_toggle:', '') === '1';
    await toggleRadarRule(chatId, enable);
    await answerTelegramCallbackQuery(query.id, enable ? '🔔 Alerts Activated!' : '⏸️ Alerts Paused', false);
    const { text, keyboard } = await getRadarMenuContent(chatId);
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // 1-Tap Preset IV Selection (Fallback)
  if (data.startsWith('radar_preset:')) {
    const parts = data.replace('radar_preset:', '').split(':');
    const atk = parseInt(parts[0] || '15', 10);
    const def = parseInt(parts[1] || '15', 10);
    const sta = parseInt(parts[2] || '15', 10);

    const existing = await getRadarRule(chatId);
    await saveRadarRule(chatId, {
      pokemon_name: existing?.pokemon_name || 'ALL',
      target_atk: atk,
      target_def: def,
      target_sta: sta,
      username: query.from.username || '',
      enabled: true,
    });

    const isHundo = atk === 15 && def === 15 && sta === 15;
    await answerTelegramCallbackQuery(
      query.id,
      isHundo ? '💯 Target set to 15/15/15 Hundo!' : '0️⃣ Target set to 0/0/0 Nundo!',
      false
    );

    const { text, keyboard } = await getRadarMenuContent(chatId);
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // Legacy Radar Scan Now Callback
  if (data === 'radar_scan_now' || data === 'radar_test_ping') {
    await answerTelegramCallbackQuery(query.id, '⚡ Explore PGSharp Standard features below!', false);
    const { text, keyboard } = getFeaturesComparisonContent();
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (editRes.ok) return;
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // My Keys / My Profile
  if (data === 'cb_my_keys') {
    await handleMyKeys(chatId, query.from.username, messageId);
    return;
  }

  // Refer & Earn Dashboard
  if (data === 'cb_refer_earn') {
    await handleReferAndEarn(chatId, messageId);
    return;
  }

  // Stock Checker
  if (data === 'cb_stock') {
    const stock1 = await getAvailableCount('1_month_1_device');
    const stock2 = await getAvailableCount('1_month_2_device');

    const stockText =
      `📦 <b>Live Stock</b>\n\n` +
      `• <b>1 Device :</b> ${stock1 > 0 ? `${stock1} in stock` : '0 in stock'}\n` +
      `• <b>2 Devices :</b> ${stock2 > 0 ? `${stock2} in stock` : '0 in stock'}`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '📱 Buy 1 Device', callback_data: 'cb_buy_1_month_1_device' },
          { text: '🔋 Buy 2 Devices', callback_data: 'cb_buy_1_month_2_device' },
        ],
        [
          { text: '⬅️ Back to Menu', callback_data: 'menu_main' },
        ],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, stockText, { reply_markup: keyboard });
      if (editRes.ok) return;
    }
    await sendTelegramMessage(chatId, stockText, { reply_markup: keyboard });
    return;
  }

  // ── Admin Direct Key Dispatch Callbacks ──────────────────────────────────
  if (data.startsWith('cb_admin_give_')) {
    if (!isTelegramAdmin(chatId, query.from.username)) {
      await answerTelegramCallbackQuery(query.id, '⛔ Unauthorized', true);
      return;
    }

    const slotStr = data.replace('cb_admin_give_', '');
    const slotNum = parseInt(slotStr, 10) as 1 | 2 | 3;

    try {
      const dispatch = await dispatchManualKey({
        recipient: query.from.username ? `@${query.from.username}` : 'Admin Mobile',
        slots: slotNum,
        note: 'Telegram /givekey menu action',
        adminIdentifier: `@${query.from.username || 'Admin'}`,
      });

      const card =
        `⚡ <b>KEY ALLOCATED & LOCKED!</b>\n\n` +
        `📦 <b>Allocation:</b> ${slotNum === 3 ? '👑 3 Slots (100% Private / Dedicated)' : `${slotNum} Slot(s) Shared`}\n` +
        `👤 <b>Assigned For:</b> Direct Dispatch\n` +
        `🔑 <b>License Key:</b>\n<code>${dispatch.decryptedKey}</code>\n<i>(Tap key to copy)</i>\n\n` +
        `🔗 <b>Fulfillment Link:</b>\n${dispatch.orderUrl}\n\n` +
        `🛡️ <i>Key is atomically locked in database. Website will never double-sell this allocation.</i>`;

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '⚡ Allocate Another', callback_data: 'cb_admin_give_menu' }],
          [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
        ],
      };

      if (messageId) {
        await editTelegramMessage(chatId, messageId, card, { reply_markup: keyboard });
      } else {
        await sendTelegramMessage(chatId, card, { reply_markup: keyboard });
      }
    } catch (err: any) {
      const errText = `❌ <b>Allocation Error:</b> ${err?.message || 'Failed to dispatch key.'}`;
      if (messageId) {
        await editTelegramMessage(chatId, messageId, errText, {
          reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu_main' }]] },
        });
      } else {
        await sendTelegramMessage(chatId, errText);
      }
    }
    return;
  }

  if (data === 'cb_admin_give_menu') {
    if (!isTelegramAdmin(chatId, query.from.username)) {
      await answerTelegramCallbackQuery(query.id, '⛔ Unauthorized', true);
      return;
    }

    const giveMenuText =
      `👑 <b>Admin Direct Key Dispatch</b>\n\n` +
      `Select device slots to allocate & lock from inventory:`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '📱 1 Device (1 Slot)', callback_data: 'cb_admin_give_1' }],
        [{ text: '🔋 2 Devices (2 Slots)', callback_data: 'cb_admin_give_2' }],
        [{ text: '👑 3 Devices (Full Private Key)', callback_data: 'cb_admin_give_3' }],
        [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      await editTelegramMessage(chatId, messageId, giveMenuText, { reply_markup: keyboard });
    } else {
      await sendTelegramMessage(chatId, giveMenuText, { reply_markup: keyboard });
    }
    return;
  }

  // ── Pokemon GO Live Events & Raids Navigation ─────────────────────────────
  if (data.startsWith('cb_events_')) {
    const subAction = data.replace('cb_events_', '');
    const forceRefresh = subAction === 'refresh';
    const events = await getPokemonEvents(forceRefresh);

    let text = '';
    let tab: 'overview' | 'raids' | 'commday' = 'overview';

    if (subAction === 'raids') {
      text = formatRaidsMessage(events);
      tab = 'raids';
    } else if (subAction === 'commday') {
      text = formatCommDaysMessage(events);
      tab = 'commday';
    } else {
      text = formatEventsOverview(events);
      tab = 'overview';
    }

    const keyboard = getEventsInlineKeyboard(tab);

    if (subAction === 'refresh') {
      await answerTelegramCallbackQuery(query.id, '✅ Schedule refreshed with live events!');
    }

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, text, { reply_markup: keyboard });
      if (!editRes.ok) {
        await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    }
    return;
  }

  // ── Step 1: Buy Plan Selected -> Show Payment Method Choices ─────────────
  if (data.startsWith('cb_buy_')) {
    const planId = data.replace('cb_buy_', '');
    const plan = PLAN_MAP[planId] || PLANS[0];
    const available = await getAvailableCount(plan.id);

    if (available <= 0) {
      const soldOutText = `⚠️ <b>Sorry!</b> ${plan.name} is temporarily sold out.`;
      const soldOutKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }]],
      };
      if (messageId) {
        const editRes = await editTelegramMessage(chatId, messageId, soldOutText, { reply_markup: soldOutKeyboard });
        if (editRes.ok) return;
      }
      await sendTelegramMessage(chatId, soldOutText, { reply_markup: soldOutKeyboard });
      return;
    }

    const discountState = await getUserDiscountState(chatId);
    const pricing = getDiscountedPricing(plan.id, discountState.hasDiscount);
    const amountInr = pricing.priceInrRupees;
    const amountUsd = pricing.priceUsdDollars;

    const discountHeader = discountState.hasDiscount
      ? `${discountState.discountLabel}\n\n`
      : '';

    const paymentChoiceText =
      `${discountHeader}📱 <b>${plan.name} (${plan.duration})</b>\n\n` +
      `Choose payment method:`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: `⚡ Pay via UPI (₹${amountInr})`, callback_data: `cb_pay_upi_${plan.id}` },
        ],
        [
          { text: `💳 Pay via PayPal ($${amountUsd})`, callback_data: `cb_pay_paypal_${plan.id}` },
        ],
        [
          { text: '🌐 Web Store (Cart)', web_app: { url: STORE_URL } },
        ],
        [
          { text: '⬅️ Back to Menu', callback_data: 'menu_main' },
        ],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, paymentChoiceText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, paymentChoiceText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, paymentChoiceText, { reply_markup: keyboard });
    }
    return;
  }

  // ── Step 2A: User Selected UPI Payment ────────────────────────────────────
  if (data.startsWith('cb_pay_upi_')) {
    const planId = data.replace('cb_pay_upi_', '');
    const plan = PLAN_MAP[planId] || PLANS[0];
    const discountState = await getUserDiscountState(chatId);
    const pricing = getDiscountedPricing(plan.id, discountState.hasDiscount);
    const amountInr = pricing.priceInrRupees;

    // Check if user already has an active pending order in this chat to avoid duplicate orders on every tap
    const db = getAdminFirestore();
    const existingSnap = await db
      .collection('orders')
      .where('telegram_chat_id', '==', chatId)
      .where('payment_status', '==', 'pending')
      .limit(1)
      .get();

    let orderId: string;
    const orderDoc: Record<string, any> = {
      customer_email: query.from.username
        ? `${query.from.username.toLowerCase()}@telegram.user`
        : `tg_${query.from.id}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: pricing.priceInrPaise,
      currency: 'INR',
      payment_gateway: 'upi_direct',
      payment_status: 'pending',
      delivered_key: null,
      telegram_chat_id: chatId,
      telegram_username: query.from.username || '',
      telegram_user_id: query.from.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (discountState.hasDiscount && discountState.discountType === 'referral' && discountState.referrerChatId) {
      orderDoc.applied_referral_from = discountState.referrerChatId;
    }
    if (discountState.hasDiscount && discountState.discountType === 'coupon' && discountState.couponCode) {
      orderDoc.coupon_code = discountState.couponCode;
    }

    if (!existingSnap.empty) {
      orderId = existingSnap.docs[0].id;
      orderDoc.order_id = orderId;
      orderDoc.gateway_order_id = `upi_${orderId}`;
      await db.collection('orders').doc(orderId).update(orderDoc);
    } else {
      orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
      orderDoc.order_id = orderId;
      orderDoc.gateway_order_id = `upi_${orderId}`;
      orderDoc.created_at = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('orders').doc(orderId).set(orderDoc);
    }

    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${amountInr}&cu=INR&tn=${orderId}&aid=uGICAgMC507CUEg`
    )}`;

    const discountMsg = discountState.hasDiscount ? `\n🎉 <i>Discount applied: Saved ₹${pricing.savingsInr}!</i>\n` : '';

    const upiCaption =
      `📦 <b>${plan.name} (~30 Days) — ₹${amountInr}</b>${discountMsg}\n` +
      `🔑 <b>UPI ID:</b> <code>${UPI_VPA}</code>\n` +
      `🔖 <b>Order ID:</b> <code>${orderId}</code>\n\n` +
      `⚡ <b>Scan QR or pay ₹${amountInr}. Key is auto-delivered here within 1–2 minutes!</b>`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "❓ Paid but didn't get key?", callback_data: `cb_prompt_utr_${orderId}` },
        ],
        [
          { text: '💬 Support', url: TELEGRAM_URL },
          { text: '⬅️ Back', callback_data: `cb_buy_${plan.id}` },
        ],
      ],
    };

    if (messageId) {
      await deleteTelegramMessage(chatId, messageId);
    }
    await sendTelegramPhoto(chatId, upiQrUrl, {
      caption: upiCaption,
      reply_markup: keyboard,
    });
    return;
  }

  // ── Step 2A-2: User Tapped Paid but didn't get key? ──────────────────────
  if (data.startsWith('cb_prompt_utr_')) {
    const orderId = data.replace('cb_prompt_utr_', '');
    const promptText =
      `⏳ <b>Awaiting Bank Confirmation...</b>\n` +
      `Bank SMS alerts usually arrive within 1–2 minutes.\n\n` +
      `💡 <b>If you paid and want your key right away without waiting:</b>\n` +
      `Send a screenshot of your <b>Transaction Details</b> (in Google Pay/FamPay, tap on the payment to view full details with the 12-digit UPI ID) or reply with the 12 digits directly!\n\n` +
      `<i>🔖 Order ID: <code>${orderId}</code></i>`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '👤 Check Order in My Keys', callback_data: 'cb_my_keys' }],
        [{ text: '💬 Need Help? Contact Support', url: TELEGRAM_URL }],
        [{ text: '⬅️ Back to Payment', callback_data: 'cb_buy_1_month_1_device' }],
      ],
    };

    await sendTelegramMessage(chatId, promptText, { reply_markup: keyboard });
    return;
  }

  // ── Step 2B: User Selected PayPal Payment ─────────────────────────────────
  if (data.startsWith('cb_pay_paypal_')) {
    const planId = data.replace('cb_pay_paypal_', '');
    const plan = PLAN_MAP[planId] || PLANS[0];
    const discountState = await getUserDiscountState(chatId);
    const pricing = getDiscountedPricing(plan.id, discountState.hasDiscount);
    const amountUsd = pricing.priceUsdDollars;

    // Check if user already has an active pending order in this chat to avoid duplicate orders on every tap
    const db = getAdminFirestore();
    const existingSnap = await db
      .collection('orders')
      .where('telegram_chat_id', '==', chatId)
      .where('payment_status', '==', 'pending')
      .limit(1)
      .get();

    let orderId: string;
    const orderDoc: Record<string, any> = {
      customer_email: query.from.username
        ? `${query.from.username.toLowerCase()}@telegram.user`
        : `tg_${query.from.id}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: pricing.priceUsdCents,
      currency: 'USD',
      payment_gateway: 'paypal_direct',
      payment_status: 'pending',
      delivered_key: null,
      telegram_chat_id: chatId,
      telegram_username: query.from.username || '',
      telegram_user_id: query.from.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (discountState.hasDiscount && discountState.discountType === 'referral' && discountState.referrerChatId) {
      orderDoc.applied_referral_from = discountState.referrerChatId;
    }
    if (discountState.hasDiscount && discountState.discountType === 'coupon' && discountState.couponCode) {
      orderDoc.coupon_code = discountState.couponCode;
    }

    if (!existingSnap.empty) {
      orderId = existingSnap.docs[0].id;
      orderDoc.order_id = orderId;
      orderDoc.gateway_order_id = `paypal_${orderId}`;
      await db.collection('orders').doc(orderId).update(orderDoc);
    } else {
      orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
      orderDoc.order_id = orderId;
      orderDoc.gateway_order_id = `paypal_${orderId}`;
      orderDoc.created_at = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('orders').doc(orderId).set(orderDoc);
    }

    const paypalUrl = `${PAYPAL_ME_URL}/${amountUsd}USD`;
    const discountMsg = discountState.hasDiscount ? `\n🎉 <i>Discount applied: Saved $${pricing.savingsUsd}!</i>` : '';

    const paypalText =
      `💳 <b>Pay $${amountUsd} USD via PayPal</b>${discountMsg}\n\n` +
      `Send <b>$${amountUsd} USD</b> to:\n` +
      `<code>${PAYPAL_EMAIL}</code>\n\n` +
      `After paying, reply here with your <b>PayPal Transaction ID</b> or <b>PayPal Email</b> to get your key automatically!`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: `💳 Open PayPal ($${amountUsd})`, url: paypalUrl },
        ],
        [
          { text: '💬 Support', url: TELEGRAM_URL },
          { text: '⬅️ Back', callback_data: `cb_buy_${plan.id}` },
        ],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, paypalText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, paypalText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, paypalText, { reply_markup: keyboard });
    }
    return;
  }

  // FAQ & Guide
  if (data === 'cb_faq') {
    const faqText =
      `🔑 <b>Key Activation:</b>\n` +
      `Open PGSharp ➔ Settings ⚙️ ➔ Activate ➔ Paste key.\n\n` +
      `• <b>1 Device:</b> Use on 1 phone\n` +
      `• <b>2 Devices:</b> Use on 2 phones simultaneously`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '💬 Support', url: TELEGRAM_URL }],
        [{ text: '⬅️ Back', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, faqText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, faqText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, faqText, { reply_markup: keyboard });
    }
    return;
  }

  // Live Support
  if (data === 'cb_support') {
    const supportText =
      `💬 <b>Support</b>\n\n` +
      `Need help or have questions?\n` +
      `Direct message: @sleekfx3`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '💬 Message @sleekfx3', url: TELEGRAM_URL }],
        [{ text: '⬅️ Back', callback_data: 'menu_main' }],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, supportText, { reply_markup: keyboard });
      if (!editRes.ok) {
        await deleteTelegramMessage(chatId, messageId);
        await sendTelegramMessage(chatId, supportText, { reply_markup: keyboard });
      }
    } else {
      await sendTelegramMessage(chatId, supportText, { reply_markup: keyboard });
    }
    return;
  }
}

/**
 * Handle My Keys / My Profile
 */
async function handleMyKeys(chatId: number, username?: string, messageId?: number) {
  try {
    const db = getAdminFirestore();

    // 1. Check for active pending or verifying orders
    let activeDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    try {
      const activeSnap = await db
        .collection('orders')
        .where('telegram_chat_id', '==', chatId)
        .where('payment_status', 'in', ['pending', 'verifying'])
        .limit(2)
        .get();
      activeDocs = activeSnap.docs;
    } catch (activeErr) {
      console.warn('[Telegram] Could not fetch active orders for My Keys:', activeErr);
    }

    // 2. Check for completed paid orders
    const paidSnap = await db
      .collection('orders')
      .where('telegram_chat_id', '==', chatId)
      .where('payment_status', '==', 'paid')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    if (activeDocs.length === 0 && paidSnap.empty) {
      const emptyText = `👤 <b>My Keys</b>\n\nYou have no active keys yet.`;
      const emptyKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }],
          [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
        ],
      };
      if (messageId) {
        const editRes = await editTelegramMessage(chatId, messageId, emptyText, { reply_markup: emptyKeyboard });
        if (editRes.ok) return;
      }
      await sendTelegramMessage(chatId, emptyText, { reply_markup: emptyKeyboard });
      return;
    }

    let activeOrderSection = '';
    let pendingOrderId: string | null = null;

    if (activeDocs.length > 0) {
      activeDocs.forEach((doc) => {
        const order = doc.data();
        const plan = PLAN_MAP[order.plan_type] || PLANS[0];
        const isVerifying = order.payment_status === 'verifying';
        const formattedAmount =
          order.currency === 'USD'
            ? `$${(order.amount / 100).toFixed(2)}`
            : `₹${Math.round(order.amount / 100)}`;

        pendingOrderId = doc.id;
        activeOrderSection +=
          `${isVerifying ? '⏳ <b>Payment Verifying with Bank:</b>' : '🟡 <b>Order Awaiting Bank Confirmation:</b>'}\n` +
          `• <b>Order ID:</b> <code>${doc.id}</code>\n` +
          `• <b>Plan:</b> ${plan.name} (${formattedAmount})\n` +
          `• <b>Status:</b> ${isVerifying ? 'Verifying payment with bank network...' : 'Waiting for bank confirmation alert...'}\n` +
          `💡 <b>To fast-track your key:</b> Send a screenshot of your <b>Transaction Details</b> (in Google Pay/FamPay, tap the payment to view details with the 12-digit UPI ID) or reply with the 12 digits!\n\n`;
      });
    }

    const nowMs = Date.now();
    let keysList = '';
    if (!paidSnap.empty) {
      paidSnap.docs.forEach((doc, idx) => {
        const order = doc.data();
        const plan = PLAN_MAP[order.plan_type] || PLANS[0];
        const key = order.delivered_key || 'Processing';

        const createdAtMs =
          order.created_at?.toDate?.()?.getTime?.() ||
          (typeof order.created_at === 'number' ? order.created_at : nowMs);
        const expiresAtMs = createdAtMs + 30 * 24 * 60 * 60 * 1000;
        const daysLeft = Math.ceil((expiresAtMs - nowMs) / (1000 * 60 * 60 * 24));

        let statusBadge = '';
        if (daysLeft <= 0) {
          statusBadge = '🔴 <i>Expired (30 days completed)</i>';
        } else if (daysLeft <= 3) {
          statusBadge = `⚠️ <b>Expiring soon: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left!</b>`;
        } else {
          statusBadge = `🟢 <i>Active (${daysLeft} days remaining)</i>`;
        }

        keysList += `\n${idx + 1}. <b>${plan.name} (${plan.duration}):</b>\n<code>${key}</code>\n${statusBadge}\n`;
      });
    }

    let profileText = '👤 <b>My Keys Dashboard</b>\n\n';
    if (activeOrderSection) {
      profileText += `${activeOrderSection}─────────────────────────────\n`;
    }
    if (keysList) {
      profileText += `🔑 <b>Your Purchased Keys:</b>\n${keysList}\n<i>(Tap key code to copy)</i>`;
    }

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        ...(pendingOrderId
          ? [[{ text: "❓ Paid but didn't get key?", callback_data: `cb_prompt_utr_${pendingOrderId}` }]]
          : []),
        [
          { text: '🛒 Buy A Key', callback_data: 'cb_buy_1_month_1_device' },
          { text: '⬅️ Back to Menu', callback_data: 'menu_main' },
        ],
        [{ text: '💬 Support', url: TELEGRAM_URL }],
      ],
    };

    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, profileText, { reply_markup: keyboard });
      if (editRes.ok) return;
    }
    await sendTelegramMessage(chatId, profileText, { reply_markup: keyboard });
  } catch (err) {
    console.error('[Telegram] My Keys error:', err);
    const errText = `👤 <b>My Keys</b>\n\nTap below to purchase a key:`;
    const errKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }],
        [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
      ],
    };
    if (messageId) {
      const editRes = await editTelegramMessage(chatId, messageId, errText, { reply_markup: errKeyboard });
      if (editRes.ok) return;
    }
    await sendTelegramMessage(chatId, errText, { reply_markup: errKeyboard });
  }
}

/**
 * Handle Refer & Earn Dashboard
 */
async function handleReferAndEarn(chatId: number, messageId?: number) {
  const stats = await getReferralStats(chatId);
  const botUsername = TELEGRAM_BOT_USERNAME || 'AetheriaStoreOfficialBot';
  const refLink = `https://t.me/${botUsername}?start=ref_${chatId}`;
  const shareText = encodeURIComponent(
    `⚡ Get your PGSharp Standard Key with ₹30 / $0.50 OFF instant discount here: ${refLink}`
  );

  const message =
    `👥 <b>Refer & Earn</b>\n\n` +
    `Invite fellow trainers and save together!\n` +
    `• 🎁 <b>Your Friend Gets:</b> ₹30 / $0.50 OFF their first key\n` +
    `• 🎟️ <b>You Get:</b> ₹30 / $0.50 OFF coupon for your next key purchase\n\n` +
    `🔗 <b>Your Personal Referral Link:</b>\n` +
    `<code>${refLink}</code>\n` +
    `<i>(Tap link above to copy)</i>\n\n` +
    `📊 <b>Your Referral Stats:</b>\n` +
    `• Friends Clicked: <b>${stats.invitedCount}</b>\n` +
    `• Completed Orders: <b>${stats.completedOrdersCount}</b>\n` +
    `• Coupons Earned: <b>${stats.rewardsEarned}</b>\n\n` +
    `<i>Coupons are delivered automatically via DM once your friend's payment is confirmed!</i>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: '📤 Share Link to Telegram',
          url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`,
        },
      ],
      [
        { text: '🛒 Buy A Key', callback_data: 'cb_buy_1_month_1_device' },
        { text: '⬅️ Back to Menu', callback_data: 'menu_main' },
      ],
    ],
  };

  if (messageId) {
    const editRes = await editTelegramMessage(chatId, messageId, message, { reply_markup: keyboard });
    if (editRes.ok) return;
  }
  await sendTelegramMessage(chatId, message, { reply_markup: keyboard });
}

/**
 * Handle incoming Photo messages (Screenshots / UPI Receipts / QR Proofs)
 */
async function handlePhotoMessage(message: NonNullable<TelegramUpdate['message']>) {
  const chatId = message.chat.id;
  const username = message.from?.username;
  const caption = (message.caption || '').trim();
  const photos = message.photo || [];

  if (photos.length === 0) return;

  // 1. Check if caption contains 12-digit UTR
  const utrMatch = caption.match(/\b(\d{12})\b/);
  const cleanUtr = utrMatch ? utrMatch[1] : null;

  // 2. Fetch the highest resolution photo (last item in the array)
  const highestResPhoto = photos[photos.length - 1];
  let photoUrl: string | undefined;

  try {
    const fileRes = await getTelegramFile(highestResPhoto.file_id);
    if (fileRes.ok && fileRes.file_url) {
      photoUrl = fileRes.file_url;
    }
  } catch (err) {
    console.error('[Telegram] Failed to resolve photo URL from Telegram API:', err);
  }

  // If user included 12-digit UTR in caption, process UTR submission directly!
  if (cleanUtr) {
    await processTelegramUtrSubmission(chatId, cleanUtr, username, photoUrl);
    return;
  }

  // 3. Find active pending or verifying order for this user
  const db = getAdminFirestore();
  const pendingSnap = await db
    .collection('orders')
    .where('telegram_chat_id', '==', chatId)
    .where('payment_status', 'in', ['pending', 'verifying'])
    .limit(1)
    .get();

  let orderId: string;
  let targetOrder: Record<string, any>;

  if (!pendingSnap.empty) {
    const doc = pendingSnap.docs[0];
    orderId = doc.id;
    targetOrder = doc.data();

    await db.collection('orders').doc(orderId).update({
      payment_status: 'verifying',
      ...(photoUrl ? { payment_proof_url: photoUrl } : {}),
      updated_at: new Date(),
    });
  } else {
    const plan = PLANS[0];
    orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    targetOrder = {
      order_id: orderId,
      customer_email: username ? `${username.toLowerCase()}@telegram.user` : `tg_${chatId}@telegram.user`,
      customer_phone: username ? `@${username}` : `Telegram ID: ${chatId}`,
      plan_type: plan.id,
      amount: plan.price_inr,
      currency: 'INR',
      payment_gateway: 'upi_direct',
      payment_status: 'verifying',
      delivered_key: null,
      gateway_order_id: `upi_${orderId}`,
      telegram_chat_id: chatId,
      telegram_username: username || '',
      telegram_user_id: message.from?.id || chatId,
      ...(photoUrl ? { payment_proof_url: photoUrl } : {}),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: new Date(),
    };
    await db.collection('orders').doc(orderId).set(targetOrder);
  }

  // 4. Send alert to Discord Admin with 1-click Approve / Reject buttons + Screenshot preview
  sendPaymentVerificationAlert({
    orderId,
    customerEmail: targetOrder.customer_email,
    customerPhone: username ? `@${username}` : `Telegram ID: ${chatId}`,
    planType: targetOrder.plan_type || '1_month_1_device',
    amount: targetOrder.amount || 16000,
    currency: targetOrder.currency || 'INR',
    gateway: 'upi_direct',
    transactionId: 'Screenshot Submitted',
    screenshotUrl: photoUrl,
    notes: `Customer sent payment screenshot in Telegram chat.${caption ? ` Caption: "${caption}"` : ''}`,
  }).catch((err) => console.error('[Telegram] Screenshot verification alert error:', err));

  // 5. Send reassuring reply to the user with fast-track UTR tip
  const ackText =
    `📸 <b>Payment Screenshot Received!</b>\n\n` +
    `We have received your payment proof for Order <code>${orderId}</code>.\n\n` +
    `⚡ <b>Fast-Track Tip for Instant Key Delivery:</b>\n` +
    `If your screenshot shows the <b>12-digit UPI transaction ID / UTR</b> (e.g. <code>326282062667</code>), you can also reply with those 12 digits for zero-wait automated delivery!\n\n` +
    `<i>Otherwise, our automated system will deliver your key the moment bank confirmation arrives or admin approves.</i>`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: "❓ Paid but didn't get key?", callback_data: `cb_prompt_utr_${orderId}` }],
      [{ text: '👤 Check Order in My Keys', callback_data: 'cb_my_keys' }],
      [{ text: '💬 Contact Support', url: TELEGRAM_URL }],
    ],
  };

  await sendTelegramMessage(chatId, ackText, { reply_markup: keyboard });
}

/**
 * Handle Inbound Text Messages (Persistent Keyboard buttons, Commands, UTR submissions)
 */
async function handleTextMessage(message: NonNullable<TelegramUpdate['message']>) {
  const chatId = message.chat.id;
  const rawText = (message.text || '').trim();
  const firstName = message.from?.first_name || 'Trainer';
  const username = message.from?.username;

  // ── 1. Persistent Keyboard Actions ────────────────────────────────────────
  if (rawText === '🔑 PGSharp Store' || rawText === '🛒 Buy Standard Key' || rawText.startsWith('/store') || rawText.startsWith('/buy')) {
    const userDiscount = await getUserDiscountState(chatId);
    const { text, keyboard } = getStoreMenuContent(userDiscount.hasDiscount ? userDiscount.discountLabel : undefined);
    await sendTelegramMessage(chatId, text, {
      reply_markup: keyboard,
    });
    return;
  }

  // ── Free vs Standard Feature Comparison ──────────────────────────────────
  if (
    rawText === '⚡ Free vs Standard' ||
    rawText.startsWith('/features') ||
    rawText.startsWith('/compare') ||
    rawText.startsWith('/hotspots') ||
    rawText.startsWith('/coords') ||
    rawText.startsWith('/radar')
  ) {
    const { text, keyboard } = getFeaturesComparisonContent();
    await sendTelegramMessage(chatId, text, {
      reply_markup: keyboard,
    });
    return;
  }

  // ── Cooldown & Safety Rules Guide ────────────────────────────────────────
  if (
    rawText === '⏱️ Cooldown Guide' ||
    rawText.startsWith('/cooldown') ||
    rawText.startsWith('/safety') ||
    rawText.startsWith('/softban')
  ) {
    const { text, keyboard } = getCooldownGuideContent();
    await sendTelegramMessage(chatId, text, {
      reply_markup: keyboard,
    });
    return;
  }

  // ── Conversational Payment Intent Detection (Panic Prevention & Instant Guidance) ──
  const lowerText = rawText.toLowerCase().trim();
  const PAYMENT_INTENT_PHRASES = [
    'done', 'paid', 'payment done', 'i paid', 'i have paid', 'sent', 'money sent',
    'ho gaya', 'maine pay kar diya', 'pay kar diya', 'payment sent', 'paid 160',
    'paid 300', 'screenshot', 'check payment', 'verify payment', 'utr', 'ref no',
    'receipt', 'bill', 'already paid', 'paid already', 'amount sent'
  ];
  const isPaymentIntent =
    PAYMENT_INTENT_PHRASES.includes(lowerText) ||
    /^(i\s+)?(paid|done|sent)(\s+(160|300|money|payment|upi|gpay|phonepe))?$/i.test(lowerText);

  if (isPaymentIntent) {
    const db = getAdminFirestore();
    const pendingSnap = await db
      .collection('orders')
      .where('telegram_chat_id', '==', chatId)
      .where('payment_status', 'in', ['pending', 'verifying'])
      .limit(1)
      .get();

    if (!pendingSnap.empty) {
      const order = pendingSnap.docs[0].data();
      const orderId = pendingSnap.docs[0].id;
      const plan = PLAN_MAP[order.plan_type] || PLANS[0];
      const amountInr = Math.round(order.amount / 100);

      const ackText =
        `✅ <b>Payment Acknowledged!</b>\n\n` +
        `⏳ <i>Awaiting Bank Confirmation... Your bank's network is taking a moment to send the credit alert.</i>\n\n` +
        `💡 <b>To fast-track your key instantly:</b>\n` +
        `Send a screenshot of your <b>Transaction Details</b> (in Google Pay/FamPay, tap on the payment to view full details with the 12-digit UPI ID), or reply with the 12 digits!\n\n` +
        `<i>🔖 Order ID: <code>${orderId}</code></i>\n` +
        `<i>Our automated system will verify and deliver your <b>PGSharp Standard Key</b> right here in this chat!</i>`;

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: "❓ Paid but didn't get key?", callback_data: `cb_prompt_utr_${orderId}` }],
          [{ text: '👤 Check Order in My Keys', callback_data: 'cb_my_keys' }],
          [{ text: '💬 Support', url: TELEGRAM_URL }],
        ],
      };

      await sendTelegramMessage(chatId, ackText, { reply_markup: keyboard });
      return;
    } else {
      const promptNewOrder =
        `👋 Did you just complete a payment?\n\n` +
        `• If you already paid via UPI, please send a screenshot of your <b>Transaction Details</b> or the <b>12-digit UPI transaction ID</b> directly here in chat for instant key delivery.\n` +
        `• If you want to purchase a PGSharp Standard Key, tap below:`;

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '🔑 Buy PGSharp Key (₹160)', callback_data: 'cb_buy_1_month_1_device' }],
          [{ text: '💬 Contact Support', url: TELEGRAM_URL }],
        ],
      };

      await sendTelegramMessage(chatId, promptNewOrder, { reply_markup: keyboard });
      return;
    }
  }

  // ── Format 1: Smart Direct Chat IV / Species Detection (Zero Commands Needed) ──
  const parsedDirect = parseDirectIvInput(rawText);
  if (parsedDirect) {
    const existing = await getRadarRule(chatId);
    const targetSpecies = parsedDirect.species || existing?.pokemon_name || 'ALL';
    const targetAtk = parsedDirect.atk;
    const targetDef = parsedDirect.def;
    const targetSta = parsedDirect.sta;
    const anyIv = parsedDirect.any_iv ?? false;

    const updatedRule = await saveRadarRule(chatId, {
      pokemon_name: targetSpecies,
      target_atk: targetAtk,
      target_def: targetDef,
      target_sta: targetSta,
      any_iv: anyIv,
      username: username || '',
      enabled: true,
    });

    const isHundo = targetAtk === 15 && targetDef === 15 && targetSta === 15;
    const isNundo = targetAtk === 0 && targetDef === 0 && targetSta === 0;
    const ivBadge = (anyIv || targetAtk === -1)
      ? 'All IVs (Any)'
      : isHundo
      ? '💯 15 / 15 / 15 (Hundo)'
      : isNundo
      ? '0️⃣ 0 / 0 / 0 (Nundo)'
      : `⚔️ ${targetAtk} / 🛡️ ${targetDef} / ❤️ ${targetSta}`;

    const speciesBadge = targetSpecies === 'ALL'
      ? 'All Pokémon'
      : parsedDirect.speciesCorrected
      ? `${targetSpecies} (auto-corrected)`
      : targetSpecies;

    const confirmText =
      `🎯 <b>Target Updated!</b>\n\n` +
      `📊 <b>Target IV:</b> <code>${ivBadge}</code>\n` +
      `🐾 <b>Species:</b> <code>${speciesBadge}</code>\n` +
      `📡 <b>Alerts:</b> 🟢 Active & Ready\n\n` +
      `Whenever a matching Pokémon spawns anywhere in the world, the bot will immediately alert you with coordinates and despawn timer!`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '📡 Scan Now', callback_data: 'radar_scan_now' },
          { text: '🎯 Radar Settings', callback_data: 'menu_radar' },
        ],
        [
          { text: '🔑 Buy PGSharp Key (₹160)', callback_data: 'cb_buy_1_month_1_device' },
          { text: '⬅️ Main Menu', callback_data: 'menu_main' },
        ],
      ],
    };

    await sendTelegramMessage(chatId, confirmText, { reply_markup: keyboard });
    return;
  }

  // ── Standalone Pokémon Name Detection (Fuzzy Matching + Typo Auto-Correction) ──
  const NON_POKEMON_KEYWORDS = new Set([
    'hi', 'hello', 'hey', 'help', 'support', 'buy', 'price', 'key', 'keys',
    'stock', 'thanks', 'thank', 'thx', 'yes', 'no', 'ok', 'okay', 'menu',
    'start', 'cancel', 'refund', 'proof', 'proofs', 'admin', 'test', 'login',
    'how', 'what', 'who', 'when', 'where', 'why', 'done', 'paid', 'sent',
    'screenshot', 'receipt', 'utr', 'payment', 'bill', 'verify'
  ]);

  if (!rawText.startsWith('/') && rawText.length <= 30 && /^[a-zA-Z\s\.\-':]+$/.test(rawText.trim())) {
    const lowerTrim = rawText.toLowerCase().trim();
    if (!NON_POKEMON_KEYWORDS.has(lowerTrim)) {
      const matchedPoke = tryFuzzyMatchPokemon(rawText);
      const targetSpecies = matchedPoke ? matchedPoke.name : formatPokemonName(rawText);
      const isCorrected = matchedPoke ? matchedPoke.corrected : false;

      const existing = await getRadarRule(chatId);
      const targetAtk = existing?.target_atk ?? -1;
      const targetDef = existing?.target_def ?? -1;
      const targetSta = existing?.target_sta ?? -1;
      const anyIv = existing?.any_iv ?? true;

      const updatedRule = await saveRadarRule(chatId, {
        pokemon_name: targetSpecies,
        target_atk: targetAtk,
        target_def: targetDef,
        target_sta: targetSta,
        any_iv: anyIv,
        username: username || '',
        enabled: true,
      });

      const isHundo = targetAtk === 15 && targetDef === 15 && targetSta === 15;
      const isNundo = targetAtk === 0 && targetDef === 0 && targetSta === 0;
      const ivBadge = (anyIv || targetAtk === -1)
        ? 'All IVs (Any)'
        : isHundo
        ? '💯 15 / 15 / 15 (Hundo)'
        : isNundo
        ? '0️⃣ 0 / 0 / 0 (Nundo)'
        : `⚔️ ${targetAtk} / 🛡️ ${targetDef} / ❤️ ${targetSta}`;

      const speciesBadge = targetSpecies === 'ALL'
        ? 'All Pokémon'
        : isCorrected
        ? `${targetSpecies} (auto-corrected from "${rawText}")`
        : targetSpecies;

      const confirmText =
        `🐾 <b>Pokémon Target Set!</b>\n\n` +
        `🐾 <b>Species:</b> <code>${speciesBadge}</code>\n` +
        `📊 <b>Target IV:</b> <code>${ivBadge}</code>\n` +
        `📡 <b>Alerts:</b> 🟢 Active & Ready\n\n` +
        `<i>You can type an IV like <code>1/14/15</code> or <code>15/15/15</code> anytime to tune target IVs.</i>`;

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: '⚙️ Set Target IVs', callback_data: 'radar_prompt_iv' },
            { text: '📡 Scan Now', callback_data: 'radar_scan_now' },
          ],
          [
            { text: '🎯 Radar Settings', callback_data: 'menu_radar' },
            { text: '⬅️ Main Menu', callback_data: 'menu_main' },
          ],
        ],
      };

      await sendTelegramMessage(chatId, confirmText, { reply_markup: keyboard });
      return;
    }
  }

  // ── /track <species> [atk/def/sta] ─────────────────────────────────────────
  if (rawText.startsWith('/track')) {
    const parts = rawText.split(/\s+/).slice(1);
    if (parts.length === 0) {
      const { text, keyboard } = await getRadarMenuContent(chatId);
      await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
      return;
    }

    const speciesRaw = parts[0].toUpperCase() === 'ALL' ? 'ALL' : parts[0];
    const species = speciesRaw === 'ALL' ? 'ALL' : fuzzyMatchPokemon(speciesRaw).name;
    let targetAtk = 15;
    let targetDef = 15;
    let targetSta = 15;
    let anyIv = false;

    if (parts[1]) {
      const ivStr = parts[1].trim().toLowerCase();
      if (ivStr === 'any' || ivStr === 'all' || ivStr === 'random') {
        targetAtk = -1;
        targetDef = -1;
        targetSta = -1;
        anyIv = true;
      } else if (ivStr === '100' || ivStr === 'hundo') {
        targetAtk = 15;
        targetDef = 15;
        targetSta = 15;
      } else if (ivStr === '0' || ivStr === 'nundo') {
        targetAtk = 0;
        targetDef = 0;
        targetSta = 0;
      } else if (ivStr.includes('/')) {
        const ivParts = ivStr.split('/');
        targetAtk = Math.max(0, Math.min(15, parseInt(ivParts[0] || '15', 10)));
        targetDef = Math.max(0, Math.min(15, parseInt(ivParts[1] || '15', 10)));
        targetSta = Math.max(0, Math.min(15, parseInt(ivParts[2] || '15', 10)));
      }
    } else {
      const existing = await getRadarRule(chatId);
      if (existing) {
        targetAtk = existing.target_atk;
        targetDef = existing.target_def;
        targetSta = existing.target_sta;
        anyIv = existing.any_iv ?? false;
      }
    }

    await saveRadarRule(chatId, {
      pokemon_name: species,
      target_atk: targetAtk,
      target_def: targetDef,
      target_sta: targetSta,
      any_iv: anyIv,
      username: username || '',
      enabled: true,
    });

    const isHundo = targetAtk === 15 && targetDef === 15 && targetSta === 15;
    const isNundo = targetAtk === 0 && targetDef === 0 && targetSta === 0;
    const ivBadge = (anyIv || targetAtk === -1)
      ? 'All IVs (Any)'
      : isHundo
      ? '💯 15 / 15 / 15 (Hundo)'
      : isNundo
      ? '0️⃣ 0 / 0 / 0 (Nundo)'
      : `⚔️ ${targetAtk} / 🛡️ ${targetDef} / ❤️ ${targetSta}`;

    const confirmText =
      `✅ <b>Radar Alert Configured!</b>\n\n` +
      `🐾 <b>Tracking Species:</b> <code>${species === 'ALL' ? 'All Pokémon' : species}</code>\n` +
      `📊 <b>Target IV:</b> <code>${ivBadge}</code>\n` +
      `🔔 <b>Status:</b> 🟢 Active\n\n` +
      `You will receive an instant private ping with coordinates and despawn timer when a match spawns!`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '⚙️ Set Target IVs', callback_data: 'radar_prompt_iv' },
          { text: '📡 Scan Now', callback_data: 'radar_scan_now' },
        ],
        [
          { text: '🎯 Radar Settings', callback_data: 'menu_radar' },
          { text: '⬅️ Main Menu', callback_data: 'menu_main' },
        ],
      ],
    };

    await sendTelegramMessage(chatId, confirmText, { reply_markup: keyboard });
    return;
  }

  if (rawText === '👤 My Keys' || rawText === '👤 My profile' || rawText.startsWith('/keys') || rawText.startsWith('/profile')) {
    await handleMyKeys(chatId, username);
    return;
  }

  if (rawText === '📦 Live Stock' || rawText.startsWith('/stock')) {
    const stock1 = await getAvailableCount('1_month_1_device');
    const stock2 = await getAvailableCount('1_month_2_device');
    await sendTelegramMessage(
      chatId,
      `📦 <b>Live Stock</b>\n\n` +
        `• <b>1 Device :</b> ${stock1 > 0 ? `${stock1} in stock` : '0 in stock'}\n` +
        `• <b>2 Devices :</b> ${stock2 > 0 ? `${stock2} in stock` : '0 in stock'}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 Buy 1 Device', callback_data: 'cb_buy_1_month_1_device' },
              { text: '🔋 Buy 2 Devices', callback_data: 'cb_buy_1_month_2_device' },
            ],
          ],
        },
      }
    );
    return;
  }

  if (rawText === '💬 Support' || rawText.startsWith('/help') || rawText.startsWith('/support')) {
    await sendTelegramMessage(
      chatId,
      `💬 <b>Support</b>\n\n` +
        `Need help or have questions?\n` +
        `Direct contact: @sleekfx3`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Message @sleekfx3', url: TELEGRAM_URL }],
          ],
        },
      }
    );
    return;
  }

  if (rawText === '👥 Refer & Earn' || rawText.startsWith('/refer')) {
    await handleReferAndEarn(chatId);
    return;
  }

  if (
    rawText === '📢 Proofs Channel' ||
    rawText === '📢 Live Proofs' ||
    rawText.startsWith('/channel') ||
    rawText.startsWith('/proofs')
  ) {
    await sendTelegramMessage(
      chatId,
      `📢 <b>Official Proofs & Vouches Channel</b>\n\n` +
        `Every completed order is verified and posted live with transaction timestamps, masked customer tags, and live inventory count!\n\n` +
        `👉 Join our official channel to see 100% genuine live order proofs and stock alerts:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👉 Join Proofs Channel 📢', url: TELEGRAM_CHANNEL_URL }],
            [{ text: '🛒 Buy Standard Key', callback_data: 'cb_buy_1_month_1_device' }],
          ],
        },
      }
    );
    return;
  }

  // ── Pokemon GO Live Events & Raid Calendar ────────────────────────────────
  if (
    rawText === '📅 Live Events' ||
    rawText === '📅 Events' ||
    rawText.startsWith('/events') ||
    rawText.startsWith('/raids') ||
    rawText.startsWith('/calendar') ||
    rawText.startsWith('/spotlight') ||
    rawText.startsWith('/community')
  ) {
    const isRaidsOnly = rawText.startsWith('/raids');
    const isCommDayOnly = rawText.startsWith('/spotlight') || rawText.startsWith('/community');
    const events = await getPokemonEvents();

    let text = formatEventsOverview(events);
    let tab: 'overview' | 'raids' | 'commday' = 'overview';

    if (isRaidsOnly) {
      text = formatRaidsMessage(events);
      tab = 'raids';
    } else if (isCommDayOnly) {
      text = formatCommDaysMessage(events);
      tab = 'commday';
    }

    const keyboard = getEventsInlineKeyboard(tab);
    await sendTelegramMessage(chatId, text, { reply_markup: keyboard });
    return;
  }

  // ── 2. Commands ───────────────────────────────────────────────────────────
  // ── Admin Command: /givekey or /grant ────────────────────────────────────
  if (rawText.startsWith('/givekey') || rawText.startsWith('/grant')) {
    if (!isTelegramAdmin(chatId, username)) {
      await sendTelegramMessage(chatId, '⛔ <b>Unauthorized:</b> This command is restricted to store administrators.');
      return;
    }

    const parts = rawText.split(/\s+/).slice(1);
    // If no arguments: /givekey -> show interactive menu
    if (parts.length === 0) {
      const giveMenuText =
        `👑 <b>Admin Direct Key Dispatch</b>\n\n` +
        `Select device slots to allocate & lock from inventory:`;

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: '📱 1 Device (1 Slot)', callback_data: 'cb_admin_give_1' }],
          [{ text: '🔋 2 Devices (2 Slots)', callback_data: 'cb_admin_give_2' }],
          [{ text: '👑 3 Devices (Full Private Key)', callback_data: 'cb_admin_give_3' }],
          [{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }],
        ],
      };

      await sendTelegramMessage(chatId, giveMenuText, { reply_markup: keyboard });
      return;
    }

    // Has arguments: /givekey <slots> [recipient]
    const slotArg = parseInt(parts[0], 10);
    const slots: 1 | 2 | 3 = (slotArg === 1 || slotArg === 2 || slotArg === 3) ? slotArg : 1;
    const recipient = parts.slice(1).join(' ').trim() || (username ? `@${username}` : 'Direct Customer');

    try {
      const dispatch = await dispatchManualKey({
        recipient,
        slots,
        note: `Direct Telegram command by @${username || 'Admin'}`,
        adminIdentifier: `@${username || 'Admin'}`,
      });

      const card =
        `⚡ <b>KEY ALLOCATED & LOCKED!</b>\n\n` +
        `📦 <b>Plan:</b> ${slots === 3 ? '👑 3 Slots (100% Private / Dedicated)' : `${slots} Slot(s) Shared`}\n` +
        `👤 <b>Recipient:</b> ${dispatch.recipient}\n` +
        `🔑 <b>License Key:</b>\n<code>${dispatch.decryptedKey}</code>\n<i>(Tap key to copy)</i>\n\n` +
        `🔗 <b>Customer Fulfillment Link:</b>\n${dispatch.orderUrl}\n\n` +
        `🛡️ <i>Key is atomically locked in database. Website will never double-sell this allocation.</i>`;

      await sendTelegramMessage(chatId, card);
    } catch (err: any) {
      await sendTelegramMessage(chatId, `❌ <b>Allocation Failed:</b> ${err?.message || 'Error dispatching key.'}`);
    }
    return;
  }

  if (rawText.startsWith('/start')) {
    const startParam = rawText.replace('/start', '').trim();
    let discountBanner: string | undefined;

    if (startParam.startsWith('ref_')) {
      const referrerId = parseInt(startParam.replace('ref_', ''), 10);
      if (!isNaN(referrerId)) {
        const eligibility = await validateReferralEligibility(chatId, referrerId);
        if (eligibility.eligible) {
          await saveUserReferral(chatId, referrerId);
          discountBanner =
            `🎁 <b>SPECIAL REFERRAL DISCOUNT APPLIED!</b>\n` +
            `Your friend invited you to Aetheria Store. You get an exclusive discount on your first key:\n` +
            `• 📱 <b>1 Device:</b> <s>₹160 / $2.00</s> ➔ <b>₹130 / $1.70</b>\n` +
            `• 🔋 <b>2 Devices:</b> <s>₹300 / $3.60</s> ➔ <b>₹270 / $3.00</b>`;
        } else if (eligibility.reason === 'self_referral') {
          await sendTelegramMessage(
            chatId,
            `⚠️ <b>Self-referrals are not allowed!</b>\nShare your link with other trainers in <b>👥 Refer & Earn</b> to earn ₹30 / $0.50 discount coupons on your next key purchase.`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `👋 <b>Welcome back!</b>\nReferral discounts are reserved for new trainers' first purchase. Use <b>👥 Refer & Earn</b> below to invite friends and earn discount coupons on your next key purchase!`
          );
        }
      }
    }

    if (!discountBanner) {
      const userDiscount = await getUserDiscountState(chatId);
      if (userDiscount.hasDiscount) {
        discountBanner = userDiscount.discountLabel;
      }
    }

    // Send clean single-card welcome and plan picker with inline keyboard
    const { text, keyboard } = getPlanPickerContent(discountBanner, firstName);
    await sendTelegramMessage(chatId, text, {
      reply_markup: keyboard,
    });
    return;
  }

  // ── 3. Detect 12-digit UPI Reference Number / UTR ──────────────────────────
  const utrMatch = rawText.match(/\b(\d{12})\b/);
  if (utrMatch) {
    const cleanUtr = utrMatch[1];
    await processTelegramUtrSubmission(chatId, cleanUtr, username);
    return;
  }

  // ── 4. Detect PayPal Email Address ─────────────────────────────────────────
  const emailMatch = rawText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (emailMatch) {
    const cleanEmail = emailMatch[1].toLowerCase();
    await processTelegramPaypalSubmission(chatId, cleanEmail, true, username);
    return;
  }

  // ── 5. Detect PayPal Transaction ID (alphanumeric 13-22 characters) ─────────
  const paypalTxMatch = rawText.match(/\b([A-Za-z0-9]{13,22})\b/);
  if (paypalTxMatch && /[a-zA-Z]/.test(paypalTxMatch[1]) && /[0-9]/.test(paypalTxMatch[1])) {
    const cleanTx = paypalTxMatch[1].toUpperCase();
    await processTelegramPaypalSubmission(chatId, cleanTx, false, username);
    return;
  }

  // ── 6. Detect Coupon / Promo Code (e.g. REF30_ABCDEF, VIP20, /coupon ...) ──
  const couponMatch = rawText.match(/^(?:\/coupon\s+)?([A-Za-z0-9_]{3,25})$/i);
  if (couponMatch) {
    const candidateCode = couponMatch[1].toUpperCase();
    const couponValidation = await validateAndApplyCoupon(candidateCode, PLANS[0], 'INR');
    if (couponValidation.valid) {
      await setUserCoupon(chatId, candidateCode);
      const discountRs = Math.round((couponValidation.discountAmountInr || 1000) / 100);
      const p1Inr = Math.max(0, 160 - discountRs);
      const p2Inr = Math.max(0, 300 - discountRs);
      const discountText =
        `🎟️ <b>Promo Code "${candidateCode}" Applied!</b>\n\n` +
        `• 📱 <b>1 Device:</b> <s>₹160</s> ➔ <b>₹${p1Inr}</b>\n` +
        `• 🔋 <b>2 Devices:</b> <s>₹300</s> ➔ <b>₹${p2Inr}</b>\n\n` +
        `Choose your plan below:`;
      const { keyboard } = getPlanPickerContent();
      await sendTelegramMessage(chatId, discountText, { reply_markup: keyboard });
      return;
    }
  }

  // ── 4. Default Friendly Fallback with Persistent Keyboard ──────────────────
  await sendTelegramMessage(
    chatId,
    `👋 Use the buttons below to browse keys, view stock, or contact support.`,
    {
      reply_markup: getPersistentKeyboard(),
    }
  );
}

/**
 * Process a 12-digit UTR sent by the customer in chat
 */
async function processTelegramUtrSubmission(
  chatId: number,
  cleanUtr: string,
  username?: string,
  photoUrl?: string
) {
  const db = getAdminFirestore();

  // Find recent pending or verifying order for this chat ID
  const ordersSnap = await db
    .collection('orders')
    .where('telegram_chat_id', '==', chatId)
    .where('payment_status', 'in', ['pending', 'verifying'])
    .limit(1)
    .get();

  let targetOrder: Record<string, any> | null = null;
  let orderId: string;

  if (!ordersSnap.empty) {
    targetOrder = ordersSnap.docs[0].data();
    orderId = ordersSnap.docs[0].id;
  } else {
    // If no pending order exists, create one for the 1-device plan by default
    const plan = PLANS[0];
    orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    targetOrder = {
      order_id: orderId,
      customer_email: username ? `${username.toLowerCase()}@telegram.user` : `tg_${chatId}@telegram.user`,
      plan_type: plan.id,
      amount: plan.price_inr,
      currency: 'INR',
      payment_gateway: 'upi_direct',
      payment_status: 'pending',
      delivered_key: null,
      gateway_order_id: `upi_${orderId}`,
      telegram_chat_id: chatId,
      telegram_username: username || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('orders').doc(orderId).set(targetOrder);
  }

  // Check duplicate UTR
  const dupSnap = await db
    .collection('orders')
    .where('utr_number', '==', cleanUtr)
    .limit(1)
    .get();

  if (!dupSnap.empty && dupSnap.docs[0].id !== orderId) {
    const dupData = dupSnap.docs[0].data();
    if (dupData.payment_status === 'paid' || dupData.payment_status === 'verifying') {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>UTR Already Used</b>\n\n` +
          `The UTR number <code>${cleanUtr}</code> has already been submitted for another order.\n` +
          `If you believe this is an error, please contact @sleekfx3.`
      );
      return;
    }
  }

  // Check automated Bank SMS Bridge credit match
  const bankCredit = await getBankCredit(cleanUtr);

  if (bankCredit && bankCredit.status === 'unclaimed') {
    // ── Instant Automated Match! ───────────────────────────────────────────
    try {
      const allocation = await allocateKeySlot(orderId, `TG_AUTO_BANK_${cleanUtr}`);

      await db.collection('orders').doc(orderId).update({
        payment_status: 'paid',
        utr_number: cleanUtr,
        ...(photoUrl ? { payment_proof_url: photoUrl } : {}),
        updated_at: new Date(),
      });

      await claimBankCredit(cleanUtr, orderId);

      const plan = PLAN_MAP[targetOrder.plan_type] || PLANS[0];

      const deliveryMessage =
        `🎉 <b>PAYMENT VERIFIED! YOUR KEY HAS BEEN DISPATCHED:</b>\n\n` +
        `🔑 <b>License Key:</b>\n` +
        `<code>${allocation.decryptedKey}</code>\n` +
        `<i>(Tap key above to copy to clipboard)</i>\n\n` +
        `📱 <b>Plan:</b> ${plan.name} (${plan.duration})\n` +
        `⚡ <b>Device Slots:</b> ${plan.device_slots} Android Device(s)\n` +
        `🆔 <b>Order ID:</b> <code>${orderId}</code>\n\n` +
        `<b>How to Activate:</b>\n` +
        `1. Open PGSharp on your Android device.\n` +
        `2. Tap the floating Star icon ⭐ -> Go to <b>Settings ⚙️</b>.\n` +
        `3. Tap <b>Activate</b>, paste your key, and tap OK!\n\n` +
        `Need a new key next month or assistance? We're always here at @sleekfx3!`;

      await sendTelegramMessage(chatId, deliveryMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👤 View All My Keys', callback_data: 'cb_my_keys' }],
            [{ text: '💬 Support & Questions', url: TELEGRAM_URL }],
            [{ text: '🌐 Visit Web Store', web_app: { url: STORE_URL } }],
          ],
        },
      });

      // Send admin alert
      sendAdminOrderAlert({
        orderId,
        customerEmail: targetOrder.customer_email,
        planType: targetOrder.plan_type,
        amount: targetOrder.amount,
        currency: 'INR',
        gateway: 'upi_direct',
        transactionId: cleanUtr,
        deliveredKey: allocation.decryptedKey,
      }).catch((err) => console.error('[Telegram] Admin alert error:', err));

      // Broadcast proof to official channel
      broadcastOrderProof({
        orderId,
        planType: targetOrder.plan_type,
        gateway: 'upi_direct',
        amount: targetOrder.amount,
        currency: 'INR',
        customerUsername: username,
      }).catch((err) => console.error('[Telegram] Proof broadcast error:', err));

      // Process referral reward if order was referred
      processReferralReward({
        ...targetOrder,
        order_id: orderId,
        utr_number: cleanUtr,
        payment_status: 'paid',
      } as Order).catch((err) => console.error('[Telegram] Referral reward error:', err));

      return;
    } catch (allocErr) {
      console.error('[Telegram] Key allocation error:', allocErr);
    }
  }

  // ── Bank credit not yet received or awaiting admin review ─────────────────
  await db.collection('orders').doc(orderId).update({
    payment_status: 'verifying',
    utr_number: cleanUtr,
    ...(photoUrl ? { payment_proof_url: photoUrl } : {}),
    updated_at: new Date(),
  });

  await sendTelegramMessage(
    chatId,
    `⏳ <b>UTR Received:</b> <code>${cleanUtr}</code>\n\n` +
      `We are currently verifying your payment with the bank.\n` +
      `Once confirmed (typically within 1–3 minutes), your <b>PGSharp Standard Key</b> will be delivered automatically right here in this chat!\n\n` +
      `<i>🔖 Order ID: <code>${orderId}</code></i>\n` +
      `<i>(If your bank SMS is taking a moment, don't worry! Your order is active and our system will deliver your key as soon as the bank confirms.)</i>`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👤 Check Order in My Keys', callback_data: 'cb_my_keys' }],
          [{ text: '💬 Support', url: TELEGRAM_URL }],
        ],
      },
    }
  );

  // Send high-priority verification alert to Discord Admin
  sendPaymentVerificationAlert({
    orderId,
    customerEmail: targetOrder.customer_email,
    planType: targetOrder.plan_type,
    amount: targetOrder.amount,
    currency: 'INR',
    gateway: 'upi_direct',
    transactionId: cleanUtr,
    customerPhone: username ? `@${username}` : `Telegram ID: ${chatId}`,
    screenshotUrl: photoUrl,
    notes: `Customer submitted 12-digit UTR ${cleanUtr} in Telegram chat.`,
  }).catch((err) => console.error('[Telegram] Verification alert error:', err));
}

/**
 * Process a PayPal Transaction ID or Payer Email sent by the customer in chat
 */
async function processTelegramPaypalSubmission(
  chatId: number,
  cleanInput: string,
  isEmail: boolean,
  username?: string
) {
  const db = getAdminFirestore();

  // Find recent pending or verifying order for this chat ID
  const ordersSnap = await db
    .collection('orders')
    .where('telegram_chat_id', '==', chatId)
    .where('payment_status', 'in', ['pending', 'verifying'])
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();

  let targetOrder: Record<string, any> | null = null;
  let orderId: string;

  if (!ordersSnap.empty) {
    targetOrder = ordersSnap.docs[0].data();
    orderId = ordersSnap.docs[0].id;
  } else {
    // If no pending order exists, create one for the 1-device plan by default
    const plan = PLANS[0];
    orderId = `ord_tg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    targetOrder = {
      order_id: orderId,
      customer_email: isEmail
        ? cleanInput.toLowerCase()
        : username
        ? `${username.toLowerCase()}@telegram.user`
        : `tg_${chatId}@telegram.user`,
      customer_phone: '',
      plan_type: plan.id,
      amount: plan.price_usd,
      currency: 'USD',
      payment_gateway: 'paypal_direct',
      payment_status: 'pending',
      delivered_key: null,
      gateway_order_id: `paypal_${orderId}`,
      telegram_chat_id: chatId,
      telegram_username: username || '',
      telegram_user_id: chatId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('orders').doc(orderId).set(targetOrder);
  }

  // Check duplicate Tx ID usage across other orders
  if (!isEmail) {
    const dupSnap = await db
      .collection('orders')
      .where('paypal_tx_id', '==', cleanInput)
      .limit(1)
      .get();

    if (!dupSnap.empty && dupSnap.docs[0].id !== orderId) {
      const dupData = dupSnap.docs[0].data();
      if (dupData.payment_status === 'paid' || dupData.payment_status === 'verifying') {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>PayPal Transaction ID Already Used</b>\n\n` +
            `The Transaction ID <code>${cleanInput}</code> has already been submitted for another order.\n` +
            `If you believe this is an error, please contact @sleekfx3.`
        );
        return;
      }
    }
  }

  // Check automated PayPal IPN credit match
  let matchedCredit: { txn_id: string } | null = null;

  if (!isEmail) {
    const credit = await getPaypalCredit(cleanInput);
    if (credit && credit.status === 'unclaimed') {
      matchedCredit = credit;
    }
  } else {
    // Search verified_paypal_credits by payer_email
    const creditSnap = await db
      .collection('verified_paypal_credits')
      .where('payer_email', '==', cleanInput.toLowerCase())
      .where('status', '==', 'unclaimed')
      .limit(1)
      .get();
    if (!creditSnap.empty) {
      matchedCredit = creditSnap.docs[0].data() as { txn_id: string };
    }
  }

  if (matchedCredit) {
    // ── Instant Automated Match! ───────────────────────────────────────────
    try {
      const allocation = await allocateKeySlot(orderId, `TG_AUTO_PAYPAL_${matchedCredit.txn_id}`);

      const updatePayload: Record<string, any> = {
        payment_status: 'paid',
        paypal_tx_id: matchedCredit.txn_id,
        payment_gateway: 'paypal_direct',
        updated_at: new Date(),
      };
      if (isEmail) {
        updatePayload.customer_email = cleanInput.toLowerCase();
      }

      await db.collection('orders').doc(orderId).update(updatePayload);
      await claimPaypalCredit(matchedCredit.txn_id, orderId);

      const plan = PLAN_MAP[targetOrder.plan_type] || PLANS[0];

      const deliveryMessage =
        `🎉 <b>PAYMENT VERIFIED! YOUR KEY HAS BEEN DISPATCHED:</b>\n\n` +
        `🔑 <b>License Key:</b>\n` +
        `<code>${allocation.decryptedKey}</code>\n` +
        `<i>(Tap key above to copy to clipboard)</i>\n\n` +
        `📱 <b>Plan:</b> ${plan.name} (${plan.duration})\n` +
        `⚡ <b>Device Slots:</b> ${plan.device_slots} Android Device(s)\n` +
        `🆔 <b>Order ID:</b> <code>${orderId}</code>\n\n` +
        `<b>How to Activate:</b>\n` +
        `1. Open PGSharp on your Android device.\n` +
        `2. Tap the floating Star icon ⭐ -> Go to <b>Settings ⚙️</b>.\n` +
        `3. Tap <b>Activate</b>, paste your key, and tap OK!\n\n` +
        `Need a new key next month or assistance? We're always here at @sleekfx3!`;

      await sendTelegramMessage(chatId, deliveryMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👤 View All My Keys', callback_data: 'cb_my_keys' }],
            [{ text: '💬 Support & Questions', url: TELEGRAM_URL }],
            [{ text: '🌐 Visit Web Store', web_app: { url: STORE_URL } }],
          ],
        },
      });

      sendAdminOrderAlert({
        orderId,
        customerEmail: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
        planType: targetOrder.plan_type,
        amount: targetOrder.amount,
        currency: 'USD',
        gateway: 'paypal_direct',
        transactionId: matchedCredit.txn_id,
        deliveredKey: allocation.decryptedKey,
      }).catch((err) => console.error('[Telegram] Admin alert error:', err));

      // Broadcast proof to official channel
      broadcastOrderProof({
        orderId,
        planType: targetOrder.plan_type,
        gateway: 'paypal_direct',
        amount: targetOrder.amount,
        currency: 'USD',
        customerEmail: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
        customerUsername: username,
      }).catch((err) => console.error('[Telegram] Proof broadcast error:', err));

      // Process referral reward if order was referred
      processReferralReward({
        ...targetOrder,
        order_id: orderId,
        customer_email: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
        paypal_tx_id: matchedCredit.txn_id,
        payment_status: 'paid',
      } as Order).catch((err) => console.error('[Telegram] Referral reward error:', err));

      return;
    } catch (allocErr) {
      console.error('[Telegram] Key allocation error:', allocErr);
    }
  }

  // ── PayPal credit not yet received or awaiting IPN/admin review ───────────
  const updateData: Record<string, any> = {
    payment_status: 'verifying',
    payment_gateway: 'paypal_direct',
    updated_at: new Date(),
  };
  if (isEmail) {
    updateData.customer_email = cleanInput.toLowerCase();
  } else {
    updateData.paypal_tx_id = cleanInput;
  }

  await db.collection('orders').doc(orderId).update(updateData);

  await sendTelegramMessage(
    chatId,
    `⏳ <b>PayPal Proof Received:</b> <code>${cleanInput}</code>\n\n` +
      `We are confirming your payment with PayPal.\n` +
      `Once confirmed (typically within 1–5 minutes), your <b>PGSharp Standard Key</b> will be delivered automatically right here in this chat!\n\n` +
      `<i>Order ID: <code>${orderId}</code></i>`
  );

  // Send high-priority verification alert to Discord Admin with 1-click Approve
  sendPaymentVerificationAlert({
    orderId,
    customerEmail: isEmail ? cleanInput.toLowerCase() : targetOrder.customer_email,
    planType: targetOrder.plan_type,
    amount: targetOrder.amount,
    currency: 'USD',
    gateway: 'paypal_direct',
    transactionId: cleanInput,
    customerPhone: username ? `@${username}` : `Telegram ID: ${chatId}`,
  }).catch((err) => console.error('[Telegram] Verification alert error:', err));
}
