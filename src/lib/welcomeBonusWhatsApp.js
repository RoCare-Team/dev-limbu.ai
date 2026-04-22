import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";

const AISENSY_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

/** Same default key as legacy `api/whatsapp-message` when env is unset */
const DEFAULT_AISENSY_KEY =
  process.env.AISENSY_API_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzZhOWFjMTNhNjFmMGQ3YjExYmQ1NCIsIm5hbWUiOiJMaW1idUFJIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY2NjhhNWZmYTNhMzhjNTJhMDVmZDYzOCIsImFjdGl2ZVBsYW4iOiJGUkVFX0ZPUkVWRVIiLCJpYXQiOjE3NjUxOTAwNjB9.Xps-oRJ5QqgkCs5BaBuPd1KS9Yxnv4D2PCYB-g5zgr4";

function normalizeIndiaWhatsApp(num) {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  return n.length === 12 ? n : null;
}

/**
 * AISensy campaign `welcome_bonus` — same payload shape as `POST /api/whatsapp-message`.
 * @param {object} opts
 * @param {string} opts.destination — E.164 style (e.g. 91xxxxxxxxxx)
 * @param {string[]} opts.templateParams
 * @param {string} [opts.campaignName="welcome_bonus"]
 * @param {string} [opts.source="welcome-bonus-automation"]
 */
export async function sendWelcomeBonusAisensy({
  destination,
  templateParams,
  campaignName = "welcome_bonus",
  source = "welcome-bonus-automation",
}) {
  if (!destination || !templateParams?.length) {
    return { ok: false, reason: "missing_params" };
  }

  const payload = {
    apiKey: DEFAULT_AISENSY_KEY,
    campaignName,
    destination,
    userName: "LimbuAI",
    templateParams,
    source,
    media: {},
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: { FirstName: "user" },
  };

  const response = await fetch(AISENSY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: payload.apiKey,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  const ok = response.ok && String(result?.success) === "true";
  return { ok, data: result, status: response.status };
}

/**
 * After registration: one welcome_bonus WhatsApp per user (idempotent).
 */
export async function runWelcomeBonusForUserId(userId) {
  await dbConnect();
  const user = await User.findOne({ userId });
  if (!user) return { ok: false, reason: "user_not_found" };
  if (user.welcomeBonusWhatsAppSent) {
    return { ok: false, reason: "already_sent" };
  }

  const dest = normalizeIndiaWhatsApp(user.phone);
  if (!dest) return { ok: false, reason: "no_phone" };

  const firstName =
    user.fullName?.trim()?.split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "User";

  const templateParams = [firstName, "https://limbu.ai/dashboard"];

  const r = await sendWelcomeBonusAisensy({
    destination: dest,
    templateParams,
    campaignName: "welcome_bonus",
    source: "new-landing-page form",
  });

  if (r.ok) {
    user.welcomeBonusWhatsAppSent = true;
    await user.save();
  }

  return { ok: r.ok, reason: r.ok ? "sent" : "aisensy_failed", data: r.data };
}
