import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';

export const dynamic = 'force-dynamic';

async function resolveAccessToken(session, accountId, email) {
  if (session?.accessToken) return session.accessToken;
  const gmb = await GmbUser.findOne({ email }).lean();
  const proj = gmb?.projects?.find((p) => p.googleId === accountId) || gmb?.projects?.[0];
  return proj?.accessToken || '';
}

/**
 * POST /api/gmb/patch-location-profile
 * Body: { accountId, locationId, description }
 * Patches Business Information v1 location profile.description (Google may enforce policies).
 */
export async function POST(request) {
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

    const body = await request.json().catch(() => ({}));
    const accountId = String(body.accountId || user.gmbProjectId || '').trim();
    const locationId = String(body.locationId || '').trim();
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (!accountId || !locationId) {
      return NextResponse.json({ error: 'accountId and locationId required' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: 'description (non-empty string) required' }, { status: 400 });
    }

    const allowedAccount =
      user.gmbProjectId === accountId ||
      user.selectedBusiness?.projectId === accountId ||
      user.selectedBusiness?.googleId === accountId;
    if (!allowedAccount) {
      return NextResponse.json({ error: 'accountId does not match connected business' }, { status: 403 });
    }

    const accessToken = await resolveAccessToken(session, accountId, session.user.email);
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google access token — sign in again.' }, { status: 401 });
    }

    const resource = `locations/${locationId}`;
    const url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${resource}`
    );
    url.searchParams.set('updateMask', 'profile.description');

    /** Google often enforces ~750 chars for profile.description; longer text is truncated. */
    const maxLen = 750;
    const trimmed = description.slice(0, maxLen);
    const patchBody = {
      profile: {
        description: trimmed,
      },
    };

    const res = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Google API ${res.status}`,
          detail: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      locationId,
      profile: data.profile || patchBody.profile,
      truncated: description.length > maxLen,
      maxLength: maxLen,
    });
  } catch (e) {
    console.error('[patch-location-profile]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
