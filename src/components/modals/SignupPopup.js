

"use client"

import { X, Gift } from "lucide-react"

export default function SignupPopup({
  showSignupPopup,
  setShowSignupPopup,
  isLoggedIn
}) {

  if (!showSignupPopup || isLoggedIn) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-white/50">

        {/* Close Button */}
        <button
          onClick={() => setShowSignupPopup(false)}
          className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-200 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Gift Icon */}
        <div className="text-primary mb-4">
          <Gift className="w-16 h-16 mx-auto animate-bounce" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-dark mb-2">
          Hurry Up!
        </h2>

        <p className="text-dark text-lg mb-6">
          Sign up now to get{" "}
          <strong className="text-dark">
            500 bonus coins
          </strong>{" "}
          and create amazing posts instantly!
        </p>

        {/* Button */}
        <button
          onClick={() => window.location.href = "/login"}
          className="w-full group px-8 py-4 bg-primary text-dark rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
        >
          Signup Fast & Get Coins
        </button>

      </div>
    </div>
  )
}
