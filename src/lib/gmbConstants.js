/** Google Business Profile API enforces ~750 characters for profile.description */
export const GMB_PROFILE_DESCRIPTION_MAX = 750;

/** Target minimum length so AI descriptions use nearly the full allowance. */
export const GMB_PROFILE_DESCRIPTION_MIN = 740;

export function clampGmbDescription(text) {
  const s = (text == null ? '' : String(text)).trim();
  if (s.length <= GMB_PROFILE_DESCRIPTION_MAX) return s;
  // Never cut in the middle of a word. Take up to the limit, then back off to the last
  // whitespace so the description always ends on a complete word.
  let cut = s.slice(0, GMB_PROFILE_DESCRIPTION_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  // Drop any dangling punctuation/connector left at the very end.
  return cut.replace(/[\s,;:.\-–—]+$/, '').trim();
}
