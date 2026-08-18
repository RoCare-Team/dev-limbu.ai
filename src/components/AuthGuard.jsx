"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Every real top-level segment under src/app. Anything else with a single
 * segment is a tenant microsite served by src/app/[slug]/page.jsx — public.
 * On *.limbu.ai those are reached via subdomain, but on localhost (and any
 * bare domain) they are reached as /<slug>, so the guard must not redirect.
 */
const APP_ROUTE_SEGMENTS = new Set([
  "about", "actions", "admin", "adminLogin", "api", "assets-management",
  "auth", "automation-logs", "automation-settings", "bakery-marketing-software",
  "blog", "build-website", "bulk-schduled", "bussiness", "cancellation-policy",
  "car-garage-marketing-software", "checkHealth", "checkout", "city",
  "clinic-marketing-software", "competitor-analysis", "connect-business",
  "connect-google-business",
  "contact", "dashboard", "data", "education-marketing-software",
  "franchise-opportunities", "franchise-panel", "get-magic-qr", "gmb-health",
  "gmb-insights", "google-business-management-service", "gym-marketing-software",
  "handyman-marketing-software", "hooks", "how-to-connect-gmb",
  "how-to-create-post", "how-to-generate-magic-qr", "how-to-post-on-gmb",
  "how-to-reply-review", "impersonate-login", "instructions", "keyword-planner",
  "limbu-website-leads", "local-rank-tracker", "login",
  "pest-control-marketing-software", "post-management", "pricing",
  "privacy-policy", "profile", "providers", "qr-dynamic",
  "realestate-marketing-software", "redirect", "restaurant-marketing-software",
  "review-management", "reviews", "salon-marketing-software", "serpResults",
  "services", "signup", "sitemaps", "subscription", "terms-and-conditions",
  "thank-you", "tour-travel-marketing-software", "user-activity",
  "user-settings", "video-generation", "video-management", "wallet", "webinar-demo", "work-with-us",
  "yoga-wellness-marketing-software",
]);

const PUBLIC_ROUTES = new Set([
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
  "/pricing",
  "/blog",
  "/how-to-connect-gmb",
  "/how-to-create-post",
  "/how-to-reply-review",
  "/how-to-generate-magic-qr",
  "/how-to-post-on-gmb",
  "/gym-marketing-software",
  "/restaurant-marketing-software",
  "/clinic-marketing-software",
  "/bakery-marketing-software",
  "/salon-marketing-software",
  "/pest-control-marketing-software",
  "/car-garage-marketing-software",
  "/tour-travel-marketing-software",
  "/yoga-wellness-marketing-software",
  "/handyman-marketing-software",
  "/google-business-management-service",
  "/education-marketing-software",
  "/realestate-marketing-software",
  "/auth/signin",
  "/connect-google-business",
  "/connect-business",
  "/bussiness",
  "/automation-logs",
]);

const ALLOWED_ADMIN_ROLES = [
  "admin",
  "superAdmin",
  "superFranchiseAdmin",
  "franchiseAdmin",
  "manager",
  "agent",
  "subadmin",
];

/**
 * Purely from the pathname — no `window`, no localStorage — so it produces the
 * same answer on the server and on the first client render.
 *
 * Ye hi wajah hai ki marketing pages ka HTML ab server par hi ban jata hai:
 * pehle guard `null` return karta tha jab tak `useEffect` nahi chalta, isliye
 * poora document khaali jata tha aur LCP JS ke baad hi shuru hota tha.
 */
function isAlwaysPublic(pathname) {
  if (PUBLIC_ROUTES.has(pathname)) return true;

  if (
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/franchise-panel") ||
    pathname.startsWith("/city") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/bussiness/") ||
    pathname.startsWith("/blog/")
  ) {
    return true;
  }

  // Tenant microsite reached by path (localhost / bare domain) instead of subdomain
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 1 && !APP_ROUTE_SEGMENTS.has(segments[0]);
}

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // Public routes never gate — they render straight into the server HTML.
  const isPublic = isAlwaysPublic(pathname);
  const [isChecking, setIsChecking] = useState(!isPublic);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Business websites on subdomains (e.g. doctorfresh.limbu.ai) are always public
    const hostname = window.location.hostname;
    const isSubdomainSite =
      hostname !== "limbu.ai" &&
      hostname !== "www.limbu.ai" &&
      hostname.endsWith(".limbu.ai");

    if (isSubdomainSite) {
      setIsChecking(false);
      return;
    }

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role"); // admin | franchiseAdmin
    const isAdmin = ALLOWED_ADMIN_ROLES.includes(role);

    // Already-signed-in users should not sit on a login screen. These routes are
    // public, so the redirect runs without ever hiding the rendered page.
    if (userId && pathname === "/login") {
      router.replace("/dashboard");
      setIsChecking(false);
      return;
    }

    if (isAdmin && pathname === "/adminLogin") {
      router.replace(
        ["superFranchiseAdmin", "franchiseAdmin"].includes(role)
          ? "/admin/franchise/franchise-lead"
          : "/admin/dashboard"
      );
      setIsChecking(false);
      return;
    }

    if (isAlwaysPublic(pathname)) {
      setIsChecking(false);
      return;
    }

    // Admin protection
    if (pathname.startsWith("/admin")) {
      if (!isAdmin) router.replace("/adminLogin");
      setIsChecking(false);
      return;
    }

    // Normal user protection
    if (!userId && !isAdmin) {
      router.replace("/");
      setIsChecking(false);
      return;
    }

    setIsChecking(false);
  }, [pathname, router]);

  if (isChecking) return null;

  return <>{children}</>;
}