"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);

  // Auto-trigger Google sign-in when page loads (for seamless flow from ConnectModal)
  useEffect(() => {
    // Only auto-sign-in if there's a callbackUrl (meaning user came from another page)
    // and there's no error (meaning this isn't an error page)
    if (callbackUrl && !error) {
      setIsAutoSigningIn(true);
      const timer = setTimeout(() => {
        signIn("google", { callbackUrl, redirect: true });
      }, 500); // Small delay to ensure page is ready
      return () => clearTimeout(timer);
    }
  }, [callbackUrl, error]);

  const handleGoogleSignIn = async () => {
    try {
      setIsAutoSigningIn(true);
      const result = await signIn("google", {
        callbackUrl,
        redirect: true,
      });

      if (result?.error) {
        console.error("Google Sign-In Error:", result.error);
        setIsAutoSigningIn(false);
      }
    } catch (error) {
      console.error("Sign-In Error:", error);
      setIsAutoSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                Authentication failed: {error}
              </p>
              <p className="text-red-600 text-xs mt-2">
                Please check your credentials and try again, or contact support if the issue persists.
              </p>
            </div>
          )}

          {isAutoSigningIn ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Connecting to Google...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-semibold hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-3"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Sign in with Google
              </button>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/login")}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Sign in with Email/Phone
              </button>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
