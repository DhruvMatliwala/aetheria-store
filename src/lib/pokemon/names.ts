import { ALL_POKEMON_SPECIES } from './speciesList';

export interface MetaPokemon {
  name: string;
  emoji: string;
}

export const TOP_SNIPED_POKEMON: MetaPokemon[] = [
  { name: 'Swampert', emoji: '💧' },
  { name: 'Lucario', emoji: '🥋' },
  { name: 'Greninja', emoji: '🐸' },
  { name: 'Garchomp', emoji: '🐲' },
  { name: 'Metagross', emoji: '⚡' },
  { name: 'Bastiodon', emoji: '🛡️' },
  { name: 'Dragonite', emoji: '🐉' },
  { name: 'Gengar', emoji: '👻' },
  { name: 'Medicham', emoji: '🔮' },
  { name: 'Charizard', emoji: '🔥' },
  { name: 'Tyranitar', emoji: '🦖' },
  { name: 'Rayquaza', emoji: '🌌' },
  { name: 'Mewtwo', emoji: '🧬' },
];

export const COMMON_POKEMON_SPECIES: string[] = ALL_POKEMON_SPECIES;

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Auto-corrects typo in Pokémon name (e.g. "swampart" -> "Swampert", "charzard" -> "Charizard")
 */
export function fuzzyMatchPokemon(raw: string): { name: string; corrected: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { name: 'ALL', corrected: false };
  if (trimmed.toUpperCase() === 'ALL') return { name: 'ALL', corrected: false };

  const clean = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Exact match case-insensitive
  for (const p of COMMON_POKEMON_SPECIES) {
    if (p.toLowerCase().replace(/[^a-z0-9]/g, '') === clean) {
      return { name: p, corrected: false };
    }
  }

  // Prefix match (e.g. "garchom" matches "Garchomp")
  for (const p of COMMON_POKEMON_SPECIES) {
    const pClean = p.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (pClean.startsWith(clean) && clean.length >= 4) {
      return { name: p, corrected: true };
    }
  }

  // Fuzzy Levenshtein match (tolerance depends on word length)
  let bestMatch: string | null = null;
  let minDistance = 999;
  const maxAllowedDistance = clean.length <= 4 ? 1 : clean.length <= 8 ? 2 : 3;

  for (const p of COMMON_POKEMON_SPECIES) {
    const pClean = p.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dist = levenshtein(clean, pClean);
    if (dist < minDistance && dist <= maxAllowedDistance) {
      minDistance = dist;
      bestMatch = p;
    }
  }

  if (bestMatch) {
    return { name: bestMatch, corrected: true };
  }

  // Fallback: title-case the user's input
  const titleCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return { name: titleCase, corrected: false };
}

/**
 * Tries to fuzzy match a Pokémon name, returning null if no close match is found.
 */
export function tryFuzzyMatchPokemon(raw: string): { name: string; corrected: boolean } | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 3) return null;
  const clean = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (
    trimmed.toUpperCase() === 'ALL' ||
    clean === 'all' ||
    clean === 'allpokemon' ||
    clean === 'allpokemons'
  ) {
    return { name: 'ALL', corrected: false };
  }

  // Exact match case-insensitive
  for (const p of COMMON_POKEMON_SPECIES) {
    if (p.toLowerCase().replace(/[^a-z0-9]/g, '') === clean) {
      return { name: p, corrected: false };
    }
  }

  // Prefix match (e.g. "garchom" matches "Garchomp")
  for (const p of COMMON_POKEMON_SPECIES) {
    const pClean = p.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (pClean.startsWith(clean) && clean.length >= 4) {
      return { name: p, corrected: true };
    }
  }

  // Fuzzy Levenshtein match
  let bestMatch: string | null = null;
  let minDistance = 999;
  const maxAllowedDistance = clean.length <= 4 ? 1 : clean.length <= 8 ? 2 : 3;

  for (const p of COMMON_POKEMON_SPECIES) {
    const pClean = p.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dist = levenshtein(clean, pClean);
    if (dist < minDistance && dist <= maxAllowedDistance) {
      minDistance = dist;
      bestMatch = p;
    }
  }

  if (bestMatch) {
    return { name: bestMatch, corrected: true };
  }

  return null;
}
