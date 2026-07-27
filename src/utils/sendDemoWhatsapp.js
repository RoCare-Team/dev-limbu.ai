// src/utils/sendDemoWhatsapp.js
// Franchise demo booking confirm hone par client + agent dono ko WhatsApp template.
// Endpoint: whatsapp.limbu.ai (AiSensy wrapper). Dono calls independent (parallel).

const WHATSAPP_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

// NOTE: ye demo campaigns ek specific AiSensy account (ws_fca30...) pe bane hain,
// generic LIMBU_AI_WHATSAPP_KEY (ws_2870...) pe ye campaigns exist nahi karte.
// Isliye dedicated env var, warna sahi wali key default.
const API_KEY =
  process.env.FRANCHISE_DEMO_WHATSAPP_KEY ||
  "ws_fca30eb07595f51089b57a862ecac20c12947558b56f1a70";

const CLIENT_CAMPAIGN =
  process.env.AISENSY_CLIENT_CAMPAIGN || "franchise_demo_client_confirm";
const AGENT_CAMPAIGN =
  process.env.AISENSY_AGENT_CAMPAIGN || "franchise_demo_agent_notify";

/** Normalize to 91XXXXXXXXXX (12 digit). Return "" if invalid. */
function normalizeNumber(num) {
  let n = String(num || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;
  if (n.length !== 12 || !n.startsWith("91")) return "";
  return n;
}

/**
 * Single campaign send.
 * @returns {{ sent: boolean, msgId: string, error?: string }}
 */
async function sendCampaign({ campaignName, destination, templateParams, paramsFallbackValue }) {
  try {
    if (!API_KEY) {
      return { sent: false, msgId: "", error: "WhatsApp API key missing" };
    }
    const to = normalizeNumber(destination);
    if (!to) {
      return { sent: false, msgId: "", error: "invalid destination number" };
    }

    const payload = {
      apiKey: API_KEY,
      campaignName,
      destination: to,
      userName: "Limbu AI",
      templateParams: templateParams.map((p) => String(p ?? "")),
      source: "api",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: paramsFallbackValue || {},
    };

    const res = await fetch(WHATSAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[sendDemoWhatsapp] error:", campaignName, res.status, data);
      return { sent: false, msgId: "", error: data?.message || `HTTP ${res.status}` };
    }

    return {
      sent: true,
      msgId: String(
        data?.data?.wamid || data?.messageId || data?.data?.messageId || ""
      ),
    };
  } catch (err) {
    console.error("[sendDemoWhatsapp] send failed:", campaignName, err.message);
    return { sent: false, msgId: "", error: err.message };
  }
}

/**
 * Client + agent dono ko demo confirmation bhejta hai.
 * @param {object} booking - FranchiseDemoBooking document/plain object
 * @returns {{ clientSent, agentSent, clientMsgId, agentMsgId }}
 */
export async function sendDemoWhatsapp(booking) {
  const {
    clientName,
    clientPhone,
    clientEmail,
    agentName,
    agentPhone,
    date,
    slotTime,
    meetLink,
  } = booking || {};

  const [client, agent] = await Promise.all([
    // Client confirm template (4 params):
    // Hi {{1}} | Date {{2}} | Time {{3}} | Meeting Link {{4}}
    sendCampaign({
      campaignName: CLIENT_CAMPAIGN,
      destination: clientPhone,
      templateParams: [clientName, date, slotTime, meetLink],
      paramsFallbackValue: {},
    }),
    // Agent notify template (6 params):
    // Hi {{1}}(agent) | Client {{2}} | Phone {{3}} | Date {{4}} | Time {{5}} | Meet Link {{6}}
    sendCampaign({
      campaignName: AGENT_CAMPAIGN,
      destination: agentPhone,
      templateParams: [agentName, clientName, clientPhone, date, slotTime, meetLink],
      paramsFallbackValue: {},
    }),
  ]);

  return {
    clientSent: client.sent,
    agentSent: agent.sent,
    clientMsgId: client.msgId,
    agentMsgId: agent.msgId,
  };
}
