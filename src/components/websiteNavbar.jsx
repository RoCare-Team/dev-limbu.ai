"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, Menu, X, ChevronRight } from "lucide-react";

export default function NavBar({ 
  logo, 
  title, 
  navItems = [], 
  phone, 
  theme = { primary: "#2563eb", secondary: "#F0A500" }, // Dynamic defaults
  darkHero = false 
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Set CSS variables for the whole component scope
  const dynamicStyles = {
    "--primary-nav": theme.primary,
    "--secondary-nav": theme.secondary,
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavClick = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      window.scrollTo({ top: (elementRect - bodyRect) - offset, behavior: "smooth" });
    }
  };

  const getTextColor = () => {
    if (scrolled) return "text-gray-900";
    return darkHero ? "text-white" : "text-gray-900";
  };

  return (
    <header
      style={dynamicStyles}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Title */}
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); handleNavClick("#home"); }}
            className="flex items-center gap-3 group"
          >
            {logo && (
              <img
                src={logo}
                alt={title}
                className={`h-10 w-auto transition-transform duration-300 ${scrolled ? "scale-90" : "scale-100"}`}
              />
            )}
            {title && (
              <span className={`font-bold text-xl tracking-tight transition-colors ${getTextColor()}`}>
                {title}
              </span>
            )}
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5 ${getTextColor()} hover:text-[var(--primary-nav)]`}
              >
                {item.label}
              </a>
            ))}

            {phone && (
              <a
                href={`tel:${phone}`}
                className="ml-4 inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                style={{ backgroundColor: "var(--primary-nav)" }}
              >
                <Phone className="w-4 h-4" />
                <span>Call Now</span>
              </a>
            )}
          </nav>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2" ref={menuRef}>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="p-2.5 rounded-full text-white shadow-md"
                style={{ backgroundColor: "var(--primary-nav)" }}
              >
                <Phone className="w-5 h-5" />
              </a>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`p-2 rounded-lg ${getTextColor()} hover:bg-black/5`}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
              <div className="absolute top-full right-4 left-4 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col p-2">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                      className="flex items-center justify-between px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-sm"
                    >
                      <span className="group-hover:text-[var(--primary-nav)] transition-colors">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}