"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// All known non-tenant single-segment routes on the main domain
const KNOWN_APP_ROUTES = new Set([
  "login",
  "adminLogin",
  "about",
  "contact",
  "dashboard",
  "privacy-policy",
  "franchise-opportunities",
  "webinar-demo",
  "cancellation-policy",
  "terms-and-conditions",
  "refund-policy",
  "work-with-us",
  "thank-you",
]);

function isTenantSlugPath(pathname) {
  // Must be exactly one segment: /some-slug (no nested paths)
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return false;

  const segment = parts[0];

  // If it's a known app route, it's NOT a tenant
  if (KNOWN_APP_ROUTES.has(segment)) return false;

  // Tenant slugs are always kebab-case with letters, numbers, hyphens
  // e.g. "doctorfresh-water-technologies-agra-1"
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment);
}

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hostname = window.location.hostname;

    // ✅ 1. Real subdomain tenant site (e.g. doctorfresh.limbu.ai)
    const isSubdomainSite =
      hostname !== "limbu.ai" &&
      hostname !== "www.limbu.ai" &&
      hostname !== "crm.limbu.ai" &&
      hostname.endsWith(".limbu.ai");

    if (isSubdomainSite) {
      setIsChecking(false);
      return;
    }

    // ✅ 2. Local dev subdomain simulation
    const isLocalSubdomain =
      hostname !== "localhost" &&
      hostname !== "limbu.local" &&
      (hostname.endsWith(".limbu.local") || hostname.endsWith(".localhost"));

    if (isLocalSubdomain) {
      setIsChecking(false);
      return;
    }

    // ✅ 3. Middleware-rewritten tenant path on main domain
    //    e.g. doctorfresh.limbu.ai/ → internally becomes /doctorfresh
    //    These look like single-segment paths that aren't known app routes
    if (isTenantSlugPath(pathname)) {
      setIsChecking(false);
      return;
    }

    // ── All checks below are for main domain app routes only ──

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    const publicRoutes = new Set([
      "/",
      "/login",
      "/adminLogin",
      "/about",
      "/contact",
      "/privacy-policy",
      "/franchise-opportunities",
      "/webinar-demo",
      "/cancellation-policy",
      "/terms-and-conditions",
      "/refund-policy",
      "/franchise-panel/login",
      "/work-with-us",
      "/thank-you",
    ]);

    const allowedAdminRoles = new Set([
      "admin",
      "superAdmin",
      "superFranchiseAdmin",
      "franchiseAdmin",
      "manager",
      "agent",
      "subadmin",
    ]);

    const isPublicRoute = publicRoutes.has(pathname);
    const isAdminRoute = pathname.startsWith("/admin");
    const isReviewRoute = pathname.startsWith("/reviews");
    const isFranchiseRoute = pathname.startsWith("/franchise-panel");

    setTimeout(() => {
      // Reviews and Franchise Panel are public or self-handled
      if (isReviewRoute || isFranchiseRoute) {
        setIsChecking(false);
        return;
      }

      // Admin route protection
      if (isAdminRoute) {
        if (!allowedAdminRoles.has(role)) {
          router.replace("/adminLogin");
          setIsChecking(false);
          return;
        }
        setIsChecking(false);
        return;
      }

      // Normal user protection
      if (!userId && !isPublicRoute && !allowedAdminRoles.has(role)) {
        router.replace("/");
        setIsChecking(false);
        return;
      }

      // Logged-in user trying to open /login → send to dashboard
      if (userId && pathname === "/login") {
        router.replace("/dashboard");
        setIsChecking(false);
        return;
      }

      // Admin role opening /adminLogin → send to their panel
      if (allowedAdminRoles.has(role) && pathname === "/adminLogin") {
        if (["superFranchiseAdmin", "franchiseAdmin"].includes(role)) {
          router.replace("/admin/franchise/franchise-lead");
        } else {
          router.replace("/admin/dashboard");
        }
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    }, 100);
  }, [pathname, router]);

  if (isChecking) return null;

  return <>{children}</>;
}