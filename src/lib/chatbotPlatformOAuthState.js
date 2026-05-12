import { normalizeMetaPhoneDigits } from "@/lib/normalizeMetaPhoneDigits";

/** Default Limbu WhatsApp chat URL after YouTube/LinkedIn chatbot connect (wa.me/917065178662). */
export const LIMBU_CHATBOT_WA_RETURN = "https://wa.me/917065178662";

function trimOrigin(s) {
  return String(s || "")
    .trim()
    .replace(/\/$/, "");
}

function originForRedirect(override) {
  const o = trimOrigin(override || process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL);
  if (o) return o;
  return "https://limbu.ai";
}

/** Sanitize WhatsApp return link from query / OAuth state (defaults to Limbu bot). */
export function normalizeChatbotWaReturnUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return LIMBU_CHATBOT_WA_RETURN;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return LIMBU_CHATBOT_WA_RETURN;
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "wa.me" || host === "api.whatsapp.com") return u.toString();
  } catch {
    /* ignore */
  }
  return LIMBU_CHATBOT_WA_RETURN;
}

function parseOptionalJsonObject(stateParam) {
  const raw = String(stateParam || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }
}

/**
 * JSON OAuth state for YouTube / LinkedIn — backward compatible with `{ userId, mobile }`.
 */
export function buildYoutubeLinkedinStatePayload({
  userId,
  mobile,
  phoneRaw,
  source,
  platform,
  userIdParamPresent,
  waReturnRaw,
}) {
  const payload = { userId };
  if (mobile) payload.mobile = true;

  const shouldTagChatbot =
    !!phoneRaw && (source === "chatbot" || !userIdParamPresent);
  if (shouldTagChatbot) {
    const digits = normalizeMetaPhoneDigits(phoneRaw);
    if (digits) {
      payload.phone = digits;
      payload.source = "chatbot";
      payload.platform = platform;
      const wa = normalizeChatbotWaReturnUrl(waReturnRaw);
      if (wa) payload.wa = wa;
    }
  }

  return JSON.stringify(payload);
}

/**
 * @returns {{ userId: string | null, mobile: boolean, phone: string, source: string, platform: string, waReturn: string }}
 */
export function parseYoutubeLinkedinOAuthState(stateParam) {
  if (!stateParam) {
    return {
      userId: null,
      mobile: false,
      phone: "",
      source: "",
      platform: "",
      waReturn: LIMBU_CHATBOT_WA_RETURN,
    };
  }
  const o = parseOptionalJsonObject(stateParam);
  if (o && typeof o === "object") {
    const waRaw = typeof o.wa === "string" ? o.wa : typeof o.wa_return === "string" ? o.wa_return : "";
    return {
      userId: typeof o.userId === "string" && o.userId.trim() ? o.userId.trim() : null,
      mobile: o.mobile === true,
      phone: normalizeMetaPhoneDigits(typeof o.phone === "string" ? o.phone : ""),
      source: o.source === "chatbot" ? "chatbot" : "",
      platform: o.platform === "youtube" || o.platform === "linkedin" ? o.platform : "",
      waReturn: normalizeChatbotWaReturnUrl(waRaw),
    };
  }
  return {
    userId: String(stateParam).trim() || null,
    mobile: false,
    phone: "",
    source: "",
    platform: "",
    waReturn: LIMBU_CHATBOT_WA_RETURN,
  };
}

function chatbotConnectQs(parsed, extra) {
  const wa = encodeURIComponent(parsed.waReturn || LIMBU_CHATBOT_WA_RETURN);
  return `type=${extra.type}&platform=${extra.platform}&phone=${encodeURIComponent(parsed.phone)}&${extra.flash}&wa_return=${wa}`;
}

function isChatbotPhoneFlow(parsed) {
  return parsed.source === "chatbot" && parsed.phone;
}

export function youtubeSuccessRedirect(parsed, originOverride) {
  const base = originForRedirect(originOverride);
  if (isChatbotPhoneFlow(parsed)) {
    return `${base}/connect-business?${chatbotConnectQs(parsed, { type: "youtube", platform: "youtube", flash: "done=youtube" })}`;
  }
  return `${base}/dashboard?youtube=connected`;
}

export function youtubeErrorRedirect(parsed, errorKey, originOverride) {
  const base = originForRedirect(originOverride);
  if (isChatbotPhoneFlow(parsed)) {
    return `${base}/connect-business?${chatbotConnectQs(parsed, { type: "youtube", platform: "youtube", flash: `yt_error=${encodeURIComponent(errorKey)}` })}`;
  }
  return `${base}/dashboard?youtube=${encodeURIComponent(errorKey)}`;
}

export function linkedinSuccessRedirect(parsed, originOverride) {
  const base = originForRedirect(originOverride);
  if (isChatbotPhoneFlow(parsed)) {
    return `${base}/connect-business?${chatbotConnectQs(parsed, { type: "linkedin", platform: "linkedin", flash: "done=linkedin" })}`;
  }
  return `${base}/dashboard?linkedin=connected`;
}

export function linkedinErrorRedirect(parsed, errorKey, originOverride) {
  const base = originForRedirect(originOverride);
  if (isChatbotPhoneFlow(parsed)) {
    return `${base}/connect-business?${chatbotConnectQs(parsed, { type: "linkedin", platform: "linkedin", flash: `li_error=${encodeURIComponent(errorKey)}` })}`;
  }
  return `${base}/dashboard?linkedin=${encodeURIComponent(errorKey)}`;
}
