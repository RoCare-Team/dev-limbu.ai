/**
 * Which dashboard pages a signed-in user may open, from the plans they bought
 * (feature groups from /api/users/plan-groups, see lib/userPlans.js).
 *
 *  - No plan at all: no dashboard. After login the user lands on the home page
 *    plans; dashboard URLs send them there too.
 *  - A plan: dashboard opens; pages of groups they did not buy stay locked
 *    (sidebar shows "Upgrade", the URL sends them to that section's plans).
 *
 * Client-only (sessionStorage cache). A cached result is only trusted to ALLOW;
 * a "no" is always re-checked with the server, so a plan bought a minute ago
 * works straight away.
 */

const CACHE_KEY = "limbu-plan-groups";
const CACHE_MS = 5 * 60 * 1000;

// Where a user without the plan is sent to buy it (home page sections + plans modal).
export const UNLOCK_PATHS = {
  any: "/#all-tools",
  gmb: "/#tools-gbp",
  social: "/#tools-social_media",
};

// Dashboard pages and the plan group they need ("any" = any active plan; an
// array = any one of those groups).
// Pages not listed here (profile, wallet, AI video on coins, …) are unchanged.
const ROUTE_PLANS = [
  ["/dashboard", "any"],
  ["/user-settings", "any"],
  ["/automation-settings", "any"],
  ["/post-management", ["gmb", "social"]], // social pages post from here too
  ["/review-management", "gmb"],
  ["/get-magic-qr", "gmb"],
  ["/assets-management", "gmb"],
  ["/gmb-insights", "gmb"],
  ["/gmb-health", "gmb"],
  ["/keyword-planner", "gmb"],
  ["/competitor-analysis", "gmb"],
  ["/limbu-website-leads", "gmb"],
  ["/bulk-schduled", "gmb"],
  ["/local-rank-tracker", "gmb"],
  ["/social-media", "social"],
];

/** Plan group a path needs ("any" | group), or null when the page is not plan-gated. */
export function planNeededFor(pathname) {
  const hit = ROUTE_PLANS.find(([route]) => pathname === route || pathname.startsWith(`${route}/`));
  return hit ? hit[1] : null;
}

/** True when `groups` (array) satisfies `need` ("any" | group | [groups]). */
export const hasPlan = (groups, need) =>
  Array.isArray(groups) &&
  (need === "any"
    ? groups.length > 0
    : Array.isArray(need)
      ? need.some((g) => groups.includes(g))
      : groups.includes(need));

function readCache(userId) {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    return c && c.userId === userId && Date.now() - c.at < CACHE_MS ? c.groups : null;
  } catch {
    return null;
  }
}

/** The user's plan groups; null if the server could not be reached. */
export async function fetchPlanGroups(userId) {
  if (!userId) return [];
  try {
    const res = await fetch(`/api/users/plan-groups?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
    if (res.status === 404) return [];
    if (!res.ok) return null;
    const json = await res.json();
    const groups = Array.isArray(json?.planGroups) ? json.planGroups : [];
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ userId, groups, at: Date.now() }));
    } catch {
      /* storage blocked */
    }
    return groups;
  } catch {
    return null;
  }
}

/**
 * May this user open a page that needs `need`? Cached "yes" is trusted; anything
 * else is asked fresh. If the server is unreachable we let them in rather than
 * lock a paying user out (every API still checks on its own).
 */
export async function canOpen(userId, need) {
  if (hasPlan(readCache(userId), need)) return true;
  const fresh = await fetchPlanGroups(userId);
  return fresh === null ? true : hasPlan(fresh, need);
}

/** Where to send a user right after login (or when they open /login signed in). */
export async function landingPathFor(userId) {
  const groups = await fetchPlanGroups(userId);
  if (groups === null) return "/dashboard";
  if (!groups.length) return UNLOCK_PATHS.any;
  // Social-only buyers start on their own tools; everyone else on the dashboard
  if (groups.length === 1 && groups[0] === "social") return "/social-media";
  return "/dashboard";
}
