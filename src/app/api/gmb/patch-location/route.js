import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import {
  GMB_BUSINESS_INFORMATION_V1_BASE,
  LOCATION_UPDATE_MASKS,
  locationResourceUrl,
  buildTitlePatchBody,
  buildProfileDescriptionPatchBody,
  buildPhoneNumbersPatchBody,
  buildWebsiteUriPatchBody,
  buildStorefrontAddressPatchBody,
  buildLatLngPatchBody,
  buildServiceAreaPatchBody,
  buildRegularHoursPatchBody,
  buildSpecialHoursPatchBody,
  buildServiceItemsPatchBody,
  buildAttributesPatchBody,
  buildCategoriesPatchBody,
} from '@/lib/gmbLocationApiActions';
import { listCategoryAttributes } from '@/lib/gmbCategoryAttributes';

export const dynamic = 'force-dynamic';

const GMB_BASE = GMB_BUSINESS_INFORMATION_V1_BASE;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Google returns these when it's momentarily busy — safe to retry.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

async function fetchWithRetry(url, options, { retries = 3, baseDelayMs = 600 } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res, text;
    try {
      res = await fetch(url, options);
      text = await res.text();
    } catch (e) {
      last = { ok: false, status: 0, data: { error: { message: `Network error: ${e.message}` } } };
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt + Math.random() * 200);
        continue;
      }
      return last;
    }
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    const result = { ok: res.ok, status: res.status, data };
    if (res.ok || !RETRYABLE_STATUSES.has(res.status) || attempt === retries) {
      return result;
    }
    last = result;
    await sleep(baseDelayMs * 2 ** attempt + Math.random() * 200);
  }
  return last;
}

async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

function normalizePhone(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (!s) return '';
  const hadPlus = s.startsWith('+');
  let digits = s.replace(/\D/g, '');
  if (!digits) return '';
  if (hadPlus) return `+${digits}`;                                 // already international
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');   // strip India trunk 0
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`; // 91XXXXXXXXXX
  if (digits.length === 10) return `+91${digits}`;                  // local 10-digit
  return `+${digits}`;                                              // fallback
}

function normalizeWebsiteUri(raw) {
  if (raw == null) return '';
  let u = String(raw).trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    new URL(u);
    return u;
  } catch {
    return '';
  }
}

function normalizeWhatsappUri(chatUrl, phoneFallback) {
  const c = String(chatUrl || '').trim();
  const m = c.match(/(?:wa\.me\/|phone=)(\+?\d+)/i); // extract number from a wa.me / api.whatsapp.com link
  const source = m ? m[1] : phoneFallback || c;
  const p = normalizePhone(source);
  const d = p.replace(/\D/g, '');
  return d.length >= 10 ? `https://wa.me/${d}` : '';
}

// Google puts the precise reason in error.details[].fieldViolations[].description
// (e.g. "Invalid phone number for region IN"). error.message is generic ("Request
// contains an invalid argument."), so dig into the violations for a useful message.
function googleErrorDetail(errData) {
  const err = errData?.error;
  if (!err) return null;
  const details = Array.isArray(err.details) ? err.details : [];
  // ErrorInfo carries the real reason (e.g. THROTTLED) — Google's top-level message
  // for these is the generic "Request contains an invalid argument."
  for (const d of details) {
    if (d.reason) {
      const fld = d.metadata?.field_mask ? ` (${d.metadata.field_mask})` : '';
      if (d.reason === 'THROTTLED') {
        return `Google is rate-limiting edits to this field${fld}. It was changed too many times recently — wait a while (often a few hours / up to ~24h) before saving it again. Other fields were saved.`;
      }
      return `${d.reason}${fld}`;
    }
  }
  // BadRequest fieldViolations (e.g. genuinely invalid value)
  for (const d of details) {
    const fv = Array.isArray(d.fieldViolations) ? d.fieldViolations : [];
    const msgs = fv.map((v) => v.description || v.field).filter(Boolean);
    if (msgs.length) return msgs.join('; ');
  }
  return err.message || null;
}

function isThrottled(failed) {
  return failed.some((f) =>
    Array.isArray(f.data?.error?.details) &&
    f.data.error.details.some((d) => d.reason === 'THROTTLED')
  );
}

// Surface the most actionable Google status instead of a blanket 502.
function pickFailureStatus(failed) {
  const statuses = failed.map((f) => f.status).filter(Boolean);
  if (isThrottled(failed)) return 429; // rate-limited field edit — transient
  if (statuses.includes(401)) return 401;
  if (statuses.includes(403)) return 403;
  if (statuses.includes(429)) return 429;
  if (statuses.includes(400)) return 400;
  return 502;
}

async function patchLocationResource(accessToken, locationId, updateMask, patchBody) {
  const url = new URL(locationResourceUrl(locationId));
  url.searchParams.set('updateMask', updateMask);
  return fetchWithRetry(url.toString(), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patchBody),
  });
}

// Services use freeFormServiceItem which must reference one of the location's category
// gcids — fetch the primary category so the caller doesn't have to send it.
// Primary + additional category gcids for a location. `primary` is used as the
// default category for untagged services; `all` is the allow-list so a service can
// only be filed under a category the location actually has.
async function fetchLocationCategoryGcids(accessToken, locationId) {
  const url = `${GMB_BASE}/locations/${encodeURIComponent(locationId)}?readMask=categories`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  if (!res.ok) return { primary: '', all: [] };
  const d = await res.json().catch(() => ({}));
  const norm = (n) => String(n || '').replace(/^categories\//, '').trim(); // e.g. "gcid:water_purification_company"
  const primary = norm(d?.categories?.primaryCategory?.name);
  const additional = Array.isArray(d?.categories?.additionalCategories)
    ? d.categories.additionalCategories.map((c) => norm(c?.name)).filter(Boolean)
    : [];
  return { primary, all: [primary, ...additional].filter(Boolean) };
}

// Generic attributes PATCH — one call for all attributes, using a combined
// attributeMask. Used for category-driven attributes AND WhatsApp (which is just a
// URL-type attribute). Gating against the category's available list happens before
// this is called, so Google never sees an unsupported attribute.
async function patchAttributes(accessToken, locationId, attributeMask, body) {
  const url = new URL(`${GMB_BASE}/locations/${encodeURIComponent(locationId)}/attributes`);
  url.searchParams.set('attributeMask', attributeMask);
  return fetchWithRetry(url.toString(), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// A Google Maps key (Geocoding API) — used to resolve service-area names to placeIds.
function mapsApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY_1 ||
    process.env.GOOGLE_MAPS_API_KEY_2 ||
    process.env.GOOGLE_MAPS_API_KEY_3 ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

// Place types Google Business ACCEPTS as a service area. Google rejects anything more
// granular (neighborhood, sublocality_level_2+, premise/complex, POI, colloquial_area,
// route) with INVALID_AREA_TYPE_FOR_SERVICE_AREA, so we must only send these.
const SERVICE_AREA_REGION_TYPES = new Set([
  'locality',
  'sublocality_level_1',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'postal_code',
]);

// Types that must NEVER be sent even if the result also carries a broad tag like
// "political" — these are what triggers INVALID_AREA_TYPE_FOR_SERVICE_AREA.
const SERVICE_AREA_REJECTED_TYPES = new Set([
  'neighborhood',
  'sublocality_level_2',
  'sublocality_level_3',
  'sublocality_level_4',
  'sublocality_level_5',
  'premise',
  'subpremise',
  'point_of_interest',
  'establishment',
  'colloquial_area',
  'route',
  'street_address',
  'intersection',
]);

/**
 * Google's serviceArea PlaceInfo requires a Google placeId (a bare name is rejected).
 * Resolve each area name to { placeName, placeId } via the Geocoding API, preferring a
 * region-type result. Returns resolved infos + the names that could not be resolved.
 */
// Over-nested names like "Dombivli, MIDC, Dombivli East, Kalyan, Maharashtra, India"
// confuse Geocoding. Produce progressively simpler queries: full → first + state/country
// → first + country → first alone, so the area still resolves to a valid region.
function serviceAreaQueryVariants(q) {
  const segs = q.split(',').map((s) => s.trim()).filter(Boolean);
  const variants = [q];
  if (segs.length >= 3) {
    const tail = segs.slice(-2); // usually "<State PIN>", "India"
    variants.push([segs[0], ...tail].join(', '));
  }
  if (segs.length >= 2) {
    variants.push([segs[0], segs[segs.length - 1]].join(', '));
    variants.push(segs[0]);
  }
  // De-dupe while preserving order.
  return [...new Set(variants.map((v) => v.trim()).filter(Boolean))];
}

async function geocodeAcceptedRegion(query, apiKey) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  const status = data.status || '';
  const results = Array.isArray(data.results) ? data.results : [];
  // Accept only a result whose types include an allowed region type AND include NO
  // rejected (too-granular) type — otherwise Google fails the whole serviceArea PATCH.
  const hit = results.find((r) => {
    const types = r.types || [];
    const hasAllowed = types.some((t) => SERVICE_AREA_REGION_TYPES.has(t));
    const hasRejected = types.some((t) => SERVICE_AREA_REJECTED_TYPES.has(t));
    return hasAllowed && !hasRejected && r.place_id;
  });
  return { hit, status, errorMessage: data.error_message || '' };
}

async function resolveServiceAreaPlaceInfos(names, apiKey) {
  const resolved = [];
  const unresolved = [];
  const seenPlaceIds = new Set();
  let apiError = '';
  for (const raw of names) {
    const q = String(raw || '').trim();
    if (!q) continue;
    let matched = null;
    for (const variant of serviceAreaQueryVariants(q)) {
      try {
        const { hit, status, errorMessage } = await geocodeAcceptedRegion(variant, apiKey);
        if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
          apiError = errorMessage || status; // e.g. REQUEST_DENIED (API not enabled)
        }
        if (hit?.place_id) {
          matched = hit;
          break;
        }
      } catch {
        /* try next variant */
      }
    }
    if (matched?.place_id && !seenPlaceIds.has(matched.place_id)) {
      seenPlaceIds.add(matched.place_id);
      // Keep the original label for display; the placeId is what Google actually stores.
      resolved.push({ placeName: q, placeId: matched.place_id });
    } else if (matched?.place_id) {
      // Same region as another already-added area — skip the duplicate silently.
    } else {
      unresolved.push(q);
    }
  }
  return { resolved, unresolved, apiError };
}

/**
 * POST /api/gmb/patch-location
 * Body: { accountId, locationId, description?, primaryPhone?, websiteUri?, whatsappUri?, serviceAreaText?, latlng?, title?, storefrontAddress? }
 * Runs one PATCH per provided slice; whatsapp uses the attributes endpoint.
 */
export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const accountId = String(body.accountId || user.gmbProjectId || '').trim();
    const locationId = String(body.locationId || '').trim();

    if (!accountId || !locationId) {
      return NextResponse.json({ error: 'accountId and locationId required' }, { status: 400 });
    }

    // A single login can be a MANAGER on several GMB accounts (each location can live
    // under a different accountId). Authorization is ultimately enforced by Google on the
    // request using the user's own OAuth token, so accept the accountId when it matches any
    // account the user is connected to OR when we're acting with the user's own session
    // token (Google will reject a location they can't actually manage).
    const gmbForAuth = await GmbUser.findOne({ email: session.user.email }).lean();
    const knownAccountIds = new Set(
      [
        user.gmbProjectId,
        user.selectedBusiness?.projectId,
        user.selectedBusiness?.googleId,
        ...(Array.isArray(gmbForAuth?.projects) ? gmbForAuth.projects.map((p) => p?.googleId) : []),
      ].filter(Boolean)
    );
    const allowedAccount = knownAccountIds.has(accountId) || Boolean(session.accessToken);
    if (!allowedAccount) {
      return NextResponse.json({ error: 'accountId does not match connected business' }, { status: 403 });
    }

    console.log(
      '[patch-location] target:',
      'accountId=', accountId,
      'locationId=', locationId,
      'usingSessionToken=', Boolean(session.accessToken)
    );

    const platformToken =
      typeof body.googleAccessToken === 'string'
        ? body.googleAccessToken
        : typeof body.accessToken === 'string'
          ? body.accessToken
          : '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    const results = [];
    const maxDesc = 750;

    const description = typeof body.description === 'string' ? body.description.trim() : '';
    // Services go to Google as serviceItems (free-form). Tagline has no Google field at all,
    // so it is not handled here. Phone is intentionally not updated from here.
    const services = typeof body.services === 'string' ? body.services.trim() : '';
    // Structured services: [{ title, description }] — each becomes a free-form
    // serviceItem with a label description. Preferred over the legacy `services` string.
    const serviceItemsIn = Array.isArray(body.serviceItems)
      ? body.serviceItems
          .map((s) =>
            s && typeof s === 'object'
              ? {
                  title: String(s.title || s.displayName || '').trim(),
                  description: String(s.description || '').trim(),
                  priceType: String(s.priceType || 'none').toLowerCase(),
                  price: s.price,
                  // Which category this service is filed under (empty = primary). Kept so
                  // buildServiceItemsPatchBody can tag each item with its own category.
                  category: String(s.category || s.categoryGcid || '').replace(/^categories\//, '').trim(),
                }
              : { title: String(s || '').trim(), description: '', priceType: 'none', price: '', category: '' }
          )
          .filter((s) => s.title)
      : null;
    const websiteUri = normalizeWebsiteUri(body.websiteUri);
    let whatsappUri =
      typeof body.whatsappUri === 'string' && body.whatsappUri.trim()
        ? String(body.whatsappUri).trim()
        : '';
    const chatUrlIn = typeof body.chatUrl === 'string' ? body.chatUrl.trim() : '';
    // Only set WhatsApp when the user actually provided a chat link/number. Do NOT derive
    // it from the phone — that pushed an unwanted attribute and failed with "invalid
    // argument" on locations whose category doesn't support attributes/url_whatsapp.
    if (!whatsappUri && chatUrlIn) {
      whatsappUri = normalizeWhatsappUri(chatUrlIn, '');
    }
    // Phone -> Google phoneNumbers.primaryPhone. Accept `primaryPhone` or `phone`.
    const primaryPhone = normalizePhone(
      typeof body.primaryPhone === 'string' && body.primaryPhone.trim()
        ? body.primaryPhone
        : typeof body.phone === 'string'
          ? body.phone
          : ''
    );
    // Booking / appointment link -> Google attributes/url_appointment (URL type,
    // category-gated exactly like url_whatsapp).
    const bookingUri = normalizeWebsiteUri(body.bookingUrl);
    const serviceAreaText = typeof body.serviceAreaText === 'string' ? body.serviceAreaText : '';
    const serviceAreaPlacesIn = Array.isArray(body.serviceAreaPlaces) ? body.serviceAreaPlaces : [];
    const serviceAreaPlaces = serviceAreaPlacesIn.map((s) => String(s).trim()).filter(Boolean);
    const latlng =
      body.latlng && typeof body.latlng === 'object'
        ? {
            latitude: Number(body.latlng.latitude),
            longitude: Number(body.latlng.longitude),
          }
        : null;
    // Category-driven attributes: [{ name, valueType, values }]. Gated against the
    // location category's available attribute list before any PATCH.
    const attributesIn = Array.isArray(body.attributes)
      ? body.attributes
          .map((a) => ({
            name: String(a?.name || '').trim(),
            valueType: String(a?.valueType || '').toUpperCase(),
            values: a?.values,
          }))
          .filter((a) => a.name && a.valueType)
      : [];

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const storefrontAddress =
      body.storefrontAddress && typeof body.storefrontAddress === 'object' ? body.storefrontAddress : null;

    // Categories: { primary: 'gcid:...', additional: ['gcid:...'] }. PATCHed with
    // updateMask=categories. Primary is required; additional (sub) categories are
    // Google-supported ids the user picked. Only sent when a primary is provided.
    const categoriesIn =
      body.categories && typeof body.categories === 'object' ? body.categories : null;
    const categoriesBody = categoriesIn
      ? buildCategoriesPatchBody(
          categoriesIn.primary || categoriesIn.primaryCategory || '',
          Array.isArray(categoriesIn.additional)
            ? categoriesIn.additional
            : Array.isArray(categoriesIn.additionalCategories)
              ? categoriesIn.additionalCategories
              : []
        )
      : null;

    const hasRegularHoursPayload =
      body.regularHours && typeof body.regularHours === 'object' && Array.isArray(body.regularHours.periods);
    const regularHoursPeriods = hasRegularHoursPayload ? body.regularHours.periods : null;

    // Special hours (holidays / exceptions): [{ date:'YYYY-MM-DD', closed?, openTime?, closeTime? }].
    const specialHoursIn = Array.isArray(body.specialHours) ? body.specialHours : null;
    const specialHoursBody = specialHoursIn ? buildSpecialHoursPatchBody(specialHoursIn) : null;

    // Service areas: names arrive from the UI (or legacy comma text). Google requires a
    // placeId per area, so resolve each name → { placeName, placeId } before PATCHing.
    const serviceAreaNames =
      serviceAreaPlaces.length > 0
        ? serviceAreaPlaces
        : String(serviceAreaText || '')
            .split(/[;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean);
    let serviceAreaBody = null;
    let serviceAreaUnresolved = [];
    let serviceAreaApiError = '';
    if (serviceAreaNames.length) {
      const key = mapsApiKey();
      if (!key) {
        serviceAreaUnresolved = [...serviceAreaNames];
        serviceAreaApiError = 'No Google Maps API key configured on the server (GOOGLE_MAPS_API_KEY_1).';
      } else {
        const { resolved, unresolved, apiError } = await resolveServiceAreaPlaceInfos(serviceAreaNames, key);
        serviceAreaUnresolved = unresolved;
        serviceAreaApiError = apiError;
        serviceAreaBody = buildServiceAreaPatchBody(resolved);
      }
    }

    const hasAny =
      description ||
      services ||
      (serviceItemsIn && serviceItemsIn.length > 0) ||
      websiteUri ||
      whatsappUri ||
      primaryPhone ||
      bookingUri ||
      Boolean(serviceAreaBody) ||
      serviceAreaNames.length > 0 ||
      (latlng && Number.isFinite(latlng.latitude) && Number.isFinite(latlng.longitude)) ||
      title ||
      storefrontAddress ||
      Boolean(hasRegularHoursPayload) ||
      Boolean(specialHoursBody && specialHoursBody.specialHours.specialHourPeriods.length) ||
      Boolean(categoriesBody) ||
      attributesIn.length > 0;

    if (!hasAny) {
      return NextResponse.json(
        { error: 'Provide at least one field to update (description, phone, website, etc.)' },
        { status: 400 }
      );
    }

    if (title) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.title,
        buildTitlePatchBody(title)
      );
      results.push({ field: 'title', ...r });
    }

    if (categoriesBody) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.categories,
        categoriesBody
      );
      if (!r.ok) {
        console.error(
          '[patch-location] categories PATCH failed:',
          'status=', r.status,
          'body=', JSON.stringify(categoriesBody),
          'googleError=', JSON.stringify(r.data?.error || r.data)
        );
      } else {
        // Confirm what Google actually persisted (primary + additional gcids).
        const saved = r.data?.categories || {};
        console.log(
          '[patch-location] categories saved (PATCH echo):',
          'primary=', saved.primaryCategory?.name,
          'additional=', JSON.stringify((saved.additionalCategories || []).map((c) => c.name))
        );
        // Independent re-read: proves whether Google truly stored it, or silently
        // reverted the write (e.g. category pending review / not allowed as secondary).
        try {
          const verify = await fetchLocationCategoryGcids(accessToken, locationId);
          console.log('[patch-location] categories verify (fresh GET):', JSON.stringify(verify));
        } catch (e) {
          console.warn('[patch-location] categories verify GET failed:', e.message);
        }
      }
      results.push({ field: 'categories', ...r });
    }

    if (description) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.profile,
        buildProfileDescriptionPatchBody(description, maxDesc)
      );
      results.push({
        field: 'profile',
        truncated: description.length > maxDesc,
        ...r,
      });
    }

    // Phone -> Google phoneNumbers.primaryPhone (Business Information API).
    if (primaryPhone) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.phoneNumbers,
        buildPhoneNumbersPatchBody(primaryPhone)
      );
      results.push({ field: 'phoneNumbers', ...r });
    }

    if (websiteUri) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.websiteUri,
        buildWebsiteUriPatchBody(websiteUri)
      );
      results.push({ field: 'websiteUri', ...r });
    }

    if (storefrontAddress) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.storefrontAddress,
        buildStorefrontAddressPatchBody(storefrontAddress)
      );
      results.push({ field: 'storefrontAddress', ...r });
    }

    if (latlng && Number.isFinite(latlng.latitude) && Number.isFinite(latlng.longitude)) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.latlng,
        buildLatLngPatchBody(latlng.latitude, latlng.longitude)
      );
      results.push({ field: 'latlng', ...r });
    }

    if (serviceAreaBody) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.serviceArea,
        serviceAreaBody
      );
      results.push({ field: 'serviceArea', ...r });
    } else if (serviceAreaNames.length) {
      // Names were requested but none could be resolved to a Google place — surface it.
      const detail = serviceAreaApiError
        ? ` (${serviceAreaApiError})`
        : '';
      results.push({
        field: 'serviceArea',
        ok: false,
        status: 400,
        data: {
          error: {
            message: `Could not match your service areas to Google places${detail}. Use clearer area names like "Andheri West, Mumbai" or "Koregaon Park, Pune".`,
          },
        },
      });
    }

    if (hasRegularHoursPayload) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.regularHours,
        buildRegularHoursPatchBody(regularHoursPeriods)
      );
      results.push({ field: 'regularHours', ...r });
    }

    if (specialHoursBody && specialHoursBody.specialHours.specialHourPeriods.length) {
      const r = await patchLocationResource(
        accessToken,
        locationId,
        LOCATION_UPDATE_MASKS.specialHours,
        specialHoursBody
      );
      if (!r.ok) {
        console.error(
          '[patch-location] specialHours PATCH failed:',
          'status=', r.status,
          'googleError=', JSON.stringify(r.data?.error || r.data)
        );
      }
      results.push({ field: 'specialHours', ...r });
    }

    // ── Attributes (category-driven + WhatsApp) ──────────────────────────────
    // WhatsApp is just a URL-type attribute, so route it through the same gated
    // generic path. Anything the category doesn't support is SKIPPED (not sent),
    // which fixes the old blanket url_whatsapp "invalid argument" failure.
    const attrItems = [...attributesIn];
    if (whatsappUri && !attrItems.some((a) => a.name === 'attributes/url_whatsapp')) {
      attrItems.push({ name: 'attributes/url_whatsapp', valueType: 'URL', values: whatsappUri });
    }
    // Booking / appointment link — same gated URL-attribute path as WhatsApp.
    if (bookingUri && !attrItems.some((a) => a.name === 'attributes/url_appointment')) {
      attrItems.push({ name: 'attributes/url_appointment', valueType: 'URL', values: bookingUri });
    }

    if (attrItems.length) {
      let available = new Set();
      let optionsByName = {};
      try {
        const cat = await listCategoryAttributes(accessToken, locationId);
        for (const m of cat.metadata || []) {
          if (!m?.parent) continue;
          available.add(m.parent);
          if (Array.isArray(m.valueMetadata)) {
            optionsByName[m.parent] = m.valueMetadata.map((v) => v.value).filter((v) => v != null);
          }
        }
      } catch (e) {
        console.warn('[patch-location] Could not load category attributes for gating:', e.message);
      }

      const supported = [];
      for (const it of attrItems) {
        // If we couldn't load the available list, fail open rather than block all edits.
        if (available.size && !available.has(it.name)) {
          results.push({
            field: it.name,
            ok: false,
            skipped: true,
            status: 200,
            reason: 'not available for this location category',
          });
        } else {
          supported.push(it);
        }
      }

      if (supported.length) {
        const built = buildAttributesPatchBody(supported, optionsByName);
        if (built) {
          const r = await patchAttributes(accessToken, locationId, built.attributeMask, built.body);
          results.push({ field: 'attributes', names: built.attributeMask, ...r });
        }
      }
    }

    // Services -> Google serviceItems (free-form, title + optional description),
    // referencing the location's primary category. Structured serviceItems[] wins
    // over the legacy comma-separated services string when both are sent.
    const servicesPayload = serviceItemsIn && serviceItemsIn.length ? serviceItemsIn : services;
    if (servicesPayload && (Array.isArray(servicesPayload) ? servicesPayload.length : true)) {
      const { primary: gcid, all: allowedGcids } = await fetchLocationCategoryGcids(accessToken, locationId);
      if (!gcid) {
        results.push({
          field: 'serviceItems',
          ok: false,
          status: 400,
          data: { error: { message: 'No primary category on this location — cannot set services.' } },
        });
      } else {
        // Each service is filed under its own category (primary or a sub-category);
        // untagged services default to the primary. allowedGcids guards against
        // sending a category the location no longer has.
        const serviceItemsBody = buildServiceItemsPatchBody(servicesPayload, gcid, { allowedGcids });
        console.log(
          '[patch-location] serviceItems send:',
          'primaryGcid=', gcid,
          'allowedGcids=', JSON.stringify(allowedGcids),
          'count=', serviceItemsBody.serviceItems.length,
          'body=', JSON.stringify(serviceItemsBody)
        );
        const r = await patchLocationResource(
          accessToken,
          locationId,
          LOCATION_UPDATE_MASKS.serviceItems,
          serviceItemsBody
        );
        if (!r.ok) {
          console.error(
            '[patch-location] serviceItems PATCH failed:',
            'status=', r.status,
            'googleError=', JSON.stringify(r.data?.error || r.data)
          );
        }
        results.push({ field: 'serviceItems', ...r });
      }
    }

    // Skipped attributes (not supported by the category) are informational — they
    // must NOT count as failures, otherwise an unsupported url_whatsapp would fail
    // the whole save (the exact bug this change fixes).
    const skipped = results.filter((x) => x.skipped);
    const failed = results.filter((x) => !x.ok && !x.skipped);
    const succeeded = results.filter((x) => x.ok);

    if (failed.length) {
      const summary = failed.map((f) => ({
        field: f.field,
        status: f.status,
        code: f.data?.error?.status,
        message: googleErrorDetail(f.data) || f.data?.error?.message,
      }));

      console.error('[patch-location] Google failures:', JSON.stringify(summary, null, 2));

      // Partial success: some fields saved, some didn't (e.g. a transient 503).
      const partial = succeeded.length > 0;
      return NextResponse.json(
        {
          success: false,
          partial,
          error: partial
            ? `Saved ${succeeded.length} of ${results.length} fields. ${failed.length} failed — please retry.`
            : 'One or more Google API calls failed',
          detail: summary.find((s) => s.message)?.message || null,
          savedFields: succeeded.map((s) => s.field),
          failures: summary,
          results,
        },
        { status: pickFailureStatus(failed) }
      );
    }

    return NextResponse.json({
      success: true,
      locationId,
      results,
      skipped: skipped.map((s) => ({ field: s.field, reason: s.reason })),
      // Areas we saved but couldn't match to a Google place (partial service-area save).
      serviceAreaUnresolved,
      descriptionMaxLength: maxDesc,
    });
  } catch (e) {
    console.error('[patch-location]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/gmb/patch-location?accountId=&locationId=
 * Fetches a single location resource (Business Information v1).
 */
export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const accountId =
      searchParams.get('accountId')?.trim() ||
      user.gmbProjectId ||
      user.selectedBusiness?.projectId ||
      user.selectedBusiness?.googleId ||
      '';
    const locationId = searchParams.get('locationId')?.trim() || '';

    if (!accountId || !locationId) {
      return NextResponse.json({ error: 'accountId and locationId query params required' }, { status: 400 });
    }

    // A single login can be a MANAGER on several GMB accounts (each location can live
    // under a different accountId). Authorization is ultimately enforced by Google on the
    // request using the user's own OAuth token, so accept the accountId when it matches any
    // account the user is connected to OR when we're acting with the user's own session
    // token (Google will reject a location they can't actually manage).
    const gmbForAuth = await GmbUser.findOne({ email: session.user.email }).lean();
    const knownAccountIds = new Set(
      [
        user.gmbProjectId,
        user.selectedBusiness?.projectId,
        user.selectedBusiness?.googleId,
        ...(Array.isArray(gmbForAuth?.projects) ? gmbForAuth.projects.map((p) => p?.googleId) : []),
      ].filter(Boolean)
    );
    const allowedAccount = knownAccountIds.has(accountId) || Boolean(session.accessToken);
    if (!allowedAccount) {
      return NextResponse.json({ error: 'accountId does not match connected business' }, { status: 403 });
    }

    const platformToken = searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    const url = locationResourceUrl(locationId);
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
      return NextResponse.json(
        { error: `Google API ${res.status}`, detail: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, location: data });
  } catch (e) {
    console.error('[patch-location GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
