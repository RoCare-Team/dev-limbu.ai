"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Platform",
      links: [
        { label: "Post Management", href: "/post-management" },
        { label: "Review Management", href: "/review-management" },
        { label: "Magic QR", href: "/get-magic-qr" },
        { label: "Blog", href: "/blog" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Local SEO", href: "/services/local-seo" },

      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Conditions", href: "/terms-and-conditions" },
        { label: "Work With Us", href: "/work-with-us" },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: "https://www.facebook.com/limbuai",
      color: "hover:bg-[#1877F2]",
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/limbuai",
      color: "hover:bg-[#E4405F]",
    },
    {
      icon: Youtube,
      href: "https://www.youtube.com/@limbuai",
      color: "hover:bg-[#FF0000]",
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/company/limbuai/",
      color: "hover:bg-[#0A66C2]",
    },
  ];

  return (
    <footer className="relative pt-24 pb-12 overflow-hidden bg-[#fafafa] border-t border-slate-200">
      {/* ── Background Aesthetics ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-yellow-400/10 blur-[100px] rounded-full z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          {/* ── Brand Section ── */}
          <div className="lg:col-span-4 space-y-8">
            <Link
              href="/"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="/images/bg-logo.png"
                alt="Limbu.ai Logo"
                width={160}
                height={50}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-slate-600 text-base leading-relaxed max-w-sm">
              Empowering local businesses with AI-driven Google Business Profile
              automation and advanced digital marketing strategies to dominate
              local search.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/badges/google-play-badge.svg"
                  alt="Play Store"
                  width={140}
                  height={42}
                  className="h-10 w-auto hover:scale-105 transition-transform shadow-sm rounded-md"
                />
              </a>
              <a
                href="https://apps.apple.com/in/app/limbu-ai/id6757781138"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/badges/app-store-badge.svg"
                  alt="App Store"
                  width={125}
                  height={42}
                  className="h-10 w-auto hover:scale-105 transition-transform shadow-sm rounded-md"
                />
              </a>
            </div>
          </div>

          {/* ── Navigation Links ── */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-slate-900 text-sm font-bold uppercase tracking-widest mb-8">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-center text-slate-600 hover:text-[#EAB308] transition-all duration-300 text-[15px]"
                      >
                        <ArrowRight className="w-0 h-3 opacity-0 -ml-4 group-hover:w-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 mr-2" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Contact & Socials ── */}
          <div className="lg:col-span-4">
            <h3 className="text-slate-900 text-sm font-bold uppercase tracking-widest mb-8">
              Connect With Us
            </h3>
            <div className="space-y-6 mb-10">
              <a
                href="mailto:info@limbu.ai"
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-[#EAB308]/50 transition-colors">
                  <Mail className="w-5 h-5 text-slate-400 group-hover:text-[#EAB308] transition-colors" />
                </div>
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                  info@limbu.ai
                </span>
              </a>

              <a
                href="tel:+919289344726"
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center shadow-sm">
                  <Phone className="w-5 h-5 text-[#EAB308]" />
                </div>
                <span className="text-slate-900 font-bold text-lg">
                  +91 92893 44726
                </span>
              </a>

              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed pt-1">
                  8th Floor, Unit No. 831,
                  <br />
                  JMD Megapolis, Sohna Road, Gurugram
                </p>
              </div>
            </div>

            {/* Social Icons with Tooltips or Motion */}
            <div className="flex gap-3">
              {socialLinks.map((social, i) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -4 }}
                    className={`w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center transition-all duration-300 shadow-sm hover:text-white hover:border-transparent ${social.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 gap-6">
          {/* slate-400 (#94a3b8) footer ke #fafafa background par sirf ~2.5:1 deta
              tha — WCAG AA fail. slate-600 par 6.8:1 milta hai. */}
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            © {currentYear} Limbu.ai. Built for Local Growth.
          </p>

          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-600">
            <Link
              href="/privacy-policy"
              className="hover:text-[#EAB308] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms-and-conditions"
              className="hover:text-[#EAB308] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/sitemap"
              className="hover:text-[#EAB308] transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
