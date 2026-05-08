/**
 * Shared Magic QR review URL + slug logic — used by:
 *   - useMagicQR (client, manual + chatbot UI)
 *   - chatbotActionHandlers.handleMagicQr (server)
 *
 * Location rows may come from localStorage `locationDetails` (short `locationId`)
 * or GMB session `locationsData` (`locationResourceName` full resource name).
 */

import { generateUniversalSlug } from "@/utils/slugify";

export function getMagicQrLocationIdentifier(location) {
  if (!location) return "";
  return (
    location.locationId ||
    location.locationResourceName ||
    location.name ||
    ""
  ).toString();
}

export function buildUniqueMagicQrReviewSlug(location, locations) {
  if (!location) return "";
  const baseSlug = generateUniversalSlug(location);
  if (!baseSlug) return "";
  const currentId = getMagicQrLocationIdentifier(location);
  const conflict = (locations || []).some((loc) => {
    const locId = getMagicQrLocationIdentifier(loc);
    if (!loc || !locId || locId === currentId) return false;
    return generateUniversalSlug(loc) === baseSlug;
  });
  if (!conflict) return baseSlug;
  return `${baseSlug}-${currentId.substring(0, 5)}`;
}

/**
 * @param {{ location: object, allLocations?: object[], baseUrl: string }} opts
 */
export function buildMagicQrReviewUrl({ location, allLocations = [], baseUrl }) {
  const slug = buildUniqueMagicQrReviewSlug(location, allLocations);
  const base = (baseUrl || "").replace(/\/$/, "");
  if (!slug || !base) return "";
  return `${base}/reviews/${slug}`;
}

/** Canonical public origin for review links when `window` is unavailable (e.g. chatbot worker). */
export function resolveMagicQrBaseUrlForServer() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.limbu.ai";
  return raw.replace(/\/$/, "");
}
