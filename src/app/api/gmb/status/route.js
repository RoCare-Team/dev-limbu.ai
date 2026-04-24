import { NextResponse } from "next/server";
import { findGmbSessionByPhone, formatGmbSessionResponse, normalizePhone } from "@/lib/gmbSessionStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmb/status?phone=919876543210
 *
 * Phone is the ONLY identifier. session_id is removed.
 *
 * Response:
 * {
 *   status:            "success" | "not_found",
 *   businessConnected: boolean,
 *   tokensReady:       boolean,
 *   paymentStatus:     "none" | "paid",
 *   phone:             string,
 *   email:             string,
 *   message:           string,
 *   locationsData:     [ ... ]
 * }
 *
 * Optional auth: LIMBU_CHAT_STATUS_TOKEN via ?token= or Authorization: Bearer
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ── Optional token guard ────────────────────────────────────────────────
    const tokenFromQuery  = searchParams.get("token")?.trim();
    const authHeader      = request.headers.get("authorization") || "";
    const tokenFromBearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    const token           = tokenFromQuery || tokenFromBearer;
    const expected        = process.env.LIMBU_CHAT_STATUS_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Validate phone ──────────────────────────────────────────────────────
    const phone = normalizePhone(searchParams.get("phone") || "");
    if (!phone) {
      return NextResponse.json(
        { error: "phone query parameter is required (digits only, e.g. 919876543210)" },
        { status: 400 }
      );
    }

    const row  = await findGmbSessionByPhone(phone);
    const body = formatGmbSessionResponse(row);

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error("GET /api/gmb/status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}
