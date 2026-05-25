/** Platform accounts — never show as franchise-panel leads */
const EXCLUDED_EMAIL_PATTERN = /^info@limbu\.ai$/i;

export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mongo filter: only leads owned by this franchise (not admin / Meta / signup with only referCode).
 */
export function buildFranchiseLeadsFilter(franchiseCode) {
  const code = String(franchiseCode || "").trim();
  if (!code) return null;

  const codeRegex = new RegExp(`^${escapeRegex(code)}$`, "i");

  return {
    $or: [
      { franchiseId: { $regex: codeRegex } },
      {
        referCode: { $regex: codeRegex },
        leadTags: "franchise-panel",
      },
      // Legacy: added from franchise panel before franchiseId / leadTags existed
      {
        referCode: { $regex: codeRegex },
        source: "manual-upload",
        $or: [
          { franchiseId: { $exists: false } },
          { franchiseId: null },
          { franchiseId: "" },
        ],
      },
    ],
    email: { $not: { $regex: EXCLUDED_EMAIL_PATTERN } },
  };
}

export function userBelongsToFranchise(user, franchiseCode) {
  if (!user || !franchiseCode) return false;
  if (user.email && EXCLUDED_EMAIL_PATTERN.test(user.email)) return false;

  const code = String(franchiseCode).trim();
  const codeRegex = new RegExp(`^${escapeRegex(code)}$`, "i");

  if (user.franchiseId && codeRegex.test(String(user.franchiseId))) {
    return true;
  }

  const tags = Array.isArray(user.leadTags) ? user.leadTags : [];
  if (
    codeRegex.test(String(user.referCode || "")) &&
    tags.includes("franchise-panel")
  ) {
    return true;
  }

  return (
    codeRegex.test(String(user.referCode || "")) &&
    user.source === "manual-upload" &&
    !user.franchiseId
  );
}
