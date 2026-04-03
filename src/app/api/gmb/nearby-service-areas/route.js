import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const USER_AGENT = 'GMB-App-BusinessOptimization/1.0';

function formatPlaceLine(name, { locality, administrativeArea, regionCode }) {
  if (!name || typeof name !== 'string') return null;
  const n = name.trim();
  if (!n) return null;
  const parts = [n];
  const city = (locality || '').trim();
  const state = (administrativeArea || '').trim();
  const country = regionCode === 'IN' || !regionCode ? 'India' : String(regionCode).trim();
  if (city && !n.toLowerCase().includes(city.toLowerCase())) parts.push(city);
  if (state && !parts.some((p) => p.toLowerCase().includes(state.toLowerCase()))) parts.push(state);
  if (country && !parts.some((p) => p.toLowerCase().includes(country.toLowerCase()))) parts.push(country);
  return parts.join(', ');
}

/**
 * POST /api/gmb/nearby-service-areas
 * Body: { latitude, longitude, radiusKm (2–12), locality?, administrativeArea?, regionCode? }
 * Uses OpenStreetMap Overpass (no API key) for suburbs/neighbourhoods within radius — approximate to Google-style place lines.
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

    const ctx = {
      locality: body.locality,
      administrativeArea: body.administrativeArea,
      regionCode: body.regionCode,
    };

    const query = `[out:json][timeout:25];
(
  node["place"="suburb"](around:${radiusM},${lat},${lng});
  node["place"="neighbourhood"](around:${radiusM},${lat},${lng});
  node["place"="quarter"](around:${radiusM},${lat},${lng});
  node["place"="locality"](around:${radiusM},${lat},${lng});
);
out tags 45;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      cache: 'no-store',
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: 'Nearby areas service returned invalid data', places: [] },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.remark || `Overpass error ${res.status}`, places: [] },
        { status: 502 }
      );
    }

    const elements = Array.isArray(data.elements) ? data.elements : [];
    const names = new Map();
    for (const el of elements) {
      const tags = el.tags || {};
      const raw = tags.name;
      if (!raw || typeof raw !== 'string') continue;
      const line = formatPlaceLine(raw, ctx);
      if (!line) continue;
      const key = line.toLowerCase();
      if (!names.has(key)) names.set(key, line);
    }

    const places = [...names.values()].slice(0, 40);

    return NextResponse.json({
      success: true,
      radiusKm,
      count: places.length,
      places,
    });
  } catch (e) {
    console.error('[nearby-service-areas]', e);
    return NextResponse.json({ error: e.message || 'Server error', places: [] }, { status: 500 });
  }
}
