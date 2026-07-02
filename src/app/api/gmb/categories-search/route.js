import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import GmbCategory from '@/models/GmbCategory';
import { categoryTokens, tokenSimilarity } from '@/lib/gmbCategoryTokens';
import { GMB_BUSINESS_INFORMATION_V1_BASE } from '@/lib/gmbLocationApiActions';

export const dynamic = 'force-dynamic';

const GMB_BASE = GMB_BUSINESS_INFORMATION_V1_BASE;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Same token-resolution pattern used by category-fields / patch-location.
async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

// Live Google fallback (only used when this region has not been synced to Mongo yet).
async function googleCategorySearch(accessToken, { query, regionCode, languageCode }) {
  const url = new URL(`${GMB_BASE}/categories`);
  url.searchParams.set('regionCode', regionCode);
  url.searchParams.set('languageCode', languageCode);
  url.searchParams.set('view', 'BASIC');
  url.searchParams.set('filter', `displayName=${query}`);
  url.searchParams.set('pageSize', '20');
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
    const err = new Error(data?.error?.message || `Google API ${res.status}`);
    err.status = res.status === 401 || res.status === 403 ? res.status : 502;
    throw err;
  }
  return (Array.isArray(data.categories) ? data.categories : [])
    .map((c) => ({ name: String(c?.name || '').replace(/^categories\//, ''), displayName: String(c?.displayName || '').trim() }))
    .filter((c) => c.name && c.displayName);
}

/**
 * GET /api/gmb/categories-search
 *   ?query=<text>                 -> substring search (Google-supported categories)
 *   ?similarTo=<display name>     -> name-similarity suggestions (sub-categories)
 *   [&exclude=gcid1,gcid2] [&regionCode=IN] [&languageCode=en] [&accountId=]
 *
 * Reads from the synced `gmbcategories` Mongo collection (populated by
 * scripts/sync-gmb-categories.mjs) — the real Google catalog. Falls back to a live
 * Google call only if the region has not been synced yet.
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
    const query = (searchParams.get('query') || '').trim();
    const similarTo = (searchParams.get('similarTo') || '').trim();
    const regionCode = (searchParams.get('regionCode') || 'IN').trim() || 'IN';
    const languageCode = (searchParams.get('languageCode') || 'en').trim() || 'en';
    const excludeSet = new Set(
      (searchParams.get('exclude') || '')
        .split(',')
        .map((s) => s.replace(/^categories\//, '').trim())
        .filter(Boolean)
    );
    const accountId =
      searchParams.get('accountId')?.trim() ||
      user.gmbProjectId ||
      user.selectedBusiness?.projectId ||
      user.selectedBusiness?.googleId ||
      '';

    if (!query && !similarTo) {
      return NextResponse.json({ success: true, categories: [] });
    }

    // Is this region synced to Mongo? If so, serve everything from the DB (fast, no
    // token needed). If not, fall back to a live Google search for `query`.
    const dbCount = await GmbCategory.countDocuments({ regionCode, languageCode });

    // ── Similarity suggestions (sub-categories for a chosen primary) ─────────────
    if (similarTo) {
      if (!dbCount) {
        // Not synced yet — best-effort live fallback using the most meaningful word.
        const term = categoryTokens(similarTo)[0] || similarTo;
        try {
          const platformToken =
            searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
          const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
          if (!accessToken) return NextResponse.json({ success: true, categories: [], synced: false });
          const live = await googleCategorySearch(accessToken, { query: term, regionCode, languageCode });
          return NextResponse.json({
            success: true,
            synced: false,
            categories: live.filter((c) => !excludeSet.has(c.name)).slice(0, 8),
          });
        } catch {
          return NextResponse.json({ success: true, categories: [], synced: false });
        }
      }
      const tokens = categoryTokens(similarTo);
      if (!tokens.length) return NextResponse.json({ success: true, synced: true, categories: [] });
      // Pull candidates that share at least one meaningful token, then rank by overlap.
      const candidates = await GmbCategory.find({
        regionCode,
        languageCode,
        tokens: { $in: tokens },
      })
        .select('name displayName tokens')
        .limit(400)
        .lean();
      const ranked = candidates
        .filter((c) => c.name && !excludeSet.has(c.name) && c.displayName.toLowerCase() !== similarTo.toLowerCase())
        .map((c) => ({ name: c.name, displayName: c.displayName, score: tokenSimilarity(tokens, c.tokens) }))
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score || a.displayName.length - b.displayName.length)
        .slice(0, 8)
        .map(({ name, displayName }) => ({ name, displayName }));
      return NextResponse.json({ success: true, synced: true, categories: ranked });
    }

    // ── Substring search ─────────────────────────────────────────────────────────
    if (query.length < 2) {
      return NextResponse.json({ success: true, categories: [] });
    }

    if (dbCount) {
      const rx = new RegExp(escapeRegex(query.toLowerCase()));
      const rows = await GmbCategory.find({
        regionCode,
        languageCode,
        displayNameLower: rx,
      })
        .select('name displayName displayNameLower')
        .limit(40)
        .lean();
      // Prefix matches first, then alphabetical — keeps the most relevant on top.
      const q = query.toLowerCase();
      const results = rows
        .sort((a, b) => {
          const ap = a.displayNameLower.startsWith(q) ? 0 : 1;
          const bp = b.displayNameLower.startsWith(q) ? 0 : 1;
          return ap - bp || a.displayName.length - b.displayName.length;
        })
        .slice(0, 20)
        .map((c) => ({ name: c.name, displayName: c.displayName }));
      return NextResponse.json({ success: true, synced: true, categories: results });
    }

    // Region not synced — live Google fallback (needs a token).
    const platformToken =
      searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }
    try {
      const live = await googleCategorySearch(accessToken, { query, regionCode, languageCode });
      return NextResponse.json({ success: true, synced: false, categories: live });
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Google search failed' }, { status: e.status || 502 });
    }
  } catch (e) {
    console.error('[gmb/categories-search GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
