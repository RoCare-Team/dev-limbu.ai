"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
      "/handyman-marketing-software"

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
    const isAdminRoute = pathname.startsWith("/admin");
    const isReviewRoute = pathname.startsWith("/reviews");
    const isFranchiseRoute = pathname.startsWith("/franchise-panel");

    setTimeout(() => {
      // Reviews and Franchise Panel are public or handled separately
      if (isReviewRoute || isFranchiseRoute) {
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
