"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Facebook, Instagram, Loader2 } from "lucide-react";

function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "");
}

function metaErrorMessage(key) {
  const k = (key || "").toLowerCase();
  const map = {
    no_pages:
      "No Facebook Pages were found. Use an account that is an admin of at least one Facebook Page.",
    no_instagram:
      "No Instagram Business account linked. Link Instagram Business to your Page in Meta first, then try again.",
    missing_params:
      "OAuth did not finish. Close this tab if it is stale, reopen the chatbot link, and tap Connect again.",
    oauth_failed:
      "Something went wrong with Meta. Wait a moment and try again, or use a different browser if it keeps failing.",
  };
  return map[k] || `Error: ${key || "unknown"}`;
}

function ConnectBusinessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "").toLowerCase().trim();
  const platform = (searchParams.get("platform") || "").toLowerCase().trim();
  const phone = normalizePhone(searchParams.get("phone") || "");

  const [oauthFlash, setOauthFlash] = useState(null);
  const hasScheduledRedirect = useRef(false);
  const [isLaunchingOAuth, setIsLaunchingOAuth] = useState(false);

  const [resolveState, setResolveState] = useState({
    loading: true,
    ok: false,
    error: "",
    userId: null,
  });

  const [metaPages, setMetaPages] = useState({
    loading: false,
    facebook: [],
    instagram: [],
    error: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const done = sp.get("done");
    const fbErr = sp.get("fb_error");
    const igErr = sp.get("ig_error");
    if (!done && !fbErr && !igErr) return;

    setOauthFlash({
      done: done || "",
      fbError: fbErr || "",
      igError: igErr || "",
    });

    const u = new URL(window.location.href);
    u.searchParams.delete("done");
    u.searchParams.delete("fb_error");
    u.searchParams.delete("ig_error");
    const qs = u.searchParams.toString();
    router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  const showFacebook =
    !platform || platform === "facebook" || platform === "fb";
  const showInstagram =
    !platform || platform === "instagram" || platform === "ig";
  const isInstagramFlow = platform === "instagram" || platform === "ig";
  const activePlatform = isInstagramFlow ? "instagram" : "facebook";

  const buttonsReady = resolveState.ok && !!phone && !resolveState.loading;
  const chatUrl = "https://wa.me/917065178662";
  const handleOpenChat = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = chatUrl;
    }
  }, [chatUrl]);

  const fbLoginHref = useMemo(() => {
    if (!phone) return "#";
    return `/api/facebook/login?phone=${encodeURIComponent(phone)}&source=chatbot`;
  }, [phone]);

  const igLoginHref = useMemo(() => {
    if (!phone) return "#";
    return `/api/instagram/login?phone=${encodeURIComponent(phone)}&source=chatbot`;
  }, [phone]);

  const activeLoginHref = activePlatform === "facebook" ? fbLoginHref : igLoginHref;
  const activeConnectedPages =
    activePlatform === "facebook" ? metaPages.facebook : metaPages.instagram;
  const activeOauthError =
    activePlatform === "facebook" ? oauthFlash?.fbError : oauthFlash?.igError;

  const handleConnect = useCallback(
    (event) => {
      if (!buttonsReady) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      setIsLaunchingOAuth(true);
      window.location.href = activeLoginHref;
    },
    [activeLoginHref, buttonsReady]
  );

  useEffect(() => {
    if (type === "google") {
      const q = phone ? `?phone=${encodeURIComponent(phone)}` : "";
      router.replace(`/connect-google-business${q}`);
    }
  }, [type, phone, router]);

  useEffect(() => {
    if (type === "google") return;
    if (!phone) {
      setResolveState({
        loading: false,
        ok: false,
        error:
          "Your link must include a phone number in the URL, for example ?type=meta&phone=917740847114 (use the chatbot link you were sent).",
        userId: null,
      });
      return;
    }

    let cancelled = false;
    setResolveState({ loading: true, ok: false, error: "", userId: null });
    setMetaPages({ loading: false, facebook: [], instagram: [], error: "" });

    void fetch(`/api/meta/resolve-user?phone=${encodeURIComponent(phone)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.userId) {
          setResolveState({ loading: false, ok: true, error: "", userId: data.userId });
        } else {
          setResolveState({
            loading: false,
            ok: false,
            error:
              data?.error ||
              "No Limbu account was found for this number. Sign in once at /login with OTP using the same phone, then come back here to connect Facebook or Instagram.",
            userId: null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolveState({
            loading: false,
            ok: false,
            error: "We could not verify your account. Check your connection and try again.",
            userId: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phone, type]);

  useEffect(() => {
    if (!resolveState.ok || !resolveState.userId) return;

    let cancelled = false;
    setMetaPages((prev) => ({ ...prev, loading: true, error: "" }));

    const loadPages = async () => {
      try {
        const [fbRes, igRes] = await Promise.all([
          fetch(`/api/facebook/pages?userId=${encodeURIComponent(resolveState.userId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/instagram/pages?userId=${encodeURIComponent(resolveState.userId)}`, {
            cache: "no-store",
          }),
        ]);

        const fbData = await fbRes.json().catch(() => ({}));
        const igData = await igRes.json().catch(() => ({}));

        if (cancelled) return;

        setMetaPages({
          loading: false,
          facebook: fbData.success && Array.isArray(fbData.pages) ? fbData.pages : [],
          instagram: igData.success && Array.isArray(igData.pages) ? igData.pages : [],
          error:
            (!fbData.success && fbData.message ? fbData.message : "") ||
            (!igData.success && igData.message ? igData.message : ""),
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching Meta pages:", error);
          setMetaPages({
            loading: false,
            facebook: [],
            instagram: [],
            error: "We could not load connected pages. Please refresh after connecting.",
          });
        }
      }
    };

    void loadPages();

    return () => {
      cancelled = true;
    };
  }, [resolveState.ok, resolveState.userId]);

  useEffect(() => {
    const done = oauthFlash?.done;
    if (!done || done !== activePlatform) return;
    if (metaPages.loading) return;
    if (hasScheduledRedirect.current) return;

    hasScheduledRedirect.current = true;
    const timer = window.setTimeout(() => {
      window.location.href = "https://wa.me/917065178662";
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [activePlatform, oauthFlash, metaPages.loading]);

  if (type === "google") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
  const fullFacebookPageUrl = `${baseUrl}/connect-business?type=meta&source=chatbot&platform=facebook&phone=${phone}`;
  const fullInstagramPageUrl = `${baseUrl}/connect-business?type=meta&source=chatbot&platform=instagram&phone=${phone}`;
  const cardTheme =
    activePlatform === "facebook"
      ? {
          badgeClass: "bg-[#1877F2]/10 text-[#1877F2]",
          buttonClass: "bg-[#1877F2] hover:bg-[#1463d6]",
          title: "Connect Facebook Page",
          helper: "Authorizing with Meta and fetching your Facebook pages.",
        }
      : {
          badgeClass: "bg-pink-100 text-[#E1306C]",
          buttonClass: "bg-[#E1306C] hover:bg-[#c1275b]",
          title: "Connect Instagram Business",
          helper: "Authorizing with Meta and fetching your Instagram business accounts.",
        };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <p className="text-lg font-bold tracking-tight text-[#0B0F19]">
          Limbu<span className="text-[#FFC107]">.ai</span>
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-slate-900">
                {cardTheme.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Clean OAuth flow with server-side save to DB, then WhatsApp redirect.
              </p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${cardTheme.badgeClass}`}>
              Limbu.ai
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Phone</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">+{phone || "Not provided"}</p>
          </div>

          {resolveState.loading && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resolving account...
            </div>
          )}

          {!resolveState.loading && resolveState.error && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {resolveState.error}
            </div>
          )}

          {activeOauthError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {metaErrorMessage(activeOauthError)}
            </div>
          )}

          {oauthFlash?.done === activePlatform && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">
                    Connected successfully. Data fetched and saved in DB.
                  </p>
                  <p className="mt-1 text-emerald-800">
                    Redirecting to WhatsApp in a moment...
                  </p>
                </div>
              </div>
            </div>
          )}

          {metaPages.loading && oauthFlash?.done === activePlatform && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              {cardTheme.helper}
            </div>
          )}

          {!metaPages.loading &&
            oauthFlash?.done === activePlatform &&
            activeConnectedPages.length > 0 && (
              <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Fetched {activeConnectedPages.length} item
                  {activeConnectedPages.length === 1 ? "" : "s"}
                </p>
                {activeConnectedPages.map((page) => (
                  <div
                    key={`${activePlatform}-${page.pageId || page.igId}`}
                    className="rounded-xl bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {page.pageName ||
                      page.igUsername ||
                      page.igName ||
                      page.username ||
                      "Connected"}
                  </div>
                ))}
              </div>
            )}

          {!resolveState.loading && resolveState.ok && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={!buttonsReady || isLaunchingOAuth}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition ${
                !buttonsReady || isLaunchingOAuth
                  ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
                  : cardTheme.buttonClass
              }`}
            >
              {isLaunchingOAuth ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : (
                <>
                  {activePlatform === "facebook" ? (
                    <Facebook className="h-5 w-5 text-white" aria-hidden />
                  ) : (
                    <Instagram className="h-5 w-5 text-white" aria-hidden />
                  )}
                  {activePlatform === "facebook"
                    ? "Connect Facebook"
                    : "Connect Instagram"}
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenChat}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Open WhatsApp
          </button>
        </section>

        {showFacebook && showInstagram && (
          <>
            <section className="mt-6 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Facebook-only page URL
              </p>
              <p className="mt-1 break-all text-center text-[11px] text-slate-600">
                {fullFacebookPageUrl}
              </p>
            </section>
            <section className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Instagram-only page URL
              </p>
              <p className="mt-1 break-all text-center text-[11px] text-slate-600">
                {fullInstagramPageUrl}
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function ConnectBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        </div>
      }
    >
      <ConnectBusinessInner />
    </Suspense>
  );
}
