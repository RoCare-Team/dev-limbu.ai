"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  Settings,
  BarChart3,
  Users,
  Wallet,
  ArrowUpLeft,
  UserSquare,
  CircleUser,
  PanelLeftDashed,
  BookCheck,
  LogOut,
  LucideHeadset,
  Link2,
  QrCode,
  Map,
  Building2,
  Workflow,
  Wand2,
  FileSpreadsheet,
  Globe,
  Clapperboard,
  CalendarClock,
} from "lucide-react";
import { LeaderboardSharp } from "@mui/icons-material";
import { isTokenAlive, clearStaleAdminLogin } from "@/lib/clientSession";
import {
  accessKeyForPath,
  canAccessPath,
  effectiveAccess,
  firstAllowedHref,
} from "@/lib/adminAccess";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState({});
  // Section-wise menu access, stored at login. null = not read yet, so the menu
  // renders nothing rather than flashing items this admin may not have.
  const [access, setAccess] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const theme = "light";

  const [isMobile, setIsMobile] = useState(false);

  /* ----------------------------
      AUTH + USER DATA
    ---------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    // Pehle sirf `token` ki maujoodgi check hoti thi, expiry nahi — 7 din
    // (admin JWT ki umr) baad bhi dashboard render ho jata, bas har API call
    // 401 deti rehti, jo "login hua par ajeeb behave kare" jaisa dikhta tha.
    if (!token || !isTokenAlive(token)) {
      clearStaleAdminLogin();
      router.push("/adminLogin");
      return;
    }

    setRole(localStorage.getItem("role") || "");
    setAdminName(localStorage.getItem("adminName") || "Admin");
    setEmail((localStorage.getItem("adminEmail") || localStorage.getItem("email")) || "");

    try {
      setPermissions(JSON.parse(localStorage.getItem("permissions")) || {});
    } catch {
      setPermissions({});
    }

    try {
      const stored = JSON.parse(localStorage.getItem("access"));
      setAccess(Array.isArray(stored) ? stored : []);
    } catch {
      // Admins who logged in before this existed have no stored list; an empty
      // one makes effectiveAccess() fall back to their role's default.
      setAccess([]);
    }
  }, [router]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, [theme]);

  /* ----------------------------
      LOGOUT
    ---------------------------- */
  const logout = () => {
    localStorage.clear();
    router.push("/adminLogin");
  };

  /* ----------------------------
      SIDEBAR MENU CONFIG
    ---------------------------- */
  const [openGroup, setOpenGroup] = useState(null);

  useEffect(() => {
    const foundIndex = visibleNavGroups.findIndex((group) =>
      group.items.some((item) => pathname.startsWith(item.href)),
    );

    if (foundIndex !== -1) {
      setOpenGroup(foundIndex);
    }
  }, [pathname]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const isAgent = role === "agent";

  const navGroups = isAgent
    ? [
        {
          title: "Overview",
          groupIcon: <BarChart3 size={16} />,
          items: [
            {
              name: "Dashboard",
              href: "/admin/dashboard",
              icon: <BarChart3 size={16} />,
            },
          ],
        },

        {
          title: "Leads",
          groupIcon: <Users size={16} />,
          items: [
            {
              name: "Leads",
              icon: <Users size={18} />,
              href: "/admin/user-management",
            },
            {
              name: "Contact Leads",
              href: "/admin/contact-form",
              icon: <Users size={16} />,
            },
            {
              name: "Demo Booked",
              href: "/admin/demoBook",
              icon: <Users size={16} />,
            },
            {
              name: "Tata Dialer Leads",
              href: "/admin/tata-dialer-lead",
              icon: <Users size={16} />,
            },
          ],
        },
      ]
    : [
        {
          title: "Overview",
          groupIcon: <BarChart3 size={16} />,
          items: [
            {
              name: "Dashboard",
              href: "/admin/dashboard",
              icon: <BarChart3 size={16} />,
            },
            {
              name: "Store Business",
              href: "/admin/store-bussiness",
              icon: <QrCode size={16} />,
            },
            {
              name: "User Recharge",
              href: "/admin/user-recharge",
              icon: <Wallet size={16} />,
            },
            {
              name: "User Management",
              href: "/admin/rbac",
              icon: <UserSquare size={16} />,
            },
          ],
        },

        {
          title: "Leads",
          groupIcon: <Users size={16} />,
          href: "/admin/user-management",
          items: [
            {
              name: "Leads",
              icon: <Users size={18} />,
              href: "/admin/user-management",
              key: "manageUsers",
            },
            {
              name: "Contact Leads",
              href: "/admin/contact-form",
              icon: <Users size={16} />,
            },
            {
              name: "Jobs Leads",
              href: "/admin/job-applications",
              icon: <Users size={16} />,
            },
            {
              name: "Demo Booked",
              href: "/admin/demoBook",
              icon: <Users size={16} />,
            },
            {
              name: "Tata Dialer Leads",
              href: "/admin/tata-dialer-lead",
              icon: <Users size={16} />,
            },
          ],
        },

        {
          title: "Bookings",
          groupIcon: <BookCheck size={16} />,
          items: [
            {
              name: "Service Booking",
              href: "/admin/service-booking",
              icon: <CircleUser size={16} />,
            },
            {
              name: "Package Booking",
              href: "/admin/our-package",
              icon: <Users size={16} />,
            },
          ],
        },

        {
          title: "AI Studio",
          groupIcon: <Clapperboard size={16} />,
          items: [
            {
              name: "AI Videos",
              href: "/admin/ai-videos",
              icon: <Clapperboard size={16} />,
              superAdminOnly: true,
            },
            {
              name: "Automation Plans",
              href: "/admin/automation-plans",
              icon: <CalendarClock size={16} />,
              superAdminOnly: true,
            },
          ],
        },

        {
          title: "Content",
          groupIcon: <QrCode size={16} />,
          items: [
            {
              name: "Blog Management",
              href: "/admin/blog",
              icon: <BookCheck size={16} />,
            },
            {
              name: "City Services",
              href: "/admin/citys",
              icon: <Map size={16} />,
            },
            {
              name: "Website Builder",
              href: "/admin/website-builder",
              icon: <Globe size={16} />,
            },
          ],
        },

        {
          title: "Franchise",
          groupIcon: <LucideHeadset size={16} />,
          items: [
            {
              name: "Franchise Lead",
              href: "/admin/franchise/franchise-lead",
              icon: <LucideHeadset size={16} />,
            },
            {
              name: "Create Franchise",
              href: "/admin/create-franchise",
              icon: <LucideHeadset size={16} />,
            },
            {
              name: "OnBoarded Franchise",
              href: "/admin/onboarded-franchise",
              icon: <Building2 size={16} />,
            },
            {
              name: "Franchise Payouts",
              href: "/admin/franchise-payout",
              icon: <Wallet size={16} />,
            },
          ],
        },

        {
          title: "Team",
          groupIcon: <CircleUser size={16} />,
          items: [
            {
              name: "Account Manager",
              href: "/admin/manager-assignment",
              icon: <UserSquare size={16} />,
            },
          ],
        },

        {
          title: "Integrations",
          groupIcon: <Link2 size={16} />,
          items: [
            {
              name: "Business Connected Nodes",
              href: "/admin/connected-node",
              icon: <Workflow size={16} />,
            },
            {
              name: "Invoice Generator",
              href: "/admin/customGenereate",
              icon: <Wand2 size={16} />,
            },
            {
              name: "Scrapper Data",
              href: "/admin/dataFormSection",
              icon: <FileSpreadsheet size={16} />,
            },
          ],
        },

        {
          title: "System",
          groupIcon: <Settings size={16} />,
          items: [
            {
              name: "Settings",
              href: "/admin/settings",
              icon: <Settings size={16} />,
            },
            {
              name: "Maintenance",
              href: "/admin/maintenance",
              icon: <PanelLeftDashed size={16} />,
            },
            {
              name: "API Logs",
              href: "/admin/logs",
              icon: <BarChart3 size={16} />,
            },
          ],
        },
      ];

  /* ----------------------------
      ROLE-BASED FILTER
    ---------------------------- */
  // Items flagged `superAdminOnly` are hidden for every other role; a group left
  // with no items is dropped. The open-group index is computed on this list too.
  const allowedKeys = access === null ? [] : effectiveAccess(role, access);

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.superAdminOnly && role !== "superAdmin") return false;
        if (access === null) return false; // still loading
        const key = accessKeyForPath(item.href);
        // An item outside the catalog (nothing maps to it) stays visible — the
        // catalog gates what it knows, it does not hide new pages by accident.
        return !key || allowedKeys.includes(key);
      }),
    }))
    .filter((group) => group.items.length > 0);

  /* ----------------------------
      ROUTE GUARD
      Hiding a menu item is not access control on its own — the URL still
      works. Anyone landing on a page their access does not cover is sent to
      the first page they do have.
    ---------------------------- */
  useEffect(() => {
    if (access === null || !role) return;
    if (canAccessPath(role, access, pathname)) return;
    router.replace(firstAllowedHref(role, access));
  }, [access, role, pathname, router]);

  /* ----------------------------
      UI
    ---------------------------- */
  return (
    <div
      className={`flex min-h-screen transition-colors ${
        theme === "dark"
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-100 text-slate-900"
      } `}
    >
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
         fixed left-0 top-0 h-screen z-50
         transition-all duration-300

         ${
           isMobile
           ? open
              ? "translate-x-0 w-64"
               : "-translate-x-full w-64"
            : open
            ? "w-64"
            : "w-20"
          }

         ${
           theme === "dark"
           ? "bg-[#0b141a] text-white"
           : "bg-gradient-to-b from-white to-slate-50 text-slate-900 border-r border-slate-200 shadow-sm"
          }
        `}
      >
        {/* Header */}
        <div
          className={`p-4 ${theme === "dark" ? "border-b border-gray-800" : "border-b border-slate-200 bg-white/70 backdrop-blur"}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md flex items-center justify-center font-bold uppercase">
              {adminName?.charAt(0)}
            </div>

            {open && (
              <div className="leading-tight">
                <p className="font-semibold text-sm">{adminName}</p>
                <p
                  className={
                    theme === "dark"
                      ? "text-xs text-gray-400"
                      : "text-xs text-slate-500"
                  }
                >
                  {email}
                </p>
                <span
                  className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded ${
                    theme === "dark" ? "bg-gray-800" : "bg-slate-100"
                  }`}
                >
                  {role}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className={`absolute top-4 right-3 ${
              theme === "dark"
                ? "text-gray-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Menu */}
        <nav
  className="
    flex-1 mt-3 h-[calc(100vh-170px)]
    overflow-y-hidden
    hover:overflow-y-auto
    scrollbar-thin
    scrollbar-thumb-slate-400
    scrollbar-track-transparent
  "
>
          {visibleNavGroups.map((group, idx) => (
            <div key={idx}>
              <button
                onClick={() => setOpenGroup(openGroup === idx ? null : idx)}
                className={`w-full flex items-center ${
                  open ? "justify-between px-4" : "justify-center"
                } py-3 text-[12px] font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 transition-all`}
              >
                <div className="flex items-center gap-2">
                  {group.groupIcon}
                  {open && <span>{group.title}</span>}
                </div>

                {open && (
                  <span
                    className={`text-xl font-bold leading-none transition-transform duration-500 ease-in-out ${
                      openGroup === idx ? "rotate-180" : ""
                    }`}
                  >
                    ⌵
                  </span>
                )}
              </button>

              <div
                className={`ml-2 mt-1 space-y-1 overflow-hidden transition-all duration-500 ease-in-out
                  ${
                    openGroup === idx
                      ? "max-h-[500px] opacity-100 translate-y-0"
                      : "max-h-0 opacity-0 -translate-y-2"
                     }`}
              >
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center ${
                        open ? "gap-3 px-4 justify-start" : "justify-center"
                      } py-2.5 text-[14px] rounded-lg transition-all duration-300
                        ${
                            active
                            ? "bg-blue-50 text-blue-600 font-medium shadow-sm scale-[1.02]"
                            : "text-slate-700 hover:bg-slate-100 hover:text-black hover:translate-x-1"
                           }`}
                    >
                      {item.icon}
                      {open && item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Bottom */}
          <div className="mt-4 border-t pt-3">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] rounded-lg text-slate-700 hover:bg-slate-100 transition"
            >
              <ArrowUpLeft size={18} />
              {open && "Visit Website"}
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div
          className={`p-4 space-y-2 ${theme === "dark" ? "border-t border-gray-800" : "border-t border-slate-200"}`}
        >
          <button
            onClick={logout}
            className="flex items-center gap-3 text-sm text-red-400 hover:text-red-500 w-full"
          >
            <LogOut size={18} />
            {open && "Logout"}
          </button>
        </div>
      </aside>

      {isMobile && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-[60] bg-white p-2 rounded-lg shadow-md"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 min-w-0 p-6 overflow-y-auto ${
          isMobile ? "ml-0" : open ? "ml-64" : "ml-20"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
