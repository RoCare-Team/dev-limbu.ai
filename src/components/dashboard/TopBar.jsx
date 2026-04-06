"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Menu as MenuIcon,
  Plus,
  ChevronDown,
  User,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";
import AvatarCircle from "./AvatarCircle"; // Move the AvatarCircle to its own file too

export default function TopBar({
  isMobile,
  onOpenSidebar,
  walletBalance,
  paidPackage,
  paidService,
  userName,
  userEmail,
  userImage,
  showSettings,
  onOpenPlans,
  onSignOut,
  router,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-16 flex-shrink-0 bg-[#060606]/95 border-b border-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onOpenSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 text-slate-400"
          >
            <MenuIcon size={20} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {(paidPackage || paidService) && (
          <button
            onClick={onOpenPlans}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase bg-yellow-400/10 border border-yellow-400/25 text-yellow-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            {paidPackage || paidService}
          </button>
        )}

        <button
          onClick={() => router.push("/wallet")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400"
        >
          <Plus size={13} />
          <span>{walletBalance} Coins</span>
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5"
          >
            <AvatarCircle name={userName} src={userImage} />
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[12px] font-semibold text-slate-200">
                {userName || "User"}
              </span>
              <span className="text-[10px] text-slate-500">
                {userEmail?.slice(0, 18)}...
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-600" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-2xl overflow-hidden">
              {/* Same dropdown items as your original code */}
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
