/**
 * generate-ad / n8n responses vary: top-level output, nested data.output, arrays, or image aliases.
 * Flatten so callers can always read `data.output` for the image URL (e.g. S3).
 */
export function normalizeGenerateAdResponse(raw) {
  let cur = raw;
  if (Array.isArray(cur)) cur = cur[0];
  if (cur == null) return { output: "" };
  if (typeof cur !== "object") {
    return { output: typeof cur === "string" ? cur : "" };
  }

  let merged = { ...cur };
  if (merged.data != null && typeof merged.data === "object") {
    merged = { ...merged.data, ...merged };
  }
  if (merged.body != null && typeof merged.body === "object") {
    merged = { ...merged.body, ...merged };
  }

  const outputCandidate =
    merged.output ||
    merged.imageUrl ||
    merged.image ||
    merged.secure_url ||
    merged.url ||
    "";

  const output =
    typeof outputCandidate === "string" ? outputCandidate.trim() : "";

  return {
    ...merged,
    output,
  };
}
