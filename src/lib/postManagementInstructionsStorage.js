/**
 * Browser-only preferences for Post Management instructions (per device).
 * Syncs checklist + extra note + "append to prompt" between /instructions and Post Management.
 */

export const PM_INSTRUCTIONS_UPDATED = "pm-instructions-updated";

const KEY_INCLUDED = "pm_instructions_included_v1";
const KEY_EXTRA = "pm_instructions_extra_v1";
const KEY_APPEND = "pm_instructions_append_v1";

export function readIncludedMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY_INCLUDED);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeIncludedMap(map) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_INCLUDED, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(PM_INSTRUCTIONS_UPDATED));
}

export function readExtraNotes() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY_EXTRA) || "";
}

export function writeExtraNotes(text) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_EXTRA, text);
  window.dispatchEvent(new CustomEvent(PM_INSTRUCTIONS_UPDATED));
}

/** Default false when unset (matches original PostInput default). */
export function readAppendToPrompt() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_APPEND) === "true";
}

export function writeAppendToPrompt(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_APPEND, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent(PM_INSTRUCTIONS_UPDATED));
}

/** For new instruction IDs, default to included in prompt unless explicitly false. */
export function mergeIncludedMapForIds(existingMap, instructionIds) {
  const next = { ...existingMap };
  for (const id of instructionIds) {
    if (id && next[id] === undefined) next[id] = true;
  }
  return next;
}
