"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { startGmbConnect } from "@/hooks/useGmbConnection";

/**
 * Pehle ye NextAuth ka error page tha. `error=OAuthCallback` (state-cookie
 * mismatch) par ye khud-ba-khud `signIn()` retry karta tha — aur jab error
 * bana rehta tha to "Redirecting…" par atak jata tha (infinite loop).
 *
 * Ab GMB OAuth server-side hai aur state signed JWT me URL se jata hai, isliye
 * wo error class exist hi nahi karti. Ye page ek seedha connect screen hai —
 * koi auto-retry nahi.
 */
export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error") || searchParams.get("gmb_error");

  // App login alag hai — logged in na ho to /login, GMB connect nahi.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">
        <h1 className="text-xl font-bold text-center mb-6">
          Connect Google Business
        </h1>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">
            Couldn&apos;t connect to Google. Please try again.
          </p>
        )}

        <button
          type="button"
          onClick={() => startGmbConnect(callbackUrl).catch((err) => console.error(err))}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
