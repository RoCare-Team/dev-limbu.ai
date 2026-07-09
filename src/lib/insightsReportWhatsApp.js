import { normalizeWhatsAppPhone } from "@/lib/keywordResearchWhatsApp";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

/** API key that owns the `Insights-report-monthly` campaign */
const INSIGHTS_REPORT_DEFAULT_KEY =
  "ws_753f64195761e81f0d5edfef2eda6933d40d9c00fad44a40";

export { normalizeWhatsAppPhone };

export function getInsightsReportWhatsAppKey() {
  return process.env.INSIGHTS_REPORT_WHATSAPP_KEY || INSIGHTS_REPORT_DEFAULT_KEY;
}

export function getInsightsReportWhatsAppImage() {
  // The `Insights-report-monthly` template has an IMAGE header, so a valid public
  // image link MUST be sent — empty media gives Meta "Media upload error (#131053)".
  // Override with a proper report banner via INSIGHTS_REPORT_WHATSAPP_IMAGE.
  return (
    process.env.INSIGHTS_REPORT_WHATSAPP_IMAGE ||
    "https://limbu.ai/images/bg-logo.png"
  );
}

/**
 * Sends the monthly GMB insights report notification on WhatsApp.
 * Template params:
 *   {{1}} -> Customer Name
 *   {{2}} -> Start Date (e.g. "7 June 2026")
 *   {{3}} -> End Date   (e.g. "8 July 2026")
 */
export async function sendInsightsReportWhatsApp({
  destination,
  customerName = "Customer",
  startLabel = "",
  endLabel = "",
  imageUrl = "",
  documentUrl = "",
  fileName = "Insights-Report.pdf",
}) {
  const apiKey = getInsightsReportWhatsAppKey();
  if (!apiKey) {
    return { ok: false, error: "WhatsApp API key not configured", waData: null };
  }

  // Prefer the dynamic PDF report as a DOCUMENT; fall back to an image header only
  // when no PDF URL was provided. (For an image the key is `link`; for a document
  // AiSensy expects `link` + `filename`.)
  const docLink = String(documentUrl || "").trim();
  const imgLink = String(imageUrl || getInsightsReportWhatsAppImage() || "").trim();
  const media = docLink
    ? { type: "document", link: docLink, filename: fileName || "Insights-Report.pdf" }
    : imgLink
      ? { type: "image", link: imgLink }
      : {};

  const basePayload = {
    apiKey,
    campaignName: "Insights-report-monthly",
    destination,
    userName: "YOUR_BRAND_NAME",
    source: "api",
    media,
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      CustomerName: customerName,
      StartDate: startLabel,
      EndDate: endLabel,
    },
  };

  // Match the working keyword-research fallback order: placeholders first, then literals.
  const attempts = [
    {
      label: "placeholders",
      payload: {
        ...basePayload,
        templateParams: ["$CustomerName", "$StartDate", "$EndDate"],
      },
    },
    {
      label: "literal_values",
      payload: {
        ...basePayload,
        templateParams: [customerName, startLabel, endLabel],
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
