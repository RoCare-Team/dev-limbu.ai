import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { resolveLocationCategory } from '@/lib/gmbCategoryAttributes';
import {
  getFoodMenus,
  updateFoodMenus,
  normalizeFoodMenus,
  buildFoodMenusBody,
} from '@/lib/gmbFoodMenu';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function resolveAccessToken(session, accountId, email, bodyToken) {
  const fromBody = typeof bodyToken === 'string' ? bodyToken.trim() : '';
  if (fromBody) return fromBody;
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

async function authContext(request, { fromBody } = {}) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: 'Unauthorized', status: 401 };

  // Optional: Google OAuth email can differ from the app-login email. Authorization is
  // enforced by the Google session token, so a missing app-user row must not block it.
  const user = (await User.findOne({ email: session.user.email }).lean()) || {};

  let accountId;
  let locationId;
  let bodyToken = '';
  let body = null;
  if (fromBody) {
    body = await request.json().catch(() => ({}));
    accountId = String(body.accountId || '').trim();
    locationId = String(body.locationId || '').trim();
    bodyToken = body.googleAccessToken || body.accessToken || '';
  } else {
    const sp = new URL(request.url).searchParams;
    accountId = sp.get('accountId')?.trim() || '';
    locationId = sp.get('locationId')?.trim() || '';
    bodyToken = sp.get('googleAccessToken')?.trim() || sp.get('accessToken')?.trim() || '';
  }
  accountId =
    accountId || user.gmbProjectId || user.selectedBusiness?.projectId || user.selectedBusiness?.googleId || '';

  if (!accountId || !locationId) {
    return { error: 'accountId and locationId required', status: 400 };
  }

  // A single login can be a MANAGER on several GMB accounts (each location can live under a
  // different accountId). Google enforces real permissions with the user's own OAuth token,
  // so accept the accountId when it matches any connected account OR when acting with the
  // user's session token.
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
  if (!allowedAccount) return { error: 'accountId does not match connected business', status: 403 };

  const accessToken = await resolveAccessToken(session, accountId, session.user.email, bodyToken);
  if (!accessToken) return { error: 'No Google access token — sign in again.', status: 401 };

  return { session, user, accountId, locationId, accessToken, body };
}

/**
 * GET /api/gmb/food-menu?accountId=&locationId=
 * Returns eligibility (canHaveFoodMenus) + the current menu in the simple UI model.
 */
export async function GET(request) {
  try {
    const ctx = await authContext(request);
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    const { accessToken, accountId, locationId } = ctx;

    let eligible = false;
    let primaryCategory = '';
    try {
      const cat = await resolveLocationCategory(accessToken, locationId);
      eligible = !!cat.capabilities?.canHaveFoodMenus;
      primaryCategory = cat.primaryCategory || '';
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Could not read location' }, { status: 502 });
    }

    if (!eligible) {
      return NextResponse.json({ success: true, eligible: false, primaryCategory, menu: { currency: 'INR', sections: [] } });
    }

    const res = await getFoodMenus(accessToken, accountId, locationId);
    // A location with no menu yet can return 404 / empty — treat as an empty menu.
    if (!res.ok && res.status !== 404) {
      return NextResponse.json(
        { error: res.data?.error?.message || `Google API ${res.status}`, eligible: true },
        { status: res.status === 401 || res.status === 403 ? res.status : 502 }
      );
    }
    const menu = normalizeFoodMenus(res.ok ? res.data : {});
    return NextResponse.json({ success: true, eligible: true, primaryCategory, menu });
  } catch (e) {
    console.error('[gmb/food-menu GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/gmb/food-menu
 * Body: { accountId, locationId, menu: { currency, sections: [{ name, items: [{ name, description, price }] }] } }
 */
export async function POST(request) {
  try {
    const ctx = await authContext(request, { fromBody: true });
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    const { accessToken, accountId, locationId, body } = ctx;

    // Eligibility guard — never PATCH a location that can't have food menus.
    let languageCode = 'en';
    try {
      const cat = await resolveLocationCategory(accessToken, locationId);
      if (!cat.capabilities?.canHaveFoodMenus) {
        return NextResponse.json(
          { error: 'This location is not eligible for a food menu on Google.' },
          { status: 400 }
        );
      }
      languageCode = cat.languageCode || 'en';
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Could not verify eligibility' }, { status: 502 });
    }

    const uiModel = body?.menu && typeof body.menu === 'object' ? body.menu : { sections: [] };
    const patchBody = buildFoodMenusBody(uiModel, { languageCode });

    if (!patchBody.menus[0].sections.length) {
      return NextResponse.json(
        { error: 'Add at least one section with a named item (and price) before saving.' },
        { status: 400 }
      );
    }

    const res = await updateFoodMenus(accessToken, accountId, locationId, patchBody);
    if (!res.ok) {
      return NextResponse.json(
        { error: res.data?.error?.message || `Google API ${res.status}`, detail: res.data },
        { status: res.status === 401 || res.status === 403 ? res.status : 502 }
      );
    }
    return NextResponse.json({ success: true, menu: normalizeFoodMenus(res.data) });
  } catch (e) {
    console.error('[gmb/food-menu POST]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
