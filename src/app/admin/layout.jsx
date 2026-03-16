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
  ArrowUpLeft,
  UserSquare,
  CircleUser,
  PanelLeftDashed,
  BookCheck,
  LogOut,
  LucideHeadset,
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
  const allNavItems = [
    { name: "Dashboard", icon: <BarChart3 size={18} />, href: "/admin/dashboard" },

    { name: "Leads", icon: <Users size={18} />, href: "/admin/user-management", key: "manageUsers" },

    { name: "User Recharge", icon: <BookCheck size={18} />, href: "/admin/user-recharge", key: "manageUsers" },

    { name: "User Management", icon: <UserSquare size={18} />, href: "/admin/rbac", key: "manageTeam" },

    { name: "Service Booking", icon: <CircleUser size={18} />, href: "/admin/service-booking", key: "manageLeads" },

    { name: "Package Booking", icon: <Users size={18} />, href: "/admin/our-package", key: "manageLeads" },

    { name: "Contact Leads", icon: <LeaderboardSharp />, href: "/admin/contact-form", key: "manageLeads" },

    { name: "Demo Leads", icon: <LeaderboardSharp />, href: "/admin/demoBook", key: "manageLeads" },

    { name: "Franchise Lead", icon: <LucideHeadset />, href: "/admin/franchise/franchise-lead", key: "manageFranchise" },
    { name: "Tata Dialer Lead", icon: <LeaderboardSharp />, href: "/admin/tata-dialer-lead",key: "manageUsers" },
    { name: "Create Franchise", icon: <LeaderboardSharp />, href: "/admin/create-franchise" },
        { name: "Account Manager", icon: <UserSquare size={18} />, href: "/admin/manager-assignment" },


    // { name: "FB Lead", icon: <PanelLeftDashed size={18} />, href: "/admin/fb-lead", key: "manageLeads" },

    { name: "Settings", icon: <Settings size={18} />, href: "/admin/settings", key: "seeAnalytics" },

    { name: "Visit Website", icon: <ArrowUpLeft size={18} />, href: "/" },
  ];

  /* ----------------------------
     ROLE-BASED FILTER
  ---------------------------- */
  const navItems = allNavItems.filter((item) => {
    if (role === "superAdmin" || role === "admin") return true;

    if (role === "agent") {
      return ["Leads", "Visit Website"].includes(item.name);
    }

    if (role === "manager") {
      return ["Leads", "Account Manager", "Visit Website"].includes(item.name);
    }

    if (["franchiseAdmin", "superFranchiseAdmin"].includes(role) && item.name === "Dashboard") return false;
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
        } bg-[#0b141a] text-white transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold uppercase">
              {adminName?.charAt(0)}
            </div>

            {open && (
              <div className="leading-tight">
                <p className="font-semibold text-sm">{adminName}</p>
                <p className="text-xs text-gray-400">{email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-gray-800">
                  {role}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="absolute top-4 right-3 text-gray-400 hover:text-white"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 mt-3">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition
                ${active ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
              >
                {item.icon}
                {open && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
