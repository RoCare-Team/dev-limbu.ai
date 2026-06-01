"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";

export default function HeroButtons() {
  const setSelectedVideo = useAuthStore(
    (state) => state.setSelectedVideo
  );

  const { isLoggedIn } = useAuthStore();

  return (
    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-8">

      {isLoggedIn ? (
        <Link
          href="/dashboard"
          className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-[#eab308] text-slate-900 font-bold text-sm hover:bg-[#ca8a04] transition-all shadow-[0_4px_14px_0_rgba(234,179,8,0.39)]"
        >
          Go to Dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-[#eab308] text-slate-900 font-bold text-sm hover:bg-[#ca8a04] transition-all shadow-[0_4px_14px_0_rgba(234,179,8,0.39)]"
        >
          Start Today Get 500 Coins
        </Link>
      )}

      <button
        className="inline-flex justify-center items-center px-6 py-3.5 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all group"
        onClick={() =>
          setSelectedVideo(
            "https://youtu.be/eQUd6u36w3g?si=_AJ3OymZQD6HnXRl"
          )
        }
      >
        Watch Demo

        <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </button>
    </div>
  );
}