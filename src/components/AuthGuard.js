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

    const isPublicRoute = publicRoutes.includes(pathname);
    const isAdminRoute = pathname.startsWith("/admin") && 
                         !pathname.startsWith("/admin/franchise");
    const isFranchiseRoute = pathname.startsWith("/admin/franchise");
    const isReviewRoute = pathname.startsWith("/reviews");

    setTimeout(() => {
      // Reviews are public
      if (isReviewRoute) {
        setIsChecking(false);
        return;
      }

      // Admin protection
      if (isAdminRoute) {
        if (role !== "admin") {
          router.replace("/adminLogin");
          setIsChecking(false);
          return;
        }
        setIsChecking(false);
        return;
      }

      // Franchise Admin protection
      if (isFranchiseRoute) {
        if (role !== "franchiseAdmin") {
          router.replace("/adminLogin");
          setIsChecking(false);
          return;
        }
        setIsChecking(false);
        return;
      }

      // Normal user protection
      if (!userId && !isPublicRoute && role !== "admin" && role !== "franchiseAdmin") {
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

      // Admin opens adminLogin
      if (role === "admin" && pathname === "/adminLogin") {
        router.replace("/admin/dashboard");
        setIsChecking(false);
        return;
      }

      // Franchise Admin opens adminLogin
      if (role === "franchiseAdmin" && pathname === "/adminLogin") {
        router.replace("/admin/franchise/dashboard");
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    }, 100);
  }, [pathname, router]);

  if (isChecking) return null;

  return <>{children}</>;
}
