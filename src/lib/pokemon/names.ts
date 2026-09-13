/**
 * Pokémon Species Fuzzy Matching and Meta Presets
 */

export interface MetaPokemon {
  name: string;
  emoji: string;
}

export const TOP_SNIPED_POKEMON: MetaPokemon[] = [
  { name: 'Swampert', emoji: '💧' },
  { name: 'Lucario', emoji: '🥋' },
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

export const COMMON_POKEMON_SPECIES: string[] = [
  'Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon', 'Charizard',
  'Squirtle', 'Wartortle', 'Blastoise', 'Caterpie', 'Metapod', 'Butterfree',
  'Weedle', 'Kakuna', 'Beedrill', 'Pidgey', 'Pidgeotto', 'Pidgeot',
  'Rattata', 'Raticate', 'Spearow', 'Fearow', 'Ekans', 'Arbok',
  'Pikachu', 'Raichu', 'Sandshrew', 'Sandslash', 'Nidoran', 'Nidorina',
  'Nidoqueen', 'Nidorino', 'Nidoking', 'Clefairy', 'Clefable', 'Vulpix',
  'Ninetales', 'Jigglypuff', 'Wigglytuff', 'Zubat', 'Golbat', 'Oddish',
  'Gloom', 'Vileplume', 'Paras', 'Parasect', 'Venonat', 'Venomoth',
  'Diglett', 'Dugtrio', 'Meowth', 'Persian', 'Psyduck', 'Golduck',
  'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Poliwag', 'Poliwhirl',
  'Poliwrath', 'Abra', 'Kadabra', 'Alakazam', 'Machop', 'Machoke',
  'Machamp', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Tentacool', 'Tentacruel',
  'Geodude', 'Graveler', 'Golem', 'Ponyta', 'Rapidash', 'Slowpoke',
  'Slowbro', 'Magnemite', 'Magneton', 'Farfetchd', 'Doduo', 'Dodrio',
  'Seel', 'Dewgong', 'Grimer', 'Muk', 'Shellder', 'Cloyster',
  'Gastly', 'Haunter', 'Gengar', 'Onix', 'Drowzee', 'Hypno',
  'Krabby', 'Kingler', 'Voltorb', 'Electrode', 'Exeggcute', 'Exeggutor',
  'Cubone', 'Marowak', 'Hitmonlee', 'Hitmonchan', 'Lickitung', 'Koffing',
  'Weezing', 'Rhyhorn', 'Rhydon', 'Chansey', 'Tangela', 'Kangaskhan',
  'Horsea', 'Seadra', 'Goldeen', 'Seaking', 'Staryu', 'Starmie',
  'Mr Mime', 'Scyther', 'Jynx', 'Electabuzz', 'Magmar', 'Pinsir',
  'Tauros', 'Magikarp', 'Gyarados', 'Lapras', 'Ditto', 'Eevee',
  'Vaporeon', 'Jolteon', 'Flareon', 'Porygon', 'Omanyte', 'Omastar',
  'Kabuto', 'Kabutops', 'Aerodactyl', 'Snorlax', 'Articuno', 'Zapdos',
  'Moltres', 'Dratini', 'Dragonair', 'Dragonite', 'Mewtwo', 'Mew',
  // Gen 2
  'Chikorita', 'Bayleef', 'Meganium', 'Cyndaquil', 'Quilava', 'Typhlosion',
  'Totodile', 'Croconaw', 'Feraligatr', 'Sentret', 'Furret', 'Hoothoot',
  'Noctowl', 'Ledyba', 'Ledian', 'Spinarak', 'Ariados', 'Crobat',
  'Chinchou', 'Lanturn', 'Pichu', 'Cleffa', 'Igglybuff', 'Togepi',
  'Togetic', 'Natu', 'Xatu', 'Mareep', 'Flaaffy', 'Ampharos',
  'Bellossom', 'Marill', 'Azumarill', 'Sudowoodo', 'Politoed', 'Hoppip',
  'Skiploom', 'Jumpluff', 'Aipom', 'Sunkern', 'Sunflora', 'Yanma',
  'Wooper', 'Quagsire', 'Espeon', 'Umbreon', 'Murkrow', 'Slowking',
  'Misdreavus', 'Unown', 'Wobbuffet', 'Girafarig', 'Pineco', 'Forretress',
  'Dunsparce', 'Gligar', 'Steelix', 'Snubbull', 'Granbull', 'Qwilfish',
  'Scizor', 'Shuckle', 'Heracross', 'Sneasel', 'Teddiursa', 'Ursaring',
  'Slugma', 'Magcargo', 'Swinub', 'Piloswine', 'Corsola', 'Remoraid',
  'Octillery', 'Delibird', 'Mantine', 'Skarmory', 'Houndour', 'Houndoom',
  'Kingdra', 'Phanpy', 'Donphan', 'Porygon2', 'Stantler', 'Smeargle',
  'Tyrogue', 'Hitmontop', 'Smoochum', 'Elekid', 'Magby', 'Miltank',
  'Blissey', 'Raikou', 'Entei', 'Suicune', 'Larvitar', 'Pupitar',
  'Tyranitar', 'Lugia', 'Ho-Oh', 'Celebi',
  // Gen 3
  'Treecko', 'Grovyle', 'Sceptile', 'Torchic', 'Combusken', 'Blaziken',
  'Mudkip', 'Marshtomp', 'Swampert', 'Poochyena', 'Mightyena', 'Zigzagoon',
  'Linoone', 'Wurmple', 'Silcoon', 'Beautifly', 'Cascoon', 'Dustox',
  'Lotad', 'Lombre', 'Ludicolo', 'Seedot', 'Nuzleaf', 'Shiftry',
  'Taillow', 'Swellow', 'Wingull', 'Pelipper', 'Ralts', 'Kirlia',
  'Gardevoir', 'Surskit', 'Masquerain', 'Shroomish', 'Breloom', 'Slakoth',
  'Vigoroth', 'Slaking', 'Nincada', 'Ninjask', 'Shedinja', 'Whismur',
  'Loudred', 'Exploud', 'Makuhita', 'Hariyama', 'Azurill', 'Nosepass',
  'Skitty', 'Delcatty', 'Sableye', 'Mawile', 'Aron', 'Lairon',
  'Aggron', 'Meditite', 'Medicham', 'Electrike', 'Manectric', 'Plusle',
  'Minun', 'Volbeat', 'Illumise', 'Roselia', 'Gulpin', 'Swalot',
  'Carvanha', 'Sharpedo', 'Wailmer', 'Wailord', 'Numel', 'Camerupt',
  'Torkoal', 'Spoink', 'Grumpig', 'Spinda', 'Trapinch', 'Vibrava',
  'Flygon', 'Cacnea', 'Cacturne', 'Swablu', 'Altaria', 'Zangoose',
  'Seviper', 'Lunatone', 'Solrock', 'Barboach', 'Whiscash', 'Corphish',
  'Crawdaunt', 'Baltoy', 'Claydol', 'Lileep', 'Cradily', 'Anorith',
  'Armaldo', 'Feebas', 'Milotic', 'Castform', 'Kecleon', 'Shuppet',
  'Banette', 'Duskull', 'Dusclops', 'Tropius', 'Chimecho', 'Absol',
  'Wynaut', 'Snorunt', 'Glalie', 'Spheal', 'Sealeo', 'Walrein',
  'Clamperl', 'Huntail', 'Gorebyss', 'Relicanth', 'Luvdisc', 'Bagon',
  'Shelgon', 'Salamence', 'Beldum', 'Metang', 'Metagross', 'Regirock',
  'Regice', 'Registeel', 'Latias', 'Latios', 'Kyogre', 'Groudon',
  'Rayquaza', 'Jirachi', 'Deoxys',
  // Gen 4
  'Turtwig', 'Grotle', 'Torterra', 'Chimchar', 'Monferno', 'Infernape',
  'Piplup', 'Prinplup', 'Empoleon', 'Starly', 'Staravia', 'Staraptor',
  'Bidoof', 'Bibarel', 'Kricketot', 'Kricketune', 'Shinx', 'Luxio',
  'Luxray', 'Budew', 'Roserade', 'Cranidos', 'Rampardos', 'Shieldon',
  'Bastiodon', 'Burmy', 'Wormadam', 'Mothim', 'Combee', 'Vespiquen',
  'Pachirisu', 'Buizel', 'Floatzel', 'Cherubi', 'Cherrim', 'Shellos',
  'Gastrodon', 'Ambipom', 'Drifloon', 'Drifblim', 'Buneary', 'Lopunny',
  'Mismagius', 'Honchkrow', 'Glameow', 'Purugly', 'Chingling', 'Stunky',
  'Skuntank', 'Bronzor', 'Bronzong', 'Bonsly', 'Mime Jr', 'Happiny',
  'Chatot', 'Spiritomb', 'Gible', 'Gabite', 'Garchomp', 'Munchlax',
  'Riolu', 'Lucario', 'Hippopotas', 'Hippowdon', 'Skorupi', 'Drapion',
  'Croagunk', 'Toxicroak', 'Carnivine', 'Finneon', 'Lumineon', 'Mantyke',
  'Snover', 'Abomasnow', 'Weavile', 'Magnezone', 'Lickilicky', 'Rhyperior',
  'Tangrowth', 'Electivire', 'Magmortar', 'Togekiss', 'Yanmega', 'Leafeon',
  'Glaceon', 'Gliscor', 'Mamoswine', 'Porygon-Z', 'Gallade', 'Probopass',
  'Dusknoir', 'Froslass', 'Rotom', 'Uxie', 'Mesprit', 'Azelf',
  'Dialga', 'Palkia', 'Heatran', 'Regigigas', 'Giratina', 'Cresselia',
  'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus',
];

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
  const maxAllowedDistance = clean.length <= 5 ? 1 : 2;

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
  const maxAllowedDistance = clean.length <= 4 ? 1 : 2;

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
