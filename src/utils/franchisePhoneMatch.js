/**
 * Normalize phone / DID strings for comparing IVR did_number with lead.phone.
 * Uses last 10 digits when longer (e.g. +91… → 10-digit national).
 */
export function normalizePhoneForIvrMatch(raw) {
  if (raw == null || raw === "") return "";
  const d = String(raw).replace(/\D/g, "");
  if (!d) return "";
  if (d.length >= 10) return d.slice(-10);
  return d;
}

