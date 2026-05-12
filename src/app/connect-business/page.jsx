"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Facebook,
  Instagram,
  Loader2,
  Phone,
  AlertCircle,
  MessageCircle,
  X,
} from "lucide-react";

// ─── utils ────────────────────────────────────────────────────────────────────

function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "");
}

const META_ERRORS = {
  no_pages:
    "No Facebook Pages found. Use an account that admins at least one Page.",
  no_instagram:
    "No Instagram Business account linked. Connect Instagram Business to your Page in Meta first.",
  missing_params:
    "OAuth didn't finish. Close this tab, reopen the chatbot link, and tap Connect again.",
  oauth_failed:
    "Something went wrong with Meta. Wait a moment and try again, or switch browsers.",
};

function metaErrorMessage(key) {
  const k = (key || "").toLowerCase();
  return META_ERRORS[k] ?? `Error: ${key || "unknown"}`;
}

// ─── platform config ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  facebook: {
    label: "Facebook",
    title: "Connect Facebook Page",
    subtitle: "Authorize Meta to link your Facebook Page to Limbu.ai",
    fetchingMessage: "Fetching your Facebook Pages…",
    buttonLabel: "Continue with Facebook",
    headerBg: "bg-blue-50",
    iconBg: "bg-[#1877F2]",
    badgeBg: "bg-blue-100",
    badgeText: "text-[#1877F2]",
    buttonBg: "bg-[#1877F2] hover:bg-[#1464d6]",
    avatarBg: "bg-blue-100",
    avatarText: "text-[#1877F2]",
    Icon: Facebook,
  },
  instagram: {
    label: "Instagram",
    title: "Connect Instagram Business",
    subtitle: "Authorize Meta to link your Instagram Business account",
    fetchingMessage: "Fetching your Instagram Business accounts…",
    buttonLabel: "Continue with Instagram",
    headerBg: "bg-pink-50",
    iconBg: "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-600",
    buttonBg:
      "bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:brightness-90",
    avatarBg: "bg-pink-100",
    avatarText: "text-pink-600",
    Icon: Instagram,
  },
};

// ─── StatusBanner ─────────────────────────────────────────────────────────────

function StatusBanner({ variant, icon, title, message }) {
  const styles = {
    info:    "bg-slate-50 border-slate-200 text-slate-700",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error:   "bg-red-50 border-red-200 text-red-900",
  };
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-3.5 text-sm ${styles[variant]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="font-semibold leading-snug">{title}</p>
        {message && <p className="mt-0.5 opacity-80">{message}</p>}
      </div>
    </div>
  );
}

// ─── SuccessModal ─────────────────────────────────────────────────────────────
// Shows after OAuth callback with connected pages + countdown redirect

function SuccessModal({ platform, pages, onClose, onRedirect }) {
  const cfg = PLATFORM_CONFIG[platform];
  const { Icon: PlatformIcon } = cfg;
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (countdown <= 0) {
      onRedirect();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onRedirect]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* top accent bar */}
        <div className={`flex items-center justify-between px-5 py-4 ${cfg.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cfg.iconBg}`}>
              <PlatformIcon className="h-4 w-4 text-white" aria-hidden />
            </div>
            <p className="text-sm font-bold text-slate-800">{cfg.label} Connected</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-200/60"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* big checkmark */}
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-base font-bold text-slate-900">Connected successfully!</p>
            <p className="text-xs text-slate-500">
              Your {cfg.label} account is now linked to Limbu.ai
            </p>
          </div>

          {/* connected pages list — only this platform's pages */}
          {pages.length > 0 && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {pages.length} page{pages.length > 1 ? "s" : ""} connected
              </p>
              <div className="divide-y divide-slate-100">
                {pages.map((page) => {
                  const initials = page.name
                    .replace("@", "")
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div key={page.id || page.name} className="flex items-center gap-3 px-3 py-2.5">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${cfg.avatarBg} ${cfg.avatarText}`}>
                        {initials}
                      </span>
                      <span className="flex-1 text-sm text-slate-800">{page.name}</span>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Active
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* countdown row */}
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
              Returning to WhatsApp
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {countdown}
            </span>
          </div>

          {/* manual redirect button */}
          <button
            onClick={onRedirect}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] active:scale-[0.99]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Go to WhatsApp now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ConnectBusinessInner ─────────────────────────────────────────────────────

function ConnectBusinessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type     = (searchParams.get("type")     || "").toLowerCase().trim();
  const platform = (searchParams.get("platform") || "").toLowerCase().trim();
  const phone    = normalizePhone(searchParams.get("phone") || "");

  // Optional: pass ?wa_return=<encoded-url> so the redirect goes back to the
  // exact chat the user came from (e.g. a specific WA deep-link with context).
  // Falls back to the default bot number.
  const waReturnUrl =
    searchParams.get("wa_return") || "https://wa.me/917065178662";

  const [oauthFlash,       setOauthFlash]       = useState(null);
  const [isLaunchingOAuth, setIsLaunchingOAuth] = useState(false);
  const [showModal,        setShowModal]        = useState(false);
  const hasOpenedModal = useRef(false);

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

  // ── strip OAuth flash params from URL ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp    = new URLSearchParams(window.location.search);
    const done  = sp.get("done");
    const fbErr = sp.get("fb_error");
    const igErr = sp.get("ig_error");
    if (!done && !fbErr && !igErr) return;

    setOauthFlash({ done: done || "", fbError: fbErr || "", igError: igErr || "" });

    const u  = new URL(window.location.href);
    u.searchParams.delete("done");
    u.searchParams.delete("fb_error");
    u.searchParams.delete("ig_error");
    const qs = u.searchParams.toString();
    router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  // ── platform derivation ───────────────────────────────────────────────────
  const isInstagramFlow = platform === "instagram" || platform === "ig";
  const activePlatform  = isInstagramFlow ? "instagram" : "facebook";
  const cfg             = PLATFORM_CONFIG[activePlatform];
  const { Icon: PlatformIcon } = cfg;

  const showBothUrls =
    (!platform || platform === "facebook" || platform === "fb") &&
    (!platform || platform === "instagram" || platform === "ig") &&
    !!phone;

  // ── login hrefs ───────────────────────────────────────────────────────────
  const fbLoginHref = useMemo(
    () => (phone ? `/api/facebook/login?phone=${encodeURIComponent(phone)}&source=chatbot` : "#"),
    [phone]
  );
  const igLoginHref = useMemo(
    () => (phone ? `/api/instagram/login?phone=${encodeURIComponent(phone)}&source=chatbot` : "#"),
    [phone]
  );
  const activeLoginHref = activePlatform === "facebook" ? fbLoginHref : igLoginHref;

  // ── PLATFORM-FILTERED pages ───────────────────────────────────────────────
  // Facebook flow → only facebook[]. Instagram flow → only instagram[].
  // This prevents cross-platform bleed (the screenshot bug).
  const activeConnectedPages =
    activePlatform === "facebook"
      ? metaPages.facebook.map((p) => ({ id: p.pageId || "", name: p.pageName || "Connected" }))
      : metaPages.instagram.map((p) => ({
          id: p.igId || "",
          name: p.igUsername || p.igName || p.username || "Connected",
        }));

  const activeOauthError =
    activePlatform === "facebook" ? oauthFlash?.fbError : oauthFlash?.igError;

  // ── redirect back to originating WA chat ─────────────────────────────────
  const handleRedirectToWA = useCallback(() => {
    window.location.href = waReturnUrl;
  }, [waReturnUrl]);

  // ── connect handler ───────────────────────────────────────────────────────
  const buttonsReady = resolveState.ok && !!phone && !resolveState.loading;

  const handleConnect = useCallback(
    (e) => {
      e.preventDefault();
      if (!buttonsReady) return;
      setIsLaunchingOAuth(true);
      window.location.href = activeLoginHref;
    },
    [activeLoginHref, buttonsReady]
  );

  // ── Google redirect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (type === "google") {
      const q = phone ? `?phone=${encodeURIComponent(phone)}` : "";
      router.replace(`/connect-google-business${q}`);
    }
  }, [type, phone, router]);

  // ── resolve user ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (type === "google") return;
    if (!phone) {
      setResolveState({
        loading: false,
        ok: false,
        error: "Your link must include a phone number, e.g. ?type=meta&phone=917740847114",
        userId: null,
      });
      return;
    }

    let cancelled = false;
    setResolveState({ loading: true, ok: false, error: "", userId: null });
    setMetaPages({ loading: false, facebook: [], instagram: [], error: "" });

    void fetch(`/api/meta/resolve-user?phone=${encodeURIComponent(phone)}`, { cache: "no-store" })
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
              "No Limbu account found for this number. Sign in at /login with OTP first, then come back.",
            userId: null,
          });
        }
      })
      .catch(() => {
        if (!cancelled)
          setResolveState({
            loading: false,
            ok: false,
            error: "Could not verify your account. Check your connection and try again.",
            userId: null,
          });
      });

    return () => { cancelled = true; };
  }, [phone, type]);

  // ── load pages (both, but only active platform is displayed) ─────────────
  useEffect(() => {
    if (!resolveState.ok || !resolveState.userId) return;

    let cancelled = false;
    setMetaPages((prev) => ({ ...prev, loading: true, error: "" }));

    const loadPages = async () => {
      try {
        const [fbRes, igRes] = await Promise.all([
          fetch(`/api/facebook/pages?userId=${encodeURIComponent(resolveState.userId)}`,  { cache: "no-store" }),
          fetch(`/api/instagram/pages?userId=${encodeURIComponent(resolveState.userId)}`, { cache: "no-store" }),
        ]);
        const fbData = await fbRes.json().catch(() => ({}));
        const igData = await igRes.json().catch(() => ({}));
        if (cancelled) return;

        setMetaPages({
          loading: false,
          facebook:  fbData.success && Array.isArray(fbData.pages)  ? fbData.pages  : [],
          instagram: igData.success && Array.isArray(igData.pages)  ? igData.pages  : [],
          error:
            (!fbData.success && fbData.message  ? fbData.message  : "") ||
            (!igData.success && igData.message  ? igData.message  : ""),
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching Meta pages:", err);
          setMetaPages({ loading: false, facebook: [], instagram: [], error: "Could not load connected pages. Please refresh after connecting." });
        }
      }
    };

    void loadPages();
    return () => { cancelled = true; };
  }, [resolveState.ok, resolveState.userId]);

  // ── open success modal once pages are loaded ──────────────────────────────
  useEffect(() => {
    const done = oauthFlash?.done;
    if (!done || done !== activePlatform) return;
    if (metaPages.loading) return;
    if (hasOpenedModal.current) return;
    hasOpenedModal.current = true;
    setShowModal(true);
  }, [activePlatform, oauthFlash, metaPages.loading]);

  // ── Google loader ─────────────────────────────────────────────────────────
  if (type === "google") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
      </div>
    );
  }

  const isSuccess  = oauthFlash?.done === activePlatform;
  const isFetching = isSuccess && metaPages.loading;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
  const fullFacebookPageUrl  = `${baseUrl}/connect-business?type=meta&source=chatbot&platform=facebook&phone=${phone}`;
  const fullInstagramPageUrl = `${baseUrl}/connect-business?type=meta&source=chatbot&platform=instagram&phone=${phone}`;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">

      {/* success modal */}
      {showModal && (
        <SuccessModal
          platform={activePlatform}
          pages={activeConnectedPages}
          onClose={() => setShowModal(false)}
          onRedirect={handleRedirectToWA}
        />
      )}

      {/* header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3.5">
          <p className="text-[17px] font-bold tracking-tight text-slate-900">
            Limbu<span className="text-amber-400">.ai</span>
          </p>
          <span className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
            {cfg.label}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 pb-16 pt-7">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* platform stripe */}
          <div className={`flex items-center gap-3 px-6 py-5 ${cfg.headerBg}`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${cfg.iconBg}`}>
              <PlatformIcon className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-[17px] font-bold leading-tight text-slate-900">{cfg.title}</h1>
              <p className="text-xs text-slate-500">{cfg.subtitle}</p>
            </div>
          </div>

          <div className="space-y-3 px-6 py-5">

            {/* phone */}
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                <Phone className="h-3.5 w-3.5 text-slate-600" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-800">+{phone || "Not provided"}</p>
              </div>
              {resolveState.ok && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              )}
            </div>

            {/* banners */}
            {resolveState.loading && (
              <StatusBanner variant="info" icon={<Loader2 className="h-4 w-4 animate-spin" />} title="Resolving account…" />
            )}
            {!resolveState.loading && resolveState.error && (
              <StatusBanner variant="warning" icon={<AlertCircle className="h-4 w-4" />} title="Account not found" message={resolveState.error} />
            )}
            {activeOauthError && (
              <StatusBanner variant="error" icon={<AlertCircle className="h-4 w-4" />} title="Meta authorization failed" message={metaErrorMessage(activeOauthError)} />
            )}
            {isFetching && (
              <StatusBanner variant="info" icon={<Loader2 className="h-4 w-4 animate-spin" />} title={cfg.fetchingMessage} />
            )}

            {/* connect button */}
            {!resolveState.loading && resolveState.ok && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={!buttonsReady || isLaunchingOAuth || isSuccess}
                className={`
                  mt-1 flex w-full items-center justify-center gap-2 rounded-2xl
                  py-3.5 text-sm font-semibold text-white transition-all duration-150
                  disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400
                  ${buttonsReady && !isLaunchingOAuth && !isSuccess ? cfg.buttonBg : ""}
                `}
              >
                {isLaunchingOAuth ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Working…</>
                ) : isSuccess ? (
                  <><CheckCircle2 className="h-4 w-4" /> Connected</>
                ) : (
                  <><PlatformIcon className="h-4 w-4" aria-hidden /> {cfg.buttonLabel}</>
                )}
              </button>
            )}

            {/* whatsapp button */}
            <button
              type="button"
              onClick={handleRedirectToWA}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
              Open WhatsApp
            </button>
          </div>
        </section>

        {/* debug URL cards */}
        {showBothUrls && (
          <div className="grid grid-cols-2 gap-2">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Facebook URL</p>
              <p className="mt-0.5 break-all text-[10px] text-slate-500">{fullFacebookPageUrl}</p>
            </section>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Instagram URL</p>
              <p className="mt-0.5 break-all text-[10px] text-slate-500">{fullInstagramPageUrl}</p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── page export ──────────────────────────────────────────────────────────────

export default function ConnectBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
        </div>
      }
    >
      <ConnectBusinessInner />
    </Suspense>
  );
}