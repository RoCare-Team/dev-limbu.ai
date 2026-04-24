import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";
import {
  saveGmbSession,
  normalizePhone,
  sessionIdFromPhone,
} from "@/lib/gmbSessionStore";
import { postJsonWithRetry } from "@/lib/limbuGmbConnectChatbot";

export const dynamic = "force-dynamic";

/**
 * POST /api/gmb/sync-and-save
 * Body: { session_id: string }
 *
 * 1. Fetches all GMB listings for the signed-in Google account.
 * 2. Saves them to the GMBConnection collection keyed by session_id.
 * 3. Optionally fires LIMBU_BUSINESS_CONNECTED_WEBHOOK_URL with the result.
 * 4. Returns { status, message, locationsData } — same shape as GET /api/gmb/status.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── parse body ──────────────────────────────────────────────────
    let body = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const phone     = normalizePhone(body.phone || "");
    let   sessionId = body.session_id?.toString()?.trim();

    // If no explicit session_id but phone is provided, derive one deterministically
    if (!sessionId && phone) {
      sessionId = sessionIdFromPhone(phone);
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id or phone is required in request body" },
        { status: 400 }
      );
    }

    // ── fetch Google Business listings ───────────────────────────────
    let allListings = [];
    try {
      allListings = await fetchAllUserGmbListings(session.accessToken);
    } catch (e) {
      return NextResponse.json(
        { error: e?.message || "Failed to load listings from Google" },
        { status: 502 }
      );
    }

    // ── save to GMBConnection (new collection) ───────────────────────
    const userEmail = session.user.email;
    let saved;
    try {
      saved = await saveGmbSession(sessionId, userEmail, allListings, phone);
    } catch (e) {
      console.error("sync-and-save DB save:", e);
      return NextResponse.json(
        { error: e?.message || "Failed to save session" },
        { status: 500 }
      );
    }

    const response = {
      status:        saved.status,
      message:       saved.message,
      locationsData: Array.isArray(saved.locationsData) ? saved.locationsData : [],
      session_id:    sessionId,
      ...(phone ? { phone } : {}),
    };

    // ── optional webhook (fire-and-forget with retry) ────────────────
    const hookUrl = process.env.LIMBU_BUSINESS_CONNECTED_WEBHOOK_URL?.trim();
    if (hookUrl) {
      const hookToken = process.env.LIMBU_BUSINESS_CONNECTED_WEBHOOK_TOKEN;
      const headers = { "Content-Type": "application/json" };
      if (hookToken) headers.Authorization = `Bearer ${hookToken}`;
      postJsonWithRetry(hookUrl, headers, response).catch((e) =>
        console.error("sync-and-save webhook:", e)
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("sync-and-save:", error);
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
