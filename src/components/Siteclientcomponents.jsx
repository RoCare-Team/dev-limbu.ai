"use client";

import { appendWhatsAppText } from "@/utils/whatsappLink";

/* ─────────────────────────────────────────────
   SafeImage
   Wraps <img> so onError (client event) works.
   Server Components cannot use onError directly.
───────────────────────────────────────────── */
const FALLBACK =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";

export function SafeImage({ src, alt, className, style }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        if (e.target.src !== FALLBACK) {
          e.target.src = FALLBACK;
        }
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   ContactForm
   Has onSubmit → must be a Client Component.
   Receives whatsappUrl, services, and theme
   hex colours as plain serialisable props.
───────────────────────────────────────────── */
export function ContactForm({ whatsappUrl, services, primaryHex, secondaryHex }) {
  const primary   = primaryHex   || "#3b82f6";
  const secondary = secondaryHex || "#6366f1";

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const msg =
      `Hi! I'm interested in your services.\n\n` +
      `Name: ${fd.get("name")}\n` +
      `Phone: ${fd.get("phone")}\n` +
      `Email: ${fd.get("email")}\n` +
      `Service: ${fd.get("service")}\n` +
      `Message: ${fd.get("message")}`;
    window.open(appendWhatsAppText(whatsappUrl, msg), "_blank");
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>

      {/* Full Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text" id="name" name="name" required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition"
          placeholder="Enter your name"
        />
      </div>

      {/* Phone + Email */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel" id="phone" name="phone" required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition"
            placeholder="Your phone number"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email" id="email" name="email"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Service dropdown */}
      <div>
        <label htmlFor="service" className="block text-sm font-semibold text-gray-700 mb-2">
          Service Required
        </label>
        <select
          id="service" name="service"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition appearance-none bg-white"
        >
          <option value="">Select a service</option>
          {services?.map((s, i) => (
            <option key={i} value={s.title}>{s.title}</option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
          Message
        </label>
        <textarea
          id="message" name="message" rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition resize-none"
          placeholder="Tell us about your requirements..."
        />
      </div>

      {/* Submit button — theme colour from props */}
      <button
        type="submit"
        className="w-full text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        {/* Inline SVG to avoid lucide import in client bundle */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Send via WhatsApp
      </button>

      <p className="text-sm text-gray-500 text-center">
        Your message will be sent via WhatsApp
      </p>
    </form>
  );
}

/* ─────────────────────────────────────────────
   SiteAnimations
   Global styles for the generated site.
   Must be in a Client Component for styled-jsx.
───────────────────────────────────────────── */
export function SiteAnimations() {
  return (
    <style jsx global>{`
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }
      .animate-blob { animation: blob 7s infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }

      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .animate-bounce-slow { animation: bounce-slow 2s infinite; }
    `}</style>
  );
}