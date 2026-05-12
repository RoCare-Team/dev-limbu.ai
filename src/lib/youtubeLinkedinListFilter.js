import { normalizeMetaPhoneDigits } from "@/lib/normalizeMetaPhoneDigits";

/**
 * Builds Mongo filter fields for listing YouTubeChannel / LinkedinProfile (merged with `{ userId }`).
 *
 * - Default (no params): **manual + legacy** only — excludes `connectionSource: "chatbot"`.
 * - `type=chatbot` or `connectionSource=chatbot`: chatbot rows only; optional `phone` (digits).
 * - `type=manual` or `connectionSource=manual`: same as default.
 * - `type=all` or `connectionSource=all`: no extra filter (every row for user).
 */
export function buildYoutubeLinkedinListFilter(searchParams) {
  const typeParam = (searchParams.get("type") || "").toLowerCase();
  const sourceParam = (
    searchParams.get("connectionSource") ||
    searchParams.get("source") ||
    ""
  ).toLowerCase();

  const wantAll =
    typeParam === "all" || sourceParam === "all";
  const wantChatbot =
    typeParam === "chatbot" || sourceParam === "chatbot";

  if (wantAll) {
    return {};
  }

  if (wantChatbot) {
    const filter = { connectionSource: "chatbot" };
    const phoneDigits = normalizeMetaPhoneDigits(searchParams.get("phone") || "");
    if (phoneDigits) {
      filter.phone = phoneDigits;
    }
    return filter;
  }

  // manual, legacy (missing connectionSource), or default — never chatbot
  return { connectionSource: { $ne: "chatbot" } };
}
