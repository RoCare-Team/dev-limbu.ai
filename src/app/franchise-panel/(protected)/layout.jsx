"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SidebarFranchisePanel from "@/components/sideBarFranchisePanel";
import { Menu } from "lucide-react"; // Import Menu icon
import {
  getFranchiseUserFromStorage,
  isRouteAllowedForRole,
} from "@/lib/franchiseAuth";

export default function FranchiseLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile toggle

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

  // Close sidebar when route changes (mobile UX)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Sidebar Component */}
      <SidebarFranchisePanel 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header - Only visible on small screens */}
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"
            >
              <Menu size={24} />
            </button>
            <span className="text-sm font-bold uppercase tracking-tight text-zinc-900">
              Franchise Panel
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}