import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import {
  GMB_BUSINESS_INFORMATION_READ_MASK,
  normalizeGmbLocationRecord,
} from '@/lib/gmbLocationDataset';

export const dynamic = 'force-dynamic';

async function resolveAccessToken(session, accountId, email) {
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

/** Business Information API: GET .../v1/locations/{id}/attributes → url_whatsapp */
async function fetchWhatsappAttributeUri(accessToken, locationId) {
  try {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${encodeURIComponent(locationId)}/attributes`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return '';
    const data = await res.json();
    const attrs = Array.isArray(data.attributes) ? data.attributes : [];
    const wa = attrs.find(
      (a) => a.name === 'attributes/url_whatsapp' || String(a.name || '').endsWith('url_whatsapp')
    );
    const u = wa?.uriValues?.[0]?.uri;
    return typeof u === 'string' ? u.trim() : '';
  } catch {
    return '';
  }
}

/**
 * GET /api/gmb/location-optimization?accountId=...&locationId=... (optional — omit for all in account)
 */
export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const accountId =
      searchParams.get('accountId')?.trim() ||
      user.gmbProjectId ||
      user.selectedBusiness?.projectId ||
      user.selectedBusiness?.googleId ||
      '';
    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId and no gmbProjectId on user — connect Google Business first.' },
        { status: 400 }
      );
    }

    const accessToken = await resolveAccessToken(session, accountId, session.user.email);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No Google access token — sign in with Google again to refresh OAuth.' },
        { status: 401 }
      );
    }

    const filterLocationId = searchParams.get('locationId')?.trim() || '';

    let all = [];
    let pageToken = null;
    do {
      let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${encodeURIComponent(accountId)}/locations?readMask=${encodeURIComponent(GMB_BUSINESS_INFORMATION_READ_MASK)}&pageSize=100`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Google Business API error ${res.status}`, detail: errText.slice(0, 500) },
          { status: 502 }
        );
      }

      const data = await res.json();
      if (Array.isArray(data.locations)) {
        all = all.concat(data.locations);
      }
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    let locations = all;
    if (filterLocationId) {
      locations = all.filter((loc) => {
        const name = loc.name || '';
        const id = name.includes('/') ? name.split('/').pop() : '';
        return id === filterLocationId || loc.name === `locations/${filterLocationId}`;
      });
    }

    const normalized = (
      await Promise.all(
        locations.map(async (loc) => {
          const base = normalizeGmbLocationRecord(loc, accountId);
          if (!base?.locationId) return null;
          const whatsappUri = await fetchWhatsappAttributeUri(accessToken, base.locationId);
          return { ...base, whatsappUri };
        })
      )
    ).filter(Boolean);

    return NextResponse.json({
      accountId,
      count: normalized.length,
      locations: normalized,
    });
  } catch (e) {
    console.error('[location-optimization]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
