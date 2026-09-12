"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  LayoutDashboard,
  FileText,
  Star,
  Image as LucideImage,
  KeyRound,
  User,
  LogOut,
  Wand,
  BarChart3,
  X,
  MapPin,
  Inbox,
  Settings,
  Clapperboard,
} from "lucide-react";
import logoDash from "../../public/images/bg-logo.png";
import {
  clearImpersonation,
  isImpersonatingNow,
} from "@/lib/clientSession";
import { clearGmbSessionCookie, clearGmbDataCache } from "@/lib/gmbClientCache";

import { useSidebar } from "@/hooks/useSidebar";
import SidebarNavItem from "./sidebar/SidebarNavItem";
import UserAvatar from "./sidebar/UserAvatar";
import TopAppBar from "./sidebar/TopAppBar";

const drawerWidth = 280;

export default function Sidebar({ children }) {
  const router = useRouter();
  const {
    isOpen,
    isMobile,
    walletBalance,
    userData,
    pathname,
    toggleSidebar,
    navigate,
  } = useSidebar();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile menu on click outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = useCallback(() => {
    // Impersonated tab me `localStorage.clear()` ATOM BOMB tha: localStorage
    // poore origin ka ek hi hota hai, isliye ye admin ka apna token/role/
    // adminEmail bhi uda deta tha. Uske baad admin panel logged out ho jata aur
    // /dashboard AuthGuard se seedha home (`/`) par chala jata — kyunki na
    // `userId` bacha, na `role`.
    //
    // Impersonation khatam karna hai to sirf impersonation ke nishaan hatao;
    // admin ki apni session ko haath mat lagao.
    if (isImpersonatingNow()) {
      clearImpersonation();
      ["userId", "userName", "fullName", "userEmail", "email"].forEach((k) => {
        try {
          window.sessionStorage?.removeItem(k);
        } catch {
          /* storage blocked */
        }
      });
      clearGmbDataCache();
      // httpOnly cookie hai, client se seedha delete nahi ho sakti — server
      // se clear karwao. Isके bina ye impersonated user ki identity dekar
      // GMB APIs ko authenticate karti rehti thi, "Exited user view" ke
      // baad bhi.
      clearGmbSessionCookie().finally(() => {
        toast.success("Exited user view");
        window.close(); // impersonation apni tab me khulta hai
        router.push("/login");
      });
      return;
    }

    clearGmbDataCache();
    localStorage.clear();
    clearGmbSessionCookie().finally(() => {
      toast.success("Logged out successfully!");
      router.push("/login");
    });
  }, [router]);

  const menuItems = useMemo(
    () => [
      {
        text: "Overview",
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
        text: "Website Leads",
        icon: <Inbox size={18} />,
        path: "/limbu-website-leads",
      },
      {
        text: "Magic QR",
        icon: <Wand size={18} />,
        children: [
          { text: "Get Magic QR", path: "/get-magic-qr" },
          { text: "Customer Reviews", path: "/reviews/get-customer-review" },
        ],
      },
      {
        text: "Assets Management",
        icon: <LucideImage size={18} />,
        path: "/assets-management",
      },
      {
        text: "AI Video",
        icon: <Clapperboard size={18} />,
        children: [
          { text: "Image To Video", path: "/video-generation/image-to-video" },
          { text: "Text To Video", path: "/video-generation" },
          { text: "AI Avatar Video", path: "/video-generation/ai-avatar-video" },
          { text: "CGI Video", path: "/video-generation/cgi-video" },
        ],
      },
      {
        text: "Keyword Planner",
        icon: <KeyRound size={18} />,
        path: "/keyword-planner",
      },
      {
        text: "Competitor Analysis",
        icon: <MapPin size={18} />,
        path: "/competitor-analysis",
      },
      { text: "GMB Health", icon: <Activity size={18} />, path: "/gmb-health" },
      {
        text: "GMB Insights",
        icon: <BarChart3 size={18} />,
        path: "/gmb-insights",
      },
      {
        text: "User Settings",
        icon: <Settings size={18} />,
        path: "/user-settings",
      },
      { text: "My Profile", icon: <User size={18} />, path: "/profile" },
    ],
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50">
      {/* Mobile Backdrop Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-white border-r border-slate-100 flex flex-col h-full ${
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        }`}
        style={{ width: isOpen ? `${drawerWidth}px` : "80px" }}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 shrink-0 border-b border-slate-50">
          <Link href="/" className="flex items-center gap-2 flex-1">
            <Image src={logoDash} width={28} height={28} alt="Logo" priority />
            {isOpen && (
              <span className="font-bold text-lg tracking-tight text-slate-900 uppercase font-sans">
                Limbu<span className="text-[#eab308]">.ai</span>
              </span>
            )}
          </Link>

          {/* Close button for mobile */}
          {isMobile && isOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto pt-4 pb-6 custom-scroll-sidebar">
          {menuItems.map((item, idx) => {
            const isActive =
              pathname === item.path ||
              (item.children && item.children.some((c) => c.path === pathname));
            return (
              <SidebarNavItem
                key={idx}
                item={item}
                collapsed={!isOpen}
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

        {/* User Strip */}
        <div className="p-4 shrink-0 border-t border-slate-50 bg-slate-50/30">
          {isOpen && (
            <div className="mb-3 px-1">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-3 py-2">
                {/* PACKAGE */}
                {userData?.activePackages?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      Package Plan
                    </p>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {userData.activePackages.map((p) => (
                        <p
                          key={p._id}
                          className="px-2 py-1 rounded-md bg-yellow-400 text-[10px] font-black text-slate-900 leading-tight"
                        >
                          {p.plan}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* SERVICE */}
                {userData?.activeServices?.length > 0 && (
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      Service Plan
                    </p>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {userData.activeServices.map((s) => (
                        <p
                          key={s._id}
                          className="px-2 py-1 rounded-md bg-yellow-400 text-[10px] font-black text-slate-900 leading-tight"
                        >
                          {s.plan}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* FREE USER */}
                {!userData?.activePackages?.length &&
                  !userData?.activeServices?.length && (
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-slate-500">
                        Free Plan
                      </p>

                      <span className="px-2 py-1 rounded-lg bg-slate-400 text-white text-[8px] font-black uppercase">
                        FREE
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}
          <div
            className={`relative flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 shadow-sm ${!isOpen ? "justify-center" : ""}`}
          >
            <UserAvatar name={userData.name} size="sm" />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-900 truncate">
                  {userData.name}
                </p>
                <p className="text-[10px] font-medium text-slate-400 truncate">
                  {userData.email}
                </p>
              </div>
            )}
            {isOpen && (
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopAppBar
          isOpen={isOpen}
          toggleSidebar={toggleSidebar}
          walletBalance={walletBalance}
          userData={userData}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          profileRef={profileRef}
          handleSignOut={handleSignOut}
        />

        {/* ── Main Content Area ── */}
        <main className="flex-1 overflow-y-auto p-4  custom-scroll-main">
          {children}
        </main>
      </div>
    </div>
  );
}
