"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const handleGoogleSignIn = async () => {
    await signIn("google", {
      callbackUrl,
      redirect: true,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-6">
          Sign In
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">
            Authentication Failed. Please Retry.
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>

      </div>
    </div>
  );
}