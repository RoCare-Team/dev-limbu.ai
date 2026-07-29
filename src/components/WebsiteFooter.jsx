import React from 'react';
import { MapPin, Phone, Mail, Globe, CheckCircle2, Instagram, Facebook, Linkedin, Youtube, Twitter } from 'lucide-react';

const SOCIAL_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
};

const WebsiteFooter = ({ data }) => {
  if (!data) return null;
  const { business, aiContent } = data;

  // Dynamic Theme Colors
  const theme = aiContent.theme || { primaryColor: "#3E4E50", secondaryColor: "#F0A500", font: "sans-serif" };

  const { title, phoneNumbers, storefrontAddress, primaryCategory, additionalCategories, slug, websiteUri } = business;
  const { primaryPhone, additionalPhones } = phoneNumbers || {};

  // Only render social links that are toggled visible and have a URL
  const socialLinks = Object.entries(aiContent?.socialLinks || {})
    .map(([key, value]) => ({ key, ...value }))
    .filter((s) => s?.show && s?.url);

  // Theme-safe text/overlay tokens.
  // Using white-based rgba overlays (instead of gray-300/400/500 + black/20)
  // keeps contrast consistent whether primaryColor is light (Ocean Blue, Teal Wave)
  // or dark (Slate Professional, Forest Green).
  const textMuted = { color: 'rgba(255,255,255,0.78)' };      // body copy
  const textSubtle = { color: 'rgba(255,255,255,0.62)' };     // secondary links
  const textFaint = { color: 'rgba(255,255,255,0.48)' };      // bottom-bar fine print
  const borderSoft = { borderColor: 'rgba(255,255,255,0.15)' };
  const surfaceSoft = { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.12)' };
  const surfaceSofter = { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' };

  return (
    <footer
      className="text-white pt-16 pb-8 px-4 md:px-8 border-t"
      style={{
        backgroundColor: theme.primaryColor,
        fontFamily: theme.font,
        ...borderSoft,
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Column 1: About / Branding */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: theme.secondaryColor }}>
            {title}
          </h2>
          <p className="text-sm leading-relaxed" style={textMuted}>
            {aiContent.about?.content?.substring(0, 160)}...
          </p>
          <div className="flex flex-wrap gap-3">
             {/* WhatsApp Quick Link */}
             <a
               href={`https://wa.me/${primaryPhone?.replace(/\D/g, "")}`}
               target="_blank"
               rel="noopener noreferrer"
               className="w-10 h-10 rounded-xl flex items-center justify-center hover:brightness-125 transition-all border"
               style={surfaceSoft}
             >
               <Phone className="w-5 h-5" style={{ color: theme.secondaryColor }} />
             </a>

             {/* Social Links (toggled visible in the editor) */}
             {socialLinks.map((social) => {
               const Icon = SOCIAL_ICONS[social.key];
               if (!Icon) return null;
               return (
                 <a
                   key={social.key}
                   href={social.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   title={social.title || social.key}
                   className="w-10 h-10 rounded-xl flex items-center justify-center hover:brightness-125 transition-all border"
                   style={surfaceSoft}
                 >
                   <Icon className="w-5 h-5" style={{ color: theme.secondaryColor }} />
                 </a>
               );
             })}
          </div>
        </div>

        {/* Column 2: Specialization */}
        <div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-1 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
            Our Focus
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2" style={textMuted}>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
              <span>{primaryCategory}</span>
            </li>
            {additionalCategories?.slice(0, 3).map((cat, index) => (
              <li
                key={index}
                className="flex items-start gap-2 transition-opacity hover:opacity-100"
                style={textSubtle}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Navigation */}
        <div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-1 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="#about" style={textSubtle} className="hover:text-white transition-colors">About Us</a>
            </li>
            <li>
              <a href="#services" style={textSubtle} className="hover:text-white transition-colors">Products & Services</a>
            </li>
            <li>
              <a href="#contact" style={textSubtle} className="hover:text-white transition-colors">Contact Support</a>
            </li>
            {websiteUri && (
                <li>
                  <a
                    href={websiteUri}
                    target="_blank"
                    rel="noreferrer"
                    style={textSubtle}
                    className="flex items-center gap-1 hover:text-white transition-colors text-xs"
                  >
                    <Globe className="w-3 h-3" /> Visit Official Website
                  </a>
                </li>
            )}
          </ul>
        </div>

        {/* Column 4: Contact Details */}
        <div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-1 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
            Get In Touch
          </h3>
          <div className="space-y-5 text-sm">
            {storefrontAddress && (
                <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-3 shrink-0" style={{ color: theme.secondaryColor }} />
                    <p className="leading-relaxed" style={textMuted}>
                        {storefrontAddress.addressLines?.[0]}, {storefrontAddress.locality}<br />
                        {storefrontAddress.administrativeArea}, {storefrontAddress.postalCode}
                    </p>
                </div>
            )}

            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-3 shrink-0" style={{ color: theme.secondaryColor }} />
              <div className="flex flex-col">
                <a href={`tel:${primaryPhone}`} className="hover:text-white font-bold transition-colors text-white">{primaryPhone}</a>
                {additionalPhones?.[0] && (
                  <a href={`tel:${additionalPhones[0]}`} className="text-xs hover:opacity-100 transition-opacity" style={textFaint}>
                    {additionalPhones[0]}
                  </a>
                )}
              </div>
            </div>

            {business.email && (
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 shrink-0" style={{ color: theme.secondaryColor }} />
                <a href={`mailto:${business.email}`} className="truncate hover:text-white transition-colors" style={textMuted}>{business.email}</a>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="mt-16 pt-8 border-t" style={borderSoft}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs gap-6">
          <p style={textFaint}>
            © {new Date().getFullYear()} <span className="text-white font-bold">{title}</span>. All rights reserved.
          </p>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full border" style={surfaceSofter}>
            <span style={textFaint}>Powered by</span>
            <span className="font-black text-white tracking-tighter text-sm">Limbu AI</span>
          </div>

          <div className="flex space-x-6">
            <a href="#" style={textFaint} className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" style={textFaint} className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;