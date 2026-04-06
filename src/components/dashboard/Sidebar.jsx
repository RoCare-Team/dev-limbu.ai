"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MENU_ITEMS } from "./nav-data";
import NavItem from "./NavItem"; // Move NavItem logic here
import logoDash from "../../public/images/bg-logo.png";

export default function Sidebar({
  open,
  setOpen,
  isMobile,
  pathname,
  navigate,
  userName,
  userEmail,
  userImage,
  visibleItems,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const content = (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logoDash} width={32} height={32} alt="Logo" />
          {open && (
            <span className="font-anton text-yellow-400 text-lg uppercase">
              Limbu.AI
            </span>
          )}
        </Link>
        {open && !isMobile && (
          <button
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item, idx) => (
          <NavItem
            key={idx}
            item={item}
            open={open}
            isActive={
              item.path === pathname ||
              item.children?.some((c) => c.path === pathname)
            }
            isDropdownOpen={openDropdown === idx}
            onToggleDropdown={() =>
              setOpenDropdown(openDropdown === idx ? null : idx)
            }
            onNavigate={navigate}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/5">
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5"
        >
          <AvatarCircle name={userName} size="sm" src={userImage} />
          {open && (
            <div className="text-left overflow-hidden">
              <p className="text-[12px] font-semibold text-slate-300 truncate">
                {userName}
              </p>
              <p className="text-[10px] text-slate-600 truncate">{userEmail}</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return open ? (
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside className="absolute left-0 top-0 h-full w-[260px] border-r border-white/5">
          {content}
        </aside>
      </div>
    ) : null;
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full z-30 transition-all duration-300 border-r border-white/5"
      style={{ width: open ? "260px" : "72px" }}
    >
      {content}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
        >
          <ChevronRight size={12} className="text-black" />
        </button>
      )}
    </aside>
  );
}
