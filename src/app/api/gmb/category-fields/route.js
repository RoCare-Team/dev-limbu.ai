import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { GMB_BUSINESS_INFORMATION_V1_BASE } from '@/lib/gmbLocationApiActions';
import { listCategoryAttributes } from '@/lib/gmbCategoryAttributes';

export const dynamic = 'force-dynamic';

const GMB_BASE = GMB_BUSINESS_INFORMATION_V1_BASE;

// Same token-resolution pattern used by location-optimization / patch-location.
async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

// Fetch the location's CURRENT attribute values, paginating nextPageToken.
async function fetchCurrentAttributes(accessToken, locationId) {
  const byName = new Map();
  let pageToken = '';
  do {
    const url = new URL(`${GMB_BASE}/locations/${encodeURIComponent(locationId)}/attributes`);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
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
    // A location with no attributes set returns 200 with no `attributes` array.
    if (!res.ok) break;
    if (Array.isArray(data.attributes)) {
      for (const a of data.attributes) {
        if (a?.name) byName.set(a.name, a);
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return byName;
}

// Normalize a stored attribute value into a plain UI value by valueType.
function normalizeCurrentValue(valueType, current) {
  if (!current) return valueType === 'REPEATED_ENUM' ? [] : null;
  switch (valueType) {
    case 'URL':
      return current.uriValues?.[0]?.uri ?? null;
    case 'BOOL':
      return typeof current.values?.[0] === 'boolean' ? current.values[0] : null;
    case 'ENUM':
      return current.values?.[0] ?? null;
    case 'REPEATED_ENUM':
      return Array.isArray(current.repeatedEnumValue?.setValues)
        ? current.repeatedEnumValue.setValues
        : [];
    default:
      return current.values?.[0] ?? null;
  }
}

/**
 * GET /api/gmb/category-fields?accountId=&locationId=[&regionCode=&languageCode=&refresh=1]
 *
 * Returns the category-driven list of editable attributes (metadata for the
 * location's primary category, merged with the location's current values).
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
      return NextResponse.json(
        { error: 'accountId and locationId query params required' },
        { status: 400 }
      );
    }

    const allowedAccount =
      user.gmbProjectId === accountId ||
      user.selectedBusiness?.projectId === accountId ||
      user.selectedBusiness?.googleId === accountId;
    if (!allowedAccount) {
      return NextResponse.json(
        { error: 'accountId does not match connected business' },
        { status: 403 }
      );
    }

    const platformToken =
      searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    const regionCode = searchParams.get('regionCode')?.trim() || '';
    const languageCode = searchParams.get('languageCode')?.trim() || '';
    const refresh = ['1', 'true'].includes(searchParams.get('refresh') || '');

    let category;
    try {
      category = await listCategoryAttributes(accessToken, locationId, {
        regionCode,
        languageCode,
        refresh,
      });
    } catch (e) {
      const status = e.status === 401 || e.status === 403 ? e.status : 502;
      return NextResponse.json(
        { error: e.message || 'Failed to load category attributes from Google' },
        { status }
      );
    }

    // Current values are per-location and must NOT be cached.
    const currentByName = await fetchCurrentAttributes(accessToken, locationId).catch(() => new Map());

    const attributes = (category.metadata || []).map((m) => {
      const options = Array.isArray(m.valueMetadata)
        ? m.valueMetadata.map((v) => ({ value: v.value, label: v.displayName || String(v.value) }))
        : [];
      return {
        name: m.parent,
        displayName: m.displayName || m.parent.replace(/^attributes\//, ''),
        group: m.groupDisplayName || 'Other',
        valueType: m.valueType || 'BOOL',
        repeatable: !!m.repeatable,
        options,
        currentValue: normalizeCurrentValue(m.valueType, currentByName.get(m.parent)),
      };
    });

    return NextResponse.json({
      success: true,
      accountId,
      locationId,
      categoryName: category.categoryName,
      primaryCategory: category.primaryCategory,
      primaryCategoryName: category.primaryCategoryName || '',
      additionalCategories: Array.isArray(category.additionalCategories) ? category.additionalCategories : [],
      regionCode: category.regionCode,
      languageCode: category.languageCode,
      capabilities: category.capabilities || {},
      attributes,
      cached: !refresh,
    });
  } catch (e) {
    console.error('[gmb/category-fields GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
