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
