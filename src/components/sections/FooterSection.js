"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Youtube, Linkedin } from "lucide-react"

export default function FooterSection() {
  return (
    <footer className="bg-[#081426] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Column 1 */}
        <div>
  <div className="flex items-center gap-2 mb-4">
    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
      <span className="text-black font-bold">L</span>
    </div>
    <h2 className="text-xl font-bold">limbu.ai</h2>
  </div>

  <p className="text-sm text-slate-300 leading-relaxed mb-4">
    Limbu.ai is an AI marketing platform that automates Google Business Profile & Social Media activity.
  </p>

  <p className="text-sm text-slate-300 mb-2">Get our Mobile App</p>

  <a
    href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Image
      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
      alt="Google Play"
      width={150}
      height={45}
      className="cursor-pointer"
    />
  </a>
</div>

          {/* Column 2 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <Link href="/post-management" className="hover:text-white transition">
                  Post Management
                </Link>
              </li>
              <li>
                <Link href="/review-management" className="hover:text-white transition">
                  Review Management
                </Link>
              </li>
              <li>
                <Link href="/get-magic-qr" className="hover:text-white transition">
                  Magic QR
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="hover:text-white cursor-pointer">Contact</li>
              <li className="hover:text-white cursor-pointer">Privacy</li>
              <li className="hover:text-white cursor-pointer">Terms</li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="hover:text-white cursor-pointer">Help Center</li>
              <li>Call: 9289344726</li>
            </ul>
          </div>

          

        </div>

          
            {/* Social Icons */}
            <div className="flex justify-end  gap-5 mb-6 ">
              <a href="https://www.facebook.com/limbuai"><Facebook className="w-8 h-8 text-slate-300 hover:text-primary cursor-pointer" /></a>
              <a href="https://www.linkedin.com/company/limbuai/"> <Instagram className="w-8 h-8 text-slate-300 hover:text-primary cursor-pointer" /></a>
              <a href="https://www.youtube.com/@limbuai"> <Youtube className="w-8 h-8 text-slate-300 hover:text-primary cursor-pointer" /></a>
              <a href="https://www.pinterest.com/limbuaiofficial/"> <Linkedin className="w-8 h-8 text-slate-300 hover:text-primary cursor-pointer" /></a>
            </div>

        {/* Divider */}
        <div className="border-t border-slate-700 mt-12 pt-6 text-center text-sm text-slate-400">
          © 2026 limbu.ai. All rights reserved.
        </div>

      </div>
    </footer>
  )
}
