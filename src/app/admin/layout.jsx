"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu, X, User, Settings, BarChart3, Users,
  ArrowUpLeft, UserSquare, CircleUser,
  PanelLeftDashed
} from "lucide-react";
import { LeaderboardSharp } from "@mui/icons-material";

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  const allNavItems = [
    { name: "Dashboard", icon: <BarChart3 size={18} />, href: "/admin/dashboard" },
    { name: "Users", icon: <Users size={18} />, href: "/admin/user-management" },
    { name: "User Recharge", icon: <UserSquare size={18} />, href: "/admin/user-recharge" },
    { name: "Service Booking", icon: <CircleUser size={18} />, href: "/admin/service-booking" },
    { name: "Package Booking", icon: <Users size={18} />, href: "/admin/our-package" },
    { name: "Leads From Contact Form", icon: <LeaderboardSharp size={18} />, href: "/admin/contact-form" },
    { name: "Demo", icon: <LeaderboardSharp size={18} />, href: "/admin/demoBook" },
    { name: "Franchise Lead", icon: <LeaderboardSharp size={18} />, href: "/admin/franchise/franchise-lead" },
    { name: "FB Lead", icon: <PanelLeftDashed size={18} />, href: "/admin/fb-lead" },
    { name: "Settings", icon: <Settings size={18} />, href: "/admin/settings" },
    { name: "Visit Website", icon: <ArrowUpLeft size={18} />, href: "/" },
  ];

  // 🔐 Role based menu
  const navItems =
    role === "franchiseAdmin"
      ? allNavItems
          .filter((item) =>
            ["Dashboard", "Franchise Lead"].includes(item.name)
          )
          .map((item) =>
            item.name === "Dashboard"
              ? { ...item, href: "/admin/franchise/dashboard" }
              : item
          )
      : allNavItems;

  // 🎯 Header title by role
  const headerTitle =
    role === "franchiseAdmin"
      ? "Franchise Admin Dashboard"
      : "Admin Dashboard";

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "w-64" : "w-20"
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <a href="/" target="_blank">
            <h2 className={`font-bold text-xl ${open ? "block" : "hidden"}`}>
              {role === "franchiseAdmin" ? "Franchise" : "Admin"}
            </h2>
          </a>
          <button onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-4 space-y-2">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.name}
              className="flex items-center gap-3 px-5 py-3 text-gray-200 hover:bg-gray-800 hover:text-white transition"
            >
              {item.icon}
              {open && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4 flex items-center gap-3 text-gray-300">
          <User size={20} />
          {open && (
            <span>
              {role === "franchiseAdmin" ? "Franchise Admin" : "Admin User"}
            </span>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-700">
            {headerTitle}
          </h1>

          {role !== "franchiseAdmin" && (
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
