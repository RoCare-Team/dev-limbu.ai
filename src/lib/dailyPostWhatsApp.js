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

  // AiSensy / Meta body params cannot contain newlines, tabs or 4+ consecutive
  // spaces, and each param must stay reasonably short. Flatten the generated
  // caption to one clean line so it can travel as a template variable ({{3}}).
  const cleanContent =
    String(postContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 700) || "Your new post is ready to review 🎉";

  const payload = {
    apiKey,
    campaignName: "daily_post_update",
    destination,
    userName: "YOUR_BRAND_NAME",
    // Pass ACTUAL values (like the working Insights-report Postman call), not
    // "$FirstName" placeholder tokens.
    // The "daily_post_update" template has exactly TWO body variables:
    //   {{1}} = recipient first name   ("Hello {{1}},")
    //   {{2}} = the generated post caption ("Content: {{2}}")
    // The image is delivered separately as the header media (media.link) below.
    templateParams: [firstName || "User", cleanContent],
    source: "api",
    // Send the generated image as the template header media so it shows in WhatsApp.
    // AiSensy expects the image as { type: "image", link: <url> } — NOT { url } and
    // NOT { url, filename } (those give Meta errors #131053 / "Unexpected key filename").
    media: imageUrl ? { type: "image", link: String(imageUrl) } : {},
    buttons: [],
    carouselCards: [],
    location: {},
    // Keep attributes EMPTY (exactly like the working Postman call). The image goes
    // ONLY via media.link above — also setting imageUrl here made the provider try to
    // attach the image twice, which triggered Meta "Media upload error (#131053)".
    attributes: {},
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
