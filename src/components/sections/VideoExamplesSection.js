"use client"

import { useState } from "react"
import { Video, X } from "lucide-react"

export default function VideoExamplesSection({ videoExamples }) {

  const [selectedVideo, setSelectedVideo] = useState(null)

  return (
    <section
      id="video-examples"
      className="relative bg-slate-50 py-16 sm:py-20 md:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
            Stunning{" "}
            <span className="bg-primary bg-clip-text text-transparent">
              Video Creations
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">
            Explore AI-powered creations tailored for businesses like yours.
          </p>
        </div>

        {/* Video Slider */}
        <div className="relative h-80 overflow-hidden rounded-2xl">

          <div className="flex gap-4 animate-scroll-videos">

            {[...videoExamples, ...videoExamples].map((videoSrc, idx) => (
              <button
                key={idx}
                className="flex-shrink-0 w-56 h-80 cursor-pointer hover:scale-105 transition-transform group relative rounded-xl"
                onClick={() => setSelectedVideo(videoSrc)}
              >

                <video
                  src={videoSrc}
                  loop
                  muted
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />

                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <Video className="w-12 h-12 text-white" />
                </div>

              </button>
            ))}

          </div>

        </div>
      </div>

      {/* MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">

          <div className="relative w-full max-w-4xl">

            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-white hover:text-pink-400 transition"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-auto"
              />
            </div>

          </div>
        </div>
      )}

    </section>
  )
}