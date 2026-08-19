/**
 * POST /api/gmb/sync-and-save
 *
 * Called when the user clicks "Continue to chatbot" on the connect page.
 * Phone is the ONLY external identifier — session_id is gone.
 *
 * Body: { phone: "919876543210" }
 *
 * What this does:
 *   1. Fetches all GMB listings from Google for the signed-in account.
 *   2. Saves listings + accessToken + refreshToken to GMBConnection (keyed by phone).
 *   3. Optionally fires LIMBU_BUSINESS_CONNECTED_WEBHOOK_URL.
 *   4. Returns { status, message, locationsData, phone }.
 */

import { NextResponse } from "next/server";
import { getGmbSession, getGmbConnection } from '@/lib/gmbSession';
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";
import {
  saveGmbSessionByPhone,
  normalizePhone,
} from "@/lib/gmbSessionStore";
import { postJsonWithRetry } from "@/lib/limbuGmbConnectChatbot";
import { upsertChatbotGmbUserDashboardRow } from "@/lib/gmbDashboardUsersSync";
import { saveUserBusinessListings } from "@/lib/adminBusinessStore";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const session = await getGmbSession(request);
    if (!session?.user?.email || !session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    let body = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const phone = normalizePhone(body.phone || "");
    if (!phone) {
      return NextResponse.json(
        { error: "phone is required in request body" },
        { status: 400 }
      );
    }

    const replaceExistingConnection = body.replaceExistingConnection === true;

    // ── Fetch GMB listings ──────────────────────────────────────────────────
    let allListings = [];
    try {
      allListings = await fetchAllUserGmbListings(session.accessToken);
    } catch (e) {
      return NextResponse.json(
        { error: e?.message || "Failed to load listings from Google" },
        { status: 502 }
      );
    }

    // ── Save to MongoDB (with tokens) ───────────────────────────────────────
    // accessToken + refreshToken are from the server-side Next.js session.
    // They are never sent from the client — fully secure.
    let saved;
    try {
      saved = await saveGmbSessionByPhone(
        phone,
        session.user.email,
        allListings,
        session.accessToken,
        session.refreshToken || ""
      );
    } catch (e) {
      console.error("[sync-and-save] DB save error:", e);
      return NextResponse.json(
        { error: e?.message || "Failed to save session" },
        { status: 500 }
      );
    }

    // ── Mirror dashboard GMB sync → adminbusinesses (same as POST /api/admin/saveBussiness) ──
    try {
      if (session.user.email || session.userId) {
        await saveUserBusinessListings(session.userId, session.user.email, allListings);
      }
    } catch (adminErr) {
      console.error("[sync-and-save] adminbusinesses mirror error:", adminErr);
    }

    // ── Mirror manual Google sign-in: `gmb_dashboard.users` + `source: "chatbot"` ──
    try {
      // Pehle ye NextAuth JWT ke `sub` se aata tha. Ab Google identity
      // connection record par hi maujood hai — koi JWT decode nahi chahiye.
      const conn = await getGmbConnection(session.userId);
      const googleId = conn?.googleId || "";

      await upsertChatbotGmbUserDashboardRow({
        phoneDigits: phone,
        userEmail: session.user.email,
        userName: conn?.name || "",
        userImage: conn?.image || "",
        googleId,
        accessToken: session.accessToken || "",
        refreshToken: session.refreshToken || "",
        replaceExistingConnection,
      });
    } catch (dashErr) {
      console.error("[sync-and-save] gmb_dashboard.users mirror error:", dashErr);
    }

    const response = {
      status:        saved.status,
      message:       saved.message,
      phone,
      email:         saved.userEmail,
      tokensReady:   !!(saved.accessToken && saved.refreshToken),
      locationsData: Array.isArray(saved.locationsData) ? saved.locationsData : [],
    };

    // ── Optional webhook (fire-and-forget) ──────────────────────────────────
    const hookUrl = process.env.LIMBU_BUSINESS_CONNECTED_WEBHOOK_URL?.trim();
    if (hookUrl) {
      const headers = { "Content-Type": "application/json" };
      const hookToken = process.env.LIMBU_BUSINESS_CONNECTED_WEBHOOK_TOKEN;
      if (hookToken) headers.Authorization = `Bearer ${hookToken}`;
      postJsonWithRetry(hookUrl, headers, response).catch((e) =>
        console.error("[sync-and-save] webhook error:", e)
      );
    }

    console.log(
      `[sync-and-save] phone=${phone} locations=${response.locationsData.length}` +
        ` tokens=${response.tokensReady}`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[sync-and-save] error:", error);
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
