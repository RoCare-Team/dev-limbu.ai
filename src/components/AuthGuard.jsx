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
  "clinic-marketing-software", "connect-business", "connect-google-business",
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
  "user-settings", "video-management", "wallet", "webinar-demo", "work-with-us",
  "yoga-wellness-marketing-software",
]);

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

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

    const publicRoutes = [
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
      "/automation-logs"
    ];

    const allowedAdminRoles = [
      "admin",
      "superAdmin",
      "superFranchiseAdmin",
      "franchiseAdmin",
      "manager",
      "agent",
      "subadmin",
    ];

    const isPublicRoute = publicRoutes.includes(pathname);

    // 👇 ADD THIS HERE
    const isAdminRoute = pathname.startsWith("/admin");
    const isReviewRoute = pathname.startsWith("/reviews");
    const isFranchiseRoute = pathname.startsWith("/franchise-panel");
    const isCityRoute = pathname.startsWith("/city");
    const isServicesRoute = pathname.startsWith("/services");
    const isBusinessSlugRoute = pathname.startsWith("/bussiness/");

    // Tenant microsite reached by path (localhost / bare domain) instead of subdomain
    const segments = pathname.split("/").filter(Boolean);
    const isTenantSiteRoute =
      segments.length === 1 && !APP_ROUTE_SEGMENTS.has(segments[0]);

    setTimeout(() => {
      // 👇 UPDATE THIS CONDITION
      if (
        isReviewRoute ||
        isFranchiseRoute ||
        isCityRoute ||
        isServicesRoute ||
        isBusinessSlugRoute ||
        isTenantSiteRoute
      ) {
        setIsChecking(false);
        return;
      }

      // Admin protection
      if (isAdminRoute) {
        if (!allowedAdminRoles.includes(role)) {
          router.replace("/adminLogin");
          setIsChecking(false);
          return;
        }
        setIsChecking(false);
        return;
      }

      // Normal user protection
      if (!userId && !isPublicRoute && !allowedAdminRoles.includes(role)) {
        router.replace("/");
        setIsChecking(false);
        return;
      }

      // User logged in but opens /login
      if (userId && pathname === "/login") {
        router.replace("/dashboard");
        setIsChecking(false);
        return;
      }

      // Any Admin role opens adminLogin
      if (allowedAdminRoles.includes(role) && pathname === "/adminLogin") {
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