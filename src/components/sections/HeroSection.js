
"use client"

export default function HeroSection({
  videoExamples,
  currentVideoIndex,
  handleVideoEnd,
  slidingTexts,
  slidingTextIndex,
  handleNavigation,
  isLoggedIn,
  setShowVideoModal
}) {

  return (
    <section className="relative h-[80vh] md:h-screen w-full flex items-end md:items-center justify-center overflow-hidden">

      {/* Background Video */}

     <img
    src="/images/banner3.jpg"
    alt="Home Background"
    className="absolute inset-0 w-full h-full object-cover"
  />

      {/* <video
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        key={currentVideoIndex}
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none transition-opacity duration-1000 ease-in-out"
        style={{ opacity: 1 }}
      >
        <source src={videoExamples[currentVideoIndex]} type="video/mp4" />
        Your browser does not support the video tag.
      </video> */}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>

      {/* Content */}
      <div className="relative z-20 text-center max-w-4xl mx-auto px-4 sm:px-6 pb-20 md:pb-0">

        {/* Sliding Text Badge */}
        <div className="relative h-10 mb-4 sm:mb-8 flex items-center justify-center">
          {slidingTexts?.map((item, index) => (
            <div
              key={index}
              className={`absolute w-full transition-opacity duration-500 ease-in-out ${
                index === slidingTextIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-blue-200 rounded-full shadow-sm">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  {item.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold leading-tight mb-4 ml-[10px]">
          <span className="text-white">
            The All-in-One AI Marketing Platform for Google,
          </span>
          <br />
          <span className="text-white">
            Facebook & Instagram.
          </span>
          <br />
          <span className="bg-primary bg-clip-text text-transparent">
            Stop juggling tabs.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-sm sm:text-lg md:text-xl text-slate-200 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
          Grow your revenue with Limbu.ai — the AI command center for Google Business Profile and social media automation.
        </p>

        {/* Buttons */}
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">

          {/* Primary Button */}
          <button
            onClick={() =>
              handleNavigation(isLoggedIn ? '/dashboard' : '/login')
            }
            className="group w-auto px-4 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-primary backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center gap-2 hover:shadow-xl hover:border-slate-400"
          >
            {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
            <svg
              className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 3l7 7-7 7M3 10h14" />
            </svg>
          </button>

          {/* Watch Demo Button */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="group w-auto px-4 sm:px-8 py-3 sm:py-4 bg-transparent backdrop-blur-sm border-2 border-white/30 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg hover:shadow-xl hover:border-slate-400 transition-all inline-flex items-center justify-center gap-2"
          >
            ▶ Watch Demo
          </button>

          

        </div>   
      </div>
      
    </section>
  )
}



