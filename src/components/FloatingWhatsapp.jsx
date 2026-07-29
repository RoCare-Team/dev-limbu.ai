// components/FloatingWhatsapp.jsx
import Image from "next/image";

export default function FloatingWhatsapp() {
  const phone = "919289344708";
  const message = encodeURIComponent(
    "Hi! I would like to know more about your franchise opportunities.",
  );
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl">
        {/* `priority` hata diya: ye floating icon hero image ke saath bandwidth
            ke liye ladta tha aur LCP late kar deta tha. */}
        <Image
          src="/social-icon/whatsaap-icon.png"
          alt="WhatsApp"
          width={42}
          height={42}
          loading="lazy"
        />
      </div>

      {/* Ping Animation */}
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-green-500 opacity-30"></span>
    </a>
  );
}
