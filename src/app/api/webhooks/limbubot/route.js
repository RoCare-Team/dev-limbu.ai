import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { recordChatbotMessage } from "@/lib/limbuBotUserSync";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ── Dedicated webhook log file ──────────────────────────────────────────────
// Every hit is appended as one JSON line (JSONL) so you can `tail -f` it and
// confirm the webhook is firing. Override the path with WEBHOOK_LOG_FILE.
const WEBHOOK_LOG_FILE =
  process.env.WEBHOOK_LOG_FILE || "/home/ec2-user/logs/webhook-limbubot.log";

try {
  fs.mkdirSync(path.dirname(WEBHOOK_LOG_FILE), { recursive: true });
} catch {
  /* ignore — falls back to console only */
}

function logWebhook(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  // console (pm2 logs) + file, both non-blocking
  console.log(`[webhooks/limbubot] ${line}`);
  fs.appendFile(WEBHOOK_LOG_FILE, line + "\n", () => {});
}

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
 * Open endpoint — no auth/secret. LimbuBot just POSTs here directly.
 */

// Optional verification handshake (some providers GET the URL first).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge");
  return new Response(challenge || "ok", { status: 200 });
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const phone = payload?.contact?.phone || "";
  const name = payload?.contact?.name || "";
  const content = String(payload?.message?.content || "").slice(0, 80);

  // We handle inbound (user) and outbound (bot reply) message events. Anything
  // else is acked so the provider doesn't retry.
  const event = String(payload?.event || "");
  const HANDLED_EVENTS = ["message.received", "message.sent"];
  if (event && !HANDLED_EVENTS.includes(event)) {
    logWebhook({ status: "ignored", event, phone, name });
    return NextResponse.json({ success: true, ignored: event });
  }

  if (!payload?.contact?.phone || !payload?.message) {
    logWebhook({ status: "bad-request", event, phone, name });
    return NextResponse.json(
      { success: false, error: "Missing contact.phone or message" },
      { status: 400 },
    );
  }

  try {
    const result = await recordChatbotMessage(payload);
    logWebhook({
      status: "ok",
      action: result?.action || "handled",
      direction: result?.direction || null,
      phone: result?.phone || phone,
      name,
      tag: result?.metaTag || null,
      userId: result?.userId || null,
      msg: content,
    });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    logWebhook({ status: "error", phone, name, error: err.message, msg: content });
    // 200 so a transient failure doesn't cause endless provider retries;
    // the error is logged for us to inspect.
    return NextResponse.json(
      { success: false, error: err.message || "handler failed" },
      { status: 200 },
    );
  }
}
