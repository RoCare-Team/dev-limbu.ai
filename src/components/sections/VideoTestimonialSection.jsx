"use client";

import { Play, X } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const testimonials = [
  {
    id: 1,
    videoUrl:
      "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-04-08+at+12.44.09+PM.mp4",
    quote:
      "Limbu.ai has helped me double my website traffic from organic search in just a few months.",
    author: "Jeremy Schofield",
    role: "Owner",
    avatar:
      "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=150&q=80",
    boxPosition: "bottom-3 left-3",
  },
  {
    id: 2,
    videoUrl: "https://limbuai.s3.ap-south-1.amazonaws.com/testimonials/Your+paragraph+text+(2).png",
    quote:
      "When we started being found on Google, I knew we were building real value for our local customers.",
    author: "Seth Shoultes",
    role: "Founder",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    boxPosition: "bottom-3 right-3",
  },
  {
    id: 3,
    videoUrl:
      "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    quote:
      "The AI capabilities have completely transformed how we handle our local business presence.",
    author: "David Harrison",
    role: "Marketing Director",
    avatar:
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80",
    boxPosition: "bottom-3 left-3",
  },
  {
    id: 4,
    videoUrl:
      "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    quote:
      "We scaled our Google Business updates 10x faster using their automated tools. Unbelievable ROI.",
    author: "Sarah Jenkins",
    role: "Agency Owner",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    boxPosition: "bottom-3 right-3",
  },
  {
    id: 5,
    videoUrl:
      "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    quote:
      "We scaled our Google Business updates 10x faster using their automated tools. Unbelievable ROI.",
    author: "Sarah Jenkins",
    role: "Agency Owner",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    boxPosition: "bottom-3 right-3",
  },
  {
    id: 6,
    videoUrl:
      "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    quote:
      "We scaled our Google Business updates 10x faster using their automated tools. Unbelievable ROI.",
    author: "Sarah Jenkins",
    role: "Agency Owner",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    boxPosition: "bottom-3 right-3",
  },
  {
    id: 7,
    videoUrl:
      "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    quote:
      "We scaled our Google Business updates 10x faster using their automated tools. Unbelievable ROI.",
    author: "Sarah Jenkins",
    role: "Agency Owner",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    boxPosition: "bottom-3 right-3",
  },
];

export default function VideoTestimonialSection() {
  const scrollContainerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);

  // Function to smoothly scroll to a specific index
  const scrollToIndex = (index) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const card = container.children[index];

    if (card) {
      // Calculate center position for smooth snap
      const scrollPosition =
        card.offsetLeft -
        container.offsetLeft -
        container.clientWidth / 2 +
        card.clientWidth / 2;
      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setActiveIndex(index);
    }
  };

  // Sync dots when user manually scrolls
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const centerPosition = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((card, index) => {
      const cardCenter =
        card.offsetLeft - container.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(centerPosition - cardCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  // Auto-scroll interval
  useEffect(() => {
    // Pause if user is hovering OR if the video modal is open
    if (isPaused || activeVideo) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % testimonials.length;
      scrollToIndex(nextIndex);
    }, 4000); // 4 seconds per slide

    return () => clearInterval(interval);
  }, [activeIndex, isPaused, activeVideo]);

  return (
    <>
      <section
        className="bg-white py-12 overflow-hidden relative border-t border-black/5"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-[#facc15]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14 relative z-10">
            <h2
              className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-black mb-3"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Great brands choose{" "}
              <span className="text-[#eab308]">Limbu.ai</span>
            </h2>
            <p
              className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Trusted by 15k+ startups, agencies, and Fortune 500 teams.
            </p>
          </div>

          {/* Video Cards Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory no-scrollbar relative z-10 scroll-smooth px-4 sm:px-[10vw]"
            style={{ scrollbarWidth: "none" }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                onClick={() => setActiveVideo(testimonial.videoUrl)}
                className={`flex-shrink-0 w-[280px] sm:w-[340px] lg:w-[360px] aspect-[9/11] relative rounded-2xl overflow-hidden snap-center group cursor-pointer border transition-all duration-500 shadow-xl ${
                  activeIndex === index
                    ? "border-[#eab308]/50 scale-100 ring-4 ring-[#eab308]/5"
                    : "border-slate-100 scale-[0.95] opacity-80 hover:opacity-100"
                }`}
              >
                {/* Background Video (Muted Autoplay loop) */}
                <video
                  src={testimonial.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover transition-all duration-700"
                />

                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none opacity-80 group-hover:opacity-40 transition-opacity" />

                {/* Play Button Icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:bg-[#facc15] group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <Play
                    className="w-6 h-6 text-white group-hover:text-black ml-1 transition-colors"
                    fill="currentColor"
                  />
                </div>

                {/* Minimal Quote Box */}
                <div
                  className={`absolute ${testimonial.boxPosition} max-w-[90%] bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl p-3.5 shadow-2xl transform transition-transform group-hover:-translate-y-1`}
                >
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <p
                        className="text-slate-800 text-[11px] leading-relaxed mb-2 font-semibold line-clamp-2"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-black font-bold text-[11px]">
                            {testimonial.author}
                          </span>
                          <span className="text-[#eab308] text-[9px] uppercase tracking-tighter font-black">
                            {testimonial.role}
                          </span>
                        </div>
                        {/* Small Avatar inside box */}
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          className="w-8 h-8 rounded-full object-cover border border-slate-100 ml-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Dots for Scroll Navigation */}
          <div className="flex justify-center gap-2 mt-6 relative z-10">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="py-2"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    activeIndex === i
                      ? "w-8 bg-[#eab308]"
                      : "w-2 bg-slate-200 hover:bg-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Video Playback Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setActiveVideo(null)}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-[#FDE047] transition-colors z-[110] p-2 bg-white/5 rounded-full hover:bg-white/10"
            onClick={() => setActiveVideo(null)}
            aria-label="Close video"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Video Container */}
          <div
            className="relative w-full max-w-5xl aspect-[9/16] sm:aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(253,224,71,0.15)] border border-white/10 bg-black scale-95 animate-scaleUp"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the video itself
          >
            <video
              src={activeVideo}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
