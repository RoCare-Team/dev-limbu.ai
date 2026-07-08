const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const DAILY_POST_DEFAULT_KEY =
  "ws_753f64195761e81f0d5edfef2eda6933d40d9c00fad44a40";

export function getDailyPostWhatsAppKey() {
  return process.env.DAILY_POST_WHATSAPP_KEY || DAILY_POST_DEFAULT_KEY;
}

export function normalizeIndiaPhone(num) {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;
  if (n.length !== 12 || !n.startsWith("91")) return null;
  return n;
}

export async function sendDailyPostUpdateWhatsApp({
  destination,
  firstName = "User",
  lastName = "",
  postContent = "",
  imageUrl = "",
}) {
  const apiKey = getDailyPostWhatsAppKey();
  if (!apiKey) return { ok: false, error: "Daily post WhatsApp API key missing" };

  const payload = {
    apiKey,
    campaignName: "daily_post_update",
    destination,
    userName: "YOUR_BRAND_NAME",
    templateParams: ["$FirstName", "$LastName"],
    source: "api",
    // Send the generated image as the template header media so it shows in WhatsApp.
    // NOTE: image header media takes ONLY `url` — Meta rejects `filename` on an
    // image param (filename is for document media only).
    media: imageUrl ? { url: String(imageUrl) } : {},
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {
      postContent: String(postContent || "").slice(0, 1024),
      imageUrl: String(imageUrl || "").slice(0, 512),
    },
    paramsFallbackValue: {
      FirstName: firstName || "firstname",
      LastName: lastName || "lastname",
    },
  };

  const res = await fetch(AISENSY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data;
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
