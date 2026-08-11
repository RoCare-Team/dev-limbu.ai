/**
 * GET /api/chatbot/action/result?phone=919876543210&action=health_score
 *
 * Returns the latest ChatbotAction result for a given phone + action.
 * Call this to poll the result after POST /api/chatbot/action returns "Action started".
 *
 * Response when pending:
 *   { success: true, status: "pending", message: "Still processing…" }
 *
 * Response when done:
 *   { success: true, status: "success", actionId: "...", result: { score, text, pdf_url, ... } }
 *
 * Response when failed:
 *   { success: false, status: "failed", message: "..." }
 *
 * Optional: pass ?actionId=... to pin the result to a specific action.
 */

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ChatbotAction from "@/models/ChatbotAction";
import { normalizePhone } from "@/lib/gmbSessionStore";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = ["health_score", "magic_qr", "website", "insights", "keyword_planner", "auto_review_reply"];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const phone    = normalizePhone(searchParams.get("phone") || "");
    const action   = searchParams.get("action")?.trim() || "";
    const actionId = searchParams.get("actionId")?.trim() || "";

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "phone query parameter is required" },
        { status: 400 }
      );
    }
    if (!action) {
      return NextResponse.json(
        { success: false, message: "action query parameter is required" },
        { status: 400 }
      );
    }
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, message: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    await dbConnect();

    // Build query — pin to actionId when provided, else take the most recent
    const query = { phone, action };
    if (actionId) query._id = actionId;

    const doc = await ChatbotAction.findOne(query).sort({ createdAt: -1 }).lean();

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "No action found for this phone + action" },
        { status: 404 }
      );
    }

    if (doc.status === "pending") {
      return NextResponse.json({
        success:  true,
        status:   "pending",
        actionId: doc._id.toString(),
        message:  "Still processing… try again in a few seconds.",
      });
    }

    if (doc.status === "failed") {
      return NextResponse.json({
        success:  false,
        status:   "failed",
        actionId: doc._id.toString(),
        message:  doc.result?.message || "Action failed",
      });
    }

    // success
    return NextResponse.json({
      success:   true,
      status:    "success",
      actionId:  doc._id.toString(),
      action:    doc.action,
      phone:     doc.phone,
      result:    doc.result,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("[chatbot/action/result] GET error:", err?.message || err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
