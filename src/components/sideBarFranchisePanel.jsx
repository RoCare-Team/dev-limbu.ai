"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Users2,
  Package,
  Server,
  ArrowUpIcon,
  IndianRupee,
  KeyRound,
  UserCircle,
} from "lucide-react";
import {
  filterMenuForRole,
  getFranchiseUserFromStorage,
} from "@/lib/franchiseAuth";

const menu = [
  { name: "Dashboard", href: "/franchise-panel/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/franchise-panel/leads", icon: FileText },
  { name: "Users Recharge", href: "/franchise-panel/user-management/recharge", icon: Users2 },
  { name: "Team Management", href: "/franchise-panel/team-management", icon: FileText },
  { name: "Service Booking", icon: Server, href: "/franchise-panel/service-booking" },
  { name: "Package Booking", icon: Package, href: "/franchise-panel/package-booking" },
  { name: "Revenue Share", icon: IndianRupee, href: "/franchise-panel/revenue-share" },
  { name: "Visit Website", icon: ArrowUpIcon, href: "/" },
];

export default function SidebarFranchisePanel() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getFranchiseUserFromStorage());
  }, []);

  const visibleMenu = filterMenuForRole(menu, user?.role);

  const logout = () => {
    localStorage.removeItem("franchise_token");
    localStorage.removeItem("franchise_user");
    router.push("/franchise-panel/login");
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-[#0a0a0a] text-zinc-300 border-r border-zinc-800/40">
      {/* Logo Section */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center">
            <Package className="text-black" size={16} />
          </div>
          <span className="text-base font-bold tracking-tight text-white uppercase">
            Franchise Panel
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-[5px] transition-all duration-200
                ${
                  active
                    ? "bg-white text-black font-semibold shadow-md"
                    : "hover:bg-zinc-800/60 hover:text-white"
                }
              `}
            >
              <Icon 
                size={18} 
                className={`${active ? "text-black" : "text-zinc-400 group-hover:text-white"}`} 
              />
              <span className="text-[13.5px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section (Compact Height) */}
      <div className="mt-auto p-3 border-t border-zinc-800/50 bg-[#0d0d0d]">
        {/* User Profile Card */}
        <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50 p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
            <UserCircle size={18} className="text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[11px] font-bold text-white uppercase leading-tight">
              {user?.fullName || user?.ownerName || "Franchise User"}
            </p>
            <p className="truncate text-[10px] text-zinc-500 leading-tight">
              {user?.email || "Manager"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <Link
            href="/franchise-panel/change-password"
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-all
              ${
                pathname === "/franchise-panel/change-password"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/40 hover:text-white"
              }`}
          >
            <KeyRound size={16} className="shrink-0" />
            <span>Change Password</span>
          </Link>

          <button
            onClick={logout}
            className="group w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-red-900/30 group-hover:border-red-500/50 transition-colors">
                <LogOut size={14} />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}