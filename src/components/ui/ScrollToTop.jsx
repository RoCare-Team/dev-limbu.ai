"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  // Show button after scroll
  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 300); // show after 300px
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
