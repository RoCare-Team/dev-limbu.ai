/**
 * Google Business Information API v1 — location resource actions.
 * @see https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations/patch
 *
 * Matches direct REST usage:
 * PATCH …/v1/locations/{LOCATION_ID}?updateMask=<mask>
 * GET  …/v1/locations/{LOCATION_ID}
 */

export const GMB_BUSINESS_INFORMATION_V1_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';

/** updateMask query values (one mask per PATCH call). */
export const LOCATION_UPDATE_MASKS = {
  title: 'title',
  /** Curl-style: ?updateMask=profile with body { profile: { description } } */
  profile: 'profile',
  /** Narrower alternative if you only want description touched explicitly */
  profileDescription: 'profile.description',
  phoneNumbers: 'phoneNumbers',
  websiteUri: 'websiteUri',
  storefrontAddress: 'storefrontAddress',
  latlng: 'latlng',
  serviceArea: 'serviceArea',
  regularHours: 'regularHours',
  specialHours: 'specialHours',
  serviceItems: 'serviceItems',
  categories: 'categories',
};

export function locationResourceUrl(locationId) {
  return `${GMB_BUSINESS_INFORMATION_V1_BASE}/locations/${encodeURIComponent(locationId)}`;
}

export function buildTitlePatchBody(title) {
  return { title: String(title || '').trim() };
}

export function buildProfileDescriptionPatchBody(description, maxLen = 750) {
  const d = String(description || '').trim().slice(0, maxLen);
  return { profile: { description: d } };
}

export function buildPhoneNumbersPatchBody(primaryPhone) {
  return { phoneNumbers: { primaryPhone: String(primaryPhone || '').trim() } };
}

export function buildWebsiteUriPatchBody(websiteUri) {
  return { websiteUri: String(websiteUri || '').trim() };
}

export function buildStorefrontAddressPatchBody(storefrontAddress) {
  return { storefrontAddress };
}

export function buildLatLngPatchBody(latitude, longitude) {
  return {
    latlng: {
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
  };
}

export function buildRegularHoursPatchBody(periods) {
  const p = Array.isArray(periods) ? periods : [];
  return { regularHours: { periods: p } };
}

/**
 * Build a specialHours PATCH body (updateMask=specialHours) from a list of dated
 * exceptions (e.g. India public holidays). Each item: { date: 'YYYY-MM-DD',
 * closed?: boolean (default true), openTime?: 'HH:MM', closeTime?: 'HH:MM' }.
 * Closed holidays only need startDate + closed:true. Google's specialHourPeriod uses
 * a Date { year, month, day }. Past-dated and malformed entries are dropped.
 */
export function buildSpecialHoursPatchBody(items, { minYear } = {}) {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const periods = [];
  for (const it of list) {
    const raw = String(it?.date || '').trim();
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
    if (!m) continue;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) continue;
    if (minYear && year < minYear) continue;
    const key = `${year}-${month}-${day}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const startDate = { year, month, day };
    const closed = it?.closed === false ? false : true; // holidays default to closed
    if (closed) {
      periods.push({ startDate, closed: true });
    } else {
      const parseHM = (s) => {
        const hm = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
        if (!hm) return null;
        return { hours: Number(hm[1]), minutes: Number(hm[2]) };
      };
      const openTime = parseHM(it.openTime) || { hours: 9, minutes: 0 };
      const closeTime = parseHM(it.closeTime) || { hours: 18, minutes: 0 };
      periods.push({ startDate, openTime, closeTime, closed: false });
    }
  }
  // Google caps special-hour periods; keep it sane.
  return { specialHours: { specialHourPeriods: periods.slice(0, 60) } };
}

/**
 * Build a serviceArea PATCH body. Google's PlaceInfo requires BOTH placeName AND a
 * Google placeId — a bare name is rejected — so this accepts resolved objects
 * { placeName, placeId } and drops any without a placeId. Max 20 places.
 */
export function buildServiceAreaPatchBody(placeInfos) {
  const infos = (Array.isArray(placeInfos) ? placeInfos : [])
    .map((p) => {
      if (p && typeof p === 'object') {
        const placeName = String(p.placeName || p.name || '').trim();
        const placeId = String(p.placeId || '').trim();
        return placeName && placeId ? { placeName, placeId } : null;
      }
      return null; // a bare string has no placeId — cannot be sent to Google
    })
    .filter(Boolean)
    .slice(0, 20);
  if (!infos.length) return null;
  return {
    serviceArea: {
      businessType: 'CUSTOMER_AND_BUSINESS_LOCATION',
      places: { placeInfos: infos },
    },
  };
}

/**
 * Build a `ServiceItem.price` (Money) from the UI price fields. The Business
 * Information API ServiceItem has a real top-level `price` (Money) — Free is a zero
 * amount, Fixed is the entered amount. "No price" omits the field. (The public API
 * has no "starts at / From" flag, so a From amount is stored as a plain price.)
 */
export function buildServiceMoney(priceType, price, currencyCode = 'INR') {
  const type = String(priceType || 'none').toLowerCase();
  if (type === 'none') return null;
  if (type === 'free') return { currencyCode, units: '0', nanos: 0 };
  const num = Number(String(price ?? '').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(num) || num < 0) return null;
  const units = Math.floor(num);
  const nanos = Math.round((num - units) * 1e9);
  return { currencyCode, units: String(units), nanos };
}

/**
 * Build a serviceItems PATCH body as free-form service items under the location's
 * primary category gcid. Accepts EITHER:
 *   - a comma-separated string / array of strings (titles only — legacy), or
 *   - an array of objects { title|displayName|label, description, priceType, price }
 *     so each service carries a title, an optional description AND a real price.
 * Verified format: { serviceItems: [{ price?: Money, freeFormServiceItem: {
 * category: 'gcid:...', label: { displayName, description?, languageCode } } }] } with
 * updateMask=serviceItems. `price` is Google's own service price field (Money).
 *
 * Each service may carry its OWN category (primary or one of the additional/sub
 * categories) via `s.category` — so services are grouped per category, exactly the
 * way Google models them. When an item has no category (or one not in
 * `opts.allowedGcids`), it falls back to `categoryGcid` (the primary). Pass the
 * location's full category set as `opts.allowedGcids` so an item can never be tagged
 * with a category the location doesn't actually have (Google rejects that).
 */
export function buildServiceItemsPatchBody(services, categoryGcid, opts = {}) {
  const normGcid = (n) => String(n || '').replace(/^categories\//, '').trim();
  const defaultGcid = normGcid(categoryGcid);
  const currencyCode = opts.currencyCode || 'INR';
  const allowed =
    Array.isArray(opts.allowedGcids) && opts.allowedGcids.length
      ? new Set(opts.allowedGcids.map(normGcid).filter(Boolean))
      : null;

  let list;
  if (Array.isArray(services)) {
    list = services.map((s) =>
      s && typeof s === 'object'
        ? {
            displayName: s.title || s.displayName || s.label || '',
            description: s.description || '',
            priceType: s.priceType || 'none',
            price: s.price,
            category: s.category || s.categoryGcid || '',
          }
        : { displayName: String(s || ''), description: '', priceType: 'none', price: '', category: '' }
    );
  } else {
    list = String(services || '')
      .split(',')
      .map((s) => ({ displayName: s, description: '', priceType: 'none', price: '', category: '' }));
  }

  const items = list
    .map((s) => {
      const cat = normGcid(s.category);
      const gcid = cat && (!allowed || allowed.has(cat)) ? cat : defaultGcid;
      return {
        displayName: String(s.displayName || '').trim(),
        description: String(s.description || '').trim(),
        priceType: s.priceType || 'none',
        price: s.price,
        gcid,
      };
    })
    .filter((s) => s.displayName && s.gcid)
    .slice(0, 100)
    .map((s) => {
      const item = {
        freeFormServiceItem: {
          // Google's v1 API wants the full resource name (`categories/gcid:...`) here —
          // the same convention as the categories PATCH. A bare `gcid:...` is silently
          // rejected, so services never get added.
          category: toCategoryResourceName(s.gcid),
          label: {
            displayName: s.displayName.slice(0, 140),
            ...(s.description ? { description: s.description.slice(0, 300) } : {}),
            languageCode: 'en',
          },
        },
      };
      const money = buildServiceMoney(s.priceType, s.price, currencyCode);
      if (money) item.price = money;
      return item;
    });

  return { serviceItems: items };
}

/**
 * Build a combined attributes PATCH body + attributeMask for the Business
 * Information v1 `locations/{id}/attributes` endpoint from a normalized list.
 *
 * items: [{ name, valueType, values }]
 *   URL           -> values: string | [string]   -> uriValues:[{ uri }]
 *   BOOL          -> values: boolean              -> values:[bool]
 *   ENUM          -> values: string               -> values:[string]
 *   REPEATED_ENUM -> values: string[]             -> repeatedEnumValue:{ setValues, unsetValues }
 *
 * `optionsByName` maps attribute name -> all option values, used to compute the
 * REPEATED_ENUM `unsetValues` complement so deselecting actually clears values.
 * The returned `attributeMask` lists exactly the attributes present in the body —
 * Google CLEARS anything that is in the mask but missing from the body.
 *
 * Returns null when nothing valid was produced.
 */
export function buildAttributesPatchBody(items, optionsByName = {}) {
  const list = Array.isArray(items) ? items : [];
  const attributes = [];

  for (const it of list) {
    const name = String(it?.name || '').trim();
    if (!name) continue;
    const valueType = String(it?.valueType || '').toUpperCase();
    const raw = it?.values;

    if (valueType === 'URL') {
      const uris = (Array.isArray(raw) ? raw : [raw])
        .map((u) => String(u || '').trim())
        .filter(Boolean);
      if (!uris.length) continue;
      attributes.push({ name, valueType, uriValues: uris.map((uri) => ({ uri })) });
    } else if (valueType === 'BOOL') {
      if (typeof raw !== 'boolean') continue;
      attributes.push({ name, valueType, values: [raw] });
    } else if (valueType === 'ENUM') {
      const v = String(raw == null ? '' : raw).trim();
      if (!v) continue;
      attributes.push({ name, valueType, values: [v] });
    } else if (valueType === 'REPEATED_ENUM') {
      const setValues = (Array.isArray(raw) ? raw : [raw])
        .map((v) => String(v || '').trim())
        .filter(Boolean);
      const allOptions = Array.isArray(optionsByName[name]) ? optionsByName[name] : [];
      const unsetValues = allOptions.filter((o) => !setValues.includes(o));
      attributes.push({ name, valueType, repeatedEnumValue: { setValues, unsetValues } });
    } else {
      // Unknown type — skip rather than send something Google rejects.
      continue;
    }
  }

  if (!attributes.length) return null;
  return {
    attributeMask: attributes.map((a) => a.name).join(','),
    body: { attributes },
  };
}

/**
 * Normalize a Google category id to the bare `gcid:...` form the categories PATCH
 * body expects (the location resource sometimes returns `categories/gcid:...`).
 */
export function normalizeCategoryGcid(name) {
  return String(name || '')
    .trim()
    .replace(/^categories\//, '');
}

/**
 * Google's Business Information API v1 requires the `Category.name` field to be the
 * FULL resource name (`categories/gcid:...`) when writing. Internally we carry the
 * bare `gcid:...` form, so re-add the prefix right before building the PATCH body —
 * otherwise Google rejects the categories update and sub-categories never save.
 */
export function toCategoryResourceName(gcid) {
  const bare = normalizeCategoryGcid(gcid);
  return bare ? `categories/${bare}` : '';
}

/**
 * Build a `categories` PATCH body (updateMask=categories) from a primary category
 * gcid + optional list of additional (sub) category gcids. Google requires the
 * primary category; additional categories are capped at 9 per the API.
 * Shape: { categories: { primaryCategory: { name }, additionalCategories: [{ name }] } }
 */
export function buildCategoriesPatchBody(primaryGcid, additionalGcids = []) {
  const primary = normalizeCategoryGcid(primaryGcid);
  if (!primary) return null;
  const additional = (Array.isArray(additionalGcids) ? additionalGcids : [])
    .map(normalizeCategoryGcid)
    .filter((g) => g && g !== primary);
  // De-dupe while preserving order; Google allows up to 9 additional categories.
  const seen = new Set();
  const uniqueAdditional = [];
  for (const g of additional) {
    if (seen.has(g)) continue;
    seen.add(g);
    uniqueAdditional.push(g);
  }
  // Google requires the full resource name (`categories/gcid:...`) on writes.
  const categories = { primaryCategory: { name: toCategoryResourceName(primary) } };
  if (uniqueAdditional.length) {
    categories.additionalCategories = uniqueAdditional
      .slice(0, 9)
      .map((name) => ({ name: toCategoryResourceName(name) }));
  } else {
    // Send an empty array so removing all sub-categories actually clears them.
    categories.additionalCategories = [];
  }
  return { categories };
}

export function parseServiceAreaFromText(text) {
  const parts = String(text || '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  return {
    businessType: 'CUSTOMER_AND_BUSINESS_LOCATION',
    places: { placeInfos: parts.map((placeName) => ({ placeName })) },
  };
}
