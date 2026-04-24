/**
 * POST /api/chatbot/action
 *
 * Trigger a chatbot action for a connected Google Business location.
 *
 * NEW (phone-based) — primary identifier:
 * {
 *   action:     "health_score" | "magic_qr" | "website" | "insights",
 *   phone:      "919876543210",
 *   locationId: "locations/123456789"
 * }
 *
 * LEGACY (session-based) — still supported:
 * {
 *   action:     "health_score" | "magic_qr" | "website" | "insights",
 *   session_id: "abc123",
 *   locationId: "locations/123456789",
 *   email:      "user@gmail.com"          ← optional if phone resolves it
 * }
 *
 * Response (immediate ≤200 ms):
 *   { success: true,  message: "Action started", actionId: "..." }
 *   { success: false, message: "<reason>" }
 *
 * After processing, a webhook fires to CHATBOT_ACTION_WEBHOOK_URL with phone.
 *
 * Scalability: swap `after(...)` for a BullMQ queue.add() call.
 */

import { NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ChatbotAction from "@/models/ChatbotAction";
import {
  findGmbSession,
  findGmbSessionByPhone,
  normalizePhone,
  toFullLocationId,
} from "@/lib/gmbSessionStore";
import { processAction } from "@/lib/chatbotActionHandlers";

const VALID_ACTIONS = ["health_score", "magic_qr", "website", "insights"];

export async function POST(req) {
  // ── 1. Parse body ────────────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const {
    action,
    phone:      rawPhone,
    session_id: rawSessionId,
    locationId: rawLocationId,
    email:      rawEmail,
  } = body ?? {};

  const phone     = normalizePhone(rawPhone || "");
  const sessionId = rawSessionId?.toString()?.trim() || "";

  // ── 2. Validate required fields ──────────────────────────────────────────────
  if (!action) {
    return NextResponse.json(
      { success: false, message: "action is required" },
      { status: 400 }
    );
  }
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid action "${action}". Must be one of: ${VALID_ACTIONS.join(", ")}`,
      },
      { status: 400 }
    );
  }
  if (!phone && !sessionId) {
    return NextResponse.json(
      { success: false, message: "phone or session_id is required" },
      { status: 400 }
    );
  }
  if (!rawLocationId?.toString()?.trim()) {
    return NextResponse.json(
      { success: false, message: "locationId is required" },
      { status: 400 }
    );
  }

  const locationId = rawLocationId.toString().trim();

  try {
    await dbConnect();

    // ── 3. Resolve GMBConnection (phone takes priority) ───────────────────────
    let sessionDoc = null;
    if (phone) {
      sessionDoc = await findGmbSessionByPhone(phone);
    }
    if (!sessionDoc && sessionId) {
      sessionDoc = await findGmbSession(sessionId);
    }

    if (!sessionDoc || sessionDoc.status !== "success") {
      return NextResponse.json({
        success: false,
        message: "Business not connected",
      });
    }

    // ── 4. Verify locationId belongs to this session ──────────────────────────
    const normalizedId = toFullLocationId(locationId);
    const locationExists = (sessionDoc.locationsData || []).some(
      (l) =>
        l.locationResourceName === normalizedId ||
        l.locationResourceName === locationId
    );
    if (!locationExists) {
      return NextResponse.json({
        success: false,
        message: "Business not connected",
      });
    }

    // Resolve email from session if not provided in body
    const email = (rawEmail?.toString()?.trim() || sessionDoc.userEmail || "").toLowerCase();

    // ── 5. Create pending action record ───────────────────────────────────────
    const actionDoc = await ChatbotAction.create({
      phone:      sessionDoc.phone || phone,
      session_id: sessionDoc.sessionId || sessionId,
      action,
      locationId,
      email,
      status: "pending",
      result: {},
    });

    console.log(
      `[chatbot/action] Created action=${action} id=${actionDoc._id}` +
        ` phone=${phone || "—"} session=${sessionId || "—"} location=${locationId}`
    );

    // ── 6. Async processing (post-response via Next.js after()) ───────────────
    // TODO: Replace with actionQueue.add("process", { actionId }) for BullMQ
    after(() =>
      processAction(actionDoc.toObject(), sessionDoc).catch((err) =>
        console.error(
          `[chatbot/action] processAction error id=${actionDoc._id}:`,
          err?.message || err
        )
      )
    );

    // ── 7. Immediate response ─────────────────────────────────────────────────
    return NextResponse.json({
      success:  true,
      message:  "Action started",
      actionId: actionDoc._id.toString(),
    });
  } catch (err) {
    console.error("[chatbot/action] POST error:", err?.message || err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
