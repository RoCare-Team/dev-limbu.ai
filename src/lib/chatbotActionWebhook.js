import { postJsonWithRetry } from "@/lib/limbuGmbConnectChatbot";

/**
 * Returns the configured webhook URL for action-complete notifications.
 * Override CHATBOT_ACTION_WEBHOOK_URL in .env to point to a different endpoint.
 */
function getWebhookUrl() {
  return (
    process.env.CHATBOT_ACTION_WEBHOOK_URL?.trim() ||
    "https://limbubot.limbutech.in/webhook/action-complete"
  );
}

/**
 * POST the action result to the Limbubot webhook (with one automatic retry).
 *
 * Payload shape:
 * {
 *   phone:      "919876543210",             ← primary identifier (new)
 *   session_id: string,                     ← kept for backward compat
 *   action:     "health_score" | "magic_qr" | "website" | "insights",
 *   status:     "success" | "failed",
 *   result:     { url?, text?, pdf_url?, message?, data?, ... }
 * }
 *
 * @param {{ phone?: string, session_id?: string, action: string, status: string, result: object }} payload
 * @returns {Promise<{ ok: boolean, status: number }>}
 */
export async function notifyActionComplete(payload) {
  const url = getWebhookUrl();

  const headers = { "Content-Type": "application/json" };
  const token = process.env.CHATBOT_ACTION_WEBHOOK_TOKEN?.trim();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await postJsonWithRetry(url, headers, payload);

    if (!res.ok) {
      console.error(
        `[chatbotActionWebhook] Webhook POST ${url} responded ${res.status}` +
          ` | action=${payload.action} session=${payload.session_id}`
      );
    } else {
      console.log(
        `[chatbotActionWebhook] Notified action=${payload.action}` +
          ` status=${payload.status} session=${payload.session_id}`
      );
    }

    return res;
  } catch (err) {
    console.error(
      "[chatbotActionWebhook] Unexpected error posting webhook:",
      err?.message || err
    );
    return { ok: false, status: 0 };
  }
}
