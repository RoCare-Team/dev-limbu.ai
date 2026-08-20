const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

/** Fallback key — override with COMPETITOR_ANALYSIS_WHATSAPP_KEY once a dedicated key is issued. */
const COMPETITOR_ANALYSIS_DEFAULT_KEY =
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";

export function normalizeWhatsAppPhone(num) {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;
  if (n.length !== 12 || !n.startsWith("91")) return null;
  return n;
}

export function getCompetitorAnalysisWhatsAppKey() {
  return (
    process.env.COMPETITOR_ANALYSIS_WHATSAPP_KEY ||
    COMPETITOR_ANALYSIS_DEFAULT_KEY
  );
}

/**
 * Sends the Competitor Analysis PDF report to a user's WhatsApp using the
 * "competitor_analysis_report_2" template (document header + $FirstName body param).
 */
export async function sendCompetitorAnalysisWhatsApp({
  destination,
  firstName = "there",
  pdfUrl = "",
  pdfFilename = "Competitor_Analysis_Report",
}) {
  const apiKey = getCompetitorAnalysisWhatsAppKey();
  if (!apiKey) {
    return { ok: false, error: "WhatsApp API key not configured", waData: null };
  }
  if (!pdfUrl) {
    return { ok: false, error: "Missing PDF URL", waData: null };
  }

  const media = {
    url: pdfUrl,
    filename: pdfFilename.endsWith(".pdf") ? pdfFilename : `${pdfFilename}.pdf`,
  };

  const payload = {
    apiKey,
    campaignName: "competitor_analysis_report_2",
    destination,
    userName: "Limbu AI",
    templateParams: ["$FirstName"],
    source: "api",
    media,
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: firstName,
    },
  };

  const response = await fetch(AISENSY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

  const error =
    waData?.error ||
    waData?.message ||
    waData?.data?.message ||
    waData?.msg ||
    `WhatsApp API returned ${response.status}`;

  return { ok: false, error: String(error), waData };
}
