import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const USER_AGENT = 'GMB-App-BusinessOptimization/1.0';

function mapsApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY_1 ||
    process.env.GOOGLE_MAPS_API_KEY_2 ||
    process.env.GOOGLE_MAPS_API_KEY_3 ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

// Place types Google Business ACCEPTS as a service area. Anything more granular is
// rejected by GBP with INVALID_AREA_TYPE_FOR_SERVICE_AREA, so only suggest these.
const SERVICE_AREA_REGION_TYPES = new Set([
  'locality',
  'sublocality_level_1',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'postal_code',
]);

// Never suggest an area that resolves to one of these — GBP will reject it.
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

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Discover candidate area names near the point via OpenStreetMap (no key needed).
async function fetchOsmCandidates(lat, lng, radiusM) {
  const query = `[out:json][timeout:25];
(
  node["place"="suburb"](around:${radiusM},${lat},${lng});
  node["place"="neighbourhood"](around:${radiusM},${lat},${lng});
  node["place"="quarter"](around:${radiusM},${lat},${lng});
  node["place"="locality"](around:${radiusM},${lat},${lng});
  node["place"="town"](around:${radiusM},${lat},${lng});
  node["place"="village"](around:${radiusM},${lat},${lng});
);
out tags 60;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    body: `data=${encodeURIComponent(query)}`,
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  const elements = Array.isArray(data.elements) ? data.elements : [];
  const out = [];
  const seen = new Set();
  for (const el of elements) {
    const name = String(el?.tags?.name || '').trim();
    if (!name) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name, lat: el.lat, lng: el.lng });
  }
  return out;
}

// Resolve a candidate name to a Google region (placeId + canonical name) via Geocoding,
// biased around the business point. Only accepts region-type results inside the radius.
async function resolveToGoogleRegion(candidate, ctx, apiKey, center, radiusKm) {
  const parts = [candidate.name];
  if (ctx.locality && !candidate.name.toLowerCase().includes(String(ctx.locality).toLowerCase())) {
    parts.push(ctx.locality);
  }
  if (ctx.administrativeArea) parts.push(ctx.administrativeArea);
  parts.push(ctx.regionCode === 'IN' || !ctx.regionCode ? 'India' : String(ctx.regionCode));
  const address = parts.filter(Boolean).join(', ');

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey);
  // Bias toward the business area so we get the right same-city region.
  if (ctx.regionCode) url.searchParams.set('region', String(ctx.regionCode).toLowerCase());

  const res = await fetch(url.toString(), { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (data.status && data.status !== 'OK') {
    return { error: data.error_message || data.status };
  }
  const results = Array.isArray(data.results) ? data.results : [];
  // Only accept region-level results with an allowed type and NO too-granular type,
  // so every suggestion is one GBP will actually save.
  const hit =
    results.find((r) => {
      const types = r.types || [];
      return (
        r.place_id &&
        types.some((t) => SERVICE_AREA_REGION_TYPES.has(t)) &&
        !types.some((t) => SERVICE_AREA_REJECTED_TYPES.has(t))
      );
    }) || null;
  if (!hit?.place_id) return { skip: true };

  // Keep only regions whose center is within the requested radius of the business.
  const loc = hit.geometry?.location;
  if (loc && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
    const dist = haversineKm(center.lat, center.lng, loc.lat, loc.lng);
    if (dist > radiusKm * 1.6) return { skip: true }; // small buffer for region centroids
  }
  return {
    placeId: hit.place_id,
    placeName: hit.formatted_address || address,
  };
}

/**
 * POST /api/gmb/nearby-service-areas
 * Body: { latitude, longitude, radiusKm (2–12), locality?, administrativeArea?, regionCode? }
 *
 * Discovers nearby areas via OpenStreetMap, then validates each against the Google
 * Geocoding API so every returned place is a real Google region with a placeId — which
 * is exactly what Google Business serviceArea needs to actually save. Returns both the
 * canonical names (`places`) and `{ placeName, placeId }` infos so the save can use the
 * exact placeId without re-resolving.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    let radiusKm = Number(body.radiusKm);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'latitude and longitude must be valid numbers' }, { status: 400 });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'coordinates out of range' }, { status: 400 });
    }
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) radiusKm = 4;
    radiusKm = Math.min(Math.max(radiusKm, 2), 12);
    const radiusM = Math.round(radiusKm * 1000);

    const apiKey = mapsApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Google Maps API key configured on the server.', places: [], placeInfos: [] },
        { status: 500 }
      );
    }

    const ctx = {
      locality: body.locality,
      administrativeArea: body.administrativeArea,
      regionCode: body.regionCode,
    };

    const candidates = await fetchOsmCandidates(lat, lng, radiusM);
    if (!candidates.length) {
      return NextResponse.json({ success: true, radiusKm, count: 0, places: [], placeInfos: [] });
    }

    // Validate candidates against Google (cap to keep latency/quota reasonable).
    const center = { lat, lng };
    const capped = candidates.slice(0, 24);
    const settled = await Promise.all(
      capped.map((c) => resolveToGoogleRegion(c, ctx, apiKey, center, radiusKm).catch(() => ({ skip: true })))
    );

    let apiError = '';
    const byPlaceId = new Map();
    for (const r of settled) {
      if (r?.error && !apiError) apiError = r.error;
      if (r?.placeId && !byPlaceId.has(r.placeId)) {
        byPlaceId.set(r.placeId, { placeName: r.placeName, placeId: r.placeId });
      }
    }

    const placeInfos = [...byPlaceId.values()].slice(0, 40);
    const places = placeInfos.map((p) => p.placeName);

    // If Google rejected the key (e.g. Geocoding API not enabled), surface it clearly.
    if (!places.length && apiError) {
      return NextResponse.json(
        { error: `Google Maps could not resolve nearby areas: ${apiError}`, places: [], placeInfos: [] },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, radiusKm, count: places.length, places, placeInfos });
  } catch (e) {
    console.error('[nearby-service-areas]', e);
    return NextResponse.json({ error: e.message || 'Server error', places: [], placeInfos: [] }, { status: 500 });
  }
}
