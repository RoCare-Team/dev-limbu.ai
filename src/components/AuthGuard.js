"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userId = localStorage.getItem("userId");  
    const role = localStorage.getItem("role");  // admin | franchiseAdmin

    const publicRoutes = [
      "/",
      "/login",
      "/adminLogin",
      "/about",
      "/contact",
      "/privacy-policy",
      "/franchise-opportunities",
      "/cancellation-policy",
      "/terms-and-conditions",
      "/refund-policy",
    ];

    const allowedAdminRoles = ["admin", "superAdmin","superFranchiseAdmin", "franchiseAdmin", "manager", "agent", "subadmin"];
    const isPublicRoute = publicRoutes.includes(pathname);
    const isAdminRoute = pathname.startsWith("/admin");
    const isReviewRoute = pathname.startsWith("/reviews");

    setTimeout(() => {
      // Reviews are public
      if (isReviewRoute) {
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
