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
  serviceItems: 'serviceItems',
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

export function buildServiceAreaPatchBody(placeNames) {
  const names = Array.isArray(placeNames)
    ? placeNames.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (!names.length) return null;
  return {
    serviceArea: {
      businessType: 'CUSTOMER_AND_BUSINESS_LOCATION',
      places: { placeInfos: names.map((placeName) => ({ placeName })) },
    },
  };
}

/**
 * Build a serviceItems PATCH body as free-form service items under the location's
 * primary category gcid. Accepts EITHER:
 *   - a comma-separated string / array of strings (titles only — legacy), or
 *   - an array of objects { title|displayName|label, description } so each service
 *     carries a title AND an optional description.
 * Verified format: { serviceItems: [{ freeFormServiceItem: { category: 'gcid:...',
 * label: { displayName, description?, languageCode } } }] } with updateMask=serviceItems.
 * Google's free-form serviceItem label supports an optional `description`.
 */
export function buildServiceItemsPatchBody(services, categoryGcid) {
  const gcid = String(categoryGcid || '').replace(/^categories\//, '').trim();

  let list;
  if (Array.isArray(services)) {
    list = services.map((s) =>
      s && typeof s === 'object'
        ? { displayName: s.title || s.displayName || s.label || '', description: s.description || '' }
        : { displayName: String(s || ''), description: '' }
    );
  } else {
    list = String(services || '')
      .split(',')
      .map((s) => ({ displayName: s, description: '' }));
  }

  const items = list
    .map((s) => ({
      displayName: String(s.displayName || '').trim(),
      description: String(s.description || '').trim(),
    }))
    .filter((s) => s.displayName)
    .slice(0, 100)
    .map((s) => ({
      freeFormServiceItem: {
        category: gcid,
        label: {
          displayName: s.displayName.slice(0, 140),
          ...(s.description ? { description: s.description.slice(0, 300) } : {}),
          languageCode: 'en',
        },
      },
    }));

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
