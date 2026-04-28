import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Menu as MenuIcon,
  ChevronLeft,
  ChevronDown,
  Plus,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  Star,
  Image as LucideImage,
  KeyRound,
  Activity,
  Wand,
  Wallet,
  Command,
  XCircle,
  ChevronUp
} from "lucide-react";

import UserAvatar from "./UserAvatar";

// Rich Search Index with Aliases and Icons
const searchIndex = [
  { title: "Overview Dashboard", path: "/dashboard", icon: <LayoutDashboard size={14} />, aliases: ["home", "main", "dashboard", "overview"] },
  { title: "Post Management", path: "/post-management", icon: <FileText size={14} />, aliases: ["create post", "social", "schedule", "publish"] },
  { title: "Review Management", path: "/review-management", icon: <Star size={14} />, aliases: ["reviews", "feedback", "reply", "reputation"] },
  { title: "Get Magic QR", path: "/get-magic-qr", icon: <Wand size={14} />, aliases: ["qr code", "scan", "print", "magic"] },
  { title: "Customer Reviews (QR)", path: "/reviews/get-customer-review", icon: <Star size={14} />, aliases: ["qr reviews", "feedback form"] },
  { title: "Assets Management", path: "/assets-management", icon: <LucideImage size={14} />, aliases: ["images", "gallery", "ai images", "photos", "media"] },
  { title: "Keyword Planner", path: "/keyword-planner", icon: <KeyRound size={14} />, aliases: ["seo", "keywords", "search terms", "google", "planner"] },
  { title: "Business Health Audit", path: "/gmb-health", icon: <Activity size={14} />, aliases: ["audit", "health check", "score", "performance", "gmb"] },
  { title: "My Profile", path: "/profile", icon: <User size={14} />, aliases: ["account", "user", "details", "profile"] },
  { title: "Account Settings", path: "/user-settings", icon: <Settings size={14} />, aliases: ["preferences", "configuration", "settings"] },
  { title: "Wallet & Credits", path: "/wallet", icon: <Wallet size={14} />, aliases: ["coins", "balance", "recharge", "payment", "credits", "wallet"] },
];

const TopAppBar = React.memo(({
  isOpen,
  toggleSidebar,
  walletBalance,
  userData,
  profileMenuOpen,
  setProfileMenuOpen,
  profileRef,
  handleSignOut,
}) => {
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return searchIndex.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.aliases.some(alias => alias.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Handle Ctrl+K Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Click Outside for Search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Keyboard Navigation in Search
  const handleSearchKeyDown = (e) => {
    if (!isSearchOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleNavigate(searchResults[selectedIndex].path);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleNavigate = useCallback((path) => {
    setIsSearchOpen(false);
    setSearchQuery("");

    // Process business slug if needed (mimicking Sidebar logic)
    let finalPath = path;
    if (path.includes("[bussiness]")) {
      const slug = userData.location?.trim().replace(/\s+/g, "-").toLowerCase();
      finalPath = path.replace("[bussiness]", slug);
    }
    router.push(finalPath);
  }, [router, userData.location]);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {isOpen ? <ChevronLeft size={18} /> : <MenuIcon size={18} />}
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block" ref={searchContainerRef}>
          <div className={`flex items-center bg-slate-50 border rounded-xl px-3 py-1.5 w-64 transition-all duration-300 ${isSearchOpen ? 'w-80 bg-white ring-2 ring-[#facc15]/30 border-[#facc15]/50 shadow-md' : 'border-slate-100 hover:border-slate-200'
            }`}>
            <Search className={`w-3.5 h-3.5 transition-colors ${isSearchOpen ? 'text-[#eab308]' : 'text-slate-400'}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
                setSelectedIndex(0);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search features, tools..."
              className="bg-transparent border-none outline-none text-[11px] ml-2 w-full font-bold text-slate-600 placeholder:text-slate-400"
            />
            {!isSearchOpen && !searchQuery && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-400 pointer-events-none">
                <Command size={8} /> K
              </div>
            )}
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="text-slate-400 hover:text-slate-600">
                <XCircle size={12} className="lucide lucide-x" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== "" && (
            <div className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Search Results
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto p-1.5 custom-scroll-main">
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <div
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${selectedIndex === index ? "bg-slate-50 text-slate-900" : "text-slate-600"
                        }`}
                    >
                      <div className={`p-1.5 rounded-lg shadow-sm border transition-colors ${selectedIndex === index ? "bg-white border-black/10 text-lemon-hover" : "bg-slate-50 border-transparent text-slate-400"
                        }`}>
                        {item.icon}
                      </div>
                      <span className="text-[12px] font-bold">{item.title}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400">
                  <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200"><ChevronDown size={8} /><ChevronUp size={8} /> to navigate</span>
                  <span className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">Enter to select</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Wallet */}
        <button
  onClick={() => router.push("/wallet")}
  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white border border-[#EAB308]/20 transition-all hover:scale-[1.02] shadow-sm"
>
  <Plus size={12} className="text-white" />
  <span className="text-[11px] font-black tracking-tight">
    {walletBalance}{" "}
    <span className="hidden sm:inline text-[9px]  opacity-70">
      CREDITS
    </span>
  </span>
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
            className="flex items-center gap-2 p-1 pr-3 rounded-xl bg-[#0F172A]  border border-slate-100  transition-all shadow-sm"
          >
            <UserAvatar  name={userData.name} size="sm"  className="text-white"/>
            <ChevronDown
              size={12}
              className={`text-white transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <UserAvatar name={userData.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 truncate">
                      {userData.name}
                    </p>
                    <p className="text-[9px] font-medium text-slate-400 truncate">
                      {userData.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  <User size={14} /> Profile Details
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/user-settings");
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  <Settings size={14} /> Settings
                </button>
                <div className="h-px bg-slate-50 my-1 mx-2" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

TopAppBar.displayName = "TopAppBar";
export default TopAppBar;
