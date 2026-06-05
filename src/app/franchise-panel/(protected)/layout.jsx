"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SidebarFranchisePanel from "@/components/sideBarFranchisePanel";
import {
  getFranchiseUserFromStorage,
  isRouteAllowedForRole,
} from "@/lib/franchiseAuth";

export default function FranchiseLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("franchise_token");
    if (!token) {
      router.replace("/franchise-panel/login");
      return;
    }

    const user = getFranchiseUserFromStorage();
    if (!user?.role) {
      router.replace("/franchise-panel/login");
      return;
    }

    if (!isRouteAllowedForRole(pathname, user.role)) {
      router.replace("/franchise-panel/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [pathname, router]);

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <SidebarFranchisePanel />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
