"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useGmbConnection } from "@/hooks/useGmbConnection";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Building2, CheckCircle2, Loader2, LogOut, Mail } from "lucide-react";
import { getLimbuWhatsAppChatUrl } from "@/lib/chatbotPlatformOAuthState";

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "");
}

function reconnectReplaceStorageKey(phoneDigits) {
  return phoneDigits ? `gmb_reconnect_replace_${phoneDigits}` : "";
}

function isReconnectReplacePending(phoneDigits) {
  if (typeof window === "undefined" || !phoneDigits) return false;
  try {
    return sessionStorage.getItem(reconnectReplaceStorageKey(phoneDigits)) === "1";
  } catch {
    return false;
  }
}

function setReconnectReplacePending(phoneDigits) {
  if (typeof window === "undefined" || !phoneDigits) return;
  try {
    sessionStorage.setItem(reconnectReplaceStorageKey(phoneDigits), "1");
  } catch {
    /* ignore */
  }
}

function clearReconnectReplacePending(phoneDigits) {
  if (typeof window === "undefined" || !phoneDigits) return;
  try {
    sessionStorage.removeItem(reconnectReplaceStorageKey(phoneDigits));
  } catch {
    /* ignore */
  }
}

function formatBusinessAddress(loc) {
  const lines    = (loc.storefrontAddress?.addressLines || []).filter(Boolean);
  const locality = loc.storefrontAddress?.locality || "";
  const region   = loc.storefrontAddress?.administrativeArea || "";
  const postal   = loc.storefrontAddress?.postalCode || "";
  const tail     = [locality, region, postal].filter(Boolean).join(", ");
  return [...lines, tail].filter(Boolean).join("\n") || "—";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BusinessCard({ loc, verified }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 bg-white px-4 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-slate-900">
          {loc.title || "Business"}
        </p>
        <p className="mt-1 whitespace-pre-line text-[13px] leading-snug text-slate-600">
          {formatBusinessAddress(loc)}
        </p>
      </div>
      <div className="shrink-0 self-start">
        <span
          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
            verified
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {verified ? "Verified" : "Unverified"}
        </span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function ConnectGoogleBusinessInner() {
  const searchParams = useSearchParams();

  // NextAuth ki jagah GMB connection. Neeche ka `status` / `session` code jaisa
  // hai waisa chalta rahe, isliye wahi shape yahan bana dete hain.
  const gmb = useGmbConnection();
  const status = gmb.loading
    ? "loading"
    : gmb.connected
      ? "authenticated"
      : "unauthenticated";
  const session = gmb.connected
    ? {
        user: { email: gmb.email, name: gmb.name, image: gmb.image },
        // Asli token ab browser me nahi aata — ye sirf "connected" ka flag hai.
        accessToken: true,
      }
    : null;

  // Phone is the ONLY identifier — no session_id anywhere
  const phone = normalizePhone(searchParams.get("phone") || "");

  // ── Phone check state (new vs existing user) ─────────────────────────────────
  const [phoneCheckLoading, setPhoneCheckLoading] = useState(true);
  const [phoneCheckError, setPhoneCheckError]     = useState("");
  const [isNewUser,       setIsNewUser]           = useState(null);
  const [existingEmail,   setExistingEmail]       = useState("");
  const [existingLocations, setExistingLocations] = useState(0);

  // ── Authentication & listing state ──────────────────────────────────────────
  const [listLoading,      setListLoading]      = useState(false);
  const [listError,        setListError]        = useState("");
  const [email,            setEmail]            = useState("");
  const [linkedVerified,   setLinkedVerified]   = useState([]);
  const [notLinked,        setNotLinked]        = useState([]);
  const [continueBusy,     setContinueBusy]     = useState(false);
  const [continueSuccess,  setContinueSuccess]  = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [signInError,      setSignInError]      = useState(false);
  const [autoSignInTriggered, setAutoSignInTriggered] = useState(false);
  const [autoContinueStarted, setAutoContinueStarted] = useState(false);
  const [locationsLoaded,  setLocationsLoaded]  = useState(false);
  const [waitSeconds,      setWaitSeconds]      = useState(8);
  const [waitActive,       setWaitActive]       = useState(false);
  const [reconnecting,     setReconnecting]     = useState(false);
  /** `null` = idle; after "saved email" CTA, counts 5→0 then opens WhatsApp */
  const [existingUserWaCountdown, setExistingUserWaCountdown] = useState(null);
  const existingUserWaArmedRef = useRef(false);

  const inConnectFlow = isNewUser || reconnecting;

  // ── Check if phone already exists in database ─────────────────────────────────
  const checkPhoneStatus = useCallback(async () => {
    if (!phone) {
      setPhoneCheckError("The URL requires ?phone=919876543210 — use the WhatsApp chatbot link.");
      setIsNewUser(true);
      setPhoneCheckLoading(false);
      return;
    }
    setPhoneCheckLoading(true);
    try {
      const res  = await fetch(`/api/gmb/check-phone?phone=${phone}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Check failed");

      if (data.exists) {
        setIsNewUser(false);
        setExistingEmail(data.userEmail || "");
        setExistingLocations(data.locationsCount || 0);
      } else {
        setIsNewUser(true);
      }
    } catch (e) {
      setPhoneCheckError(e?.message || "Could not verify phone");
      setIsNewUser(true); // Default to new user on error
    } finally {
      setPhoneCheckLoading(false);
    }
  }, [phone]);

  // Check phone status on mount
  useEffect(() => {
    void checkPhoneStatus();
  }, [phone, checkPhoneStatus]);

  useEffect(() => {
    if (phoneCheckLoading || isNewUser !== true || status !== "unauthenticated" || autoSignInTriggered) return;
    if (!phone) return;

    const timer = window.setTimeout(() => {
      handleGoogleSignIn();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [phoneCheckLoading, isNewUser, status, autoSignInTriggered, phone]);

  // Load GMB listings once authenticated
  const loadLocations = useCallback(async () => {
    setLocationsLoaded(false);
    setListLoading(true);
    setListError("");
    setContinueSuccess(false);
    setRedirectCountdown(0);
    setAutoContinueStarted(false);
    try {
      const res  = await fetch("/api/gmb/my-locations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Load failed");
      setEmail(data.email || "");
      setLinkedVerified(data.linkedVerified             || []);
      setNotLinked(     data.notLinkedOrUnverified      || []);
    } catch (e) {
      setListError(e?.message || "Could not load businesses");
    } finally {
      setListLoading(false);
      setLocationsLoaded(true);
      setWaitActive(true);
      setWaitSeconds(8);
    }
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleGoogleSignIn = () => {
    if (typeof window === "undefined") return;
    const source = searchParams.get("source");
    const qs = new URLSearchParams();
    if (phone) qs.set("phone", phone);
    if (source) qs.set("source", source);
    const query = qs.toString();
    const callbackUrl = `/connect-google-business${query ? `?${query}` : ""}`;

    setSignInError(false);
    setAutoSignInTriggered(true);
    // Yahan user app me logged in nahi hota — phone hi identity hai, isliye
    // wo connect route ko bhejna zaroori hai warna 401 milta hai.
    void gmb.connect(callbackUrl, { phone }).catch(() => setSignInError(true));
  };

  const handleContinue = useCallback(async () => {
    if (!phone) {
      setListError(
        "The URL requires ?phone=919876543210 — use the WhatsApp chatbot link."
      );
      return;
    }
    setContinueBusy(true);
    try {
      const replaceExistingConnection =
        reconnecting || isReconnectReplacePending(phone);
      const res  = await fetch("/api/gmb/sync-and-save", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone, replaceExistingConnection }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      // Store location details in localStorage for the dashboard
      const syncedListings = data.locationsData ?? [];
      if (syncedListings.length) {
        try {
          const locationDetails = syncedListings.map((item) => {
            const name       = item.locationResourceName || "";
            const locationId = name.includes("/") ? name.split("/").pop() : name;
            return {
              locationId,
              accountId:         item.accountId         || "",
              locality:          item.address?.split(",")[0] || "",
              address:           item.address            || "",
              title:             item.title              || "",
              websiteUrl:        item.websiteUri         || "",
              isVerified:        item.verified           === true,
              businessProfileId: name,
              locationResourceName: name,
            };
          });
          localStorage.setItem("locationDetails", JSON.stringify(locationDetails));
          localStorage.setItem("chatbotPhone", phone);
        } catch {
          // non-fatal
        }
      }

      setContinueSuccess(true);
      setRedirectCountdown(5);
      setReconnecting(false);
      clearReconnectReplacePending(phone);
    } catch (e) {
      setListError(e?.message || "Continue failed");
    } finally {
      setContinueBusy(false);
    }
  }, [phone, reconnecting]);

  const handleSignInWithSavedEmail = useCallback(() => {
    clearReconnectReplacePending(phone);
    setReconnecting(false);
    existingUserWaArmedRef.current = true;
    setExistingUserWaCountdown(5);
  }, [phone]);

  const handleConnectDifferent = useCallback(() => {
    setAutoContinueStarted(false);
    setReconnectReplacePending(phone);
    setReconnecting(true);
    void handleGoogleSignIn();
  }, [handleGoogleSignIn, phone]);

  // Pehle `signOut()` tha — user app se hi logout ho jata tha. Ab sirf GMB
  // disconnect karke naya Google account connect karne dete hain.
  const handleSwitchAccount = useCallback(async () => {
    const qs = phone ? `?phone=${phone}` : "";
    await gmb.disconnect();
    // Yahan consent screen zaroori hai — user naya Google account chun raha hai.
    await gmb.reconnect(`/connect-google-business${qs}`, { phone });
  }, [gmb, phone]);

  // After OAuth full page reload: restore "new Google account" flow for existing numbers
  useEffect(() => {
    if (typeof window === "undefined" || !phone || status !== "authenticated") return;
    if (isNewUser !== false) return;
    if (isReconnectReplacePending(phone)) setReconnecting(true);
  }, [phone, status, isNewUser]);

  useEffect(() => {
    if (!isNewUser && !reconnecting) return;
    if (status !== "authenticated" || !session?.accessToken) return;
    if (locationsLoaded || listLoading) return;
    void loadLocations();
  }, [isNewUser, reconnecting, status, session?.accessToken, locationsLoaded, listLoading, loadLocations]);

  useEffect(() => {
    if (
      (!isNewUser && !reconnecting) ||
      status !== "authenticated" ||
      listLoading ||
      continueSuccess ||
      continueBusy ||
      !locationsLoaded ||
      autoContinueStarted ||
      waitSeconds > 0 ||
      listError
    ) {
      return;
    }

    setAutoContinueStarted(true);
    void handleContinue();
  }, [
    isNewUser,
    reconnecting,
    status,
    listLoading,
    continueSuccess,
    continueBusy,
    locationsLoaded,
    autoContinueStarted,
    waitSeconds,
    listError,
    handleContinue,
  ]);

  useEffect(() => {
    if ((!isNewUser && !reconnecting) || status !== "authenticated" || listLoading || continueSuccess) return;
    if (!waitActive && locationsLoaded) {
      setWaitActive(true);
      setWaitSeconds(8);
    }
  }, [isNewUser, reconnecting, status, listLoading, continueSuccess, waitActive, locationsLoaded]);

  useEffect(() => {
    if (!waitActive || waitSeconds <= 0) return;
    const timeout = window.setTimeout(() => {
      setWaitSeconds((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [waitActive, waitSeconds]);

  useEffect(() => {
    if (!continueSuccess || redirectCountdown <= 0) return;
    const timeout = window.setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [continueSuccess, redirectCountdown]);

  useEffect(() => {
    if (!continueSuccess || redirectCountdown !== 0) return;
    window.location.replace(getLimbuWhatsAppChatUrl());
  }, [continueSuccess, redirectCountdown]);

  useEffect(() => {
    if (existingUserWaCountdown === null || existingUserWaCountdown <= 0) return;
    const t = window.setTimeout(() => {
      setExistingUserWaCountdown((c) => (c === null || c <= 0 ? c : c - 1));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [existingUserWaCountdown]);

  useEffect(() => {
    if (!existingUserWaArmedRef.current || existingUserWaCountdown !== 0) return;
    existingUserWaArmedRef.current = false;
    window.location.replace(getLimbuWhatsAppChatUrl());
  }, [existingUserWaCountdown]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const totalListings = linkedVerified.length + notLinked.length;
  const headline =
    totalListings === 0
      ? "No Business Profile locations found for this Google account"
      : linkedVerified.length > 0 && notLinked.length === 0
        ? "Business profiles linked to this Google account"
        : "Your Google Business Profile listings";
  const subline =
    totalListings === 0
      ? "Sign in with the correct Google account that has your Business Profile."
      : `${totalListings} listing${totalListings === 1 ? "" : "s"} found for this Gmail account — see status below.`;

  return (
      <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <p className="text-lg font-bold tracking-tight text-[#0B0F19]">
          Limbu<span className="text-[#FFC107]">.ai</span>
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-8">
        {/* Initial phone check loading */}
        {phoneCheckLoading && (
          <div className="flex min-h-[42vh] flex-col items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Loader2 className="mx-auto h-11 w-11 animate-spin text-amber-500" />
              <h2 className="mt-5 text-lg font-bold text-slate-900">Checking account…</h2>
              <p className="mt-2 text-sm text-slate-600">Verifying phone number...</p>
            </div>
          </div>
        )}

        {/* Error checking phone */}
        {!phoneCheckLoading && phoneCheckError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800 shadow-sm">
            {phoneCheckError}
          </div>
        )}

        {/* Choose Google account (new number, or existing number switching to a new Gmail) */}
        {!phoneCheckLoading && (isNewUser || reconnecting) && status !== "authenticated" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Choose your Google account</h1>
            <p className="mt-2 text-sm text-slate-600">
              {reconnecting
                ? "Sign in with the Google account you want to use for this phone number. This replaces the previous Gmail connection."
                : "Select the Google account you want to use to connect your Business Profile."}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] py-3.5 text-sm font-semibold text-[#FFC107] shadow-lg transition hover:bg-slate-800"
              >
                <Mail className="h-4 w-4" />
                Choose Google account
              </button>
            </div>
          </div>
        )}

        {/* Existing user — already linked to this WhatsApp number */}
        {!phoneCheckLoading &&
          !isNewUser &&
          !continueSuccess &&
          !reconnecting &&
          existingUserWaCountdown === null && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Account already connected!</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your phone number <span className="font-semibold">+{phone}</span> is already connected.
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              <Mail className="mb-0.5 inline h-3.5 w-3.5" /> {existingEmail}
            </p>
            <p className="mt-3 text-xs text-slate-600">
              {existingLocations} business location{existingLocations !== 1 ? "s" : ""} connected
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSignInWithSavedEmail}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] py-3.5 text-sm font-semibold text-[#FFC107] shadow-lg transition hover:bg-slate-800"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                Sign in with saved business email
              </button>

              <button
                type="button"
                onClick={handleConnectDifferent}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.5} />
                Connect with different email
              </button>
            </div>

            <p className="mt-4 text-[11px] text-slate-500">
              Signing in with a different email will replace the current connection for this phone in Limbu (GMB data and dashboard user).
            </p>
          </div>
        )}

        {/* Session loading */}
        {!phoneCheckLoading && inConnectFlow && status === "loading" && (
          <div className="flex min-h-[42vh] flex-col items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Loader2 className="mx-auto h-11 w-11 animate-spin text-amber-500" />
              <h2 className="mt-5 text-lg font-bold text-slate-900">Connecting your business</h2>
              <p className="mt-2 text-sm text-slate-600">Please wait — checking your session.</p>
            </div>
          </div>
        )}

        {/* WhatsApp connected — auto redirect after 5s */}
        {continueSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">WhatsApp connected</h1>
            <p className="mt-2 text-sm text-slate-600">
              You&apos;re all set. Returning to Limbu on WhatsApp (
              <span className="font-medium">+91 70651 78662</span>)…
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Redirecting in {redirectCountdown} second{redirectCountdown === 1 ? "" : "s"}...
            </p>
            <button
              type="button"
              onClick={() => window.location.replace(getLimbuWhatsAppChatUrl())}
              className="mt-4 text-[13px] font-semibold text-emerald-800 underline-offset-2 hover:underline"
            >
              Open WhatsApp now
            </button>
          </div>
        )}

        {/* Fetching listings */}
        {!phoneCheckLoading && inConnectFlow && status === "authenticated" && listLoading && (
          <div className="flex min-h-[48vh] flex-col items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Building2 className="mx-auto h-10 w-10 text-amber-500" strokeWidth={2} />
              <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin text-amber-500" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">Fetching listings…</h2>
              <p className="mt-2 text-sm text-slate-500">Loading locations from Google…</p>
            </div>
          </div>
        )}

        {/* Listings ready for review */}
        {!phoneCheckLoading && inConnectFlow && status === "authenticated" && !listLoading && !continueSuccess && (
          <>
            <div className="mb-2 flex justify-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  totalListings === 0 ? "bg-amber-100 text-amber-600" : "bg-sky-50 text-sky-600"
                }`}
              >
                {totalListings === 0 ? (
                  <AlertTriangle className="h-9 w-9" strokeWidth={2} />
                ) : (
                  <Building2 className="h-9 w-9" strokeWidth={2} />
                )}
              </div>
            </div>
            <h1 className="text-center text-[22px] font-bold leading-tight text-slate-900">
              {headline}
            </h1>
            <p className="mt-2 text-center text-sm leading-snug text-slate-600">{subline}</p>
            <p className="mt-2 text-center text-sm text-slate-500">
              Gmail:{" "}
              <span className="font-medium text-slate-800">
                {email || session?.user?.email || "—"}
              </span>
            </p>
            {phone && (
              <p className="mt-1 text-center text-xs text-slate-400">
                Phone: <span className="font-medium text-slate-600">+{phone}</span>
              </p>
            )}

            {listError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800">
                {listError}
              </p>
            )}

            {/* Unverified */}
            <section className="mt-8 overflow-hidden rounded-xl border border-amber-200/90 bg-white shadow-sm">
              <div className="bg-amber-50 px-4 py-2.5 text-center text-[13px] font-semibold text-amber-950">
                Unverified
              </div>
              <div className="divide-y divide-slate-100">
                {notLinked.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-slate-500">
                    {linkedVerified.length > 0
                      ? "All visible listings are verified."
                      : "Unverified or pending listings will appear here."}
                  </p>
                ) : (
                  notLinked.map((loc) => (
                    <BusinessCard key={loc.name} loc={loc} verified={false} />
                  ))
                )}
              </div>
            </section>

            {/* Verified */}
            <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-100 px-4 py-2.5 text-center text-[13px] font-semibold text-slate-800">
                Business linked to this Gmail Account
              </div>
              <div>
                {linkedVerified.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-slate-500">
                    {notLinked.length > 0
                      ? "Verified listings will appear here once verification completes."
                      : "No verified locations matched yet."}
                  </p>
                ) : (
                  linkedVerified.map((loc) => (
                    <BusinessCard key={loc.name} loc={loc} verified />
                  ))
                )}
              </div>
            </section>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="text-[13px] font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
              >
                Different Google account
              </button>
            </div>
          </>
        )}
      </main>

      {/* Existing user → WhatsApp preview (5s) before opening chat */}
      {existingUserWaCountdown !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="existing-user-wa-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
            </div>
            <h1 id="existing-user-wa-title" className="text-xl font-bold text-slate-900">
              WhatsApp connected
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Returning you to Limbu on WhatsApp (
              <span className="font-medium">+91 70651 78662</span>)…
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {existingUserWaCountdown > 0
                ? `Redirecting in ${existingUserWaCountdown} second${existingUserWaCountdown === 1 ? "" : "s"}…`
                : "Opening WhatsApp…"}
            </p>
            <button
              type="button"
              onClick={() => {
                existingUserWaArmedRef.current = false;
                setExistingUserWaCountdown(null);
                window.location.replace(getLimbuWhatsAppChatUrl());
              }}
              className="mt-5 text-[13px] font-semibold text-emerald-800 underline-offset-2 hover:underline"
            >
              Open WhatsApp now
            </button>
          </div>
        </div>
      )}

      {/* Sticky Continue button (for new users reviewing listings) */}
      {!phoneCheckLoading && inConnectFlow && status === "authenticated" && !listLoading && !continueSuccess && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            <button
              type="button"
              disabled={continueBusy || waitSeconds > 0}
              onClick={() => void handleContinue()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] py-3.5 text-sm font-semibold text-[#FFC107] shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
            >
              {continueBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                  {waitSeconds > 0 ? `Please wait ${waitSeconds}s` : "Continue to chatbot"}
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400">
              {waitSeconds > 0
                ? "Review your listings. Continue unlocks after 8 seconds."
                : "Listings will be saved, then WhatsApp opens automatically in 5 seconds."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConnectGoogleBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        </div>
      }
    >
      <ConnectGoogleBusinessInner />
    </Suspense>
  );
}
