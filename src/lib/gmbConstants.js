/** Google Business Profile API enforces ~750 characters for profile.description */
export const GMB_PROFILE_DESCRIPTION_MAX = 750;

export function clampGmbDescription(text) {
  const s = text == null ? '' : String(text);
  return s.length <= GMB_PROFILE_DESCRIPTION_MAX
    ? s
    : s.slice(0, GMB_PROFILE_DESCRIPTION_MAX);
}
