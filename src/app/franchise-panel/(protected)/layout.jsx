"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarFranchisePanel from "@/components/sideBarFranchisePanel";

export default function FranchiseLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("franchise_token");
    if (!token) {
      router.push("/franchise-panel/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <SidebarFranchisePanel />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
