"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";

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
    { name: "Services", href: "/#services" },
    { name: "Franchise", href: "/franchise-opportunities" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-black/10 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 md:px-10">
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
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-8 list-none m-0 p-0">
            {navLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-black font-medium hover:text-[var(--lemon-hover)] transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="w-px h-5 bg-black/15" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="btn-ghost btn-sm text-black border-black/20 hover:bg-black/5"
            >
              Book Free Demo
            </button>

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
        <div className="md:hidden flex flex-col gap-4 px-6 pt-6 pb-6 bg-white/95 backdrop-blur-md border-b border-black/10 shadow-lg">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-black font-medium text-left text-lg hover:text-[var(--lemon-hover)] transition"
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => {
                setModalOpen(true);
                setMenuOpen(false);
              }}
              className="btn-ghost btn-md justify-center text-black border-black/20"
            >
              Book Free Demo
            </button>

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