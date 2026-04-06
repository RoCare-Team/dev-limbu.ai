"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import { MENU_ITEMS, SETTINGS_NAV_USER_IDS, SETTINGS_PATHS } from "./nav-data";

export default function DashboardLayout({ children, user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [userId, setUserId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  // ... (Other states for subscription, user data)

  // Responsive & Initial Load Logic (Keeping your original logic)
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) setOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const navigate = (path) => {
    let finalPath = path;
    if (path.includes("[bussiness]")) {
      const loc = localStorage.getItem("locationDetails");
      const slug = JSON.parse(loc)?.[0]
        ?.title?.trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      finalPath = path.replace("[bussiness]", slug || "business");
    }
    if (isMobile) setOpen(false);
    router.push(finalPath);
  };

  const showSettings = SETTINGS_NAV_USER_IDS.has(userId);
  const visibleItems = showSettings
    ? MENU_ITEMS
    : MENU_ITEMS.filter((i) => !SETTINGS_PATHS.has(i.path));

  return (
    <div className="flex min-h-screen bg-[#060606]">
      <Toaster position="top-right" />

      <Sidebar
        open={open}
        setOpen={setOpen}
        isMobile={isMobile}
        pathname={pathname}
        navigate={navigate}
        userName={user?.name}
        visibleItems={visibleItems}
      />

      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : open ? "260px" : "72px" }}
      >
        <TopBar
          isMobile={isMobile}
          onOpenSidebar={() => setOpen(true)}
          walletBalance={walletBalance}
          router={router}
          userName={user?.name}
          userEmail={user?.email}
        />

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {/* <SubscriptionModal ... /> */}
    </div>
  );
}
