"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function formatBusinessAddress(loc) {
  const lines = (loc.storefrontAddress?.addressLines || []).filter(Boolean);
  const locality = loc.storefrontAddress?.locality || "";
  const region = loc.storefrontAddress?.administrativeArea || "";
  const postal = loc.storefrontAddress?.postalCode || "";
  const tail = [locality, region, postal].filter(Boolean).join(", ");
  const parts = [...lines, tail].filter(Boolean);
  return parts.join("\n") || "—";
}

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

/** Keep only digits from a phone string. */
function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "");
}

/** Derive a deterministic sessionId from phone when no session_id is in URL. */
function sessionIdFromPhone(phone) {
  const digits = normalizePhone(phone);
  return digits ? `phone_${digits}` : "";
}

function ConnectGoogleBusinessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support both ?session_id= (legacy) and ?phone= (new chatbot flow)
  const phoneFromUrl      = normalizePhone(searchParams.get("phone") || "");
  const rawSessionId      = searchParams.get("session_id")?.trim() || "";
  // When phone is provided without an explicit session_id, derive one deterministically
  const sessionIdFromUrl  = rawSessionId || (phoneFromUrl ? sessionIdFromPhone(phoneFromUrl) : "");

  const { data: session, status } = useSession();

  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [email, setEmail] = useState("");
  const [linkedVerified, setLinkedVerified] = useState([]);
  const [notLinked, setNotLinked] = useState([]);
  const [continueBusy, setContinueBusy] = useState(false);
  const [signInError, setSignInError] = useState(false);

  const loadLocations = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await fetch("/api/gmb/my-locations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Load failed");
      setEmail(data.email || "");
      setLinkedVerified(data.linkedVerified || []);
      setNotLinked(data.notLinkedOrUnverified || []);
    } catch (e) {
      setListError(e?.message || "Could not load businesses");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;
    void loadLocations();
  }, [status, session?.accessToken, loadLocations]);

  const handleGoogleSignIn = () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const next = new URLSearchParams();
    next.set("setup", "1");
    // Carry both identifiers forward through OAuth callback
    if (phoneFromUrl)     next.set("phone",      phoneFromUrl);
    if (sessionIdFromUrl) next.set("session_id",  sessionIdFromUrl);
    const qs = next.toString();
    const callbackUrl = `${origin}/connect-google-business${qs ? `?${qs}` : ""}`;
    setSignInError(false);
    void signIn("google", { callbackUrl }).catch(() => setSignInError(true));
  };

  const handleContinue = async () => {
    if (!sessionIdFromUrl && !phoneFromUrl) {
      setListError(
        "URL mein ?phone= ya ?session_id= zaroori hai — chatbot wala link use karein."
      );
      return;
    }
    setContinueBusy(true);
    try {
      const res = await fetch("/api/gmb/sync-and-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdFromUrl,
          ...(phoneFromUrl ? { phone: phoneFromUrl } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      const syncedListings = data.listings ?? data.locationsData ?? [];
      if (syncedListings.length) {
        try {
          const locationDetails = syncedListings.map((item) => {
            const name = item.name || item.locationResourceName || "";
            const locationId =
              name && name.includes("/")
                ? name.split("/").pop()
                : name || item.locationId || "";
            const accountId = item.accountId || "";
            const locality = item.storefrontAddress?.locality || "";
            const address =
              item.storefrontAddress?.addressLines?.[0] ||
              item.address ||
              "";
            const title = item.title || "";
            const isVerified =
              item.hasVoiceOfMerchant === true || item.verified === true;
            return {
              locationId,
              accountId,
              locality,
              address,
              title,
              websiteUrl: item.websiteUri || "",
              reviewUri: item.metadata?.newReviewUri || "",
              isVerified,
              businessProfileId: name || "",
              name,
              websiteUri: item.websiteUri,
              storefrontAddress: item.storefrontAddress,
              phoneNumbers: item.phoneNumbers,
              categories: item.categories,
              openInfo: item.openInfo,
              metadata: item.metadata,
            };
          });
          localStorage.setItem("locationDetails", JSON.stringify(locationDetails));
          localStorage.setItem(
            "reviewUrl",
            syncedListings[0]?.metadata?.newReviewUri || ""
          );
        } catch {}
      }

      router.replace("/?limbu_chat=1");
    } catch (e) {
      setListError(e?.message || "Continue failed");
    } finally {
      setContinueBusy(false);
    }
  };

  const totalListings = linkedVerified.length + notLinked.length;
  const headline =
    totalListings === 0
      ? "Is Google account par koi Business Profile location nahi mili"
      : linkedVerified.length > 0 && notLinked.length === 0
        ? "Business profiles linked to this Google account"
        : "Your Google Business Profile listings";
  const subline =
    totalListings === 0
      ? "Sahi Google account se sign in karein jisme Business Profile ho."
      : `${totalListings} listing${totalListings === 1 ? "" : "s"} is Gmail ke saath mili — neeche status dekhein.`;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <p className="text-lg font-bold tracking-tight text-[#0B0F19]">
          Limbu<span className="text-[#FFC107]">.ai</span>
        </p>
        <div className="flex items-center gap-2 text-[13px] text-slate-600">
          <span className="hidden sm:inline">English</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-8">
        {status === "loading" && (
          <div className="flex min-h-[42vh] flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Loader2 className="mx-auto h-11 w-11 animate-spin text-amber-500" />
              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Connect your business
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Please wait — session check ho raha hai…
              </p>
            </div>
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B0F19] text-[#FFC107]">
              <AlertTriangle className="h-7 w-7" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Google Business setup
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in with Google to see your Business Profile listings, then
              continue to Limbu AI chat.
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-6 w-full rounded-xl bg-[#0B0F19] py-3.5 text-sm font-semibold text-[#FFC107] shadow-md transition hover:bg-slate-800"
            >
              Continue with Google
            </button>
            {signInError && (
              <p className="mt-3 text-xs text-red-600">
                Sign-in start nahi ho paya — refresh karke try karein.
              </p>
            )}
          </div>
        )}

        {status === "authenticated" && listLoading && (
          <div className="flex min-h-[48vh] flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Building2 className="h-7 w-7" strokeWidth={2} />
              </div>
              <Loader2 className="mx-auto mt-5 h-10 w-10 animate-spin text-amber-500" />
              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Connect your business
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Please wait while we fetch your Google Business listings…
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Thodi der lag sakti hai — Google API se locations load ho rahi
                hain
              </p>
            </div>
          </div>
        )}

        {status === "authenticated" && !listLoading && (
          <>
            <div className="mb-2 flex justify-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  totalListings === 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-sky-50 text-sky-600"
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
            <p className="mt-2 text-center text-sm leading-snug text-slate-600">
              {subline}
            </p>
            <p className="mt-2 text-center text-sm text-slate-500">
              Gmail:{" "}
              <span className="font-medium text-slate-800">
                {email || session?.user?.email || "—"}
              </span>
            </p>

            {listError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800">
                {listError}
              </p>
            )}

            {/* Unverified (Voice of Merchant pending on Google) */}
            <section className="mt-8 overflow-hidden rounded-xl border border-amber-200/90 bg-white shadow-sm">
              <div className="bg-amber-50 px-4 py-2.5 text-center text-[13px] font-semibold text-amber-950">
                Unverified
              </div>
              <div className="divide-y divide-slate-100">
                {notLinked.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-slate-500">
                    {linkedVerified.length > 0
                      ? "Sab dikhai de rahi listings verified hain — neeche section dekhein."
                      : "Yahan unverified ya pending listings dikhengi."}
                  </p>
                ) : (
                  notLinked.map((loc) => (
                    <BusinessCard key={loc.name} loc={loc} verified={false} />
                  ))
                )}
              </div>
            </section>

            {/* Grey-style section: verified */}
            <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-100 px-4 py-2.5 text-center text-[13px] font-semibold text-slate-800">
                Business linked to this Gmail Account
              </div>
              <div>
                {linkedVerified.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-slate-500">
                    {notLinked.length > 0
                      ? "Verification complete hone ke baad yahan Verified dikhega."
                      : "Koi verified location abhi match nahi hui."}
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
                onClick={() => {
                  const next = new URLSearchParams();
                  if (phoneFromUrl)     next.set("phone",     phoneFromUrl);
                  if (sessionIdFromUrl) next.set("session_id", sessionIdFromUrl);
                  const qs = next.toString();
                  void signOut({
                    callbackUrl: `/connect-google-business${qs ? `?${qs}` : ""}`,
                  });
                }}
                className="text-[13px] font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
              >
                Different Google account
              </button>
            </div>
          </>
        )}
      </main>

      {status === "authenticated" && !listLoading && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            <button
              type="button"
              disabled={continueBusy}
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
                  Continue to chatbot
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Listings saveBussiness se save hongi, phir Limbu AI chat khulega
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
