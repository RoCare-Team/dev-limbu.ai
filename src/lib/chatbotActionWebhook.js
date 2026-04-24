import { postJsonWithRetry } from "@/lib/limbuGmbConnectChatbot";

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
 *   phone:  "919876543210",
 *   action: "health_score" | "magic_qr" | "website" | "insights",
 *   status: "success" | "failed",
 *   result: { url?, text?, pdf_url?, message?, data?, ... }
 * }
 *
 * @param {{ phone: string, action: string, status: string, result: object }} payload
 */
export async function notifyActionComplete(payload) {
  const url = getWebhookUrl();

  const headers = { "Content-Type": "application/json" };
  const token   = process.env.CHATBOT_ACTION_WEBHOOK_TOKEN?.trim();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await postJsonWithRetry(url, headers, {
      phone:  payload.phone  || "",
      action: payload.action,
      status: payload.status,
      result: payload.result || {},
    });

    if (!res.ok) {
      console.error(
        `[chatbotActionWebhook] Webhook ${url} responded ${res.status}` +
          ` | action=${payload.action} phone=${payload.phone}`
      );
    } else {
      console.log(
        `[chatbotActionWebhook] Notified phone=${payload.phone}` +
          ` action=${payload.action} status=${payload.status}`
      );
    }

    return res;
  } catch (err) {
    console.error("[chatbotActionWebhook] Error posting webhook:", err?.message || err);
    return { ok: false, status: 0 };
  }
}
