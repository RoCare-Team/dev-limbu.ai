"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ImpersonateLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const encodedData = searchParams.get("data");

    if (!encodedData) {
      setError("Missing impersonation data");
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(encodedData));

      const name = parsed.impersonatedName || "";
      const email = parsed.impersonatedEmail || "";

      // The dashboard and its store read from localStorage; sessionStorage is
      // kept in sync for older screens that still look there.
      const entries = {
        userToken: parsed.token,
        userId: parsed.userId,
        impersonatedUser: parsed.impersonatedUser || parsed.userId,
        impersonatedEmail: email,
        isImpersonating: "true",
        userName: name,
        fullName: name,
        userEmail: email,
        email,
      };

      Object.entries(entries).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        localStorage.setItem(key, value);
        sessionStorage.setItem(key, value);
      });

      // Drop the token from the URL/history before landing on the dashboard.
      window.history.replaceState(null, "", "/impersonate-login");
      router.replace("/dashboard");
    } catch (err) {
      console.error("Impersonation handoff failed:", err);
      setError("Could not start the session. Please try again.");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        {error ? (
          <p className="text-sm font-semibold text-red-600">{error}</p>
        ) : (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="mt-4 text-sm font-semibold text-gray-700">
              Signing you in...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ImpersonateLoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading...</div>}>
      <ImpersonateLoginInner />
    </Suspense>
  );
}
