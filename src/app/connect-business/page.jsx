"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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

  const buttonsReady = resolveState.ok && !!phone && !resolveState.loading;
  const chatUrl = "/?limbu_chat=1";
  const handleOpenChat = useCallback(() => {
    router.push(chatUrl);
  }, [router]);

  const fbLoginHref = useMemo(() => {
    if (!phone) return "#";
    return `/api/facebook/login?phone=${encodeURIComponent(phone)}&source=chatbot`;
  }, [phone]);

  const igLoginHref = useMemo(() => {
    if (!phone) return "#";
    return `/api/instagram/login?phone=${encodeURIComponent(phone)}&source=chatbot`;
  }, [phone]);

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
    if (oauthFlash?.done !== "instagram") return;
    const timer = window.setTimeout(() => {
      router.replace(`/?limbu_chat=1`);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [oauthFlash, router]);

  if (type === "google") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
  const fullPageUrl = `${baseUrl}/connect-business?type=meta&source=chatbot&phone=${phone}`;
  const fullFbUrl = `${baseUrl}/api/facebook/login?phone=${phone}&source=chatbot`;
  const fullIgUrl = `${baseUrl}/api/instagram/login?phone=${phone}&source=chatbot`;

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <p className="text-lg font-bold tracking-tight text-[#0B0F19]">
          Limbu<span className="text-[#FFC107]">.ai</span>
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-8">
        <h1 className="text-center text-[22px] font-bold leading-tight text-slate-900">
          Connect Facebook &amp; Instagram
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          This uses the same Meta OAuth flow as the dashboard — your chatbot link
          only carries your WhatsApp phone number so we resolve your Limbu{" "}
          <span className="font-semibold text-slate-800">account</span>. Facebook
          and Instagram each use their own button and URL (same server routes).
        </p>

        {phone ? (
          <p className="mt-3 text-center text-xs text-slate-500">
            Phone:{" "}
            <span className="font-medium text-slate-700">+{phone}</span>
          </p>
        ) : null}

        {oauthFlash?.done === "facebook" && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-sm">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
              aria-hidden
            />
            <p>
              <strong>Facebook Page connected successfully.</strong> Your pages
              and tokens are saved the same way as on the dashboard. Use the
              Instagram button below to finish linking Instagram Business.
            </p>
          </div>
        )}
        {oauthFlash?.done === "instagram" && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-start gap-3 text-sm text-emerald-950">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p>
                  <strong>Instagram Business connected successfully.</strong> Your
                  connection is saved. You can review it anytime after signing in
                  to Limbu with OTP on /login — you do not have to redo this OAuth
                  step.
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  We will open the Limbu chat automatically in a few seconds.
                </p>
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open chat now
                </button>
              </div>
            </div>
          </div>
        )}
        {(oauthFlash?.fbError || oauthFlash?.igError) && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-sm">
            {oauthFlash.fbError ? (
              <p className="font-medium">
                Facebook: {metaErrorMessage(oauthFlash.fbError)}
              </p>
            ) : null}
            {oauthFlash.igError ? (
              <p className={oauthFlash.fbError ? "mt-2 font-medium" : "font-medium"}>
                Instagram: {metaErrorMessage(oauthFlash.igError)}
              </p>
            ) : null}
          </div>
        )}

        {resolveState.loading && (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <p className="mt-4 text-sm text-slate-600">Resolving your Limbu account…</p>
          </div>
        )}

        {!resolveState.loading && resolveState.error && (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-950 shadow-sm">
            {resolveState.error}
          </div>
        )}

        {!resolveState.loading && resolveState.ok && (
          <>
            <section className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Meta connect checklist</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Connect Facebook and Instagram from your chatbot link. We resolve your
                    WhatsApp phone to a Limbu account and keep the same server OAuth flow
                    as the dashboard.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 shadow-inner">
                  {metaPages.loading ? (
                    <span>Loading connected pages…</span>
                  ) : (
                    <span>
                      {metaPages.facebook.length} Facebook page{metaPages.facebook.length === 1 ? "" : "s"} · {metaPages.instagram.length} Instagram account{metaPages.instagram.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Facebook Pages</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{metaPages.facebook.length}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {metaPages.facebook.length > 0
                      ? "Pages saved to Limbu.ai."
                      : "No Facebook pages connected yet."}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Instagram Accounts</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{metaPages.instagram.length}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {metaPages.instagram.length > 0
                      ? "Instagram Business connected."
                      : "No Instagram account connected yet."}
                  </p>
                </div>
              </div>

              {metaPages.error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  {metaPages.error}
                </div>
              ) : null}

              {metaPages.loading ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching connected pages…
                </div>
              ) : null}
            </section>

            {!metaPages.loading && metaPages.facebook.length + metaPages.instagram.length > 0 && (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-slate-900">Connected Meta pages</p>
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open Limbu chat
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {metaPages.facebook.map((page) => (
                    <div key={`fb-${page.pageId}`} className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="font-medium text-slate-900">{page.pageName}</p>
                      <p className="text-xs text-slate-500">Facebook Page ID: {page.pageId}</p>
                    </div>
                  ))}
                  {metaPages.instagram.map((page) => (
                    <div key={`ig-${page.igId || page.pageId}`} className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="font-medium text-slate-900">{page.igName || page.pageName || page.username}</p>
                      <p className="text-xs text-slate-500">Instagram Business ID: {page.igId || page.pageId}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <section className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[13px] leading-snug text-slate-600">
                <strong className="text-slate-900">Steps:</strong> connect your
                Facebook Page first using a Meta account that is an admin of that
                page. Your Instagram Business profile must already be linked to
                that Page in Meta; then authorize with the Instagram button.
                After each OAuth completion you&apos;ll{" "}
                <span className="font-medium text-slate-800">land back on this page</span>.
                Data is stored the same way as the manual dashboard flow (
                <code className="text-slate-800">FacebookPage</code> |{" "}
                <code className="text-slate-800">InstagramPage</code> collections).
              </p>
            </section>

            {showFacebook && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 bg-[#1877F2]/10 px-4 py-3">
                  <Facebook className="h-5 w-5 text-[#1877F2]" aria-hidden />
                  <span className="text-sm font-semibold text-slate-900">
                    Facebook Page
                  </span>
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-[13px] text-slate-600">
                    Tap the button below. It opens{" "}
                    <code className="text-slate-800">/api/facebook/login</code> —
                    the same endpoint as the dashboard. Your phone resolves to
                    your Limbu{" "}
                    <code className="text-slate-800">userId</code> and then Meta
                    OAuth begins.
                  </p>
                  <a
                    href={fbLoginHref}
                    className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition ${buttonsReady ? "bg-[#1877F2] hover:bg-[#1463d6]" : "bg-slate-300 text-slate-500 cursor-not-allowed"}`}
                    aria-disabled={!buttonsReady}
                  >
                    Connect Facebook
                  </a>
                  <p className="break-all text-[11px] text-slate-400">
                    Direct link (chatbot copy): {fullFbUrl}
                  </p>
                </div>
              </div>
            )}

            {showInstagram && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 bg-pink-50 px-4 py-3">
                  <Instagram className="h-5 w-5 text-[#E1306C]" aria-hidden />
                  <span className="text-sm font-semibold text-slate-900">
                    Instagram Business
                  </span>
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-[13px] text-slate-600">
                    Tap the button below —{" "}
                    <code className="text-slate-800">/api/instagram/login</code>.
                    Permissions differ slightly (InstagramBasic and Content
                    Publish). Authorization still happens through Meta&apos;s login
                    dialog, exactly like{" "}
                    <span className="font-medium">the dashboard Instagram flow</span>
                    .
                  </p>
                  <a
                    href={igLoginHref}
                    className={`flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition ${buttonsReady ? "bg-[#E1306C] hover:bg-[#c1275b]" : "bg-slate-300 text-slate-500 cursor-not-allowed"}`}
                    aria-disabled={!buttonsReady}
                  >
                    Connect Instagram
                  </a>
                  <p className="break-all text-[11px] text-slate-400">
                    Direct link (chatbot copy): {fullIgUrl}
                  </p>
                </div>
              </div>
            )}

            <section className="mt-8 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                All-in-one page URL (both steps here)
              </p>
              <p className="mt-1 break-all text-center text-[11px] text-slate-600">
                {fullPageUrl}
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
