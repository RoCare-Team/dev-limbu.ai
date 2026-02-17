

"use client"

export default function ExamplesSection({
  postImages,
  setSelectedImage
}) {

  return (
    <section id="examples" className="relative bg-white py-16 sm:py-20 md:py-24">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 ">

        {/* Heading */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
            AI-Generated{" "}
            <span className="bg-primary bg-clip-text text-transparent">
              Post Examples
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 px-4">
            See what our AI creates for businesses like yours
          </p>
        </div>

        {/* Image Slider */}
        <div className="relative h-64 overflow-hidden rounded-2xl ">

          <div className="flex gap-4 animate-scroll">

            {[...postImages, ...postImages].map((image, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-64 h-64 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image}
                  alt={`Post example ${idx + 1}`}
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              </div>
            ))}

          </div>

        </div>
      </div>

    </section>
  )
}
