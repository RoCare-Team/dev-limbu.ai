"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
    location: ""
  });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Wallet
  const fetchWallet = useCallback(async (uid) => {
    try {
      const res = await fetch(`/api/users/userbalance?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.user.wallet);
      }
    } catch (err) {
      console.error("Wallet fetch error");
    }
  }, []);

  // Load User Data
  useEffect(() => {
    const uid = getLocalStorage("userId");
    const name = getLocalStorage("userName") || getLocalStorage("fullName");
    const email = getLocalStorage("userEmail") || getLocalStorage("email");
    const locationDetailsStr = getLocalStorage("locationDetails");
    
    let locName = "";
    try {
      const loc = JSON.parse(locationDetailsStr);
      if (loc?.[0]?.title) locName = loc[0].title;
    } catch (e) {}

    setUserData({
      userId: uid,
      name: name || "User",
      email: email || "",
      location: locName
    });

    if (uid) fetchWallet(uid);
  }, [fetchWallet, pathname]); // Re-fetch balance on navigation to keep it fresh

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

  return {
    isOpen,
    isMobile,
    walletBalance,
    userData,
    pathname,
    toggleSidebar,
    navigate
  };
}
