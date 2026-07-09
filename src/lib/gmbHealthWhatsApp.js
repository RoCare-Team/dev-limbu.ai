const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

/** API key that owns the `gmb_health_monthly_report` campaign */
const GMB_HEALTH_DEFAULT_KEY =
  "ws_753f64195761e81f0d5edfef2eda6933d40d9c00fad44a40";

export function getGmbHealthWhatsAppKey() {
  return process.env.GMB_HEALTH_WHATSAPP_KEY || GMB_HEALTH_DEFAULT_KEY;
}

export function normalizeIndiaPhone(num) {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;
  if (n.length !== 12 || !n.startsWith("91")) return null;
  return n;
}

/**
 * Sends the GMB Business Health report on WhatsApp.
 * Template `gmb_health_monthly_report` params:
 *   {{1}} -> Customer / Business name
 *   {{2}} -> Month label (e.g. "July 2026")
 * Header: IMAGE — so a valid public image link MUST be sent.
 */
export async function sendGmbHealthWhatsApp({
  destination,
  customerName = "Customer",
  monthLabel = "",
  imageUrl = "",
  documentUrl = "",
  fileName = "Business-Health-Report.pdf",
}) {
  const apiKey = getGmbHealthWhatsAppKey();
  if (!apiKey) return { ok: false, error: "WhatsApp API key not configured", data: null };

  // Prefer the full PDF as a DOCUMENT (so the whole report goes, titled). Fall back
  // to an image header only when no PDF URL is provided.
  const docLink = String(documentUrl || "").trim();
  const imgLink = String(imageUrl || "").trim();
  const media = docLink
    ? { type: "document", link: docLink, filename: fileName || "Business-Health-Report.pdf" }
    : imgLink
      ? { type: "image", link: imgLink }
      : {};

  const payload = {
    apiKey,
    campaignName: "gmb_health_monthly_report",
    destination,
    userName: "YOUR_BRAND_NAME",
    // Actual values (like the working Postman call), not "$" placeholder tokens.
    templateParams: [customerName || "Customer", monthLabel || ""],
    source: "api",
    media,
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      CustomerName: customerName || "Customer",
      Month: monthLabel || "",
    },
  };

  let res, data;
  try {
    res = await fetch(AISENSY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    return { ok: false, error: e.message || "WhatsApp request failed", data: null };
  }

  try {
    data = await res.json();
  } catch {
    data = { message: "Invalid response from WhatsApp API" };
  }

  const sent =
    res.ok &&
    data?.success !== false &&
    (data?.data?.sent === true || data?.success === true);

  if (!sent) {
    const error =
      data?.error || data?.message || data?.data?.message || `HTTP ${res.status}`;
    return { ok: false, error: String(error), data };
  }

  return { ok: true, data };
}
