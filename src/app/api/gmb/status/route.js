import { NextResponse } from "next/server";
import { findGmbSession, formatGmbSessionResponse } from "@/lib/gmbSessionStore";

export const dynamic = "force-dynamic";

/**
 * Chatbot polls this to get the connect result for a given session.
 *
 * GET /api/gmb/status?session_id=<uuid>
 *
 * Response (always 200):
 * {
 *   "status":        "success" | "not_found",
 *   "message":       "...",
 *   "locationsData": [ ... ] | []
 * }
 *
 * Optional auth via LIMBU_CHAT_STATUS_TOKEN:
 *   ?token=<secret>  OR  Authorization: Bearer <secret>
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ── optional token guard ─────────────────────────────────────────
    const tokenFromQuery  = searchParams.get("token")?.trim();
    const authHeader      = request.headers.get("authorization") || "";
    const tokenFromBearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    const token           = tokenFromQuery || tokenFromBearer;

    const expected = process.env.LIMBU_CHAT_STATUS_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── validate session_id ──────────────────────────────────────────
    const sessionId = searchParams.get("session_id")?.trim();
    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id query parameter is required" },
        { status: 400 }
      );
    }

    // ── fetch from GMBConnection ─────────────────────────────────────
    const row  = await findGmbSession(sessionId);
    const body = formatGmbSessionResponse(row);

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error("GET /api/gmb/status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch session status" },
      { status: 500 }
    );
  }
}
