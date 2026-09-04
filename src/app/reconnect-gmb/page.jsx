"use client";

/**
 * /reconnect-gmb — Google Business Profile ko turant reconnect karne ka page.
 *
 * Kyun alag page: automation-logs par team ko "Reconnect GMB" ek click me
 * chahiye tha, par connect flow client ki identity se chalna zaroori hai (warna
 * connection admin ke apne record par ban jata). Isliye rasta ye hai —
 *
 *   automation-logs → /api/admin/login-as-user → /impersonate-login?next=/reconnect-gmb
 *   → ye page → startGmbConnect() → Google consent → /api/gmb/callback
 *
 * `startGmbConnect` hi use karte hain (apna fetch nahi) kyunki wo session
 * cookie set karna aur identity header bhejna dono handle karta hai — bina
 * uske connection GALAT user par ban jata hai.
 *
 * `consent=1` jaan-boojhkar: reconnect ka matlab hi hai ki purana grant toota
 * hai. `prompt=select_account` par Google consent screen dobara dikhata hi nahi
 * aur wahi toota grant laut aata — user permission ka checkbox tick hi nahi kar
 * pata.
 */
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { startGmbConnect } from "@/hooks/useGmbConnection";

function ReconnectInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // React StrictMode dev me effect do baar chalata hai — do OAuth redirect
    // shuru na ho jayein.
    if (started.current) return;
    started.current = true;

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    (async () => {
      try {
        await startGmbConnect(callbackUrl, { forceConsent: true });
      } catch (err) {
        setError(err?.message || "Reconnect shuru nahi ho paya. Dobara koshish karein.");
      }
    })();
  }, [searchParams]);

  const name =
    typeof window !== "undefined"
      ? localStorage.getItem("fullName") || localStorage.getItem("userName") || ""
      : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        {error ? (
          <>
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <a
              href="/dashboard"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Dashboard par jayein
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
            <p className="mt-4 text-sm font-bold text-slate-800">
              Google par bheja ja raha hai{name ? ` — ${name}` : ""}…
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
              Consent screen par <b>&ldquo;Google Business Profile&rdquo;</b> wala
              checkbox tick karna zaroori hai — warna token bina permission ke
              banega aur posts phir se fail hone lagenge.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReconnectGmbPage() {
  return (
    <Suspense fallback={null}>
      <ReconnectInner />
    </Suspense>
  );
}
