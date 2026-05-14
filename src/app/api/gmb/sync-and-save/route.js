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
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";
import {
  saveGmbSessionByPhone,
  normalizePhone,
} from "@/lib/gmbSessionStore";
import { postJsonWithRetry } from "@/lib/limbuGmbConnectChatbot";
import { upsertChatbotGmbUserDashboardRow } from "@/lib/gmbDashboardUsersSync";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
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

    // ── Mirror manual Google sign-in: `gmb_dashboard.users` + `source: "chatbot"` ──
    try {
      let googleId = "";
      try {
        const jwt = await getToken({
          req: request,
          secret: authOptions.secret,
        });
        googleId = jwt?.sub || "";
      } catch (tokErr) {
        console.warn("[sync-and-save] getToken:", tokErr?.message);
      }
      if (!googleId && session?.user?.id) {
        googleId = String(session.user.id);
      }

      await upsertChatbotGmbUserDashboardRow({
        phoneDigits: phone,
        userEmail: session.user.email,
        userName: session.user?.name || "",
        userImage: session.user?.image || "",
        googleId,
        accessToken: session.accessToken || "",
        refreshToken: session.refreshToken || "",
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
