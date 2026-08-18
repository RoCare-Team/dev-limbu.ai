import { NextResponse } from 'next/server';
import { getGmbSession } from '@/lib/gmbSession';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { GMB_BUSINESS_INFORMATION_V1_BASE } from '@/lib/gmbLocationApiActions';
import { parseServiceMoney, prettifyServiceTypeId } from '@/lib/gmbLocationDataset';

export const dynamic = 'force-dynamic';

const GMB_BASE = GMB_BUSINESS_INFORMATION_V1_BASE;

// Fields we need to render the optimization panel (description lives under `profile`).
const LOCATION_READ_MASK = [
  'name',
  'title',
  'storefrontAddress',
  'websiteUri',
  'phoneNumbers',
  'profile',
  'serviceArea',
  'serviceItems',
  'categories',
  'regularHours',
  'openInfo',
  'latlng',
  'metadata',
].join(',');

// Join free-form / structured serviceItems into a comma-separated string for the UI.
function serviceItemsToText(items) {
  if (!Array.isArray(items)) return '';
  return items
    .map((it) => it?.freeFormServiceItem?.label?.displayName || prettifyServiceTypeId(it?.structuredServiceItem?.serviceTypeId) || '')
    .map((s) => String(s).trim())
    .filter(Boolean)
    .join(', ');
}

// Structured services with title + description, for the title/description editor.
function serviceItemsToList(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      const label = it?.freeFormServiceItem?.label;
      const title = String(
        label?.displayName || prettifyServiceTypeId(it?.structuredServiceItem?.serviceTypeId) || ''
      ).trim();
      const description = String(label?.description || it?.structuredServiceItem?.description || '').trim();
      const { priceType, price } = parseServiceMoney(it?.price);
      // Preserve which category each service is filed under so the round-trip keeps the
      // sub-category assignment instead of collapsing everything onto the primary.
      const category = String(it?.freeFormServiceItem?.category || '')
        .replace(/^categories\//, '')
        .trim();
      return title ? { title, description, priceType, price, category } : null;
    })
    .filter(Boolean);
}

async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

// List every GMB account the token can access (owner + manager). Returns bare numeric ids.
async function fetchAccessibleAccountIds(accessToken) {
  const out = [];
  let pageToken = null;
  do {
    // Use the same host the dashboard uses to list accounts (proven to work with the
    // existing OAuth scopes) so managed accounts are enumerated reliably.
    let url = `${GMB_BASE}/accounts?pageSize=100`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      const err = new Error(data?.error?.message || `accounts ${res.status}`);
      err.status = res.status;
      throw err;
    }
    for (const a of Array.isArray(data.accounts) ? data.accounts : []) {
      const id = String(a?.name || '').replace(/^accounts\//, '').trim();
      if (id) out.push(id);
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return out;
}

async function fetchAllLocationsByAccount(accessToken, accountId) {
  let allLocations = [];
  let pageToken = null;
  do {
    let url = `${GMB_BASE}/accounts/${encodeURIComponent(
      accountId
    )}/locations?readMask=${encodeURIComponent(LOCATION_READ_MASK)}&pageSize=100`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
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
      const message = data?.error?.message || `Google API ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    if (Array.isArray(data.locations) && data.locations.length) {
      allLocations = [...allLocations, ...data.locations];
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return allLocations;
}

function formatAddress(addr) {
  if (!addr || typeof addr !== 'object') return '';
  const lines = Array.isArray(addr.addressLines) ? addr.addressLines : [];
  return [...lines, addr.locality, addr.administrativeArea, addr.postalCode]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(', ');
}

function mapLocation(loc, accountId) {
  const name = loc.name || '';
  const locationId = name.includes('/') ? name.split('/').pop() : name;
  const addr = loc.storefrontAddress || null;
  const serviceAreaPlaces = Array.isArray(loc.serviceArea?.places?.placeInfos)
    ? loc.serviceArea.places.placeInfos.map((p) => p.placeName).filter(Boolean)
    : [];
  return {
    locationId,
    accountId,
    title: loc.title || '',
    address: formatAddress(addr),
    locality: addr?.locality || '',
    // Precise listing coordinates (when Google exposes them) for accurate radius search.
    lat: Number.isFinite(Number(loc.latlng?.latitude)) ? Number(loc.latlng.latitude) : null,
    lng: Number.isFinite(Number(loc.latlng?.longitude)) ? Number(loc.latlng.longitude) : null,
    websiteUrl: loc.websiteUri || '',
    primaryPhone: loc.phoneNumbers?.primaryPhone || '',
    profileDescription: loc.profile?.description || '',
    serviceAreaPlaces,
    services: serviceItemsToText(loc.serviceItems),
    serviceItemsList: serviceItemsToList(loc.serviceItems),
    primaryCategory: loc.categories?.primaryCategory?.displayName || '',
    primaryCategoryId: (loc.categories?.primaryCategory?.name || '').replace(/^categories\//, ''),
    // Raw structures so the panel/normalizer can render hours & open status.
    regularHours: loc.regularHours || null,
    openInfo: loc.openInfo || null,
    isVerified: loc.metadata?.hasVoiceOfMerchant === true,
    locationResourceName: name,
    businessProfileId: name,
  };
}

/**
 * GET /api/gmb/location-optimization?accountId=
 * Lists every Google Business location for the connected account, including the
 * profile description and service-area places used by the optimization panel.
 */
export async function GET(request) {
  try {
    await dbConnect();
    const session = await getGmbSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Google OAuth email can differ from the app-login email (managing another
    // account's GMB). The Google session token enforces authorization, so a missing app
    // user row must not block a valid session.
    const user = (await User.findOne({ email: session.user.email }).lean()) || {};

    const { searchParams } = new URL(request.url);
    const accountId =
      searchParams.get('accountId')?.trim() ||
      user.gmbProjectId ||
      user.selectedBusiness?.projectId ||
      user.selectedBusiness?.googleId ||
      '';

    if (!accountId) {
      return NextResponse.json({ error: 'accountId query param required' }, { status: 400 });
    }

    // A single login can be a MANAGER on several GMB accounts (each location can live under
    // a different accountId). Google enforces real permissions with the user's own OAuth
    // token, so accept the accountId when it matches any connected account OR when acting
    // with the user's session token.
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

    const platformToken =
      searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    // The requested accountId may NOT be one this token can access (a manager logs in with
    // their own Google account, and each listing can live under a different GMB account).
    // So gather locations across EVERY account the token manages and tag each with its own
    // accountId — that way the panel shows all editable listings and each patches correctly.
    let mapped = [];
    let firstError = null;

    // 1) Try the requested account directly (fast path when it is accessible).
    try {
      const direct = await fetchAllLocationsByAccount(accessToken, accountId);
      mapped = direct.map((loc) => mapLocation(loc, accountId));
    } catch (e) {
      firstError = e;
    }

    // 2) Aggregate across all accessible accounts (covers managed accounts + wrong id).
    try {
      const accountIds = await fetchAccessibleAccountIds(accessToken);
      const seen = new Set(mapped.map((m) => m.locationId));
      const perAccount = await Promise.all(
        accountIds
          .filter((id) => id !== accountId) // already fetched above
          .map(async (id) => {
            try {
              const locs = await fetchAllLocationsByAccount(accessToken, id);
              return locs.map((loc) => mapLocation(loc, id));
            } catch {
              return [];
            }
          })
      );
      for (const list of perAccount) {
        for (const m of list) {
          if (!seen.has(m.locationId)) {
            seen.add(m.locationId);
            mapped.push(m);
          }
        }
      }
    } catch (e) {
      // If we already got the direct-account locations, ignore the account-list failure.
      if (!mapped.length) firstError = firstError || e;
    }

    if (!mapped.length && firstError) {
      const status = firstError.status === 401 || firstError.status === 403 ? firstError.status : 502;
      return NextResponse.json(
        { error: firstError.message || 'Failed to load locations from Google' },
        { status }
      );
    }

    console.log(
      '[location-optimization] returning',
      mapped.length,
      'locations; descriptions:',
      JSON.stringify(
        mapped.map((m) => ({ id: m.locationId, descLen: (m.profileDescription || '').length }))
      )
    );

    return NextResponse.json({ success: true, accountId, locations: mapped });
  } catch (e) {
    console.error('[location-optimization GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
