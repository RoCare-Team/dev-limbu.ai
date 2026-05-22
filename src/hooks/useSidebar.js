"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getLocalStorage } from "@/utils/storage";

export function useSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    userId: null,
    location: "",
  });

  // console.log("Sidebar Hook - UserData:", userData);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Wallet from API
  const fetchWallet = useCallback(async (uid) => {
    try {
      const res = await fetch(`/api/users/userbalance?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        const balance = data?.user?.wallet ?? data?.wallet ?? 0;
        setWalletBalance(balance);
        localStorage.setItem("walletBalance", String(balance));
      }
    } catch (err) {
      console.error("Wallet fetch error", err);
    }
  }, []);

  const fetchUserPlan = useCallback(async (uid) => {
  try {
    const res = await fetch(`/api/users/userbalance?userId=${uid}`);

    if (res.ok) {
      const data = await res.json();

      console.log("LIVE USER DATA =>", data.user);

      setUserData((prev) => ({
        ...prev,

        paidPackage: data?.user?.paidPackage || "",
        paidService: data?.user?.paidService || "",
      }));
    }
  } catch (err) {
    console.error("Plan fetch error", err);
  }
}, []);

  // Load User Data on mount / navigation
  useEffect(() => {
    const uid = getLocalStorage("userId");
    const name = getLocalStorage("userName") || getLocalStorage("fullName");
    const email = getLocalStorage("userEmail") || getLocalStorage("email");
    const locationDetailsStr = getLocalStorage("locationDetails");

    let locName = "";
    try {
      const loc = JSON.parse(locationDetailsStr);
      if (loc?.[0]?.title) locName = loc[0].title;
    } catch (e) { }

    const sidebarUserData = {
  userId: uid,
  name: name || "User",
  email: email || "",
  location: locName,

};

console.log("SIDEBAR USER DATA =>", sidebarUserData);

setUserData(sidebarUserData);

    if (uid) fetchWallet(uid);
    if (uid) fetchUserPlan(uid);
  }, [fetchWallet, pathname]);

  // ✅ Listen for wallet events fired from anywhere in the app
  useEffect(() => {
    // Direct balance set (e.g. after API confirms new balance)
    const onWalletUpdated = (e) => {
      const newBalance = e.detail?.balance;
      if (typeof newBalance === "number") {
        setWalletBalance(newBalance);
        localStorage.setItem("walletBalance", String(newBalance));
      }
    };

    // Optimistic deduct (e.g. right after coins are cut)
    const onWalletDeducted = (e) => {
      const amount = e.detail?.amount;
      if (typeof amount === "number") {
        setWalletBalance(prev => {
          const updated = Math.max(0, prev - amount);
          localStorage.setItem("walletBalance", String(updated));
          return updated;
        });
      }
    };

    // Refund / credit
    const onWalletCredited = (e) => {
      const amount = e.detail?.amount;
      if (typeof amount === "number") {
        setWalletBalance(prev => {
          const updated = prev + amount;
          localStorage.setItem("walletBalance", String(updated));
          return updated;
        });
      }
    };

    window.addEventListener("wallet:updated", onWalletUpdated);
    window.addEventListener("wallet:deducted", onWalletDeducted);
    window.addEventListener("wallet:credited", onWalletCredited);

    return () => {
      window.removeEventListener("wallet:updated", onWalletUpdated);
      window.removeEventListener("wallet:deducted", onWalletDeducted);
      window.removeEventListener("wallet:credited", onWalletCredited);
    };
  }, []);

  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);

  const navigate = useCallback((path) => {
    let finalPath = path;
    if (path.includes("[bussiness]")) {
      const slug = userData.location?.trim().replace(/\s+/g, "-").toLowerCase();
      finalPath = path.replace("[bussiness]", slug);
    }
    if (isMobile) setIsOpen(false);
    router.push(finalPath);
  }, [isMobile, router, userData.location]);

  return { isOpen, isMobile, walletBalance, userData, pathname, toggleSidebar, navigate };
}