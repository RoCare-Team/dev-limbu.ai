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
  CheckCircle,
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
} from "lucide-react";
import logoDash from "../../public/images/bg-logo.png";

const drawerWidth = 260;
const SETTINGS_NAV_USER_IDS = new Set(["USR1761994068831"]);

/* ── Avatar initials ── */
function AvatarCircle({ name, size = "md", src }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm";
  if (src)
    return (
      <img src={src} alt={name} className={`${s} rounded-full object-cover`} />
    );
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(253,224,71,0.2)",
        color: "#FDE047",
      }}
    >
      {name ? name.charAt(0).toUpperCase() : "U"}
    </div>
  );
}

/* ── Nav item ── */
function NavItem({
  item,
  open,
  isActive,
  isDropdownOpen,
  onToggleDropdown,
  onNavigate,
  pathname,
}) {
  const isDropdown = !!item.children;
  return (
    <div>
      <button
        onClick={() =>
          isDropdown ? onToggleDropdown() : onNavigate(item.path)
        }
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
          isActive
            ? "text-black"
            : "text-[rgba(226,232,240,0.55)] hover:text-[rgba(226,232,240,0.9)] hover:bg-[rgba(255,255,255,0.04)]"
        }`}
        style={isActive ? { backgroundColor: "#FDE047" } : {}}
      >
        <span
          className={`flex-shrink-0 transition-transform duration-200 ${isActive ? "text-black" : "text-[rgba(253,224,71,0.5)] group-hover:text-[rgba(253,224,71,0.8)]"}`}
        >
          {item.icon}
        </span>
        {open && (
          <>
            <span
              className="flex-1 text-left text-[13px] font-medium tracking-[0.01em] truncate"
              style={{ fontFamily: "inherit" }}
            >
              {item.text}
            </span>
            {isDropdown && (
              <span
                className={
                  isActive ? "text-black" : "text-[rgba(226,232,240,0.3)]"
                }
              >
                {isDropdownOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </span>
            )}
          </>
        )}
      </button>

      {/* Dropdown children */}
      {isDropdown && isDropdownOpen && open && (
        <div
          className="ml-4 mt-1 mb-1 pl-3 space-y-0.5"
          style={{ borderLeft: "1px solid rgba(253,224,71,0.15)" }}
        >
          {item.children.map((sub, i) => {
            const subActive = sub.path === pathname;
            return (
              <button
                key={i}
                onClick={() => onNavigate(sub.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                  subActive
                    ? "text-black"
                    : "text-[rgba(226,232,240,0.45)] hover:text-[rgba(226,232,240,0.85)] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
                style={subActive ? { backgroundColor: "#FDE047" } : {}}
              >
                {sub.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ children, user }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [userPlan, setUserPlan] = useState("Free");
  const [walletBalance, setWalletBalance] = useState(0);
  const [userId, setUserId] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [locationCheck, setLocationCheck] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [paidService, setPaidService] = useState(null);
  const [paidPackage, setPaidPackage] = useState(null);
  const [currentPlanDuration, setCurrentPlanDuration] = useState(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  /* ── Responsive ── */
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

  /* ── userId from localStorage ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, [pathname]);

  /* ── User info ── */
  useEffect(() => {
    if (user?.name) setUserName(user.name);
    else {
      const n =
        localStorage.getItem("userName") || localStorage.getItem("fullName");
      if (n) setUserName(n);
    }
    if (user?.email) setUserEmail(user.email);
    else {
      const e =
        localStorage.getItem("userEmail") || localStorage.getItem("email");
      if (e) setUserEmail(e);
    }
  }, [user]);

  /* ── Fetch subscription ── */
  const fetchSubscriptionDetails = async (showLoader = false) => {
    if (showLoader) setSubscriptionLoading(true);
    try {
      const uid = localStorage.getItem("userId");
      if (!uid) {
        setUserPlan("Free");
        return;
      }
      const res = await fetch(`/api/auth/signup?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data);
        if (data.fullName) {
          setUserName(data.fullName);
          localStorage.setItem("userName", data.fullName);
        }
        if (data.email) {
          setUserEmail(data.email);
          localStorage.setItem("userEmail", data.email);
        }
        if (data.subscription?.status === "active") {
          const p = data.subscription.plan || "Premium Plan";
          setUserPlan(p);
          localStorage.setItem("Plan", p);
        } else {
          setUserPlan("Free");
          localStorage.setItem("Plan", "Free");
        }
        if (data.paidService) {
          setPaidService(data.paidService);
          localStorage.setItem("paidService", data.paidService);
        }
        if (data.paidPackage) {
          setPaidPackage(data.paidPackage);
          localStorage.setItem("paidPackage", data.paidPackage);
        }
        if (data.planDuration) {
          setCurrentPlanDuration(data.planDuration);
          localStorage.setItem("planDuration", data.planDuration);
        }
        if (data.wallet !== undefined) {
          setWalletBalance(data.wallet);
          localStorage.setItem("walletBalance", data.wallet.toString());
        }
      } else {
        setUserPlan("Free");
      }
    } catch {
      setUserPlan("Free");
    } finally {
      if (showLoader) setSubscriptionLoading(false);
    }
  };

  /* ── Fetch wallet ── */
  const fetchWalletBalance = async () => {
    try {
      const uid = localStorage.getItem("userId");
      if (!uid) return;
      const res = await fetch(`/api/users/userbalance?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.user.wallet);
        localStorage.setItem("walletBalance", data.user.wallet.toString());
      }
    } catch {}
  };

  /* ── Initial load ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const uid = localStorage.getItem("userId");
    if (!uid) {
      setSubscriptionLoading(false);
      return;
    }
    setUserId(uid);
    const stored = {
      plan: localStorage.getItem("Plan"),
      balance: localStorage.getItem("walletBalance"),
      name:
        localStorage.getItem("userName") || localStorage.getItem("fullName"),
      email: localStorage.getItem("userEmail") || localStorage.getItem("email"),
      service: localStorage.getItem("paidService"),
      package: localStorage.getItem("paidPackage"),
      dur: localStorage.getItem("planDuration"),
    };
    if (stored.plan) setUserPlan(stored.plan);
    if (stored.balance) setWalletBalance(parseInt(stored.balance));
    if (stored.name) setUserName(stored.name);
    if (stored.email) setUserEmail(stored.email);
    if (stored.service) setPaidService(stored.service);
    if (stored.package) setPaidPackage(stored.package);
    if (stored.dur) setCurrentPlanDuration(stored.dur);
    fetchSubscriptionDetails(true);
    fetchWalletBalance();

    const locationDetailsStr = localStorage.getItem("locationDetails");
    try {
      const loc = JSON.parse(locationDetailsStr);
      if (loc?.[0]?.title) setLocationCheck(loc[0].title);
    } catch {}
  }, []);

  /* ── Wallet refresh every 30s ── */
  useEffect(() => {
    if (!userId) return;
    const t = setInterval(fetchWalletBalance, 30000);
    return () => clearInterval(t);
  }, [userId]);

  /* ── Close profile menu on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Default open dropdown ── */
  useEffect(() => {
    const idx = menuItems.findIndex((i) => i.text === "Services & Packages");
    if (idx !== -1) setOpenDropdown(idx);
  }, []);

  /* ── Fetch plans ── */
  const fetchPlansData = async () => {
    try {
      const res = await fetch("/api/home-data?type=subscriptionPlans");
      if (res.ok) setSubscriptionPlans(await res.json());
    } catch {}
  };

  const handleOpenPlansModal = () => {
    setPlansModalOpen(true);
    fetchSubscriptionDetails(false);
    fetchPlansData();
  };

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

  /* ── Nav items ── */
  const menuItems = [
    { text: "Home", icon: <Home size={18} />, path: "/" },
    {
      text: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
    },
    {
      text: "Post Management",
      icon: <FileText size={18} />,
      path: "/post-management",
    },
    {
      text: "Review Management",
      icon: <Star size={18} />,
      path: "/review-management",
    },
    {
      text: "Get Magic QR",
      icon: <Wand size={18} />,
      children: [
        { text: "Get Magic QR", path: "/get-magic-qr" },
        { text: "Get Customer Review", path: "/reviews/get-customer-review" },
      ],
    },
    {
      text: "Assets Management",
      icon: <LucideImage size={18} />,
      path: "/assets-management",
    },
    {
      text: "Keyword Management",
      icon: <KeyRound size={18} />,
      path: "/keyword-planner",
    },
    {
      text: "Services & Packages",
      icon: <Package size={18} />,
      children: [
        { text: "Our Services", path: "/#services" },
        { text: "Our Packages", path: "/#subscription-plans" },
      ],
    },
    { text: "GMB Health", icon: <Activity size={18} />, path: "/gmb-health" },
    { text: "User Profile", icon: <User size={18} />, path: "/profile" },
    { text: "Settings", icon: <Settings size={18} />, path: "/user-settings" },
  ];

  const SETTINGS_PATHS = new Set([
    "/user-settings",
    "/user-settings/optimization",
  ]);
  const navUserId = typeof userId === "string" ? userId.trim() : "";
  const showSettings = SETTINGS_NAV_USER_IDS.has(navUserId);
  const visibleItems = showSettings
    ? menuItems
    : menuItems.filter((i) => !SETTINGS_PATHS.has(i.path));

  /* ── Sidebar content ── */
  const sidebarContent = (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-16 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {open ? (
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={logoDash} width={32} height={32} alt="Logo" />
            <span
              className="font-normal uppercase tracking-tight text-lg leading-none"
              style={{
                fontFamily: "Anton, Impact, sans-serif",
                color: "#FDE047",
              }}
            >
              Limbu.AI
            </span>
          </Link>
        ) : (
          <Image
            src={logoDash}
            width={28}
            height={28}
            alt="Logo"
            className="mx-auto"
          />
        )}
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-[rgba(255,255,255,0.06)]"
            style={{ color: "rgba(226,232,240,0.4)" }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scroll">
        {visibleItems.map((item, idx) => {
          const isDropdown = !!item.children;
          const isActive =
            item.path === pathname ||
            (item.children && item.children.some((c) => c.path === pathname));
          return (
            <NavItem
              key={idx}
              item={item}
              open={open}
              isActive={isActive}
              isDropdownOpen={openDropdown === idx}
              onToggleDropdown={() =>
                setOpenDropdown(openDropdown === idx ? null : idx)
              }
              onNavigate={navigate}
              pathname={pathname}
            />
          );
        })}
      </nav>

      {/* Bottom user strip */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => navigate("/profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:bg-[rgba(255,255,255,0.05)]`}
        >
          <AvatarCircle name={userName} size="sm" src={user?.image} />
          {open && (
            <div className="flex-1 min-w-0 text-left">
              <p
                className="text-[12px] font-semibold truncate"
                style={{ color: "rgba(226,232,240,0.85)" }}
              >
                {userName || "User"}
              </p>
              <p
                className="text-[10px] truncate"
                style={{ color: "rgba(226,232,240,0.35)" }}
              >
                {userEmail
                  ? userEmail.length > 22
                    ? userEmail.slice(0, 22) + "…"
                    : userEmail
                  : ""}
              </p>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0a0a0a",
            color: "#e2e8f0",
            border: "1px solid rgba(253,224,71,0.2)",
            fontSize: "13px",
          },
        }}
      />

      <div className="flex min-h-screen" style={{ backgroundColor: "#060606" }}>
        {/* ── Sidebar (desktop permanent) ── */}
        {!isMobile && (
          <aside
            className="fixed left-0 top-0 h-full z-30 transition-all duration-300 shrink-0"
            style={{
              width: open ? `${drawerWidth}px` : "72px",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {sidebarContent}
            {/* Collapsed toggle */}
            {!open && (
              <button
                onClick={() => setOpen(true)}
                className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 z-10"
                style={{
                  backgroundColor: "#FDE047",
                  boxShadow: "0 0 12px rgba(253,224,71,0.4)",
                }}
              >
                <ChevronRight size={12} className="text-black" />
              </button>
            )}
          </aside>
        )}

        {/* ── Mobile drawer overlay ── */}
        {isMobile && open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <aside
              className="fixed left-0 top-0 h-full z-50 transition-transform duration-300"
              style={{
                width: `${drawerWidth}px`,
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {sidebarContent}
            </aside>
          </>
        )}

        {/* ── Main area ── */}
        <div
          className="flex flex-col flex-1 min-w-0 transition-all duration-300"
          style={{
            marginLeft: isMobile ? 0 : open ? `${drawerWidth}px` : "72px",
          }}
        >
          {/* ── Top AppBar ── */}
          <header
            className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-16 flex-shrink-0"
            style={{
              backgroundColor: "rgba(6,6,6,0.95)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Left: hamburger (mobile) + logo */}
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setOpen(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)]"
                  style={{ color: "rgba(226,232,240,0.6)" }}
                >
                  <MenuIcon size={20} />
                </button>
              )}
            </div>

            {/* Right: chips + user menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Plan chip */}
              {(paidPackage || paidService) && (
                <button
                  onClick={handleOpenPlansModal}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase cursor-pointer transition-all duration-200 hover:opacity-85"
                  style={{
                    background: "rgba(253,224,71,0.1)",
                    border: "1px solid rgba(253,224,71,0.25)",
                    color: "#FDE047",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "#FDE047" }}
                  />
                  {paidPackage || paidService}
                </button>
              )}

              {/* Wallet chip */}
              <button
                onClick={() => {
                  fetchWalletBalance();
                  router.push("/wallet");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.05em] cursor-pointer transition-all duration-200 hover:opacity-85"
                style={{
                  background: "rgba(74,222,128,0.08)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  color: "#4ade80",
                }}
              >
                <Plus size={13} />
                <span>{walletBalance}</span>
                <span className="hidden sm:inline">Coins</span>
              </button>

              {/* Profile menu */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.05)]"
                >
                  <div className="relative">
                    <AvatarCircle name={userName} src={user?.image} />
                    <span
                      className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-black"
                      style={{ backgroundColor: "#4ade80" }}
                    />
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span
                      className="text-[12px] font-semibold leading-tight"
                      style={{ color: "rgba(226,232,240,0.9)" }}
                    >
                      {userName || "User"}
                    </span>
                    {userEmail && (
                      <span
                        className="text-[10px] leading-tight"
                        style={{ color: "rgba(226,232,240,0.4)" }}
                      >
                        {userEmail.length > 18
                          ? userEmail.slice(0, 18) + "…"
                          : userEmail}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className="hidden sm:block"
                    style={{ color: "rgba(226,232,240,0.35)" }}
                  />
                </button>

                {/* Dropdown menu */}
                {profileMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
                    style={{
                      backgroundColor: "#0d0d0d",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* User info */}
                    <div
                      className="px-4 py-3.5"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <AvatarCircle name={userName} src={user?.image} />
                        <div className="min-w-0">
                          <p
                            className="text-[12px] font-semibold truncate"
                            style={{ color: "rgba(226,232,240,0.9)" }}
                          >
                            {userName || "No Name"}
                          </p>
                          <p
                            className="text-[10px] truncate"
                            style={{ color: "rgba(226,232,240,0.4)" }}
                          >
                            {userEmail || "No email"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    {[
                      {
                        icon: <User size={14} />,
                        label: "Profile",
                        action: () => {
                          setProfileMenuOpen(false);
                          router.push("/profile");
                        },
                      },
                      {
                        icon: <Wallet size={14} />,
                        label: `Wallet · ${walletBalance} Coins`,
                        action: () => {
                          setProfileMenuOpen(false);
                          fetchWalletBalance();
                          router.push("/wallet");
                        },
                      },
                      ...(showSettings
                        ? [
                            {
                              icon: <Settings size={14} />,
                              label: "Settings",
                              action: () => {
                                setProfileMenuOpen(false);
                                router.push("/user-settings");
                              },
                            },
                          ]
                        : []),
                    ].map(({ icon, label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(255,255,255,0.04)] text-left"
                        style={{ color: "rgba(226,232,240,0.65)" }}
                      >
                        <span style={{ color: "rgba(253,224,71,0.5)" }}>
                          {icon}
                        </span>
                        {label}
                      </button>
                    ))}

                    <div
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    />
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(248,113,113,0.07)] text-left"
                      style={{ color: "#f87171" }}
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main
            className="flex-1 p-4 sm:p-6"
            style={{ backgroundColor: "#060606" }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* ── Subscription Modal ── */}
      {plansModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setPlansModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "#0d0d0d",
              border: "1px solid rgba(253,224,71,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal top bar */}
            <div
              className="h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, #FDE047, rgba(253,224,71,0.2))",
              }}
            />

            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2
                className="font-normal uppercase tracking-tight"
                style={{
                  fontFamily: "Anton, Impact, sans-serif",
                  color: "#FDE047",
                  fontSize: "1.3rem",
                }}
              >
                My Subscription
              </h2>
              <button
                onClick={() => setPlansModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)]"
                style={{ color: "rgba(226,232,240,0.5)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5">
              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-8 h-8 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "rgba(253,224,71,0.15)",
                      borderTopColor: "#FDE047",
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* Current plan */}
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p
                      className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1"
                      style={{ color: "rgba(226,232,240,0.4)" }}
                    >
                      Current Plan
                    </p>
                    <p
                      className="font-normal uppercase tracking-tight mb-3"
                      style={{
                        fontFamily: "Anton, Impact, sans-serif",
                        color: "#FDE047",
                        fontSize: "1.4rem",
                      }}
                    >
                      {paidPackage || paidService || "Free Plan"}
                    </p>

                    {subscriptionData?.subscription?.status === "active" && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            label: "Start Date",
                            value: subscriptionData.subscription.date
                              ? new Date(
                                  subscriptionData.subscription.date,
                                ).toLocaleDateString()
                              : "N/A",
                          },
                          {
                            label: "Expiry Date",
                            value: subscriptionData.subscription.expiry
                              ? new Date(
                                  subscriptionData.subscription.expiry,
                                ).toLocaleDateString()
                              : "N/A",
                          },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p
                              className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-0.5"
                              style={{ color: "rgba(226,232,240,0.35)" }}
                            >
                              {label}
                            </p>
                            <p
                              className="text-[13px] font-medium"
                              style={{ color: "rgba(226,232,240,0.8)" }}
                            >
                              {value}
                            </p>
                          </div>
                        ))}
                        <div className="col-span-2 flex items-center gap-2 mt-1">
                          <p
                            className="text-[10px] font-semibold tracking-[0.1em] uppercase"
                            style={{ color: "rgba(226,232,240,0.35)" }}
                          >
                            Status:
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase"
                            style={{
                              background: "rgba(74,222,128,0.1)",
                              border: "1px solid rgba(74,222,128,0.25)",
                              color: "#4ade80",
                            }}
                          >
                            {subscriptionData.subscription.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plan features */}
                  {subscriptionPlans &&
                    (paidPackage || paidService) &&
                    (() => {
                      let plan = null;
                      if (paidPackage && currentPlanDuration) {
                        const cycle = subscriptionPlans.billingCycles?.find(
                          (c) => c.cycle === currentPlanDuration,
                        );
                        if (cycle)
                          plan = cycle.plans?.find(
                            (p) => p.title === paidPackage,
                          );
                      }
                      if (!plan && paidService) {
                        plan = subscriptionPlans.billingCycles
                          ?.flatMap((c) => c.plans)
                          .find((p) => p.title === paidService);
                      }
                      if (!plan) return null;
                      return (
                        <div
                          className="rounded-xl p-4 mb-4"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          {plan.description && (
                            <p
                              className="text-[11px] text-center mb-3 italic"
                              style={{ color: "rgba(226,232,240,0.45)" }}
                            >
                              {plan.description}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {[
                              { label: "Posts", value: plan.posts },
                              { label: "Citations", value: plan.citations },
                            ].map(({ label, value }) => (
                              <div
                                key={label}
                                className="rounded-lg p-3 text-center"
                                style={{
                                  background: "rgba(253,224,71,0.05)",
                                  border: "1px solid rgba(253,224,71,0.1)",
                                }}
                              >
                                <p
                                  className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1"
                                  style={{ color: "rgba(253,224,71,0.5)" }}
                                >
                                  {label}
                                </p>
                                <p
                                  className="font-normal text-xl"
                                  style={{
                                    fontFamily: "Anton, Impact, sans-serif",
                                    color: "#FDE047",
                                  }}
                                >
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                          <p
                            className="text-[11px] mb-2 font-medium"
                            style={{ color: "rgba(226,232,240,0.5)" }}
                          >
                            {plan.title} · {plan.duration} · Start:{" "}
                            {subscriptionData?.packageStartDate
                              ? new Date(
                                  subscriptionData.packageStartDate,
                                ).toLocaleDateString()
                              : "N/A"}{" "}
                            → Expiry:{" "}
                            {subscriptionData?.packageExpiryDate
                              ? new Date(
                                  subscriptionData.packageExpiryDate,
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p
                            className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-2"
                            style={{ color: "rgba(226,232,240,0.35)" }}
                          >
                            Plan Features
                          </p>
                          <div className="space-y-1.5">
                            {plan.features?.map((f, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle
                                  size={13}
                                  className="flex-shrink-0 mt-0.5"
                                  style={{ color: "#4ade80" }}
                                />
                                <p
                                  className="text-[12px]"
                                  style={{ color: "rgba(226,232,240,0.6)" }}
                                >
                                  {f}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                  {/* Modal action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setPlansModalOpen(false);
                        router.push("/user-activity");
                      }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold tracking-[0.08em] uppercase cursor-pointer transition-all duration-200 hover:opacity-80"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(226,232,240,0.65)",
                      }}
                    >
                      <Activity size={14} /> View Activity
                    </button>
                    <button
                      onClick={() => {
                        setPlansModalOpen(false);
                        router.push("/#subscription-plans");
                      }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-bold tracking-[0.08em] uppercase cursor-pointer transition-all duration-200 hover:opacity-90"
                      style={{
                        background: "#FDE047",
                        color: "#000",
                        boxShadow: "0 0 20px rgba(253,224,71,0.25)",
                      }}
                    >
                      Upgrade / Renew ↗
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
