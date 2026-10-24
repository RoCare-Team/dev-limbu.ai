/**
 * Section-wise admin access.
 *
 * ONE list that the sidebar, the route guard and the "create user" screen all
 * read, so a section can never be shown in the menu but missing from the
 * permission picker (or the other way round).
 *
 * An admin's `access` is an array of ITEM keys (not section keys) — a role like
 * franchiseAdmin usually needs one item out of a section, not the whole group.
 * Missing/empty `access` means "never configured": those admins fall back to the
 * role default below rather than being locked out of everything.
 */

export const ADMIN_SECTIONS = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
      { key: "store-business", label: "Store Business", href: "/admin/store-bussiness" },
      { key: "user-recharge", label: "User Recharge", href: "/admin/user-recharge" },
      { key: "rbac", label: "User Management (roles)", href: "/admin/rbac" },
    ],
  },
  {
    key: "leads",
    label: "Leads",
    items: [
      { key: "leads", label: "Leads", href: "/admin/user-management" },
      { key: "contact-leads", label: "Contact Leads", href: "/admin/contact-form" },
      { key: "jobs-leads", label: "Jobs Leads", href: "/admin/job-applications" },
      { key: "demo-booked", label: "Demo Booked", href: "/admin/demoBook" },
      { key: "tata-dialer", label: "Tata Dialer Leads", href: "/admin/tata-dialer-lead" },
    ],
  },
  {
    key: "bookings",
    label: "Bookings",
    items: [
      { key: "service-booking", label: "Service Booking", href: "/admin/service-booking" },
      { key: "package-booking", label: "Package Booking", href: "/admin/our-package" },
    ],
  },
  {
    key: "ai-studio",
    label: "AI Studio",
    items: [
      { key: "ai-videos", label: "AI Videos", href: "/admin/ai-videos" },
      { key: "automation-plans", label: "Automation Plans", href: "/admin/automation-plans" },
    ],
  },
  {
    key: "content",
    label: "Content",
    items: [
      { key: "blog", label: "Blog Management", href: "/admin/blog" },
      { key: "city-services", label: "City Services", href: "/admin/citys" },
      { key: "local-stores", label: "Our Store (City)", href: "/admin/local-stores" },
      { key: "website-builder", label: "Website Builder", href: "/admin/website-builder" },
    ],
  },
  {
    key: "franchise",
    label: "Franchise",
    items: [
      { key: "franchise-lead", label: "Franchise Lead", href: "/admin/franchise/franchise-lead" },
      { key: "create-franchise", label: "Create Franchise", href: "/admin/create-franchise" },
      { key: "onboarded-franchise", label: "OnBoarded Franchise", href: "/admin/onboarded-franchise" },
      { key: "franchise-payouts", label: "Franchise Payouts", href: "/admin/franchise-payout" },
    ],
  },
  {
    key: "team",
    label: "Team",
    items: [{ key: "account-manager", label: "Account Manager", href: "/admin/manager-assignment" }],
  },
  {
    key: "integrations",
    label: "Integrations",
    items: [
      { key: "connected-nodes", label: "Business Connected Nodes", href: "/admin/connected-node" },
      { key: "invoice-generator", label: "Invoice Generator", href: "/admin/customGenereate" },
      { key: "scrapper-data", label: "Scrapper Data", href: "/admin/dataFormSection" },
    ],
  },
  {
    key: "system",
    label: "System",
    items: [
      { key: "settings", label: "Settings", href: "/admin/settings" },
      { key: "maintenance", label: "Maintenance", href: "/admin/maintenance" },
      { key: "api-logs", label: "API Logs", href: "/admin/logs" },
    ],
  },
];

export const ALL_ACCESS_KEYS = ADMIN_SECTIONS.flatMap((s) => s.items.map((i) => i.key));

const sectionKeys = (key) =>
  ADMIN_SECTIONS.find((s) => s.key === key)?.items.map((i) => i.key) ?? [];

/**
 * What each role gets when nobody picks anything. Mirrors the old coarse
 * ROLE_PRESETS, expanded to the menu items those permissions used to imply.
 */
export const ROLE_DEFAULT_ACCESS = {
  superAdmin: ALL_ACCESS_KEYS,
  // Second to superAdmin: everything except Leads and Franchise, which are
  // ticked per user when this manager should handle them.
  seniorManager: ALL_ACCESS_KEYS.filter(
    (k) => !sectionKeys("leads").includes(k) && !sectionKeys("franchise").includes(k)
  ),
  admin: ALL_ACCESS_KEYS.filter((k) => !sectionKeys("ai-studio").includes(k)),
  // A franchise admin's job is the franchise pipeline — nothing else.
  franchiseAdmin: ["dashboard", ...sectionKeys("franchise")],
  subadmin: ["dashboard", ...sectionKeys("leads"), ...sectionKeys("bookings"), "account-manager"],
  AccountManger: ["dashboard", ...sectionKeys("leads"), ...sectionKeys("bookings"), "account-manager"],
  agent: ["dashboard", "leads", "contact-leads", "demo-booked", "tata-dialer"],
  support: ["dashboard", "contact-leads", "demo-booked"],
  superFranchiseAdmin: ["dashboard", ...sectionKeys("franchise")],
  manager: ["dashboard", ...sectionKeys("leads"), "account-manager"],
};

/**
 * Can `actorRole` edit, delete, or see the password of an admin whose role is
 * `targetRole` (and give someone that role)? Only a superAdmin touches
 * superAdmin accounts, so a seniorManager can never take over or create one.
 */
export function canManageRole(actorRole, targetRole) {
  if (targetRole !== "superAdmin") return true;
  return actorRole === "superAdmin" || actorRole === "admin";
}

/** Keeps only keys this build knows about, so a stale/edited list can't widen access. */
export function sanitizeAccess(list) {
  if (!Array.isArray(list)) return [];
  const known = new Set(ALL_ACCESS_KEYS);
  return [...new Set(list.filter((k) => known.has(k)))];
}

/** The access an admin effectively has: their own list, else the role's default. */
export function effectiveAccess(role, access) {
  if (role === "superAdmin") return ALL_ACCESS_KEYS;
  const own = sanitizeAccess(access);
  if (own.length) return own;
  return ROLE_DEFAULT_ACCESS[role] ?? ["dashboard"];
}

/** Longest-prefix match, so /admin/franchise/franchise-lead/123 stays allowed. */
export function accessKeyForPath(pathname) {
  if (!pathname) return null;
  let best = null;
  for (const section of ADMIN_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        if (!best || item.href.length > best.href.length) best = item;
      }
    }
  }
  return best?.key ?? null;
}

/**
 * Can this admin open this path? Paths that belong to no menu item (shared
 * sub-pages, redirects) are allowed — this gates the menu, it is not a
 * replacement for each API's own authorization.
 */
export function canAccessPath(role, access, pathname) {
  if (role === "superAdmin") return true;
  const key = accessKeyForPath(pathname);
  if (!key) return true;
  return effectiveAccess(role, access).includes(key);
}

/** First page this admin is actually allowed to see — used after a blocked hit. */
export function firstAllowedHref(role, access) {
  const allowed = new Set(effectiveAccess(role, access));
  for (const section of ADMIN_SECTIONS) {
    for (const item of section.items) {
      if (allowed.has(item.key)) return item.href;
    }
  }
  return "/admin/dashboard";
}
