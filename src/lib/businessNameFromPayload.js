/**
 * Pick first non-empty business / location title from GMB-shaped location objects.
 * @param {unknown[]} locs
 * @returns {string}
 */
export function firstBusinessNameFromLocations(locs) {
  if (!Array.isArray(locs) || locs.length === 0) return "";
  for (const loc of locs) {
    if (!loc || typeof loc !== "object") continue;
    const candidates = [
      loc.name,
      loc.title,
      loc.locationName,
      loc.displayName,
      loc.businessName,
      loc.storefrontAddress?.businessName,
    ];
    for (const c of candidates) {
      const s = c != null ? String(c).trim() : "";
      if (s && !/^location\s+\d+$/i.test(s)) return s;
    }
  }
  return "";
}

/**
 * Resolve business name for AI / n8n: PostInput value → GMB project → title → locations → prompt line.
 */
export function resolveBusinessNameForGeneration({
  fromInput = "",
  selectedBusinessName = "",
  bussinessTitle = "",
  availableLocations = [],
  prompt = "",
}) {
  const input = typeof fromInput === "string" ? fromInput.trim() : "";
  const gmb = selectedBusinessName ? String(selectedBusinessName).trim() : "";
  const title = bussinessTitle ? String(bussinessTitle).trim() : "";
  const fromLoc = firstBusinessNameFromLocations(availableLocations);
  const promptHead =
    typeof prompt === "string" && prompt.trim()
      ? prompt.trim().split(/\r?\n/)[0].trim().slice(0, 200)
      : "";
  return input || gmb || title || fromLoc || promptHead;
}
