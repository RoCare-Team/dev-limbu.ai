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

return ( <footer className="bg-[#fafafa] border-t border-slate-200 pt-16 pb-10"> <div className="max-w-7xl mx-auto px-6">
    {/* GRID */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-x-10">

      {/* LEFT */}
      <div className="md:col-span-4 flex flex-col items-start">
        <Image
          src="/images/bg-logo.png"
          alt="Limbu.ai Logo"
          width={140}
          height={40}
          className="mb-6"
        />

        <p className="text-sm text-slate-600 leading-relaxed max-w-[260px] mb-6">
          Empowering local businesses with AI-driven Google Business Profile automation and advanced digital marketing strategies.
        </p>

        <div className="flex gap-3">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
            alt="Google Play"
            width={130}
            height={40}
          />
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
            alt="App Store"
            width={120}
            height={40}
          />
        </div>
      </div>

      {/* MIDDLE LINKS */}
      <div className="md:col-span-4 grid grid-cols-2 gap-8">
        {footerSections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-bold tracking-[0.2em] text-slate-900 mb-6 uppercase">
              {section.title}
            </h3>

            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-yellow-500 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div className="md:col-span-4">
        <h3 className="text-xs font-bold tracking-[0.2em] text-slate-900 mb-6 uppercase">
          Connect With Us
        </h3>

        <div className="space-y-4 text-sm text-slate-600">

          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4" />
            info@limbu.ai
          </div>

          <div className="flex items-center gap-3 text-yellow-500 font-semibold">
            <Phone className="w-4 h-4" />
            +91 92833 44726
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-1" />
            <span>
              8th Floor, Unit No. 831,<br />
              JMD Megapolis, Gurugram
            </span>
          </div>
        </div>

        {/* SOCIAL */}
        <div className="flex gap-3 mt-6">
          {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
            <div
              key={i}
              className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-yellow-500 hover:text-white transition"
            >
              <Icon className="w-4 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* BOTTOM */}
    <div className="mt-12 pt-6 border-t text-center md:text-left text-xs text-slate-500">
      © 2026 Limbu.ai. All rights reserved.
    </div>
  </div>
</footer>

);
}
