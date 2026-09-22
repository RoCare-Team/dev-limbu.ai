import { cityToSlug, findCityBySlug } from "@/utils/citySlug";

/**
 * City landing pages — one source of truth for their URL, category and meta
 * keywords. Used by the page metadata (so Google sees the keywords) and by
 * /api/state-pages (so backlinks point at the exact canonical URL with the same
 * keywords). Keep the two in sync by changing things only here.
 */

// Canonical host the pages declare — backlinks must point here.
export const SEO_SITE_URL = "https://www.limbu.ai";

export const GBP_CITY_PREFIX = "google-bussiness-profile-management-";
export const LOCAL_SEO_CITY_PREFIX = "local-seo-";
export const FRANCHISE_CITY_PREFIX = "franchise-opportunities-";

const FRANCHISE_GENERIC_KEYWORDS = [
  "AI franchise business",
  "franchise opportunities",
  "Google Business Profile services",
  "local SEO franchise",
  "GMB management franchise",
  "AI marketing franchise",
  "business automation franchise",
  "review management services",
  "digital marketing franchise India",
  "Limbu.ai franchise",
];

export const CITY_PAGE_CATEGORIES = [
  {
    category: "google-business-profile-management",
    path: (slug) => `/services/${GBP_CITY_PREFIX}${slug}`,
    keywords: (city) => [
      `Google Business Profile management ${city}`,
      `GMB management services ${city}`,
      `Google My Business optimization ${city}`,
      `GMB agency in ${city}`,
      `Google Maps ranking ${city}`,
      `local SEO ${city}`,
      `Google review management ${city}`,
      "Google Business Profile services",
    ],
  },
  {
    category: "local-seo",
    path: (slug) => `/services/${LOCAL_SEO_CITY_PREFIX}${slug}`,
    keywords: (city) => [
      `local SEO services ${city}`,
      `local SEO company in ${city}`,
      `Google Maps SEO ${city}`,
      `local business SEO ${city}`,
      `Google Business Profile optimization ${city}`,
      `local search ranking ${city}`,
      `near me SEO ${city}`,
    ],
  },
  {
    category: "franchise-opportunities",
    path: (slug) => `/bussiness/${FRANCHISE_CITY_PREFIX}${slug}`,
    keywords: (city) => [
      `franchise opportunities in ${city}`,
      `business franchise ${city}`,
      `AI franchise business ${city}`,
      `digital marketing franchise ${city}`,
      ...FRANCHISE_GENERIC_KEYWORDS,
    ],
  },
];

const BY_CATEGORY = new Map(CITY_PAGE_CATEGORIES.map((c) => [c.category, c]));

/** Keywords for a city page; the national franchise page (no city) keeps the generic list. */
export function getCityPageKeywords(category, cityName) {
  if (category === "franchise-opportunities" && !cityName) return FRANCHISE_GENERIC_KEYWORDS;
  const entry = BY_CATEGORY.get(category);
  return entry && cityName ? entry.keywords(cityName) : [];
}

/** Absolute canonical URL of a city page. */
export function getCityPageUrl(category, citySlug) {
  const entry = BY_CATEGORY.get(category);
  return entry ? `${SEO_SITE_URL}${entry.path(cityToSlug(citySlug))}` : null;
}

/** "Asansol", "asansol" or "sector-143-noida" → { slug, name }, or null when not a known city. */
export function resolveSeoCity(input = "") {
  const slug = cityToSlug(input);
  const name = findCityBySlug(slug);
  return name ? { slug, name } : null;
}
