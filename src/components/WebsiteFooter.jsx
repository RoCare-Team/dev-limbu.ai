import React from 'react';
import { MapPin, Phone, Mail, Globe, CheckCircle2 } from 'lucide-react';

const WebsiteFooter = ({ data }) => {
  if (!data) return null;
  const { business, aiContent } = data;
  
  // Dynamic Theme Colors
  const theme = aiContent.theme || { primaryColor: "#3E4E50", secondaryColor: "#F0A500", font: "sans-serif" };

  const { title, phoneNumbers, storefrontAddress, primaryCategory, additionalCategories, slug, websiteUri } = business;
  const { primaryPhone, additionalPhones } = phoneNumbers || {};

  return (
    <footer 
      className="text-white pt-16 pb-8 px-4 md:px-8 border-t" 
      style={{ 
        backgroundColor: theme.primaryColor, 
        fontFamily: theme.font,
        borderColor: 'rgba(255,255,255,0.1)'
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Column 1: About / Branding */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: theme.secondaryColor }}>
            {title}
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed opacity-80">
            {aiContent.about?.content?.substring(0, 160)}...
          </p>
          <div className="flex space-x-3">
             {/* WhatsApp Quick Link */}
             <a href={`https://wa.me/${primaryPhone?.replace(/\D/g, "")}`} target="_blank" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/5">
               <Phone className="w-5 h-5" style={{ color: theme.secondaryColor }} />
             </a>
          </div>
        </div>

        {/* Column 2: Specialization */}
        <div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-1 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
            Our Focus
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
              <span>{primaryCategory}</span>
            </li>
            {additionalCategories?.slice(0, 3).map((cat, index) => (
              <li key={index} className="flex items-start gap-2 opacity-80 hover:opacity-100 transition-opacity">
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
          <ul className="space-y-3 text-sm text-gray-400">
            <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Products & Services</a></li>
            <li><a href="#contact" className="hover:text-white transition-colors">Contact Support</a></li>
            {websiteUri && (
                <li><a href={websiteUri} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors text-xs">
                    <Globe className="w-3 h-3" /> Visit Official Website
                </a></li>
            )}
          </ul>
        </div>

        {/* Column 4: Contact Details */}
        <div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-1 rounded-full" style={{ backgroundColor: theme.secondaryColor }} />
            Get In Touch
          </h3>
          <div className="space-y-5 text-sm text-gray-300">
            {storefrontAddress && (
                <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-3 shrink-0" style={{ color: theme.secondaryColor }} />
                    <p className="opacity-80 leading-relaxed">
                        {storefrontAddress.addressLines?.[0]}, {storefrontAddress.locality}<br />
                        {storefrontAddress.administrativeArea}, {storefrontAddress.postalCode}
                    </p>
                </div>
            )}
            
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-3 shrink-0" style={{ color: theme.secondaryColor }} />
              <div className="flex flex-col">
                <a href={`tel:${primaryPhone}`} className="hover:text-white font-bold transition-colors">{primaryPhone}</a>
                {additionalPhones?.[0] && <a href={`tel:${additionalPhones[0]}`} className="text-xs opacity-60 hover:opacity-100 transition-opacity">{additionalPhones[0]}</a>}
              </div>
            </div>

            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 shrink-0" style={{ color: theme.secondaryColor }} />
              <p className="opacity-80 truncate">contact@{slug || 'business'}.com</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="mt-16 pt-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-6">
          <p>© {new Date().getFullYear()} <span className="text-gray-300 font-bold">{title}</span>. All rights reserved.</p>
          
          <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/5">
            <span className="opacity-60">Powered by</span>
            <span className="font-black text-white tracking-tighter text-sm">Limbu AI</span>
          </div>

          <div className="flex space-x-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;