"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube, Linkedin } from "lucide-react";

export default function FooterSection() {
  // Configurable footer sections with custom routes
  const footerSections = [
    {
      title: "Platform",
      links: [
        { label: "Post Management", href: "/post-management" },
        { label: "Review Management", href: "/review-management" },
        { label: "Magic QR", href: "/get-magic-qr" },
        { label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact", href: "/contact" },
        { label: "Privacy", href: "/privacy-policy" },
        { label: "Terms", href: "/terms-and-conditions" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "info@limbu.ai", href: "mailto:info@limbu.ai" },
        { label: "9283344726", href: "tel:+919283344726" },
      ],
    },
  ];

  return (
    <footer className="pt-20 pb-10" style={{ backgroundColor: "#0A0D11", borderTop: "1px solid rgba(253,224,71,0.1)" }}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <Image 
                src="/images/limbuailogo.png" 
                alt="Limbu.ai Logo" 
                width={160} 
                height={50} 
                className="h-auto"
              />
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Limbu.ai is an AI marketing platform that automates Google Business Profile & Social Media activity.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Google Play"
                width={140}
                height={42}
              />
            </a>
          </div>

          {/* Columns 2, 3, 4: Generated from map */}
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h3 
                className="text-white mb-6 uppercase tracking-wider text-xl font-normal"
                style={{ fontFamily: "Anton, Impact, sans-serif" }}
              >
                {section.title}
              </h3>
              <ul className="space-y-4 text-sm text-white/60">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className={`transition-colors ${link.label === "9283344726" ? "text-[#FDE047] font-bold" : "hover:text-[#FDE047]"}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-6">
          <p className="text-xs text-white/30 uppercase tracking-widest">
            © 2026 limbu.ai. All rights reserved.
          </p>
          
          <div className="flex gap-6">
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
                  className="text-white/40 hover:text-[#FDE047] transition-colors"
                >
                  <Icon className="w-6 h-6" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}