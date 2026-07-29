"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  // Show button after scroll.
  // Listener passive hai (warna browser har scroll par preventDefault ka
  // intezaar karta hai) aur kaam rAF me hota hai, to ek frame me ek hi baar.
  useEffect(() => {
    let frame = 0;

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setShow(window.scrollY > 300); // show after 300px
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      className=" cursor-pointer
        fixed bottom-6 right-6 z-50
        w-12 h-12 rounded-full
        bg-[#FDE047] text-black
        flex items-center justify-center
        shadow-[0_0_20px_rgba(253,224,71,0.4)]
        hover:bg-white hover:scale-110
        transition-all duration-300
      "
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
