"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import CartButton from "@/components/cart/CartButton";
import { SITE_SERVICES } from "@/lib/siteServices";
import { SERVICE_GUIDES, guidePath } from "@/lib/serviceGuides";
import CartDrawer from "@/components/cart/CartDrawer";

import {
  ChevronDown, BookOpen, PhoneCall,
  MapPin, Share2, Sparkles, Megaphone, Search, Globe, Target, Contact, Smartphone,
} from "lucide-react";

// Services menu (same list as the footer), with an icon per service.
const SERVICE_ICONS = {
  gmb: MapPin, social: Share2, ai: Sparkles, outreach: Megaphone, seo: Search, web: Globe, ads: Target, crm: Contact, app: Smartphone,
};
const SERVICE_LINKS = SITE_SERVICES.map((s) => ({ ...s, icon: SERVICE_ICONS[s.key] }));

// Guide menu: one step-by-step guide per service (lib/serviceGuides.js), then all guides.
const GUIDE_LINKS = [
  ...SERVICE_GUIDES.map((g) => ({ name: g.name, sub: g.menuSub, href: guidePath(g), icon: SERVICE_ICONS[g.key] })),
  { name: "All Guides", sub: "Every service, step by step", href: "/guide", icon: BookOpen },
];

/** Hover dropdown in the desktop nav. `wide` lays the links out in two columns. */
function NavDropdown({ label, links, wide = false }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-black text-sm font-semibold hover:text-[var(--lemon-hover)] transition cursor-pointer"
      >
        {label} <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className={`absolute top-full -left-4 pt-4 transition-all duration-300 ${open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}
      >
        <div className={`bg-white border border-black/5 rounded-2xl shadow-2xl p-2 ${wide ? "grid grid-cols-2 gap-1 w-[540px]" : "min-w-[260px]"}`}>
          {links.map((sub) => (
            <Link
              key={sub.name}
              href={sub.href}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all group/item"
            >
              <sub.icon size={18} className="text-lemon-hover mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-black/80 group-hover/item:text-black transition-colors">{sub.name}</p>
                {sub.sub && <p className="text-[10px] text-black/60 font-medium leading-tight mt-0.5">{sub.sub}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </li>
  );
}

/** A titled list of links in the mobile menu. */
function MobileLinkGroup({ title, links, onNavigate }) {
  return (
    <div className="flex flex-col gap-3 mt-2 border-t border-black/5 pt-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-black/60">{title}</p>
      <div className="grid grid-cols-1 gap-2">
        {links.map((sub) => (
          <Link key={sub.name} href={sub.href} className="flex items-center gap-3 py-2 text-sm font-semibold text-black/70" onClick={onNavigate}>
            <sub.icon size={16} className="text-lemon-hover" />
            <div>
              <span>{sub.name}</span>
              {sub.sub && <p className="text-[9px] text-black/60 font-medium -mt-1">{sub.sub}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Zustand Store
  const { isLoggedIn, logout, checkAuth, setModalOpen } = useAuthStore();

  // Sync Auth
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const navLinks = [
    { name: "Pricing", href: "/pricing" },
    { name: "Franchise", href: "/bussiness/franchise-opportunities" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-black/10 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 md:px-10 max-w-7xl mx-auto">
        {/* LOGO */}
       {/* LOGO */}
<Link href="/" className="cursor-pointer flex items-center gap-2 shrink-0">
  {/* Cropped lemon (no transparent padding), so the gap to the text is just gap-2 */}
  <Image
    src="/images/logo-mark.png"
    alt="Limbu.ai Logo"
    width={119}
    height={144}
    className="object-contain h-10 w-auto"
    priority
  />
  <span className="text-xl font-black tracking-tight text-black">
    Limbu <span className="text-[#F5C518]">AI</span>
  </span>
</Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-inter">
          <ul className="flex items-center gap-8 list-none m-0 p-0">
            <NavDropdown label="Services" links={SERVICE_LINKS} wide />
            {navLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-black text-sm font-semibold hover:text-[var(--lemon-hover)] transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}

            <NavDropdown label="Guide" links={GUIDE_LINKS} wide />

            <li>
              <Link
                href="/blog"
                className="text-black text-sm font-semibold hover:text-[var(--lemon-hover)] transition"
              >
                Blog
              </Link>
            </li>
          </ul>

          <div className="w-px h-5 bg-black/15" />

          <div className="flex items-center gap-3">
            <CartButton />
            <a
              href="tel:+919289344726"
              className="btn-ghost btn-sm text-black border-black/20 hover:bg-black/5 flex items-center gap-2"
            >
              <PhoneCall size={14} /> +91 9289344726
            </a>

            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="btn-ghost btn-sm text-black border-black/20 hover:bg-black/5">
                  Dashboard
                </Link>
                <button onClick={logout} className="btn-lemon btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-lemon btn-sm">
                Start Now
              </Link>
            )}
          </div>
        </div>

        {/* Mobile: cart + hamburger */}
        <CartButton className="md:hidden ml-auto mr-3" />
        <button
          className="md:hidden flex flex-col gap-1.5 p-1 z-50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span
            className={`block w-6 h-0.5 bg-black transition ${menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
          />
          <span
            className={`block w-6 h-0.5 bg-black transition ${menuOpen ? "opacity-0" : ""
              }`}
          />
          <span
            className={`block w-6 h-0.5 bg-black transition ${menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
          />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 px-6 pt-6 pb-6 bg-white/95 backdrop-blur-md border-b border-black/10 shadow-lg max-h-[85vh] overflow-y-auto font-inter">
          <MobileLinkGroup title="Services" links={SERVICE_LINKS} onNavigate={() => setMenuOpen(false)} />

          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-black font-semibold text-left text-lg hover:text-[var(--lemon-hover)] transition"
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <MobileLinkGroup title="Guide" links={GUIDE_LINKS} onNavigate={() => setMenuOpen(false)} />

          <Link
            href="/blog"
            className="text-black font-semibold text-left text-lg hover:text-[var(--lemon-hover)] transition"
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </Link>

          <div className="flex flex-col gap-3 mt-4">
            <a
              href="tel:+919289344726"
              onClick={() => setMenuOpen(false)}
              className="btn-ghost btn-md justify-center text-black border-black/20 flex items-center gap-2"
            >
               <PhoneCall size={16} /> +91 9289344726
            </a>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="btn-lemon btn-md flex justify-center"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="btn-lemon btn-md flex justify-center"
              >
                Start Now
              </Link>
            )}
          </div>
        </div>
      )}

      <CartDrawer />
    </nav>
  );
}