import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { GMB_BUSINESS_INFORMATION_V1_BASE } from '@/lib/gmbLocationApiActions';

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
  'metadata',
].join(',');

async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
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
    websiteUrl: loc.websiteUri || '',
    primaryPhone: loc.phoneNumbers?.primaryPhone || '',
    profileDescription: loc.profile?.description || '',
    serviceAreaPlaces,
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

    if (!accountId) {
      return NextResponse.json({ error: 'accountId query param required' }, { status: 400 });
    }

    const allowedAccount =
      user.gmbProjectId === accountId ||
      user.selectedBusiness?.projectId === accountId ||
      user.selectedBusiness?.googleId === accountId;
    if (!allowedAccount) {
      return NextResponse.json({ error: 'accountId does not match connected business' }, { status: 403 });
    }

    const platformToken =
      searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    let locations;
    try {
      locations = await fetchAllLocationsByAccount(accessToken, accountId);
    } catch (e) {
      const status = e.status === 401 || e.status === 403 ? e.status : 502;
      return NextResponse.json(
        { error: e.message || 'Failed to load locations from Google' },
        { status }
      );
    }

    const mapped = locations.map((loc) => mapLocation(loc, accountId));

    return NextResponse.json({ success: true, accountId, locations: mapped });
  } catch (e) {
    console.error('[location-optimization GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
