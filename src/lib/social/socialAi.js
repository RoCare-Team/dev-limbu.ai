/**
 * AI for social automation: classify a comment/DM and draft a reply in the
 * business's tone. Uses OpenAI (gpt-4o-mini, same as the caption writer);
 * without OPENAI_API_KEY it falls back to keyword rules and short templates so
 * the automation still works. Server-only.
 */

const TONES = {
  friendly: "warm, friendly and personal, like a helpful shop owner",
  professional: "polite, clear and professional",
  short: "very short and sweet, one line",
};

// Words that mark a comment as abusive / spam even without AI.
const DEFAULT_NEGATIVE_WORDS = [
  "fraud", "scam", "cheat", "cheater", "worst", "fake", "chor", "bakwas", "ghatiya", "pagal",
  "idiot", "stupid", "bastard", "fuck", "shit", "kutta", "kamina", "saala", "bc", "mc",
];

const SPAM_PATTERNS = [/https?:\/\//i, /\bwww\./i, /\bdm me\b/i, /\bfollow (me|back)\b/i, /\bearn \$?\d+/i, /\bcrypto\b/i];

async function chatJson(system, user, maxTokens = 300) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("[social-ai]", err.message);
    return null;
  }
}

/** Rule-based check used when AI is off/unavailable, and always for custom blocked words. */
export function ruleCheck(text, blockedWords = []) {
  const t = ` ${String(text || "").toLowerCase()} `;
  const words = [...DEFAULT_NEGATIVE_WORDS, ...blockedWords.map((w) => String(w).toLowerCase().trim()).filter(Boolean)];
  const hit = words.find((w) => new RegExp(`[^a-z0-9]${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z0-9]`, "i").test(t));
  if (hit) return { negative: true, reason: `Contains "${hit}"` };
  if (SPAM_PATTERNS.some((re) => re.test(t))) return { negative: true, reason: "Looks like spam" };
  return { negative: false, reason: "" };
}

/**
 * Is this comment abusive, hateful or spam (not just a complaint)? Genuine
 * complaints are NOT negative here: hiding them hurts trust; they get a reply.
 */
export async function classifyComment(text, { blockedWords = [], useAi = true } = {}) {
  const rule = ruleCheck(text, blockedWords);
  if (rule.negative || !useAi) return rule;
  const ai = await chatJson(
    'You moderate comments on a small business\'s Facebook/Instagram posts. Return JSON {"negative": boolean, "reason": string}. negative=true only for abuse, hate, harassment, threats, obscene language or spam/scam links. A genuine complaint or criticism is NOT negative. Comments can be in English, Hindi or Hinglish.',
    `Comment: """${String(text).slice(0, 800)}"""`,
    80
  );
  return ai && typeof ai.negative === "boolean" ? { negative: ai.negative, reason: ai.reason || "" } : rule;
}

/**
 * A reply to a comment or DM. `kind` = "comment" | "dm". `business` is what the
 * owner wants customers to know (services, timings, phone, offers).
 */
export async function draftReply(text, { kind = "comment", tone = "friendly", business = "", businessName = "", authorName = "" } = {}) {
  const ai = await chatJson(
    `You reply on behalf of ${businessName || "a local business"} to a customer ${kind === "dm" ? "direct message" : "comment"} on Facebook/Instagram.
Tone: ${TONES[tone] || TONES.friendly}. Reply in the customer's language (English, Hindi or Hinglish).
${kind === "dm" ? "2 to 4 short sentences." : "1 to 2 short sentences, no hashtags."}
STRICT RULE: only state facts (timings, open days, prices, offers, address, availability, phone) that are written in the business info below. If the customer asks something the business info does not answer, do NOT say yes or no and do not guess: thank them and ask them to call or send a message so the team can confirm. Praise or thanks can simply be thanked back.
Business info from the owner: """${String(business).slice(0, 1500) || "Not provided."}"""
Return JSON {"reply": string}.`,
    `${authorName ? `Customer name: ${authorName}\n` : ""}Customer ${kind}: """${String(text).slice(0, 1000)}"""`,
    kind === "dm" ? 250 : 150
  );
  if (ai?.reply) return String(ai.reply).trim();
  // Fallback templates (no AI key)
  const name = authorName ? ` ${authorName.split(" ")[0]}` : "";
  if (kind === "dm") return `Hi${name}! Thanks for reaching out to ${businessName || "us"}. We have received your message and will reply shortly.`;
  return `Thank you${name}! 🙏 ${businessName ? `Team ${businessName}` : "We"} really appreciate it.`;
}

export const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "short", label: "Short & sweet" },
];
