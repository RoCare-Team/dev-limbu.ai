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
  buildWebsiteUriPatchBody,
  buildStorefrontAddressPatchBody,
  buildLatLngPatchBody,
  buildServiceAreaPatchBody,
  buildRegularHoursPatchBody,
  buildServiceItemsPatchBody,
  buildAttributesPatchBody,
  parseServiceAreaFromText,
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
async function fetchPrimaryCategoryGcid(accessToken, locationId) {
  const url = `${GMB_BASE}/locations/${encodeURIComponent(locationId)}?readMask=categories`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  if (!res.ok) return '';
  const d = await res.json().catch(() => ({}));
  const nm = d?.categories?.primaryCategory?.name || '';
  return nm.replace(/^categories\//, ''); // e.g. "gcid:water_purification_company"
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

    const allowedAccount =
      user.gmbProjectId === accountId ||
      user.selectedBusiness?.projectId === accountId ||
      user.selectedBusiness?.googleId === accountId;
    if (!allowedAccount) {
      return NextResponse.json({ error: 'accountId does not match connected business' }, { status: 403 });
    }

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
              ? { title: String(s.title || s.displayName || '').trim(), description: String(s.description || '').trim() }
              : { title: String(s || '').trim(), description: '' }
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

    const hasRegularHoursPayload =
      body.regularHours && typeof body.regularHours === 'object' && Array.isArray(body.regularHours.periods);
    const regularHoursPeriods = hasRegularHoursPayload ? body.regularHours.periods : null;

    const serviceAreaFromText = !serviceAreaPlaces.length ? parseServiceAreaFromText(serviceAreaText) : null;
    const serviceAreaBody =
      serviceAreaPlaces.length > 0
        ? buildServiceAreaPatchBody(serviceAreaPlaces)
        : serviceAreaFromText
          ? { serviceArea: serviceAreaFromText }
          : null;

    const hasAny =
      description ||
      services ||
      (serviceItemsIn && serviceItemsIn.length > 0) ||
      websiteUri ||
      whatsappUri ||
      Boolean(serviceAreaBody) ||
      (latlng && Number.isFinite(latlng.latitude) && Number.isFinite(latlng.longitude)) ||
      title ||
      storefrontAddress ||
      Boolean(hasRegularHoursPayload) ||
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

    // Phone number is intentionally never PATCHed to Google here (per requirement).

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

    // ── Attributes (category-driven + WhatsApp) ──────────────────────────────
    // WhatsApp is just a URL-type attribute, so route it through the same gated
    // generic path. Anything the category doesn't support is SKIPPED (not sent),
    // which fixes the old blanket url_whatsapp "invalid argument" failure.
    const attrItems = [...attributesIn];
    if (whatsappUri && !attrItems.some((a) => a.name === 'attributes/url_whatsapp')) {
      attrItems.push({ name: 'attributes/url_whatsapp', valueType: 'URL', values: whatsappUri });
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
      const gcid = await fetchPrimaryCategoryGcid(accessToken, locationId);
      if (!gcid) {
        results.push({
          field: 'serviceItems',
          ok: false,
          status: 400,
          data: { error: { message: 'No primary category on this location — cannot set services.' } },
        });
      } else {
        const r = await patchLocationResource(
          accessToken,
          locationId,
          LOCATION_UPDATE_MASKS.serviceItems,
          buildServiceItemsPatchBody(servicesPayload, gcid)
        );
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

    const allowedAccount =
      user.gmbProjectId === accountId ||
      user.selectedBusiness?.projectId === accountId ||
      user.selectedBusiness?.googleId === accountId;
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
