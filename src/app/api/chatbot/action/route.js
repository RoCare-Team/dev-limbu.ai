/**
 * POST /api/chatbot/action
 *
 * Trigger a chatbot action for a Google Business connected via phone number.
 * Phone is the SOLE identifier — session_id is fully removed.
 * Tokens (accessToken/refreshToken) are loaded from GMBConnection (saved at connect time).
 *
 * Request body:
 * {
 *   action:     "health_score" | "magic_qr" | "website" | "insights",
 *   phone:      "919876543210",
 *   locationId: "locations/505165208589849995"
 * }
 *
 * Immediate response (≤200 ms):
 *   { success: true,  message: "Action started", actionId: "..." }
 *   { success: false, message: "<reason>" }
 *
 * After processing, a webhook fires to CHATBOT_ACTION_WEBHOOK_URL with phone.
 * Use GET /api/chatbot/action/result?phone=...&action=... to poll the result.
 *
 * BullMQ migration: replace `after(...)` with `actionQueue.add(...)`.
 */

import { NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ChatbotAction from "@/models/ChatbotAction";
import {
  findGmbSessionByPhone,
  normalizePhone,
  toFullLocationId,
} from "@/lib/gmbSessionStore";
import { processAction } from "@/lib/chatbotActionHandlers";

const VALID_ACTIONS = ["health_score", "magic_qr", "website", "insights", "keyword_planner"];

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

  const { action, phone: rawPhone, locationId: rawLocationId } = body ?? {};
  const phone      = normalizePhone(rawPhone || "");
  const locationId = rawLocationId?.toString()?.trim() || "";

  // ── 2. Validate ──────────────────────────────────────────────────────────────
  if (!action) {
    return NextResponse.json({ success: false, message: "action is required" }, { status: 400 });
  }
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { success: false, message: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!phone) {
    return NextResponse.json({ success: false, message: "phone is required" }, { status: 400 });
  }
  if (!locationId) {
    return NextResponse.json({ success: false, message: "locationId is required" }, { status: 400 });
  }

  try {
    await dbConnect();

    // ── 3. Load GMBConnection by phone ───────────────────────────────────────
    const sessionDoc = await findGmbSessionByPhone(phone);

    if (!sessionDoc || sessionDoc.status !== "success") {
      return NextResponse.json({ success: false, message: "Business not connected" });
    }
    if (!sessionDoc.accessToken) {
      return NextResponse.json({
        success: false,
        message: "Tokens not found. Please reconnect Google Business.",
      });
    }

    // ── 4. Verify locationId belongs to this account ─────────────────────────
    const normalizedId    = toFullLocationId(locationId);
    const locationExists  = (sessionDoc.locationsData || []).some(
      (l) => l.locationResourceName === normalizedId || l.locationResourceName === locationId
    );
    if (!locationExists) {
      return NextResponse.json({ success: false, message: "Business not connected" });
    }

    // ── 5. Create pending action record ──────────────────────────────────────
    const actionDoc = await ChatbotAction.create({
      phone,
      action,
      locationId,
      email:     sessionDoc.userEmail || "",
      status:    "pending",
      result:    {},
    });

    console.log(
      `[chatbot/action] Created action=${action} id=${actionDoc._id}` +
        ` phone=${phone} location=${locationId}`
    );

    // ── 6. Process async (post-response via Next.js after()) ─────────────────
    after(() =>
      processAction(actionDoc.toObject(), sessionDoc).catch((err) =>
        console.error(
          `[chatbot/action] processAction error id=${actionDoc._id}:`,
          err?.message || err
        )
      )
    );

    // ── 7. Immediate response ────────────────────────────────────────────────
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
