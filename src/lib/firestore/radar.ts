import { getAdminFirestore, admin } from '@/lib/firebase/admin';
import { PokemonSpawn, RadarWatchlistRule } from '@/types/pokemon';

const COLLECTION = 'radar_watchlists';

/**
 * Saves or updates a user's Pokémon Radar tracking rule in Firestore.
 */
export async function saveRadarRule(
  chatId: number,
  rule: Partial<RadarWatchlistRule>
): Promise<RadarWatchlistRule> {
  const db = getAdminFirestore();
  const docRef = db.collection(COLLECTION).doc(String(chatId));
  const snap = await docRef.get();

  const isHundo = rule.target_atk === 15 && rule.target_def === 15 && rule.target_sta === 15;
  const isNundo = rule.target_atk === 0 && rule.target_def === 0 && rule.target_sta === 0;

  const existingData = snap.exists ? (snap.data() as RadarWatchlistRule) : null;

  const updatedRule: RadarWatchlistRule = {
    chat_id: chatId,
    username: rule.username ?? existingData?.username ?? '',
    pokemon_name: rule.pokemon_name !== undefined ? rule.pokemon_name : existingData?.pokemon_name ?? 'ALL',
    target_atk: rule.target_atk !== undefined ? rule.target_atk : existingData?.target_atk ?? 15,
    target_def: rule.target_def !== undefined ? rule.target_def : existingData?.target_def ?? 15,
    target_sta: rule.target_sta !== undefined ? rule.target_sta : existingData?.target_sta ?? 15,
    any_iv: rule.any_iv !== undefined ? rule.any_iv : (rule.target_atk === -1 ? true : existingData?.any_iv ?? false),
    is_hundo_only: rule.is_hundo_only !== undefined ? rule.is_hundo_only : isHundo,
    is_nundo_only: rule.is_nundo_only !== undefined ? rule.is_nundo_only : isNundo,
    enabled: rule.enabled !== undefined ? rule.enabled : true,
    updated_at: new Date().toISOString(),
  };

  if (!existingData) {
    updatedRule.created_at = new Date().toISOString();
  }

  await docRef.set(updatedRule, { merge: true });
  return updatedRule;
}

/**
 * Retrieves a user's active radar rule from Firestore.
 */
export async function getRadarRule(chatId: number): Promise<RadarWatchlistRule | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(String(chatId)).get();
  if (!doc.exists) return null;
  return doc.data() as RadarWatchlistRule;
}

/**
 * Toggles a user's radar alerts on or off.
 */
export async function toggleRadarRule(chatId: number, enabled: boolean): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(String(chatId)).set(
    {
      enabled,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Finds all Telegram users whose watchlist matches the incoming live spawn.
 */
export async function findMatchingSubscribers(spawn: PokemonSpawn): Promise<number[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).where('enabled', '==', true).get();
  if (snap.empty) return [];

  const matchedChatIds: number[] = [];
  const spawnNameLower = spawn.name.toLowerCase().trim();
  const isSpawnHundo = spawn.atk === 15 && spawn.def === 15 && spawn.sta === 15;
  const isSpawnNundo = spawn.atk === 0 && spawn.def === 0 && spawn.sta === 0;

  for (const doc of snap.docs) {
    const rule = doc.data() as RadarWatchlistRule;
    if (!rule.enabled) continue;

    // Check species filter if specified
    if (rule.pokemon_name && rule.pokemon_name.trim() !== '' && rule.pokemon_name.toUpperCase() !== 'ALL') {
      if (rule.pokemon_name.toLowerCase().trim() !== spawnNameLower) {
        continue;
      }
    }

    // Match any IV (all IVs allowed)
    if (rule.any_iv || rule.target_atk === -1) {
      matchedChatIds.push(rule.chat_id);
      continue;
    }

    // Universal 100% IV Hundo match
    if (rule.is_hundo_only) {
      if (isSpawnHundo) {
        matchedChatIds.push(rule.chat_id);
      }
      continue;
    }

    // Universal 0% IV Nundo match
    if (rule.is_nundo_only) {
      if (isSpawnNundo) {
        matchedChatIds.push(rule.chat_id);
      }
      continue;
    }

    // Exact Attack / Defense / Stamina match (e.g. 0/14/14 or 1/14/15)
    if (
      rule.target_atk === spawn.atk &&
      rule.target_def === spawn.def &&
      rule.target_sta === spawn.sta
    ) {
      matchedChatIds.push(rule.chat_id);
    }
  }

  return [...new Set(matchedChatIds)];
}
