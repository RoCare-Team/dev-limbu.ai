"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [oauthStarting, setOauthStarting] = useState(false);

  /**
   * Auto-retry once on OAuthCallback error.
   * This error is usually a transient OAuth state-cookie mismatch —
   * retrying immediately succeeds because NextAuth clears the stale
   * state and issues fresh cookies.
   *
   * We guard with sessionStorage so we don't loop if the error persists.
   */
  useEffect(() => {
    if (error === "OAuthCallback") {
      const retried = sessionStorage.getItem("oauth_auto_retried");
      if (!retried) {
        sessionStorage.setItem("oauth_auto_retried", "1");
        // Small delay so NextAuth's error-page cookies are flushed first
        const t = setTimeout(() => {
          signIn("google", { callbackUrl });
        }, 300);
        return () => clearTimeout(t);
      }
    } else {
      // Clear the retry flag on any other page load so next OAuthCallback
      // attempt gets its one auto-retry.
      sessionStorage.removeItem("oauth_auto_retried");
    }
  }, [callbackUrl, error]);

  const handleGoogleLogin = async () => {
    if (oauthStarting) return;
    setOauthStarting(true);
    // Clear the retry guard so a manual click always gets a fresh attempt
    sessionStorage.removeItem("oauth_auto_retried");
    try {
      await signIn("google", { callbackUrl });
    } finally {
      setOauthStarting(false);
    }
  };

  // Agar ek baar retry ho chuka hai aur error abhi bhi OAuthCallback hai,
  // toh ye transient nahi hai — ab asli error dikhao, loop mat karo.
  const alreadyRetried =
    typeof window !== "undefined" &&
    sessionStorage.getItem("oauth_auto_retried") === "1";

  const getErrorMessage = () => {
    if (!error) return null;
    if (error === "OAuthCallback" && !alreadyRetried) {
      return "Retrying sign-in automatically…";
    }
    if (error === "OAuthCallback") {
      return "Google sign-in could not be completed. Please try again.";
    }
    if (error === "OAuthAccountNotLinked") {
      return "This email is already linked with a different sign-in method.";
    }
    return "Something went wrong while signing you in. Please try again.";
  };

  const errorMessage = getErrorMessage();
  // Sirf tab tak "Redirecting…" dikhao jab tak actual retry chal raha ho
  // (yaani retry abhi shuru hua hai) — infinite disabled state se bacho.
  const isAutoRetrying =
    error === "OAuthCallback" && alreadyRetried === false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">
        <h1 className="text-xl font-bold text-center mb-6">Sign In</h1>

        {errorMessage && (
          <p className="mb-4 text-sm text-blue-600 text-center animate-pulse">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          disabled={oauthStarting || isAutoRetrying}
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none"
        >
          {oauthStarting || isAutoRetrying ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
