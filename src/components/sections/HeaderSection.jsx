"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";

import { ChevronDown, BookOpen, User, Info, Link as LinkIcon, MessageSquare, QrCode, Send, PhoneCall } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Zustand Store
  const { isLoggedIn, logout, checkAuth, setModalOpen } = useAuthStore();

  // Sync Auth
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const navLinks = [
    { name: "Pricing", href: "/pricing" },
    { name: "Features", href: "/#features" },
    { name: "Blog", href: "/blog" },
    { name: "Franchise", href: "/franchise-opportunities" },
  ];

  const resourceLinks = [
    {
      name: "How To Connect GMB",
      sub: "Step-by-step connection guide",
      href: "/how-to-connect-gmb",
      icon: LinkIcon
    },
    { name: "Create AI Post", href: "/how-to-create-post", icon: BookOpen },
    { name: "Reply to Reviews", href: "/how-to-reply-review", icon: MessageSquare },
    { name: "Generate Magic QR", href: "/how-to-generate-magic-qr", icon: QrCode },
    { name: "Post on GMB", href: "/how-to-post-on-gmb", icon: Send },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-black/10 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 md:px-10 max-w-7xl mx-auto">
        {/* LOGO */}
        <Link href="/" className="cursor-pointer flex items-center shrink-0">
          <Image
            src="/images/limbuailogo.png"
            alt="Limbu.ai Logo"
            width={160}
            height={49}
            className="object-contain h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-inter">
          <ul className="flex items-center gap-8 list-none m-0 p-0">
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

            {/* Resources Dropdown */}
            <li className="relative group">
              <button
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                className="flex items-center gap-1 text-black text-sm font-semibold hover:text-[var(--lemon-hover)] transition cursor-pointer"
              >
                GMB Guide <ChevronDown size={14} className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <div
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                className={`absolute top-full -left-4 pt-4 transition-all duration-300 ${dropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}
              >
                <div className="bg-white border border-black/5 rounded-2xl shadow-2xl p-2 min-w-[260px]">
                  {resourceLinks.map((sub) => (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all group/item"
                    >
                      <sub.icon size={18} className="text-lemon-hover mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-black/80 group-hover/item:text-black transition-colors">{sub.name}</p>
                        {sub.sub && <p className="text-[10px] text-black/40 font-medium leading-tight mt-0.5">{sub.sub}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          </ul>

          <div className="w-px h-5 bg-black/15" />

          <div className="flex items-center gap-3">
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

        {/* Mobile Hamburger */}
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

          {/* Mobile Resources Section */}
          <div className="flex flex-col gap-3 mt-2 border-t border-black/5 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/30">GMB Mastery Guide</p>
            <div className="grid grid-cols-1 gap-2">
              {resourceLinks.map((sub) => (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className="flex items-center gap-3 py-2 text-sm font-semibold text-black/70"
                  onClick={() => setMenuOpen(false)}
                >
                  <sub.icon size={16} className="text-lemon-hover" />
                  <div>
                    <span>{sub.name}</span>
                    {sub.sub && <p className="text-[9px] text-black/30 font-medium -mt-1">{sub.sub}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>

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
    </nav>
  );
}