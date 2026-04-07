"use client";

import { X } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function VideoModal() {
  const { selectedVideo, setSelectedVideo } = useAuthStore();

  if (!selectedVideo) return null;

  // Helper function to extract YouTube ID and format the embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // Check if it's a YouTube URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      const videoId = match[2];
      // autoplay=1 ensures it plays when modal opens
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }
    
    // Return original URL if it's a direct video file (.mp4 etc)
    return url;
  };

  const embedUrl = getEmbedUrl(selectedVideo);
  const isYouTube = selectedVideo.includes("youtube.com") || selectedVideo.includes("youtu.be");

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4 md:p-10 animate-fadeIn"
      onClick={() => setSelectedVideo(null)}
    >
      <div
        className="relative w-full max-w-5xl aspect-video group"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Cyber Glow Border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#FDE047]/20 via-[#FDE047]/40 to-[#FDE047]/20 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>

        <div className="relative bg-[#0A0A0A] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 w-full h-full">
          
          {/* Close Button */}
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-[#FDE047] text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[160]"
            aria-label="Close"
          >
            <X className="w-6 h-6 stroke-[3px]" />
          </button>

          {/* Conditional Rendering: YouTube Iframe vs HTML5 Video */}
          {isYouTube ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="YouTube Video Player"
            ></iframe>
          ) : (
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          )}
        </div>
        
        <p className="absolute -bottom-8 left-0 right-0 text-center text-white/30 text-xs tracking-[0.2em] uppercase pointer-events-none">
           Click outside to exit
        </p>
      </div>
    </div>
  );
}