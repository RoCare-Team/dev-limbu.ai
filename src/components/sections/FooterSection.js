import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

function PinterestIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "Post Management", href: "/post-management" },
      { label: "Review Management", href: "/review-management" },
      { label: "Magic QR", href: "/get-magic-qr" },
      {
        label: "Google Business Service",
        href: "/services/google-bussiness-profile-management",
      },
      { label: "Local SEO", href: "/services/local-seo" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Work With Us", href: "/work-with-us" },
      { label: "Blog", href: "/blog" },
    ],
  },
];

const socialLinks = [
  {
    href: "https://www.facebook.com/limbuai",
    Icon: Facebook,
    label: "Facebook",
  },
  {
    href: "https://www.linkedin.com/company/limbuai/",
    Icon: Linkedin,
    label: "LinkedIn",
  },
  {
    href: "https://www.instagram.com/limbuai/",
    Icon: Instagram,
    label: "Instagram",
  },
  {
    href: "https://www.pinterest.com/limbuaiofficial/",
    Icon: PinterestIcon,
    label: "Pinterest",
  },
  {
    href: "https://www.youtube.com/@limbuai",
    Icon: Youtube,
    label: "YouTube",
  },
];

export default function FooterSection() {
  return (
    <footer className="bg-[#fafafa] border-t border-slate-200 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-x-10">
          {/* LEFT */}
          <div className="md:col-span-4 flex flex-col gap-5">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/bg-logo.png"
                alt="Limbu.ai Logo"
                width={40}
                height={40}
                priority
                className="object-contain"
              />

              <h2 className="text-lg font-bold text-slate-800">
                Limbu <span className="text-yellow-400">AI</span>
              </h2>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed max-w-[260px]">
              Empowering local businesses with AI-driven Google Business
              Profile automation and advanced digital marketing strategies.
            </p>

            {/* App Buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/images/badges/google-play-badge.svg"
                  alt="Google Play"
                  width={120}
                  height={40}
                  unoptimized
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
                  width={110}
                  height={40}
                  unoptimized
                />
              </a>
            </div>
          </div>

          {/* MIDDLE */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-bold tracking-[0.2em] text-slate-900 mb-6 uppercase">
                  {section.title}
                </h3>

                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-600 hover:text-yellow-500 transition-colors duration-300"
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
                <Mail className="w-4 h-4 shrink-0" />
                <span>info@limbu.ai</span>
              </div>

              <div className="flex items-center gap-3 text-yellow-500 font-semibold">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+91 9289344726</span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 shrink-0" />

                <span>
                  8th Floor, Unit No. 831,
                  <br />
                  JMD Megapolis, Gurugram
                </span>
              </div>
            </div>

            {/* SOCIAL */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-yellow-500 hover:text-white hover:border-yellow-500 transition-all duration-300"
                >
                  <item.Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center md:text-left text-xs text-slate-500">
          © 2026 Limbu.ai. All rights reserved.
        </div>
      </div>
    </footer>
  );
}