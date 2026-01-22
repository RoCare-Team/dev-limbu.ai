"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Settings,
  BarChart3,
  Users,
  ArrowUpLeft,
  UserSquare,
  CircleUser,
  PanelLeftDashed,
  BookCheck,
} from "lucide-react";
import { LeaderboardSharp } from "@mui/icons-material";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState({});

  /* ----------------------------
     AUTH + USER DATA
  ---------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/adminLogin");
      return;
    }

    const storedRole = localStorage.getItem("role");
    const storedPermissions = localStorage.getItem("permissions");

    if (storedRole && storedRole !== "undefined") {
      setRole(storedRole);
    }

    try {
      setPermissions(JSON.parse(storedPermissions) || {});
    } catch {
      setPermissions({});
    }
  }, [router]);

  /* ----------------------------
     SIDEBAR MENU CONFIG
  ---------------------------- */
  const allNavItems = [
    { name: "Dashboard", icon: <BarChart3 size={18} />, href: "/admin/dashboard" },

    {
      name: "Leads",
      icon: <Users size={18} />,
      href: "/admin/user-management",
      key: "manageUsers",
    },

    { name: "User Recharge", icon: <BookCheck size={18} />, href: "/admin/user-recharge",key: "manageUsers", },

    {
      name: "User Management",
      icon: <UserSquare size={18} />,
      href: "/admin/rbac",
      key: "manageTeam",
    },

    { name: "Service Booking", icon: <CircleUser size={18} />, href: "/admin/service-booking",key: "manageLeads" },

    { name: "Package Booking", icon: <Users size={18} />, href: "/admin/our-package",key: "manageLeads"},

    {
      name: "Leads From Contact Form",
      icon: <LeaderboardSharp />,
      href: "/admin/contact-form",
      key: "manageLeads",
    },

    {
      name: "Demo",
      icon: <LeaderboardSharp />,
      href: "/admin/demoBook",
      key: "manageLeads",
    },

    {
      name: "Franchise Lead",
      icon: <LeaderboardSharp />,
      href: "/admin/franchise/franchise-lead",
      key: "manageFranchise",
    },

    {
      name: "FB Lead",
      icon: <PanelLeftDashed size={18} />,
      href: "/admin/fb-lead",
      key: "manageLeads",
    },

    {
      name: "Settings",
      icon: <Settings size={18} />,
      href: "/admin/settings",
      key: "seeAnalytics",
    },

    { name: "Visit Website", icon: <ArrowUpLeft size={18} />, href: "/" },
  ];

  /* ----------------------------
     ROLE-BASED FILTER
  ---------------------------- */
  const navItems = allNavItems.filter((item) => {
    // SuperAdmin & Admin → Full Access
    if (role === "superAdmin" || role === "admin") return true;

    // Other roles → Permission based
    if (!item.key) return true;
    return permissions[item.key] === true;
  });

  /* ----------------------------
     UI
  ---------------------------- */
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "w-64" : "w-20"
        } bg-gray-900 text-white transition-all duration-300`}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <h2 className="text-sm font-semibold uppercase">
            {open ? role : role?.charAt(0)}
          </h2>

          <button onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-800 transition"
            >
              {item.icon}
              {open && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
