/**
 * Google Business Information v1 — category attribute metadata helpers.
 *
 * Different business categories expose different editable attributes (a restaurant
 * gets a menu link + dine-in/serves-breakfast flags; a service business gets none of
 * those). This module fetches the attribute METADATA available for a location's
 * primary category from Google's `attributes.list`, and exposes a name set used to
 * GATE attribute writes (so we never PATCH an attribute the category doesn't support
 * — the cause of the old blanket `attributes/url_whatsapp` "invalid argument" failures).
 *
 * @see https://developers.google.com/my-business/reference/businessinformation/rest/v1/attributes/list
 */

import { GMB_BUSINESS_INFORMATION_V1_BASE } from '@/lib/gmbLocationApiActions';

const GMB_BASE = GMB_BUSINESS_INFORMATION_V1_BASE;

// Attribute metadata is category-level (identical for every location of the same
// category + region + language), so it is safe to share across users. Cache it in
// memory to avoid hitting attributes.list on every location switch.
// Scale-up note: for multi-instance serverless, replace with a Mongo TTL model.
const META_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const metaCache = new Map(); // key -> { data, expiresAt }

const cacheKey = (gcid, regionCode, languageCode) =>
  `${gcid}|${regionCode}|${languageCode}`;

// Parse Google money → { priceType, price } for the services editor.
function parseServiceMoney(money) {
  if (!money || typeof money !== 'object') return { priceType: 'none', price: '' };
  const units = money.units != null ? Number(money.units) : NaN;
  if (Number.isFinite(units)) {
    if (units === 0) return { priceType: 'free', price: '' };
    return { priceType: 'fixed', price: String(units) };
  }
  return { priceType: 'none', price: '' };
}

// Google's own structuredServiceItem entries carry no displayName — only a raw
// serviceTypeId like "job_type_id:banners". Turn it into a readable label instead of
// leaking the raw id into the UI, e.g. "job_type_id:photo_printing" -> "Photo Printing".
function prettifyServiceTypeId(serviceTypeId) {
  const raw = String(serviceTypeId || '').trim();
  if (!raw) return '';
  const tail = raw.includes(':') ? raw.split(':').pop() : raw;
  return tail
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Parse raw GMB serviceItems[] → [{ title, description, priceType, price, category }],
// preserving each service's sub-category so the editor keeps the right grouping.
function parseServiceItemsList(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      const label = it?.freeFormServiceItem?.label;
      const title = String(
        label?.displayName || prettifyServiceTypeId(it?.structuredServiceItem?.serviceTypeId) || ''
      ).trim();
      const description = String(label?.description || it?.structuredServiceItem?.description || '').trim();
      const { priceType, price } = parseServiceMoney(it?.price);
      const category = String(
        it?.freeFormServiceItem?.category || it?.structuredServiceItem?.category || ''
      )
        .replace(/^categories\//, '')
        .trim();
      return title ? { title, description, priceType, price, category } : null;
    })
    .filter(Boolean);
}

async function gmbGet(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Google API ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Resolve the location's primary category gcid + region/language. The category name
 * comes back as `categories/gcid:restaurant` — kept in full form because the
 * attributes.list `categoryName` param expects exactly that.
 */
export async function resolveLocationCategory(accessToken, locationId, opts = {}) {
  // Single-location GET reliably returns profile.description AND serviceItems (the list
  // endpoint often omits both), so fetch them here and surface them for the editor.
  const url = `${GMB_BASE}/locations/${encodeURIComponent(
    locationId
  )}?readMask=categories,storefrontAddress,metadata,profile,serviceItems,serviceArea,regularHours,specialHours`;
  const loc = await gmbGet(url, accessToken);
  const profileDescription = typeof loc?.profile?.description === 'string' ? loc.profile.description : '';
  const serviceItemsList = parseServiceItemsList(loc?.serviceItems);
  // Current service-area places (Google returns { placeName, placeId } per area).
  const serviceAreaPlaces = Array.isArray(loc?.serviceArea?.places?.placeInfos)
    ? loc.serviceArea.places.placeInfos.map((p) => String(p?.placeName || '').trim()).filter(Boolean)
    : [];
  // Current opening hours periods (openDay/openTime/closeDay/closeTime).
  const regularHoursPeriods = Array.isArray(loc?.regularHours?.periods) ? loc.regularHours.periods : [];
  // Current special-hours (holiday closures / exceptions) so saved holidays reload.
  const specialHourPeriods = Array.isArray(loc?.specialHours?.specialHourPeriods)
    ? loc.specialHours.specialHourPeriods
    : [];
  const categoryName = loc?.categories?.primaryCategory?.name || '';
  const primaryCategory = loc?.categories?.primaryCategory?.displayName || '';
  // Current additional (sub) categories, kept as { name (gcid), displayName } so the
  // UI can render + re-send them when the user edits the category set.
  const additionalCategories = Array.isArray(loc?.categories?.additionalCategories)
    ? loc.categories.additionalCategories
        .map((c) => ({
          name: String(c?.name || '').replace(/^categories\//, ''),
          displayName: String(c?.displayName || '').trim(),
        }))
        .filter((c) => c.name)
    : [];
  const regionCode =
    (opts.regionCode && String(opts.regionCode).trim()) ||
    loc?.storefrontAddress?.regionCode ||
    'US';
  const languageCode = (opts.languageCode && String(opts.languageCode).trim()) || 'en';
  // Location metadata exposes which optional modules this profile supports — the
  // "capability detector" that drives which editors appear (Menu, etc.).
  const md = loc?.metadata || {};
  const capabilities = {
    canHaveFoodMenus: md.canHaveFoodMenus === true,
    canModifyServiceList: md.canModifyServiceList === true,
    canHaveBusinessCalls: md.canHaveBusinessCalls === true,
    canOperateHealthData: md.canOperateHealthData === true,
  };
  return {
    categoryName,
    primaryCategory,
    primaryCategoryName: String(categoryName || '').replace(/^categories\//, ''),
    additionalCategories,
    regionCode,
    languageCode,
    capabilities,
    profileDescription,
    serviceItemsList,
    serviceAreaPlaces,
    regularHoursPeriods,
    specialHourPeriods,
  };
}

/**
 * List attribute METADATA available for a category + region + language.
 * Returns the raw attributeMetadata[] entries (parent, valueType, displayName,
 * groupDisplayName, repeatable, valueMetadata[]). Cached in memory.
 */
export async function listCategoryAttributeMetadata(
  accessToken,
  { categoryName, regionCode, languageCode },
  { refresh = false } = {}
) {
  const gcid = String(categoryName || '').replace(/^categories\//, '');
  if (!gcid) return [];

  const key = cacheKey(gcid, regionCode, languageCode);
  if (!refresh) {
    const hit = metaCache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.data;
    }
  }

  const all = [];
  let pageToken = '';
  do {
    const url = new URL(`${GMB_BASE}/attributes`);
    url.searchParams.set('categoryName', `categories/${gcid}`);
    url.searchParams.set('regionCode', regionCode);
    url.searchParams.set('languageCode', languageCode);
    url.searchParams.set('showAll', 'false');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await gmbGet(url.toString(), accessToken);
    if (Array.isArray(data.attributeMetadata) && data.attributeMetadata.length) {
      all.push(...data.attributeMetadata);
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  const cleaned = all.filter((m) => m && m.parent && !m.deprecated);
  metaCache.set(key, { data: cleaned, expiresAt: Date.now() + META_TTL_MS });
  return cleaned;
}

/**
 * Convenience: resolve the category for a location, then return its attribute
 * metadata. Returns { categoryName, primaryCategory, regionCode, languageCode,
 * metadata } so callers don't repeat the location read.
 */
export async function listCategoryAttributes(accessToken, locationId, opts = {}) {
  const cat = await resolveLocationCategory(accessToken, locationId, opts);
  if (!cat.categoryName) {
    return { ...cat, metadata: [] };
  }
  const metadata = await listCategoryAttributeMetadata(accessToken, cat, {
    refresh: opts.refresh,
  });
  return { ...cat, metadata };
}

/**
 * Set of attribute names (e.g. "attributes/url_menu") available for the location's
 * category. Used to gate writes so we never PATCH an unsupported attribute.
 */
export async function listCategoryAttributeNames(accessToken, locationId, opts = {}) {
  const { metadata } = await listCategoryAttributes(accessToken, locationId, opts);
  return new Set(metadata.map((m) => m.parent).filter(Boolean));
}
