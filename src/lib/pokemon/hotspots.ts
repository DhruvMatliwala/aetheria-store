import { PokemonSpawn, RadarWatchlistRule } from '@/types/pokemon';
import { TOP_SNIPED_POKEMON } from './names';

export interface SpoofingHotspot {
  city: string;
  lat: number;
  lng: number;
  landmark: string;
}

export const SPOOFING_HOTSPOTS: SpoofingHotspot[] = [
  {
    city: 'Zaragoza, Spain',
    lat: 41.65606,
    lng: -0.87734,
    landmark: 'Plaza del Pilar',
  },
  {
    city: 'New York, USA',
    lat: 40.75889,
    lng: -73.98513,
    landmark: 'Times Square / Central Park',
  },
  {
    city: 'Tokyo, Japan',
    lat: 35.69142,
    lng: 139.70057,
    landmark: 'Shinjuku & Shibuya',
  },
  {
    city: 'Sydney, Australia',
    lat: -33.85678,
    lng: 151.21529,
    landmark: 'Circular Quay / Opera House',
  },
  {
    city: 'San Francisco, USA',
    lat: 37.80867,
    lng: -122.40982,
    landmark: 'Pier 39',
  },
  {
    city: 'São Paulo, Brazil',
    lat: -23.58741,
    lng: -46.65763,
    landmark: 'Parque Ibirapuera',
  },
  {
    city: 'Taipei, Taiwan',
    lat: 25.02969,
    lng: 121.53625,
    landmark: "Da'an Forest Park",
  },
  {
    city: 'London, UK',
    lat: 51.50726,
    lng: -0.16573,
    landmark: 'Hyde Park',
  },
];

/**
 * Generates a realistic live spawn in one of the world's premier spoofing hubs,
 * tailored to match a specific subscriber's radar watchlist rule.
 */
export function generateRealisticHotspotSpawn(rule: RadarWatchlistRule): PokemonSpawn {
  // 1. Pick a random premier hotspot
  const hotspot = SPOOFING_HOTSPOTS[Math.floor(Math.random() * SPOOFING_HOTSPOTS.length)];

  // Add realistic jitter around the hotspot (approx 200m - 500m radius)
  const latOffset = (Math.random() - 0.5) * 0.007;
  const lngOffset = (Math.random() - 0.5) * 0.007;
  const latitude = Number((hotspot.lat + latOffset).toFixed(6));
  const longitude = Number((hotspot.lng + lngOffset).toFixed(6));

  // 2. Determine species
  let speciesName = rule.pokemon_name?.trim();
  if (!speciesName || speciesName.toUpperCase() === 'ALL') {
    const metaList = TOP_SNIPED_POKEMON;
    const randomMeta = metaList[Math.floor(Math.random() * metaList.length)];
    speciesName = randomMeta.name;
  }

  // 3. Determine IV spread matching the user's rule
  let atk = 15;
  let def = 15;
  let sta = 15;

  if (rule.is_hundo_only) {
    atk = 15;
    def = 15;
    sta = 15;
  } else if (rule.is_nundo_only) {
    atk = 0;
    def = 0;
    sta = 0;
  } else if (rule.any_iv || rule.target_atk === -1) {
    // Generate exciting diverse spreads for "All IVs"
    const roll = Math.random();
    if (roll < 0.25) {
      // 100% Hundo
      atk = 15;
      def = 15;
      sta = 15;
    } else if (roll < 0.65) {
      // Top PvP rank spread
      const pvpSpreads = [
        [0, 14, 14],
        [1, 14, 15],
        [0, 15, 14],
        [0, 15, 15],
        [1, 15, 14],
        [2, 15, 15],
      ];
      const picked = pvpSpreads[Math.floor(Math.random() * pvpSpreads.length)];
      atk = picked[0];
      def = picked[1];
      sta = picked[2];
    } else {
      // High 3-star wild spread
      atk = Math.floor(12 + Math.random() * 4);
      def = Math.floor(12 + Math.random() * 4);
      sta = Math.floor(12 + Math.random() * 4);
    }
  } else {
    // Specific custom IV configured by user
    atk = rule.target_atk;
    def = rule.target_def;
    sta = rule.target_sta;
  }

  // 4. Realistic level and CP
  const level = Math.floor(18 + Math.random() * 16); // Level 18 to 33
  const cpMultiplier = (level / 35) * (atk + def + sta) / 45;
  const cp = Math.max(650, Math.floor(900 + cpMultiplier * 1800));

  // 5. Despawn countdown (between 12 and 24 minutes in the future)
  const despawnMinutes = 12 + Math.floor(Math.random() * 12);
  const despawn_time = Date.now() + despawnMinutes * 60 * 1000;

  return {
    name: speciesName,
    latitude,
    longitude,
    atk,
    def,
    sta,
    cp,
    level,
    despawn_time,
    city: `${hotspot.city} (${hotspot.landmark})`,
  };
}
