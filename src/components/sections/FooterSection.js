"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function FooterSection() {
  const footerSections = [
    {
      title: "Platform",
      links: [
        { label: "Post Management", href: "/post-management" },
        { label: "Review Management", href: "/review-management" },
        { label: "Magic QR", href: "/get-magic-qr" },
        { label: "Blog", href: "/blog" },
        { label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Conditions", href: "/terms-and-conditions" },
        { label: "Work With Us", href: "/work-with-us" },
      ],
    },
  ];

  return (
    <footer
      className="relative pt-20 pb-10 overflow-hidden border-t border-slate-200"
      style={{ backgroundColor: "#fafafa" }} // Soft off-white/light gray background
    >
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(circle at bottom right, rgba(250, 204, 21, 0.2) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ── Top Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Column 1: Brand (4 cols) */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-block mb-8">
              <Image
                src="/images/limbuailogo.png"
                alt="Limbu.ai Logo"
                width={160}
                height={50}
                className="h-auto" // Removed the invert filter to keep original colors
              />
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-xs font-medium">
              Empowering local businesses with AI-driven Google Business Profile automation and advanced digital marketing strategies.
            </p>

            {/* App Store Badges */}
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-105 transition-transform duration-300"
              >
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  width={135}
                  height={40}
                  className="h-10 w-auto"
                />
              </a>
              <a
                href="https://apps.apple.com/in/app/limbu-ai/id6757781138"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-105 transition-transform duration-300"
              >
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on the App Store"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </a>
            </div>
          </div>

          {/* Columns 2, 3: Links (4 cols) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-slate-900 text-xs font-bold uppercase tracking-[0.2em] mb-8">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-600 font-medium hover:text-[#EAB308] transition-colors duration-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Column 4: Contact (4 cols) */}
          <div className="md:col-span-4">
            <h3 className="text-slate-900 text-xs font-bold uppercase tracking-[0.2em] mb-8">
              Connect With Us
            </h3>
            <ul className="space-y-4 mb-8">
              <li>
                <a href="mailto:info@limbu.ai" className="flex items-center gap-3 text-sm text-slate-600 font-medium hover:text-[#EAB308] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-[#EAB308]/10 group-hover:border-transparent transition-colors">
                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-[#EAB308]" />
                  </div>
                  info@limbu.ai
                </a>
              </li>
              <li>
                <a href="tel:+919289344726" className="flex items-center gap-3 text-sm font-bold text-[#EAB308] hover:scale-[1.02] transition-transform origin-left group">
                  <div className="w-8 h-8 rounded-lg bg-[#EAB308]/10 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  +91 92833 44726
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium group">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <span className="mt-1.5 leading-snug">
                  8th Floor, Unit No. 831,<br />
                  JMD Megapolis, Gurugram
                </span>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex gap-4">
              {[
                { icon: Facebook, href: "https://www.facebook.com/limbuai" },
                { icon: Instagram, href: "https://www.instagram.com/limbuai" },
                { icon: Youtube, href: "https://www.youtube.com/@limbuai" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/limbuai/" },
              ].map((social, i) => {
                const Icon = social.icon;
                return (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-[#EAB308] hover:border-transparent hover:text-white transition-all duration-300 shadow-sm"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            © 2026 Limbu.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}