import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { GMB_BUSINESS_INFORMATION_V1_BASE } from '@/lib/gmbLocationApiActions';

export const dynamic = 'force-dynamic';

const GMB_BASE = GMB_BUSINESS_INFORMATION_V1_BASE;

// Same token-resolution pattern used by categories-search / category-fields.
async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

const normGcid = (n) => String(n || '').replace(/^categories\//, '').trim();

/**
 * GET /api/gmb/category-service-types
 *   ?names=gcid:a,gcid:b   -> Google's predefined service types for each category
 *   [&regionCode=IN] [&languageCode=en] [&accountId=]
 *
 * Fetches straight from Google (view=FULL, no local DB) so the one-click service
 * suggestions are the real, category-supported service types. Returns:
 *   { success, byCategory: { "gcid:a": { displayName, serviceTypes: [{ serviceTypeId, displayName }] } } }
 */
export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Google OAuth email can differ from the app-login email. Authorization is
    // enforced by the Google session token, so a missing app-user row must not block it.
    const user = (await User.findOne({ email: session.user.email }).lean()) || {};

    const { searchParams } = new URL(request.url);
    const regionCode = (searchParams.get('regionCode') || 'IN').trim() || 'IN';
    const languageCode = (searchParams.get('languageCode') || 'en').trim() || 'en';
    const names = Array.from(
      new Set(
        (searchParams.get('names') || '')
          .split(',')
          .map(normGcid)
          .filter(Boolean)
      )
    ).slice(0, 20); // Google caps batchGet at ~20 names.

    if (!names.length) {
      return NextResponse.json({ success: true, byCategory: {} });
    }

    const accountId =
      searchParams.get('accountId')?.trim() ||
      user.gmbProjectId ||
      user.selectedBusiness?.projectId ||
      user.selectedBusiness?.googleId ||
      '';
    const platformToken =
      searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    const url = new URL(`${GMB_BASE}/categories:batchGet`);
    url.searchParams.set('regionCode', regionCode);
    url.searchParams.set('languageCode', languageCode);
    url.searchParams.set('view', 'FULL');
    for (const n of names) url.searchParams.append('names', `categories/${n}`);

    const res = await fetch(url.toString(), {
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
      const status = res.status === 401 || res.status === 403 ? res.status : 502;
      return NextResponse.json(
        { error: data?.error?.message || `Google API ${res.status}` },
        { status }
      );
    }

    const byCategory = {};
    for (const c of Array.isArray(data.categories) ? data.categories : []) {
      const gcid = normGcid(c?.name);
      if (!gcid) continue;
      const serviceTypes = (Array.isArray(c?.serviceTypes) ? c.serviceTypes : [])
        .map((t) => ({
          serviceTypeId: String(t?.serviceTypeId || '').trim(),
          displayName: String(t?.displayName || '').trim(),
        }))
        .filter((t) => t.displayName);
      byCategory[gcid] = {
        displayName: String(c?.displayName || '').trim(),
        serviceTypes,
      };
    }

    return NextResponse.json({ success: true, byCategory });
  } catch (e) {
    console.error('[gmb/category-service-types GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
