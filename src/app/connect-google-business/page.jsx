"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function ConnectGoogleBusinessPage() {
  const [phase, setPhase] = useState("starting");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const callbackUrl = `${origin}/?limbu_chat=1&gmb_sync=1`;
    setPhase("redirecting");
    void signIn("google", { callbackUrl }).catch(() => {
      setPhase("error");
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-10 shadow-xl shadow-slate-200/50 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B0F19] text-[#FFC107]">
          {phase === "error" ? (
            <span className="text-2xl font-bold">!</span>
          ) : (
            <Loader2 className="h-7 w-7 animate-spin" strokeWidth={2.25} />
          )}
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {phase === "error"
            ? "Sign-in start nahi ho paya"
            : "Google Business connect"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {phase === "error"
            ? "Page refresh karke dubara try karein, ya seedhe home par Limbu AI chat se connect karein."
            : "Aapko Google par sign-in ke liye bheja ja raha hai. Complete hone ke baad aap wapas chat par aa jayenge."}
        </p>
        {phase !== "error" && (
          <p className="mt-6 text-xs text-slate-400">
            Secure OAuth · same site par wapas redirect
          </p>
        )}
      </div>
    </div>
  );
}
