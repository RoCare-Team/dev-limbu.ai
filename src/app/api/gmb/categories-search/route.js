import { NextResponse } from 'next/server';
import { getGmbSession } from '@/lib/gmbSession';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { categoryTokens, tokenSimilarity } from '@/lib/gmbCategoryTokens';
import { GMB_BUSINESS_INFORMATION_V1_BASE } from '@/lib/gmbLocationApiActions';

export const dynamic = 'force-dynamic';

const GMB_BASE = GMB_BUSINESS_INFORMATION_V1_BASE;

// Same token-resolution pattern used by category-fields / patch-location.
async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

// Live Google category search. Categories come straight from Google (no local DB),
// so only real, Google-supported categories are ever returned. Pages through the
// full result set so nothing is dropped.
async function googleCategorySearch(accessToken, { query, regionCode, languageCode }) {
  const out = [];
  let pageToken = '';
  // A few pages is plenty for a single filter term; guard against runaway loops.
  for (let page = 0; page < 5; page += 1) {
    const url = new URL(`${GMB_BASE}/categories`);
    url.searchParams.set('regionCode', regionCode);
    url.searchParams.set('languageCode', languageCode);
    url.searchParams.set('view', 'BASIC');
    url.searchParams.set('filter', `displayName=${query}`);
    url.searchParams.set('pageSize', '100');
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
    if (!res.ok) {
      const err = new Error(data?.error?.message || `Google API ${res.status}`);
      err.status = res.status === 401 || res.status === 403 ? res.status : 502;
      throw err;
    }
    for (const c of Array.isArray(data.categories) ? data.categories : []) {
      const name = String(c?.name || '').replace(/^categories\//, '');
      const displayName = String(c?.displayName || '').trim();
      if (name && displayName) out.push({ name, displayName });
    }
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return out;
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
    const session = await getGmbSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Google OAuth email can differ from the app-login email. Authorization is
    // enforced by the Google session token, so a missing app-user row must not block it.
    const user = (await User.findOne({ email: session.user.email }).lean()) || {};

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

    // No local DB — every category is fetched live from Google, so only real,
    // Google-supported categories are ever suggested. A token is always required.
    const platformToken =
      searchParams.get('googleAccessToken')?.trim() || searchParams.get('accessToken')?.trim() || '';
    const accessToken = await resolveAccessToken(session, accountId, session.user.email, platformToken);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    // ── Similarity suggestions (sub-categories for a chosen primary) ─────────────
    // Search Google with the meaningful words from the primary name, merge every
    // result, then rank by how well each matches. All matches are returned.
    if (similarTo) {
      const tokens = categoryTokens(similarTo);
      const terms = tokens.length ? tokens.slice(0, 3) : [similarTo];
      const merged = new Map();
      for (const term of terms) {
        try {
          const live = await googleCategorySearch(accessToken, { query: term, regionCode, languageCode });
          for (const c of live) {
            if (!merged.has(c.name)) merged.set(c.name, c);
          }
        } catch (e) {
          // 401/403 means the token is dead — surface it; other term failures are skipped.
          if (e.status === 401 || e.status === 403) {
            return NextResponse.json({ error: e.message || 'Google search failed' }, { status: e.status });
          }
        }
      }
      const baseTokens = tokens.length ? tokens : categoryTokens(similarTo);
      const ranked = [...merged.values()]
        .filter(
          (c) => !excludeSet.has(c.name) && c.displayName.toLowerCase() !== similarTo.toLowerCase()
        )
        .map((c) => ({ ...c, score: tokenSimilarity(baseTokens, categoryTokens(c.displayName)) }))
        .sort((a, b) => b.score - a.score || a.displayName.length - b.displayName.length)
        .map(({ name, displayName }) => ({ name, displayName }));
      return NextResponse.json({ success: true, synced: false, categories: ranked });
    }

    // ── Substring search ─────────────────────────────────────────────────────────
    if (query.length < 2) {
      return NextResponse.json({ success: true, categories: [] });
    }
    try {
      const live = await googleCategorySearch(accessToken, { query, regionCode, languageCode });
      const results = live.filter((c) => !excludeSet.has(c.name));
      return NextResponse.json({ success: true, synced: false, categories: results });
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Google search failed' }, { status: e.status || 502 });
    }
  } catch (e) {
    console.error('[gmb/categories-search GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
