"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  Home,
  Menu as MenuIcon,
  Package,
  Wand,
  X,
  LayoutDashboard,
  FileText,
  Star,
  Image as LucideImage,
  KeyRound,
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  LogOut,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  Search,
} from "lucide-react";
import logoDash from "../../public/images/bg-logo.png";

const drawerWidth = 280;
const SETTINGS_NAV_USER_IDS = new Set(["USR1761994068831"]);

/* ── SUB-COMPONENT: Avatar ── */
const UserAvatar = ({ name, size = "md", src }) => {
  const s = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  if (src)
    return (
      <img src={src} alt={name} className={`${s} rounded-xl object-cover ring-1 ring-slate-100 shadow-sm`} />
    );
  return (
    <div
      className={`${s} rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-slate-100 uppercase tracking-tighter`}
      style={{
        backgroundColor: "rgba(250, 204, 21, 0.12)",
        color: "#EAB308",
      }}
    >
      {name ? name.charAt(0) : "U"}
    </div>
  );
};

/* ── SUB-COMPONENT: Nav Item ── */
const SidebarNavItem = ({
  item,
  collapsed,
  isActive,
  isDropdownOpen,
  onToggleDropdown,
  onNavigate,
  pathname,
}) => {
  const isDropdown = !!item.children;
  
  return (
    <div className="px-3 mb-0.5">
      <button
        onClick={() => isDropdown ? onToggleDropdown() : onNavigate(item.path)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer group relative ${
          isActive
            ? "bg-slate-900 text-white shadow-md shadow-slate-200"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        }`}
      >
        <span className={`flex-shrink-0 transition-colors duration-300 ${isActive ? "text-[#facc15]" : "text-slate-400 group-hover:text-slate-600"}`}>
          {item.icon}
        </span>
        
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-[13px] font-bold tracking-tight truncate font-sans">
              {item.text}
            </span>
            {isDropdown && (
              <span className={isActive ? "text-white/40" : "text-slate-300"}>
                {isDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            )}
          </>
        )}
      </button>

      {isDropdown && isDropdownOpen && !collapsed && (
        <div className="mt-1 ml-4 pl-3 space-y-0.5 border-l-2 border-slate-100">
          {item.children.map((sub, i) => {
            const subActive = sub.path === pathname;
            return (
              <button
                key={i}
                onClick={() => onNavigate(sub.path)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                  subActive
                    ? "text-slate-900 bg-slate-100"
                    : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {sub.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── MAIN COMPONENT: Sidebar Shell ── */
export default function Sidebar({ children, user }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [locationCheck, setLocationCheck] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, [pathname]);

  const fetchWalletBalance = async () => {
    try {
      const uid = localStorage.getItem("userId");
      if (!uid) return;
      const res = await fetch(`/api/users/userbalance?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.user.wallet);
      }
    } catch {}
  };

  useEffect(() => {
    const n = localStorage.getItem("userName") || localStorage.getItem("fullName");
    if (n) setUserName(n);
    const e = localStorage.getItem("userEmail") || localStorage.getItem("email");
    if (e) setUserEmail(e);
    
    fetchWalletBalance();
    const locationDetailsStr = localStorage.getItem("locationDetails");
    try {
      const loc = JSON.parse(locationDetailsStr);
      if (loc?.[0]?.title) setLocationCheck(loc[0].title);
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    localStorage.clear();
    toast.success("Logged out successfully!");
    router.push("/login");
  };

  const navigate = (path) => {
    let finalPath = path;
    if (path.includes("[bussiness]")) {
      const slug = locationCheck?.trim().replace(/\s+/g, "-").toLowerCase();
      finalPath = path.replace("[bussiness]", slug);
    }
    if (isMobile) setOpen(false);
    router.push(finalPath);
  };

  const menuItems = [
    { text: "Overview", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
    { text: "Post Management", icon: <FileText size={18} />, path: "/post-management" },
    { text: "Review Management", icon: <Star size={18} />, path: "/review-management" },
    {
      text: "Magic QR",
      icon: <Wand size={18} />,
      children: [
        { text: "Get Magic QR", path: "/get-magic-qr" },
        { text: "Customer Reviews", path: "/reviews/get-customer-review" },
      ],
    },
    { text: "Assets Management", icon: <LucideImage size={18} />, path: "/assets-management" },
    { text: "Keyword Planner", icon: <KeyRound size={18} />, path: "/keyword-planner" },
    { text: "GMB Health", icon: <Activity size={18} />, path: "/gmb-health" },
    { text: "My Profile", icon: <User size={18} />, path: "/profile" },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50">
      <Toaster position="top-right" />

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-white border-r border-slate-100 flex flex-col h-full ${
          isMobile && !open ? "-translate-x-full" : "translate-x-0"
        }`}
        style={{ width: open ? `${drawerWidth}px` : "80px" }}
      >
        {/* Logo Section - Fixed */}
        <div className="h-16 flex items-center px-6 shrink-0 border-b border-slate-50">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logoDash} width={28} height={28} alt="Logo" priority />
            {open && (
              <span className="font-bold text-lg tracking-tight text-slate-900 uppercase font-sans">
                Limbu<span className="text-[#eab308]">.ai</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Section - Scrollable */}
        <nav className="flex-1 overflow-y-auto pt-4 pb-6 custom-scroll-sidebar">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.path || (item.children && item.children.some(c => c.path === pathname));
            return (
              <SidebarNavItem
                key={idx}
                item={item}
                collapsed={!open}
                isActive={isActive}
                isDropdownOpen={openDropdown === idx}
                onToggleDropdown={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                onNavigate={navigate}
                pathname={pathname}
              />
            );
          })}
        </nav>

        {/* User Strip - Fixed */}
        <div className="p-4 shrink-0 border-t border-slate-50 bg-slate-50/30">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 shadow-sm ${!open ? 'justify-center' : ''}`}>
            <UserAvatar name={userName} size="sm" src={user?.image} />
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-900 truncate">{userName || "User"}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">{userEmail}</p>
              </div>
            )}
            {open && (
               <button onClick={handleSignOut} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={14} />
               </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top App Bar - Fixed */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setOpen(!open)}
              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {open ? <ChevronLeft size={18} /> : <MenuIcon size={18} />}
            </button>
            
            <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-48 focus-within:w-64 focus-within:ring-2 focus-within:ring-[#facc15]/30 transition-all duration-300">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-[11px] ml-2 w-full font-bold text-slate-600" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet */}
            <button 
              onClick={() => router.push("/wallet")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 transition-all hover:scale-[1.02] shadow-sm"
            >
              <Plus size={12} className="text-[#EAB308]" />
              <span className="text-[11px] font-black tracking-tight">{walletBalance} <span className="hidden sm:inline">COINS</span></span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all shadow-sm"
              >
                <UserAvatar name={userName} size="sm" src={user?.image} />
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={userName} size="sm" src={user?.image} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">{userName}</p>
                        <p className="text-[9px] font-medium text-slate-400 truncate">{userEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { setProfileMenuOpen(false); router.push("/profile"); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                      <User size={14} /> Profile Details
                    </button>
                    <button onClick={() => { setProfileMenuOpen(false); router.push("/user-settings"); }} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                      <Settings size={14} /> Settings
                    </button>
                    <div className="h-px bg-slate-50 my-1 mx-2" />
                    <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition-all">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content - Scrollable ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scroll-main bg-[#fcfcfd]">
           {children}
        </main>
      </div>

      <style jsx global>{`
        .custom-scroll-sidebar::-webkit-scrollbar { width: 3px; }
        .custom-scroll-sidebar::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.05); border-radius: 10px; }
        
        .custom-scroll-main::-webkit-scrollbar { width: 6px; }
        .custom-scroll-main::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll-main::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.08); border-radius: 10px; }
        .custom-scroll-main::-webkit-scrollbar-thumb:hover { background: rgba(15, 23, 42, 0.15); }
        
        body { font-family: var(--font-sans); }
      `}</style>
    </div>
  );
}
