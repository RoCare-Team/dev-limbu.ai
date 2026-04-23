/**
 * POST /api/chatbot/action
 *
 * Trigger a chatbot action for a connected Google Business location.
 * The business connection (session_id ↔ locationId) MUST already exist in the
 * database — this endpoint does NOT handle the OAuth connect flow.
 *
 * Request body:
 * {
 *   action:     "health_score" | "magic_qr" | "website" | "insights",
 *   session_id: string,   // GMB OAuth session / chatbot user ID
 *   locationId: string,   // "locations/<id>" or bare numeric ID
 *   email:      string    // Google account email of the connected business
 * }
 *
 * Response (immediate, 200):
 * { success: true,  message: "Action started", actionId: "<mongo-id>" }
 * { success: false, message: "<reason>" }
 *
 * Processing is asynchronous. When the action finishes (or fails), a POST
 * webhook is fired to CHATBOT_ACTION_WEBHOOK_URL (default:
 * https://limbubot.limbutech.in/webhook/action-complete).
 *
 * Scalability note:
 *   The `processAction()` call below is fire-and-forget.
 *   To switch to queue-based processing (BullMQ / Redis), replace the
 *   `after(...)` block with a job enqueue, e.g.:
 *     await actionQueue.add("process", { actionId: actionDoc._id.toString() });
 */

import { NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ChatbotAction from "@/models/ChatbotAction";
import { findGmbSession } from "@/lib/gmbSessionStore";
import { processAction, toFullLocationId } from "@/lib/chatbotActionHandlers";

const VALID_ACTIONS = ["health_score", "magic_qr", "website", "insights"];

export async function POST(req) {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const { action, session_id, locationId, email } = body ?? {};

  // ── 2. Validate required fields ────────────────────────────────────────────
  const missing = ["action", "session_id", "locationId", "email"].filter(
    (k) => !body?.[k]?.toString()?.trim()
  );
  if (missing.length) {
    return NextResponse.json(
      { success: false, message: `Missing required fields: ${missing.join(", ")}` },
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

  try {
    await dbConnect();

    // ── 3. Verify the business connection ─────────────────────────────────────
    const sessionDoc = await findGmbSession(session_id.trim());

    if (!sessionDoc || sessionDoc.status !== "success") {
      return NextResponse.json({
        success: false,
        message: "Business not connected",
      });
    }

    // Confirm the requested locationId is part of this session
    const normalizedId = toFullLocationId(locationId.trim());
    const locationExists = (sessionDoc.locationsData || []).some(
      (l) =>
        l.locationResourceName === normalizedId ||
        l.locationResourceName === locationId.trim()
    );

    if (!locationExists) {
      return NextResponse.json({
        success: false,
        message: "Business not connected",
      });
    }

    // ── 4. Create the action record ────────────────────────────────────────────
    const actionDoc = await ChatbotAction.create({
      session_id: session_id.trim(),
      action,
      locationId: locationId.trim(),
      email: email.trim().toLowerCase(),
      status: "pending",
      result: {},
    });

    console.log(
      `[chatbot/action] Created action=${action} id=${actionDoc._id}` +
        ` session=${session_id} location=${locationId}`
    );

    // ── 5. Schedule async processing (post-response) ──────────────────────────
    // `after` (Next.js 15.1+) ensures the task runs after the response is sent,
    // even on serverless runtimes like Vercel.
    // To migrate to BullMQ: replace this block with a queue.add() call.
    after(() =>
      processAction(actionDoc.toObject(), sessionDoc).catch((err) =>
        console.error(
          `[chatbot/action] Unhandled processAction error id=${actionDoc._id}:`,
          err?.message || err
        )
      )
    );

    // ── 6. Respond immediately ────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: "Action started",
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
