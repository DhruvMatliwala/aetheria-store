import { IntentLevel } from '../types';

export interface FilterResult {
  isMatch: boolean;
  intentLevel: IntentLevel;
  matchedKeywords: string[];
}

export function evaluateBuyerIntent(
  text: string,
  highIntentKeywords: string[],
  generalKeywords: string[],
  excludeKeywords: string[]
): FilterResult {
  const lower = text.toLowerCase();

  // 1. Check exclude list (e.g. "ban wave", "patch notes", "virus")
  for (const excluded of excludeKeywords) {
    if (lower.includes(excluded.toLowerCase())) {
      return { isMatch: false, intentLevel: 'WARM', matchedKeywords: [] };
    }
  }

  // 2. Base sanity: Must relate to PGSharp or spoofing keys
  const hasPgsharpMention =
    lower.includes('pgsharp') ||
    lower.includes('pg sharp') ||
    lower.includes('pogo spoof') ||
    (lower.includes('standard') && lower.includes('key'));

  if (!hasPgsharpMention) {
    return { isMatch: false, intentLevel: 'WARM', matchedKeywords: [] };
  }

  // 3. Smart buyer phrases that strongly indicate someone wants to buy/get a key
  const hotPhrases = [
    'need key',
    'need a key',
    'want key',
    'want a key',
    'buy key',
    'buying key',
    'buy pgsharp',
    'buying pgsharp',
    'sell key',
    'selling key',
    'spare key',
    'spare slot',
    'spare code',
    'extra key',
    'extra slot',
    'who sells',
    'anyone selling',
    'anyone have a key',
    'anyone got a key',
    'has anyone got a key',
    'where to buy',
    'how to buy',
    'where to get key',
    'how to get a key',
    'looking for key',
    'looking for a key',
    'share key',
    'share slot',
    'split key',
    'split slot',
    'split standard',
    'share standard',
    '1 slot',
    'one slot',
    'second slot',
    '2nd slot',
    'have 1 slot',
    'standard edition key',
    'pgsharp standard key',
    'need standard',
    'want standard',
    'buy standard',
    'can anyone give me a key',
    'can anyone share',
    'payment failed',
    'payment declined',
    'card declined',
    'payment error',
    'cant pay',
    'cannot pay',
    'cannot buy key',
    'cant buy key',
    'beli key',
    'comprar key',
  ];

  const matchedPhrases: string[] = [];
  for (const phrase of hotPhrases) {
    if (lower.includes(phrase)) {
      matchedPhrases.push(phrase);
    }
  }

  // Pair matching: (buyer intent verb) + (key / slot noun)
  const buyerVerbs = [
    'need',
    'want',
    'buy',
    'buying',
    'purchase',
    'looking for',
    'searching for',
    'spare',
    'split',
    'share',
    'anyone have',
    'anyone got',
    'who sells',
    'anyone selling',
    'declined',
    'failed',
  ];
  const keyNouns = ['key', 'keys', 'slot', 'slots', 'code', 'standard', 'license', 'activation'];

  let hasVerb = false;
  let hasNoun = false;
  const verbMatches: string[] = [];

  for (const v of buyerVerbs) {
    if (new RegExp(`\\b${v}\\b`, 'i').test(lower)) {
      hasVerb = true;
      verbMatches.push(v);
    }
  }

  for (const n of keyNouns) {
    if (new RegExp(`\\b${n}\\b`, 'i').test(lower)) {
      hasNoun = true;
    }
  }

  // If matched explicit phrase OR strong buyer verb + key noun
  if (matchedPhrases.length > 0 || (hasVerb && hasNoun)) {
    const combined = Array.from(new Set([...matchedPhrases, ...verbMatches]));
    return {
      isMatch: true,
      intentLevel: 'HOT',
      matchedKeywords: combined.length > 0 ? combined : ['buyer intent'],
    };
  }

  // General questions about keys (WARM)
  const generalKeyTerms = ['pgsharp key', 'activation key', 'license key', 'standard key'];
  const matchedGeneral: string[] = [];
  for (const term of generalKeyTerms) {
    if (lower.includes(term)) {
      matchedGeneral.push(term);
    }
  }

  if (matchedGeneral.length > 0) {
    return {
      isMatch: true,
      intentLevel: 'WARM',
      matchedKeywords: matchedGeneral,
    };
  }

  return { isMatch: false, intentLevel: 'WARM', matchedKeywords: [] };
}
