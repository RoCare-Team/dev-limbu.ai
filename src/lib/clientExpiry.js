/**
 * Shared package-expiry vocabulary: how many days are left, which bucket a
 * client falls into, and the colours that bucket uses everywhere.
 */

/** Days from today until a date. Negative = already past. Null = no date. */
export function daysUntil(value) {
  if (!value) return null;

  const expiry = new Date(value);
  if (isNaN(expiry.getTime())) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const expiryDay = new Date(expiry);
  expiryDay.setHours(0, 0, 0, 0);

  return Math.round((expiryDay - startOfToday) / 86400000);
}

/** "Expiring" is the 7-day renewal window, inclusive of today. */
export function statusFromDays(days) {
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= 7) return "expiring";
  return "active";
}

export const CLIENT_STATUS_META = {
  active: {
    label: "Active",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    text: "text-emerald-600",
  },
  expiring: {
    label: "Expiring Soon",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    text: "text-amber-600",
  },
  expired: {
    label: "Expired",
    chip: "border-red-200 bg-red-50 text-red-700",
    text: "text-red-600",
  },
  unknown: {
    label: "No Expiry Set",
    chip: "border-gray-200 bg-gray-50 text-gray-600",
    text: "text-gray-400",
  },
};

/** "3d left" / "Expires today" / "Expired 12d ago" */
export function expiryNote(days) {
  if (days === null) return "";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d left`;
}

/** One booking row can be one of several packages for the same client. */
export function clientKeyOf(row) {
  return String(row.leadId || row.email || row.leadName || row._id).toLowerCase();
}

/**
 * Collapse booking rows to one entry per client, keyed on their LATEST
 * package expiry — a client who renewed is active even though their older
 * booking row has a past expiry date.
 */
export function buildClientStatuses(rows = []) {
  const byClient = new Map();

  rows.forEach((row) => {
    const key = clientKeyOf(row);
    const expiry = row.packageExpiryDate || null;
    const existing = byClient.get(key);

    if (!existing) {
      byClient.set(key, {
        key,
        name: row.leadName || row.email || "Unknown",
        email: row.email || "",
        plan: row.plan || "",
        expiry,
        gross: Number(row.amount) || 0,
      });
      return;
    }

    existing.gross += Number(row.amount) || 0;

    const currentTime = existing.expiry
      ? new Date(existing.expiry).getTime()
      : -Infinity;
    const nextTime = expiry ? new Date(expiry).getTime() : -Infinity;

    if (nextTime > currentTime) {
      existing.expiry = expiry;
      existing.plan = row.plan || existing.plan;
    }
  });

  return [...byClient.values()].map((client) => {
    const days = daysUntil(client.expiry);
    return { ...client, days, status: statusFromDays(days) };
  });
}

export function summarizeClientStatuses(clients = []) {
  const counts = { active: 0, expiring: 0, expired: 0, unknown: 0 };
  clients.forEach((client) => {
    counts[client.status] += 1;
  });
  return { ...counts, total: clients.length };
}
