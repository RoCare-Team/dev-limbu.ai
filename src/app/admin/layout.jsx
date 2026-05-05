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
  } from "lucide-react";
  import { LeaderboardSharp } from "@mui/icons-material";

  export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [open, setOpen] = useState(true);
    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState({});
    const [adminName, setAdminName] = useState("");
    const [email, setEmail] = useState("");
    const theme = "light";

    /* ----------------------------
      AUTH + USER DATA
    ---------------------------- */
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/adminLogin");
        return;
      }

      setRole(localStorage.getItem("role") || "");
      setAdminName(localStorage.getItem("adminName") || "Admin");
      setEmail(localStorage.getItem("email") || "");

      try {
        setPermissions(JSON.parse(localStorage.getItem("permissions")) || {});
      } catch {
        setPermissions({});
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

  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: <BarChart3 size={16}/> },
        { name: "Store Business", href: "/admin/store-bussiness", icon: <QrCode size={16}/> },
        { name: "User Recharge", href: "/admin/user-recharge", icon: <Wallet size={16}/> },
        { name: "User Management", href: "/admin/rbac", icon: <UserSquare size={16}/> },
      ],
    },

    {
    title: "Leads",
    href: "/admin/user-management", // 👈 ADD THIS
    items: [
          { name: "Leads", icon: <Users size={18} />, href: "/admin/user-management", key: "manageUsers" },
      { name: "Contact Leads", href: "/admin/contact-form", icon: <Users size={16}/> },
      { name: "Demo Leads", href: "/admin/demoBook", icon: <Users size={16}/> },
      { name: "Tata Dialer Leads", href: "/admin/tata-dialer-lead", icon: <Users size={16}/> },
    ],
  },
    {
      title: "Bookings",
      items: [
        { name: "Service Booking", href: "/admin/service-booking", icon: <CircleUser size={16}/> },
        { name: "Package Booking", href: "/admin/our-package", icon: <Users size={16}/> },
      ],
    },
    
    {
      title: "Content",
      items: [
        { name: "Blog Management", href: "/admin/blog", icon: <BookCheck size={16}/> },
        { name: "City Services", href: "/admin/citys", icon: <Map size={16}/> },
      ],
    },
    {
      title: "Franchise",
      items: [
        { name: "Franchise Lead", href: "/admin/franchise/franchise-lead", icon: <LucideHeadset size={16}/> },
        { name: "Create Franchise", href: "/admin/create-franchise", icon: <LucideHeadset size={16}/> },
      ],
    },
    {
      title: "Team",
      items: [
        { name: "Account Manager", href: "/admin/manager-assignment", icon: <UserSquare size={16}/> },
      ],
    },
    {
      title: "Integrations",
      items: [
        { name: "Connected Nodes", href: "/admin/connected-node", icon: <Link2 size={16}/> },
      ],
    },
    {
      title: "System",
      items: [
        { name: "Settings", href: "/admin/settings", icon: <Settings size={16}/> },
        { name: "Maintenance", href: "/admin/maintenance", icon: <PanelLeftDashed size={16}/> },
        { name: "API Logs", href: "/admin/logs", icon: <BarChart3 size={16}/> },
      ],
    },
  ];

    /* ----------------------------
      ROLE-BASED FILTER
    ---------------------------- */
    

    /* ----------------------------
      UI
    ---------------------------- */
    return (
      <div
        className={`flex min-h-screen transition-colors ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"
          } `}
      >
        {/* Sidebar */}
        <aside
          className={`${open ? "w-64" : "w-20"
            } fixed left-0 top-0 h-screen z-50
    transition-all duration-300 flex flex-col
    overflow-y-hidden hover:overflow-y-auto
    ${theme === "dark"
              ? "bg-[#0b141a] text-white"
              : "bg-gradient-to-b from-white to-slate-50 text-slate-900 border-r border-slate-200 shadow-sm"
            }`}
        >
          {/* Header */}
          <div className={`p-4 ${theme === "dark" ? "border-b border-gray-800" : "border-b border-slate-200 bg-white/70 backdrop-blur"}`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md flex items-center justify-center font-bold uppercase">
                {adminName?.charAt(0)}
              </div>

              {open && (
                <div className="leading-tight">
                  <p className="font-semibold text-sm">{adminName}</p>
                  <p className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-slate-500"}>{email}</p>
                  <span
                    className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded ${theme === "dark" ? "bg-gray-800" : "bg-slate-100"
                      }`}
                  >
                    {role}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setOpen(!open)}
              className={`absolute top-4 right-3 ${theme === "dark" ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Menu */}
        <nav className="flex-1 mt-3">

    {navGroups.map((group, idx) => (
      <div key={idx}>
        
        <button
          onClick={() => setOpenGroup(openGroup === idx ? null : idx)}
          className="w-full flex items-center justify-between px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
        >
          {group.title}
          <span
  className={`text-xl font-bold leading-none transition-transform ${
    openGroup === idx ? "rotate-180" : ""
  }`}
>
  ⌵
</span>
        </button>

        {openGroup === idx && (
          <div className="ml-2 mt-1 space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[14px] rounded-lg transition-all
  ${
    active
      ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
      : "text-slate-700 hover:bg-slate-100 hover:text-black"
  }`}
                >
                  {item.icon}
                  {open && item.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    ))}

    {/* Bottom */}
    <div className="mt-4 border-t pt-3">
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-2.5 text-[14px] rounded-lg text-slate-700 hover:bg-slate-100 transition"
      >
        <ArrowUpLeft size={18}/>
        {open && "Visit Website"}
      </Link>

      
    </div>  

  </nav>

          {/* Logout */}
          <div className={`p-4 space-y-2 ${theme === "dark" ? "border-t border-gray-800" : "border-t border-slate-200"}`}>
            <button
              onClick={logout}
              className="flex items-center gap-3 text-sm text-red-400 hover:text-red-500 w-full"
            >
              <LogOut size={18} />
              {open && "Logout"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 min-w-0 p-6 overflow-y-auto ${open ? "ml-64" : "ml-20"
            }`}
        >
          {children}
        </main>
      </div>
    );
  }




