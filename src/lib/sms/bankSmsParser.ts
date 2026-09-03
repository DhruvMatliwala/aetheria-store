/**
 * Robust regex parser for Indian Bank Credit SMS messages (SBI, HDFC, ICICI, Axis, Paytm, PhonePe, etc.)
 * Standardizes extraction of 12-digit NPCI UPI Reference Numbers (UTR) and credited amount.
 */

export interface ParsedBankSms {
  utr: string | null;
  amount: number | null; // in Rupees
  rawText: string;
}

export function parseBankSms(text: string): ParsedBankSms {
  if (!text) {
    return { utr: null, amount: null, rawText: '' };
  }

  const cleanText = text.trim();

  // ── 1. Extract 12-digit UTR ────────────────────────────────────────────────
  // Look for keywords: UPI/, UTR, Ref No, RRN, Txn, Txn ID, etc.
  const utrKeywordMatch = cleanText.match(
    /(?:UPI[\/:_\s-]*|ref(?:\.|\s*no)?[:\s/_-]*|utr[:\s/_-]*|rrn[:\s/_-]*|txn(?:\s*id)?[:\s/_-]*|credited\s+by\s+UPI\s+ref[:\s/_-]*)(\d{12})\b/i
  );

  let utr: string | null = utrKeywordMatch ? utrKeywordMatch[1] : null;

  // Fallback: look for any standalone 12-digit numeric sequence (NPCI UPI standard)
  if (!utr) {
    const standaloneMatches = cleanText.match(/\b\d{12}\b/g);
    if (standaloneMatches && standaloneMatches.length > 0) {
      utr = standaloneMatches[0];
    }
  }

  // ── 2. Extract Credited Amount in Rupees ─────────────────────────────────────
  // Prioritize explicitly credited amounts (e.g., "Credited for Rs.180.14", "credited with INR 180", "Rs 180.14 credited")
  // to avoid accidentally matching account balance (e.g., "Bal: Rs.12,500.00").
  const creditSpecificMatch =
    cleanText.match(/(?:credited(?:\s+by|\s+with|\s+for)?|received|credit)\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    cleanText.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:has been\s*)?credited/i);

  const generalAmountMatch = cleanText.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const amountMatch = creditSpecificMatch || generalAmountMatch;

  let amount: number | null = null;
  if (amountMatch) {
    const num = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (!isNaN(num)) {
      amount = num;
    }
  }

  return {
    utr,
    amount,
    rawText: cleanText,
  };
}
