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
  parseServiceAreaFromText,
} from '@/lib/gmbLocationApiActions';

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

// Surface the most actionable Google status instead of a blanket 502.
function pickFailureStatus(failed) {
  const statuses = failed.map((f) => f.status).filter(Boolean);
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

async function patchWhatsappAttribute(accessToken, locationId, uri) {
  const url = new URL(`${GMB_BASE}/locations/${encodeURIComponent(locationId)}/attributes`);
  url.searchParams.set('attributeMask', 'attributes/url_whatsapp');
  const body = {
    attributes: [{ name: 'attributes/url_whatsapp', uriValues: [{ uri }] }],
  };
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
    const primaryPhone = normalizePhone(body.primaryPhone);
    const websiteUri = normalizeWebsiteUri(body.websiteUri);
    let whatsappUri =
      typeof body.whatsappUri === 'string' && body.whatsappUri.trim()
        ? String(body.whatsappUri).trim()
        : '';
    if (!whatsappUri) {
      whatsappUri = normalizeWhatsappUri(body.chatUrl, body.primaryPhone);
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
      primaryPhone ||
      websiteUri ||
      whatsappUri ||
      Boolean(serviceAreaBody) ||
      (latlng && Number.isFinite(latlng.latitude) && Number.isFinite(latlng.longitude)) ||
      title ||
      storefrontAddress ||
      Boolean(hasRegularHoursPayload);

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

    if (whatsappUri) {
      const r = await patchWhatsappAttribute(accessToken, locationId, whatsappUri);
      results.push({ field: 'attributes/url_whatsapp', ...r });
    }

    const failed = results.filter((x) => !x.ok);
    const succeeded = results.filter((x) => x.ok);

    if (failed.length) {
      const summary = failed.map((f) => ({
        field: f.field,
        status: f.status,
        code: f.data?.error?.status,
        message: f.data?.error?.message,
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
