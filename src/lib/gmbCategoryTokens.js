/**
 * Shared tokenizer for Google Business category display names. Used both by the
 * sync script (to store searchable tokens on each category) and by the
 * categories-search API (to rank name-similarity suggestions). Keeping the logic in
 * one place ensures the tokens stored in Mongo match the tokens queried at runtime.
 */

// Generic words that carry no category meaning — dropped so "Water Purification
// Company" and "Water Filter Supplier" still overlap on the meaningful tokens.
const STOP_WORDS = new Set([
  'company', 'store', 'shop', 'service', 'services', 'repair', 'repairs',
  'center', 'centre', 'dealer', 'dealers', 'supplier', 'suppliers',
  'manufacturer', 'manufacturers', 'contractor', 'contractors', 'agency',
  'agencies', 'provider', 'providers', 'consultant', 'consultants', 'firm',
  'and', 'the', 'of', 'in', 'for', 'or', 'a', 'an', 'to', 'with',
]);

/**
 * Lowercase, split on non-alphanumerics, drop stop-words + very short tokens, and
 * de-duplicate. Returns a stable array of meaningful tokens for a category name.
 */
export function categoryTokens(displayName) {
  const words = String(displayName || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && w.length >= 3 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

/**
 * Similarity score between two token arrays: number of shared tokens weighted by
 * Jaccard overlap so short, highly-overlapping names rank above long partial ones.
 */
export function tokenSimilarity(aTokens, bTokens) {
  const a = new Set(aTokens || []);
  const b = new Set(bTokens || []);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  if (!shared) return 0;
  const union = a.size + b.size - shared;
  return shared + shared / union; // shared count + Jaccard tie-breaker
}
