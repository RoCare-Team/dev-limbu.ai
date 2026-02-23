"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, MoreVertical, X } from "lucide-react";

export default function NavBar({ logo, title, navItems = [], phone, whatsappLink }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  /* Shrink navbar on scroll */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Close menu on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavClick = (href) => {
    setMobileOpen(false);
    // smooth scroll
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-lg shadow-lg py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo + Brand */}
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); handleNavClick("#home"); }}
          className="flex items-center gap-3"
        >
          {logo && (
            <div
              className={`rounded-xl overflow-hidden transition-all duration-300 ${
                scrolled ? "bg-white shadow p-1" : "bg-white/20 backdrop-blur-sm p-1"
              }`}
            >
              <img
                src={logo}
                alt={title}
                className="h-10 w-auto max-w-[120px] object-contain"
              />
            </div>
          )}
          {title && (
            <span
              className={`font-bold text-lg transition-colors duration-300 hidden sm:block ${
                scrolled ? "text-gray-900" : "text-white drop-shadow"
              }`}
            >
              {title}
            </span>
          )}
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                scrolled
                  ? "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  : "text-white/90 hover:text-white hover:bg-white/20"
              }`}
            >
              {item.label}
            </a>
          ))}

          {/* Call CTA */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="ml-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          )}
        </nav>

        {/* Mobile: Call button + 3-dot menu */}
        <div className="flex md:hidden items-center gap-2" ref={menuRef}>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 shadow"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden xs:inline">Call</span>
            </a>
          )}

          {/* 3-dot button */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`p-2 rounded-full transition-all duration-200 ${
              scrolled
                ? "text-gray-700 hover:bg-gray-100"
                : "text-white hover:bg-white/20"
            }`}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}
          </button>

          {/* Dropdown menu */}
          {mobileOpen && (
            <div className="absolute top-full right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[180px] animate-fade-in">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                  className="block px-5 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold text-sm transition-colors border-b border-gray-50 last:border-0"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}