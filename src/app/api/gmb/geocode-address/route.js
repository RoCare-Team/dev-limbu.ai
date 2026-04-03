import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const USER_AGENT = 'GMB-Optimization/1.0';

function buildSearchQuery(body) {
  if (typeof body.query === 'string' && body.query.trim().length >= 3) {
    return body.query.trim();
  }
  const parts = [
    body.fullAddress,
    body.address,
    body.locality,
    body.administrativeArea,
    body.postalCode,
    body.regionCode === 'IN' || !body.regionCode ? 'India' : body.regionCode,
  ]
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);
  let q = parts.join(', ').trim();
  if (typeof body.businessTitle === 'string' && body.businessTitle.trim() && q) {
    q = `${body.businessTitle.trim()}, ${q}`;
  }
  return q;
}

/**
 * POST /api/gmb/geocode-address
 * Resolves lat/lng from storefront-style address (OpenStreetMap Nominatim).
 * Body: { query? } or { fullAddress?, address?, locality?, administrativeArea?, postalCode?, regionCode?, businessTitle? }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const q = buildSearchQuery(body);
    if (!q || q.length < 3) {
      return NextResponse.json({ error: 'Provide a query or address fields to geocode.' }, { status: 400 });
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', q);

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      return NextResponse.json({ error: 'Geocoder returned invalid data' }, { status: 502 });
    }

    if (!res.ok || !Array.isArray(data) || !data.length) {
      return NextResponse.json(
        { error: 'No location found for this address. Try entering latitude and longitude manually.' },
        { status: 404 }
      );
    }

    const hit = data[0];
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates from geocoder' }, { status: 502 });
    }

    return NextResponse.json({
      lat,
      lng,
      displayName: typeof hit.display_name === 'string' ? hit.display_name : q,
      queryUsed: q,
    });
  } catch (e) {
    console.error('[geocode-address]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
