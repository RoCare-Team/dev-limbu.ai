import { POPULAR_CITIES } from "@/utils/popularCity";

/**
 * Single source of truth for city <-> URL slug conversion.
 *
 * POPULAR_CITIES entries are free-form ("Sector 143, Noida", "Janjgir-champa",
 * "Margaon "), so the slug is lossy: commas, hyphens and stray whitespace all
 * collapse to a single "-". Rebuilding a display name from a slug and comparing
 * it back against the list therefore never matches for those entries, which is
 * what made them 404. Always validate on the slug, and take the display name
 * from the list instead of reconstructing it.
 */
export function cityToSlug(city = "") {
  return String(city)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// slug -> display name. First entry wins so duplicate slugs stay stable.
const CITY_BY_SLUG = (() => {
  const map = new Map();

  for (const city of POPULAR_CITIES) {
    const slug = cityToSlug(city);
    if (!slug || map.has(slug)) continue;

    const name = String(city).trim().replace(/\s+/g, " ");

    map.set(slug, name.charAt(0).toUpperCase() + name.slice(1));
  }

  return map;
})();

/** Display name for a slug, or null when the city is not in the list. */
export function findCityBySlug(slug = "") {
  return CITY_BY_SLUG.get(cityToSlug(slug)) ?? null;
}

/** Deduplicated slugs, for sitemap generation. */
export function getCitySlugs() {
  return [...CITY_BY_SLUG.keys()];
}
