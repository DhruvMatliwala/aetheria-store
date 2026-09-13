import { NextRequest, NextResponse } from 'next/server';
import { PokemonSpawn } from '@/types/pokemon';
import { findMatchingSubscribers } from '@/lib/firestore/radar';
import { sendPokemonSpawnAlert } from '@/lib/telegram/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory deduplication cache (stores spawn keys for 20 minutes)
const recentlyBroadcasted = new Map<string, number>();

function isDuplicateSpawn(spawn: PokemonSpawn): boolean {
  const now = Date.now();
  // Cleanup entries older than 20 minutes
  for (const [key, timestamp] of recentlyBroadcasted.entries()) {
    if (now - timestamp > 20 * 60 * 1000) {
      recentlyBroadcasted.delete(key);
    }
  }

  const key = `${spawn.name.toLowerCase()}_${spawn.latitude.toFixed(4)}_${spawn.longitude.toFixed(4)}_${spawn.atk}_${spawn.def}_${spawn.sta}`;
  if (recentlyBroadcasted.has(key)) {
    return true;
  }
  recentlyBroadcasted.set(key, now);
  return false;
}

/**
 * Normalizes varied community scanner webhook formats (Golbat, Poracle, RDM, MAD)
 */
function normalizeSpawn(raw: Record<string, any>): PokemonSpawn | null {
  const name =
    raw.name ||
    raw.pokemon_name ||
    raw.pokemon ||
    (raw.pokemon_id ? `Pokemon #${raw.pokemon_id}` : null);

  const latitude = Number(raw.latitude ?? raw.lat);
  const longitude = Number(raw.longitude ?? raw.lon ?? raw.lng);

  if (!name || isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const atk = Number(raw.atk ?? raw.individual_attack ?? raw.attack ?? 15);
  const def = Number(raw.def ?? raw.individual_defense ?? raw.defense ?? 15);
  const sta = Number(raw.sta ?? raw.individual_stamina ?? raw.stamina ?? 15);

  const rawDespawn = raw.despawn_time ?? raw.disappear_time ?? raw.despawn ?? Date.now() + 15 * 60 * 1000;
  const despawn_time = typeof rawDespawn === 'number' ? rawDespawn : Date.now() + 15 * 60 * 1000;

  return {
    pokemon_id: raw.pokemon_id ? Number(raw.pokemon_id) : undefined,
    name: String(name),
    latitude,
    longitude,
    atk: Math.max(0, Math.min(15, atk)),
    def: Math.max(0, Math.min(15, def)),
    sta: Math.max(0, Math.min(15, sta)),
    cp: raw.cp ? Number(raw.cp) : undefined,
    level: raw.level ? Number(raw.level) : undefined,
    despawn_time,
    city: raw.city || raw.location || undefined,
  };
}

/**
 * POST /api/pokemon/spawns
 * Ingests real-time community scanner webhooks and dispatches live alerts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawList: Record<string, any>[] = Array.isArray(body)
      ? body
      : Array.isArray(body.spawns)
      ? body.spawns
      : [body];

    let processedCount = 0;
    let alertsSent = 0;

    for (const item of rawList) {
      const spawn = normalizeSpawn(item);
      if (!spawn) continue;

      // Drop expired spawns or spawns with less than 3 minutes left
      const now = Date.now();
      const despawnMs = spawn.despawn_time > 10000000000 ? spawn.despawn_time : spawn.despawn_time * 1000;
      if (despawnMs - now < 3 * 60 * 1000) {
        continue;
      }

      // Check duplicate cache
      if (isDuplicateSpawn(spawn)) {
        continue;
      }

      processedCount++;

      // Find matching users in Firestore
      const subscribers = await findMatchingSubscribers(spawn);
      for (const chatId of subscribers) {
        try {
          const sent = await sendPokemonSpawnAlert(chatId, spawn);
          if (sent) alertsSent++;
        } catch (alertErr) {
          console.error(`[Radar] Failed to send alert to ${chatId}:`, alertErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      alertsSent,
    });
  } catch (err: any) {
    console.error('[pokemon/spawns] Webhook error:', err);
    return NextResponse.json({ error: 'Failed to process spawns', details: err?.message }, { status: 500 });
  }
}

/**
 * GET /api/pokemon/spawns?test=true&chatId=12345
 * Test simulator for instant testing by admin
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const isTest = url.searchParams.get('test') === 'true';
  const targetChatId = url.searchParams.get('chatId');

  if (!isTest) {
    return NextResponse.json({
      status: 'online',
      message: 'Aetheria Pokémon Radar Spawn Webhook Ingestion API',
      timestamp: new Date().toISOString(),
    });
  }

  const sampleSpawn: PokemonSpawn = {
    name: 'Swampert',
    latitude: 41.66112,
    longitude: -0.89291,
    atk: 0,
    def: 14,
    sta: 14,
    cp: 1485,
    level: 25,
    despawn_time: Date.now() + 15 * 60 * 1000,
    city: 'Zaragoza, Spain',
  };

  let dispatched = false;
  if (targetChatId) {
    dispatched = await sendPokemonSpawnAlert(Number(targetChatId), sampleSpawn);
  }

  return NextResponse.json({
    success: true,
    test: true,
    dispatchedTo: targetChatId || 'None specified (pass ?chatId=...)',
    spawn: sampleSpawn,
  });
}
