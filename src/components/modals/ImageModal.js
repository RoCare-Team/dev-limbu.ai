
"use client"

import { X } from "lucide-react"

export default function ImageModal({
  selectedImage,
  setSelectedImage
}) {

  if (!selectedImage) return null

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setSelectedImage(null)}
    >

      <div
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close Button */}
        <button
          onClick={() => setSelectedImage(null)}
          className="absolute -top-12 right-0 sm:-top-16 sm:-right-16 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-2xl group z-10"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Image Container */}
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">

          <img
            src={selectedImage}
            alt="Enlarged post"
            className="w-full h-auto object-contain max-h-[80vh]"
          />

          {/* Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <p className="text-white font-semibold text-lg">
              AI Generated Post
            </p>
            <p className="text-white/80 text-sm">
              Created automatically for Google My Business
            </p>
          </div>

        </div>

        {/* Close Hint */}
        <p className="text-white/60 text-center mt-4 text-sm">
          Click outside or press ESC to close
        </p>

      </div>
    </div>
  )
}
