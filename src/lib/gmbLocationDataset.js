/**
 * Normalizes Google Business Profile API (Business Information v1) location payloads
 * for Business optimization UI + OpenAI context.
 */

export const GMB_BUSINESS_INFORMATION_READ_MASK = [
  'name',
  'title',
  'storeCode',
  'languageCode',
  'storefrontAddress',
  'latlng',
  'phoneNumbers',
  'websiteUri',
  'regularHours',
  'specialHours',
  'moreHours',
  'categories',
  'serviceArea',
  'labels',
  'profile',
  'relationshipData',
  'metadata',
  'openInfo',
  'serviceItems',
].join(',');

/**
 * Parse a Google ServiceItem `price` (Money) back into the UI's { priceType, price }.
 * Zero amount → Free; a positive amount → Fixed; missing → No price. (The public API
 * has no "From" flag, so a From price reads back as Fixed.)
 */
export function parseServiceMoney(money) {
  if (!money || typeof money !== 'object') return { priceType: 'none', price: '' };
  const units = Number(money.units || 0);
  const nanos = Number(money.nanos || 0);
  const amt = units + nanos / 1e9;
  if (!Number.isFinite(amt)) return { priceType: 'none', price: '' };
  if (amt === 0) return { priceType: 'free', price: '' };
  return { priceType: 'fixed', price: String(Number.isInteger(amt) ? amt : Number(amt.toFixed(2))) };
}

/** Human-readable lines from Business Information regularHours.periods */
export function formatRegularHoursSummary(periods) {
  if (!Array.isArray(periods) || !periods.length) return '';
  return periods
    .map((p) => {
      const od = p.openDay || '';
      const cd = p.closeDay || od;
      const oh = p.openTime?.hours;
      const om = p.openTime?.minutes || 0;
      const ch = p.closeTime?.hours;
      const cm = p.closeTime?.minutes || 0;
      if (ch === 24 && (!oh && oh !== 0)) return `${od}: Open 24 hours`;
      const open = oh != null ? `${oh}:${String(om).padStart(2, '0')}` : '';
      const close = ch != null ? `${ch}:${String(cm).padStart(2, '0')}` : '';
      if (open || close) return `${od}${cd && cd !== od ? '–' + cd : ''}: ${open}–${close}`.trim();
      return `${od}`;
    })
    .join('; ');
}

export function formatServiceAreaPlaces(placeInfos) {
  if (!Array.isArray(placeInfos) || !placeInfos.length) return '';
  return placeInfos.map((p) => p.placeName || p.placeId || '').filter(Boolean).join('; ');
}

/**
 * Compact object for LLM prompts (facts only, no tokens).
 */
export function buildAiContextFromEnrichedLocation(loc) {
  if (!loc) return {};
  return {
    businessTitle: loc.title || '',
    primaryCategory: loc.primaryCategory || '',
    categoryApiName: loc.primaryCategoryName || '',
    phone: loc.phone || '',
    website: loc.websiteUrl || '',
    fullAddress: loc.fullAddress || '',
    locality: loc.locality || '',
    administrativeArea: loc.administrativeArea || '',
    postalCode: loc.postalCode || '',
    regionCode: loc.regionCode || '',
    storeCode: loc.storeCode || '',
    languageCode: loc.languageCode || '',
    profileDescriptionFromGoogle: loc.profileDescription || '',
    serviceAreas: loc.serviceAreaText || '',
    serviceAreaPlacesSelected: Array.isArray(loc.serviceAreaPlaces) ? loc.serviceAreaPlaces : [],
    hoursSummary: loc.hoursSummaryText || '',
    openStatus: loc.openStatus || '',
    mapsUri: loc.mapsUri || '',
    placeId: loc.placeId || '',
    lat: loc.lat != null ? loc.lat : undefined,
    lng: loc.lng != null ? loc.lng : undefined,
  };
}

/**
 * Merge API location + account into dashboard / editor shape (extends enrichGmbLocation fields).
 */
export function normalizeGmbLocationRecord(loc, accountId = '') {
  if (!loc) return null;
  const resourceName = typeof loc.name === 'string' ? loc.name : '';
  let locationId = String(loc.locationId || loc.googleId || '');
  if (!locationId && resourceName.includes('/')) {
    locationId = resourceName.split('/').pop() || '';
  }
  const sa = loc.storefrontAddress;
  const addressLines = sa?.addressLines?.length
    ? sa.addressLines.map(String).join(', ')
    : String(loc.address || '');
  const locality = sa?.locality || loc.locality || '';
  const administrativeArea = sa?.administrativeArea || '';
  const postalCode = sa?.postalCode || '';
  const regionCode = sa?.regionCode || '';
  const fullAddress = [addressLines, locality, administrativeArea, postalCode, regionCode].filter(Boolean).join(', ');
  const phone = loc.phoneNumbers?.primaryPhone || loc.phone || '';
  const websiteUrl = loc.websiteUri || loc.websiteUrl || '';
  const primaryCategory = loc.categories?.primaryCategory?.displayName || loc.primaryCategory || '';
  const primaryCategoryName = loc.categories?.primaryCategory?.name || loc.primaryCategoryId || '';
  const openStatus = loc.openInfo?.status || '';
  const mapsUri = loc.metadata?.mapsUri || '';
  const placeId = loc.metadata?.placeId || '';
  const newReviewUri = loc.metadata?.newReviewUri || loc.reviewUri || '';
  const isVerified = Boolean(loc.metadata?.hasVoiceOfMerchant ?? loc.isVerified);
  const acc = accountId || loc.accountId || '';
  const title = loc.title || '';
  const profileDescription =
    typeof loc.profile?.description === 'string'
      ? loc.profile.description
      : typeof loc.profileDescription === 'string'
        ? loc.profileDescription
        : '';
  const serviceAreaPlaceInfos = loc.serviceArea?.places?.placeInfos;
  const serviceAreaPlaces = Array.isArray(serviceAreaPlaceInfos)
    ? serviceAreaPlaceInfos.map((p) => p.placeName || p.placeId || '').filter(Boolean)
    : Array.isArray(loc.serviceAreaPlaces)
      ? loc.serviceAreaPlaces.map((s) => String(s).trim()).filter(Boolean)
      : [];
  const serviceAreaText = formatServiceAreaPlaces(serviceAreaPlaceInfos) || (loc.serviceAreaText || '');
  // Services come either pre-flattened (loc.services) or as raw GMB serviceItems.
  const services =
    typeof loc.services === 'string' && loc.services.trim()
      ? loc.services.trim()
      : Array.isArray(loc.serviceItems)
        ? loc.serviceItems
            .map((it) => it?.freeFormServiceItem?.label?.displayName || it?.structuredServiceItem?.serviceTypeId || '')
            .map((s) => String(s).trim())
            .filter(Boolean)
            .join(', ')
        : '';
  // Structured services (title + description). Prefer a pre-flattened list, else
  // derive from raw GMB serviceItems (free-form label carries the description).
  const normGcid = (n) => String(n || '').replace(/^categories\//, '').trim();
  const serviceItemsList = Array.isArray(loc.serviceItemsList)
    ? loc.serviceItemsList
        .map((s) => ({
          title: String(s?.title || s?.displayName || '').trim(),
          description: String(s?.description || '').trim(),
          priceType: s?.priceType || 'none',
          price: s?.price != null ? String(s.price) : '',
          // Which category this service belongs to (empty = primary).
          category: normGcid(s?.category || s?.categoryGcid),
        }))
        .filter((s) => s.title)
    : Array.isArray(loc.serviceItems)
      ? loc.serviceItems
          .map((it) => {
            const label = it?.freeFormServiceItem?.label;
            const title = String(label?.displayName || it?.structuredServiceItem?.serviceTypeId || '').trim();
            const description = String(label?.description || it?.structuredServiceItem?.description || '').trim();
            const { priceType, price } = parseServiceMoney(it?.price);
            const category = normGcid(
              it?.freeFormServiceItem?.category || it?.structuredServiceItem?.category
            );
            return title ? { title, description, priceType, price, category } : null;
          })
          .filter(Boolean)
      : [];
  const hoursSummaryText = formatRegularHoursSummary(loc.regularHours?.periods);
  const storeCode = loc.storeCode || '';
  const languageCode = loc.languageCode || '';
  const lat = loc.latlng?.latitude;
  const lng = loc.latlng?.longitude;

  if (!locationId) locationId = resourceName || title;
  if (!locationId) return null;

  const regularHours = loc.regularHours && typeof loc.regularHours === 'object' ? loc.regularHours : null;
  const specialHours = Array.isArray(loc.specialHours) ? loc.specialHours : null;

  return {
    locationId,
    resourceName,
    title,
    address: addressLines,
    locality,
    administrativeArea,
    postalCode,
    regionCode,
    fullAddress: fullAddress || [addressLines, locality].filter(Boolean).join(', '),
    websiteUrl,
    phone,
    primaryCategory,
    primaryCategoryName,
    openStatus,
    mapsUri,
    placeId,
    newReviewUri,
    isVerified,
    accountId: acc,
    profileDescription,
    serviceAreaText,
    hoursSummaryText,
    storeCode,
    languageCode,
    lat,
    lng,
    aiContext: buildAiContextFromEnrichedLocation({
      title,
      primaryCategory,
      primaryCategoryName,
      phone,
      websiteUrl,
      fullAddress,
      locality,
      administrativeArea,
      postalCode,
      regionCode,
      storeCode,
      languageCode,
      profileDescription,
      serviceAreaText,
      serviceAreaPlaces,
      hoursSummaryText,
      openStatus,
      mapsUri,
      placeId,
      lat,
      lng,
    }),
    serviceAreaPlaces,
    services,
    serviceItemsList,
    regularHours,
    specialHours,
  };
}
