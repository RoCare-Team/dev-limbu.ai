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
  let s = String(raw).trim().replace(/\s/g, '');
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  if (s.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
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
  if (/^https?:\/\//i.test(c) && /wa\.me|api\.whatsapp\.com/i.test(c)) return c;
  const p = normalizePhone(phoneFallback || c);
  const d = p.replace(/\D/g, '');
  if (d.length >= 10) return `https://wa.me/${d}`;
  return '';
}

async function patchLocationResource(accessToken, locationId, updateMask, patchBody) {
  const url = new URL(locationResourceUrl(locationId));
  url.searchParams.set('updateMask', updateMask);
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patchBody),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function patchWhatsappAttribute(accessToken, locationId, uri) {
  const url = new URL(`${GMB_BASE}/locations/${encodeURIComponent(locationId)}/attributes`);
  url.searchParams.set('attributeMask', 'attributes/url_whatsapp');
  const body = {
    attributes: [
      {
        name: 'attributes/url_whatsapp',
        uriValues: [{ uri }],
      },
    ],
  };
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
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
    if (failed.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more Google API calls failed',
          results,
        },
        { status: 502 }
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
