import { NextResponse } from "next/server";
import { recordIncomingChatbotMessage } from "@/lib/limbuBotUserSync";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Real-time LimbuBot / WhatsApp webhook.
 *
 * Expected POST body:
 * {
 *   "event": "message.received",
 *   "workspace_id": 23,
 *   "contact": { "id": 42, "phone": "916386103750", "name": "..." },
 *   "message": { "wamid": "...", "type": "text", "content": "...",
 *                "timestamp": "1782990842", "replied_to_wamid": null }
 * }
 *
 * Auth: if LIMBUBOT_WEBHOOK_SECRET is set, the sender must pass it as
 * `?token=<secret>` or header `x-webhook-secret`. If not set, all requests
 * are accepted (configure the secret in production).
 */

const WEBHOOK_SECRET = process.env.LIMBUBOT_WEBHOOK_SECRET || "";

function isAuthorized(req, searchParams) {
  if (!WEBHOOK_SECRET) return true; // not configured → open
  const token =
    searchParams.get("token") || req.headers.get("x-webhook-secret") || "";
  return token === WEBHOOK_SECRET;
}

// Optional verification handshake (some providers GET the URL first).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge");
  if (!isAuthorized(req, searchParams)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  return new Response(challenge || "ok", { status: 200 });
}

export async function POST(req) {
  const { searchParams } = new URL(req.url);

  if (!isAuthorized(req, searchParams)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // We only act on inbound message events. Everything else is acked so the
  // provider doesn't retry.
  const event = String(payload?.event || "");
  if (event && event !== "message.received") {
    return NextResponse.json({ success: true, ignored: event });
  }

  if (!payload?.contact?.phone || !payload?.message) {
    return NextResponse.json(
      { success: false, error: "Missing contact.phone or message" },
      { status: 400 },
    );
  }

  try {
    const result = await recordIncomingChatbotMessage(payload);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[webhooks/limbubot]", err);
    // 200 so a transient failure doesn't cause endless provider retries;
    // the error is logged for us to inspect.
    return NextResponse.json(
      { success: false, error: err.message || "handler failed" },
      { status: 200 },
    );
  }
}
