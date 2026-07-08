const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

/** API key tied to `keyword_research_update` campaign (verified in Postman) */
const KEYWORD_RESEARCH_DEFAULT_KEY =
  "ws_753f64195761e81f0d5edfef2eda6933d40d9c00fad44a40";

export function normalizeWhatsAppPhone(num) {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;
  if (n.length !== 12 || !n.startsWith("91")) return null;
  return n;
}

/**
 * Must use the API key that owns `keyword_research_update` campaign.
 * Do NOT use LIMBU_AI_WHATSAPP_KEY or AISENSY_API_KEY here — those are
 * different WhatsApp accounts without this campaign.
 */
export function getKeywordResearchWhatsAppKey() {
  return process.env.KEYWORD_RESEARCH_WHATSAPP_KEY || KEYWORD_RESEARCH_DEFAULT_KEY;
}

/**
 * Payload matches Postman / whatsapp.limbu.ai working format:
 * templateParams use "$FirstName" / "$LastName" placeholders;
 * actual values go in paramsFallbackValue.
 */
export async function sendKeywordResearchWhatsApp({
  destination,
  firstName = "User",
  lastName = "",
  pdfUrl = "",
  pdfFilename = "Keyword_Research_Report",
}) {
  const apiKey = getKeywordResearchWhatsAppKey();
  if (!apiKey) {
    return { ok: false, error: "WhatsApp API key not configured", waData: null };
  }

  const basePayload = {
    apiKey,
    campaignName: "keyword_research_update",
    destination,
    userName: "YOUR_BRAND_NAME",
    source: "api",
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: firstName,
      LastName: lastName,
    },
  };

  const mediaWithPdf =
    pdfUrl && pdfUrl.trim()
      ? {
          url: pdfUrl.trim(),
          filename: pdfFilename.endsWith(".pdf") ? pdfFilename : `${pdfFilename}.pdf`,
        }
      : {};

  // Keep a strict fallback order to match the working Postman/cURL shape.
  const attempts = [
    {
      label: "placeholders_with_media",
      payload: {
        ...basePayload,
        templateParams: ["$FirstName", "$LastName"],
        media: mediaWithPdf,
      },
    },
    {
      label: "literal_values_with_media",
      payload: {
        ...basePayload,
        templateParams: [firstName, lastName],
        media: mediaWithPdf,
      },
    },
    {
      label: "placeholders_without_media",
      payload: {
        ...basePayload,
        templateParams: ["$FirstName", "$LastName"],
        media: {},
      },
    },
  ];

  let lastError = "WhatsApp send failed";
  let lastData = null;

  for (const attempt of attempts) {
    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attempt.payload),
    });

    let waData;
    try {
      waData = await response.json();
    } catch {
      waData = { message: "Invalid response from WhatsApp API" };
    }

    const sent =
      response.ok &&
      waData?.success !== false &&
      (waData?.data?.sent === true || waData?.success === true);

    if (sent) {
      return { ok: true, waData };
    }

    lastData = waData;
    lastError =
      waData?.error ||
      waData?.message ||
      waData?.data?.message ||
      waData?.msg ||
      `WhatsApp API returned ${response.status}`;
  }

  return { ok: false, error: String(lastError), waData: lastData };
}
