"use client";

import Link from "next/link";
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
      { name: "Service Booking", icon: Server, href: "/admin/service-booking" },
      { name: "Package Booking", icon: Package, href: "/admin/service-booking" },

  { name: "Settings", href: "/franchise-panel/settings", icon: Settings },
      { name: "Visit Website", icon: ArrowUpIcon, href: "/" },

];

export default function SidebarFranchisePanel() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("franchise_token");
    localStorage.removeItem("franchise_user");
    router.push("/franchise-panel/login");
  };

  return (
    <aside className="w-64 bg-black text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-gray-800">
        Franchise Panel
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => {
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
