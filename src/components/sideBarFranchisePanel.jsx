"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Users2,
  CircleAlert,
  Package,
  Server,
  ArrowUpIcon,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/franchise-panel/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/franchise-panel/leads", icon: FileText },
  { name: "Users Recharge", href: "/franchise-panel/user-management/recharge", icon: Users2 },
  { name: "Team  Management", href: "/franchise-panel/team-management", icon: FileText },
      { name: "Service Booking", icon: Server, href: "/franchise-panel/service-booking" },
      { name: "Package Booking", icon: Package, href: "/franchise-panel/package-booking" },

  // { name: "Settings", href: "/franchise-panel/settings", icon: Settings },
      { name: "Visit Website", icon: ArrowUpIcon, href: "/" },

];

export default function SidebarFranchisePanel() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("franchise_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const visibleMenu =
    user?.role === "agent"
      ? menu.filter((item) =>
          ["/franchise-panel/dashboard", "/franchise-panel/leads"].includes(item.href),
        )
      : menu;

  const logout = () => {
    localStorage.removeItem("franchise_token");
    localStorage.removeItem("franchise_user");
    router.push("/franchise-panel/login");
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-black text-white">
      <div className="border-b border-gray-800 p-6 text-xl font-bold">
        Franchise Panel
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition
                ${active ? "bg-white text-black" : "hover:bg-gray-800"}
              `}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mb-2 rounded-lg border border-gray-800 px-4 py-3">
        <p className="truncate text-sm font-semibold">{user?.fullName || user?.ownerName || "Franchise User"}</p>
        <p className="truncate text-xs text-gray-400">{user?.email || ""}</p>
      </div>

      <button
        onClick={logout}
        className="m-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-white-100 hover:bg-white-700 transition"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
