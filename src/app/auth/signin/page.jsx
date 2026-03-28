"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [oauthStarting, setOauthStarting] = useState(false);

  const handleGoogleLogin = async () => {
    if (oauthStarting) return;
    setOauthStarting(true);
    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } finally {
      setOauthStarting(false);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;

    if (error === "OAuthCallback" || error === "OAuthAccountNotLinked") {
      return "We couldn't complete your Google sign-in on the first try. Please try again. If it keeps happening, clear your browser cookies and try once more.";
    }

    return "Something went wrong while signing you in. Please try again.";
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">
        <h1 className="text-xl font-bold text-center mb-6">
          Sign In
        </h1>

        {errorMessage && (
          <p className="mb-4 text-sm text-red-600 text-center">
            {errorMessage}
          </p>
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