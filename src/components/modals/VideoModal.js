

"use client"

import { X } from "lucide-react"

export default function VideoModal({
  selectedVideo,
  setSelectedVideo
}) {

  if (!selectedVideo) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto p-4 animate-fadeIn"
      onClick={() => setSelectedVideo(null)}
    >
      <div className="w-full min-h-screen flex items-start justify-center mt-24 mb-10">

        <div
          className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl aspect-video max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Close Button */}
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-200 transition z-10"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Video Player */}
          <video
            src={selectedVideo}
            controls
            autoPlay
            preload="auto"
            className="w-full h-full object-contain rounded-2xl"
          />

        </div>

      </div>
    </div>
  )
}
