"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {

  const handleGoogleLogin = async () => {
    await signIn("google", {
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">

        <h1 className="text-xl font-bold text-center mb-6">
          Sign In
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Continue with Google
        </button>

      </div>

    </div>
  );
}