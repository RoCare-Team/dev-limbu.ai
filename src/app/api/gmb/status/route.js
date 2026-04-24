import { NextResponse } from "next/server";
import {
  findGmbSession,
  findGmbSessionByPhone,
  formatGmbSessionResponse,
} from "@/lib/gmbSessionStore";

export const dynamic = "force-dynamic";

/**
 * Chatbot polls this to get the connect result for a session or phone number.
 *
 * GET /api/gmb/status?session_id=<uuid>
 * GET /api/gmb/status?phone=919876543210          ← new: phone-based lookup
 *
 * Response (always 200):
 * {
 *   "status":            "success" | "not_found",
 *   "businessConnected": boolean,
 *   "paymentStatus":     "none" | "paid",
 *   "payment":           null | { ... },
 *   "email":             string,
 *   "phone":             string,
 *   "message":           string,
 *   "locationsData":     [ ... ] | []
 * }
 *
 * Optional auth: LIMBU_CHAT_STATUS_TOKEN via ?token= or Authorization: Bearer
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ── optional token guard ─────────────────────────────────────────────────
    const tokenFromQuery  = searchParams.get("token")?.trim();
    const authHeader      = request.headers.get("authorization") || "";
    const tokenFromBearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    const token           = tokenFromQuery || tokenFromBearer;

    const expected = process.env.LIMBU_CHAT_STATUS_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── resolve by phone (new) or session_id (legacy) ────────────────────────
    const phone     = searchParams.get("phone")?.trim();
    const sessionId = searchParams.get("session_id")?.trim();

    if (!phone && !sessionId) {
      return NextResponse.json(
        { error: "phone or session_id query parameter is required" },
        { status: 400 }
      );
    }

    let row;
    if (phone) {
      row = await findGmbSessionByPhone(phone);
    } else {
      row = await findGmbSession(sessionId);
    }

    const body = formatGmbSessionResponse(row);

    // Include phone in response so the chatbot can store it
    if (row?.phone) body.phone = row.phone;
    else if (phone) body.phone = phone;

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error("GET /api/gmb/status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch session status" },
      { status: 500 }
    );
  }
}
