
"use client"

import Image from "next/image"
import { Menu, X } from "lucide-react"
import LogoImage from "../../../public/images/bg-logo.png"

export default function HeaderSection({
  isLoggedIn,
  handleNavigation,
  handleLogout,
  setShowBookDemoModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) {

  return (
    <>
      {/* HEADER */}
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

    {/* LEFT - LOGO */}
    <div
      className="flex items-center gap-3 cursor-pointer flex-shrink-0"
      onClick={() => handleNavigation('/')}
    >
      <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-md">
        <Image
          src={LogoImage}
          alt="Limbu.ai Logo"
          className="w-7 h-7"
        />
      </div>

      <div className="leading-tight">
        <h2 className="text-lg font-bold text-yellow-500">
          limbu.ai
        </h2>
        <p className="text-xs text-gray-600">
          Social & Local Growth
        </p>
      </div>
    </div>

    {/* CENTER - NAV LINKS */}
    <nav className="hidden lg:flex items-center gap-7 text-sm text-sm font-dark">
      <a href="#features" className="hover:text-yellow-500 transition">
        Features
      </a>

      <a href="#how-it-works" className="hover:primary transition">
        How It Works
      </a>

      <a href="#services" className="hover:text-primary transition">
        Our Services
      </a>

      <a href="#franchise" className="hover:text-primary transition">
        Become Franchise Partners
      </a>

      <button
        onClick={() => setShowBookDemoModal(true)}
        className="text-primary hover:underline"
      >
        Book a Demo
      </button>
    </nav>

    {/* RIGHT - ACTION BUTTONS */}
    <div className="hidden lg:flex items-center gap-4">

      {/* WhatsApp */}
      <a
        href="https://wa.me/919283344726"
        target="_blank"
        className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition"
      >
        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        9283344726
      </a>

      {isLoggedIn ? (
        <>
          <button
            onClick={() => handleNavigation('/dashboard')}
            className="px-5 py-2 border border-yellow-400 text-gray-800 rounded-lg font-semibold hover:bg-yellow-50 transition"
          >
            Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:shadow-md transition"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={() => handleNavigation('/login')}
          className="px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:shadow-md transition"
        >
          Login
        </button>
      )}
    </div>

    {/* MOBILE MENU BUTTON */}
    <div className="lg:hidden">
      <button onClick={() => setIsMobileMenuOpen(true)}>
        <Menu className="w-6 h-6 text-gray-800" />
      </button>
    </div>

  </div>
</header>


      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 p-6 md:hidden">

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">Menu</h2>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-6">

            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-700">
              Features
            </a>

           

            <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-700">
              Services
            </a>

            <button
              onClick={() => {
                setShowBookDemoModal(true)
                setIsMobileMenuOpen(false)
              }}
              className="text-lg font-medium text-dark text-left"
            >
              Book a Demo
            </button>

            <a
              href="https://wa.me/919283344726"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition"
            >
              🟢 9283344726
            </a>

            {isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="mt-4 px-6 py-3 bg-white border-2 border-dark text-dark rounded-lg font-semibold"
                >
                  Dashboard
                </button>

                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-primary text-dark rounded-lg font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavigation('/login')}
                className="mt-4 px-6 py-3 bg-primary text-dark rounded-lg font-semibold"
              >
                Login
              </button>
            )}

          </nav>
        </div>
      )}
    </>
  )
}
