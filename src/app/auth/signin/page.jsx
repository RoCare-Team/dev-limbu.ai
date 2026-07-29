"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { startGmbConnect } from "@/hooks/useGmbConnection";

/**
 * Pehle ye NextAuth ka error page tha. `error=OAuthCallback` (state-cookie
 * mismatch) par ye khud-ba-khud `signIn()` retry karta tha, aur jab error bana
 * rehta tha to "Redirecting..." par atak jata tha (infinite loop).
 *
 * Ab GMB OAuth server-side hai aur state signed JWT me URL se jata hai, isliye
 * wo error class exist hi nahi karti. Ye page ek seedha connect screen hai,
 * koi auto-retry nahi.
 */
function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const queryError = searchParams.get("error") || searchParams.get("gmb_error");

  const [uiError, setUiError] = useState(null);
  const [busy, setBusy] = useState(false);

  // App login alag hai. Logged in na ho to /login, GMB connect nahi.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) router.replace("/login");
  }, [router]);

  const message =
    uiError ||
    (queryError ? "Couldn't connect to Google. Please try again." : null);

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    setUiError(null);
    try {
      await startGmbConnect(callbackUrl);
    } catch (err) {
      setUiError(err.message);
      setBusy(false);
    }
  };

  return (
    <Shell>
      {message && (
        <p className="mb-4 text-sm text-red-600 text-center">{message}</p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={handleConnect}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none"
      >
        {busy ? "Redirecting..." : "Continue with Google"}
      </button>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">
        <h1 className="text-xl font-bold text-center mb-6">
          Connect Google Business
        </h1>
        {children}
      </div>
    </div>
  );
}

/**
 * `useSearchParams()` prerender ke waqt bail out karta hai, isliye Suspense
 * boundary zaroori hai — warna poora page client-render par chala jata hai.
 */
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="w-full bg-blue-600/60 text-white py-3 rounded-lg text-center">
            Loading...
          </div>
        </Shell>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
