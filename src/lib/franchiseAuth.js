export const FRANCHISE_OWNER_ROLE = "franchise";
export const FRANCHISE_AGENT_ROLE = "agent";

export const AGENT_ALLOWED_ROUTES = [
  "/franchise-panel/dashboard",
  "/franchise-panel/leads",
  "/franchise-panel/change-password",
];

export const BOOKING_ROUTES = [
  "/franchise-panel/service-booking",
  "/franchise-panel/package-booking",
];

export const ADMIN_ONLY_ROUTES = [
  ...BOOKING_ROUTES,
  "/franchise-panel/revenue-share",
  "/franchise-panel/team-management",
  "/franchise-panel/user-management/recharge",
];

export function normalizeFranchiseRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function isFranchiseAgent(role) {
  return normalizeFranchiseRole(role) === FRANCHISE_AGENT_ROLE;
}

export function isFranchiseOwner(role) {
  return normalizeFranchiseRole(role) === FRANCHISE_OWNER_ROLE;
}

export function canAccessBookings(role) {
  return !isFranchiseAgent(role);
}

export function canManageWallet(role) {
  return !isFranchiseAgent(role);
}

export function isRouteAllowedForRole(pathname, role) {
  if (!pathname?.startsWith("/franchise-panel")) return true;

  if (isFranchiseAgent(role)) {
    return AGENT_ALLOWED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  }

  return true;
}

export function filterMenuForRole(menu, role) {
  if (!isFranchiseAgent(role)) return menu;
  return menu.filter((item) => AGENT_ALLOWED_ROUTES.includes(item.href));
}

export function getFranchiseUserFromStorage() {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem("franchise_user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function getFranchiseAuthHeaders() {
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("franchise_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
