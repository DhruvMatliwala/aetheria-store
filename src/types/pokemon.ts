export interface PokemonSpawn {
  id?: string;
  pokemon_id?: number;
  name: string;
  latitude: number;
  longitude: number;
  atk: number;
  def: number;
  sta: number;
  iv?: number; // 0 to 100 percentage
  cp?: number;
  level?: number;
  despawn_time: number; // Unix timestamp in seconds or milliseconds
  city?: string;
}

export interface RadarWatchlistRule {
  chat_id: number;
  username?: string;
  pokemon_name?: string; // Optional specific species (e.g. 'Swampert') or undefined for any species
  target_atk: number; // 0-15 or -1 if any_iv
  target_def: number; // 0-15
  target_sta: number; // 0-15
  any_iv?: boolean; // If true, matches all IV spreads
  is_hundo_only?: boolean; // 15/15/15
  is_nundo_only?: boolean; // 0/0/0
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}
