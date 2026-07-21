"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [oauthStarting, setOauthStarting] = useState(false);

  // NOTE: Yahan pehle OAuthCallback par AUTO-RETRY tha. Wo galat tha:
  // retry ek naya signIn fire karta tha jo OAuth state cookie ko overwrite
  // kar deta tha -> callback par "state mismatch" -> infinite loop.
  // Ab sirf manual button. Ek hi signIn = ek hi state = koi mismatch nahi.

  const handleGoogleLogin = async () => {
    if (oauthStarting) return;
    setOauthStarting(true);
    try {
      await signIn("google", { callbackUrl });
    } finally {
      setOauthStarting(false);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (error === "OAuthCallback") {
      return "Google sign-in could not be completed. Please try again.";
    }
    if (error === "OAuthAccountNotLinked") {
      return "This email is already linked with a different sign-in method.";
    }
    return "Something went wrong while signing you in. Please try again.";
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">
        <h1 className="text-xl font-bold text-center mb-6">Sign In</h1>

        {errorMessage && (
          <p className="mb-4 text-sm text-red-600 text-center">{errorMessage}</p>
        )}

        <button
          type="button"
          disabled={oauthStarting}
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none"
        >
          {oauthStarting ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
