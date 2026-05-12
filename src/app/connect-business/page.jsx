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
  Youtube,
  Linkedin,
} from "lucide-react";
import {
  LIMBU_CHATBOT_WA_RETURN,
  normalizeChatbotWaReturnUrl,
} from "@/lib/chatbotPlatformOAuthState";

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

const YOUTUBE_ERRORS = {
  no_channels: "No YouTube channel found on this Google account. Create a channel first, then try again.",
  missing_params: META_ERRORS.missing_params,
  oauth_failed: "Something went wrong with YouTube / Google sign-in. Try again in a moment.",
};

const LINKEDIN_ERRORS = {
  missing_params: META_ERRORS.missing_params,
  oauth_failed:
    "Something went wrong with LinkedIn sign-in. Wait a moment and try again, or switch browsers.",
};

function platformErrorMessage(errors, key) {
  const k = (key || "").toLowerCase();
  return errors[k] ?? `Error: ${key || "unknown"}`;
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
    listItemSingular: "page",
    listItemPlural: "pages",
    oauthErrorTitle: "Meta authorization failed",
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
    listItemSingular: "page",
    listItemPlural: "pages",
    oauthErrorTitle: "Meta authorization failed",
  },
  youtube: {
    label: "YouTube",
    title: "Connect YouTube Channel",
    subtitle: "Sign in with Google to link your YouTube channel to Limbu.ai",
    fetchingMessage: "Fetching your YouTube channels…",
    buttonLabel: "Continue with Google / YouTube",
    headerBg: "bg-red-50",
    iconBg: "bg-[#FF0000]",
    badgeBg: "bg-red-100",
    badgeText: "text-red-600",
    buttonBg: "bg-[#FF0000] hover:bg-[#e60000]",
    avatarBg: "bg-red-100",
    avatarText: "text-red-600",
    Icon: Youtube,
    listItemSingular: "channel",
    listItemPlural: "channels",
    oauthErrorTitle: "YouTube authorization failed",
  },
  linkedin: {
    label: "LinkedIn",
    title: "Connect LinkedIn",
    subtitle: "Authorize LinkedIn to link your profile or company pages to Limbu.ai",
    fetchingMessage: "Fetching your LinkedIn accounts…",
    buttonLabel: "Continue with LinkedIn",
    headerBg: "bg-sky-50",
    iconBg: "bg-[#0A66C2]",
    badgeBg: "bg-sky-100",
    badgeText: "text-[#0A66C2]",
    buttonBg: "bg-[#0A66C2] hover:bg-[#0958a8]",
    avatarBg: "bg-sky-100",
    avatarText: "text-[#0A66C2]",
    Icon: Linkedin,
    listItemSingular: "account",
    listItemPlural: "accounts",
    oauthErrorTitle: "LinkedIn authorization failed",
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

function SuccessModal({ platform, pages, onClose, onRedirect }) {
  const cfg = PLATFORM_CONFIG[platform];
  const { Icon: PlatformIcon } = cfg;
  const [countdown, setCountdown] = useState(4);
  const noun = pages.length === 1 ? cfg.listItemSingular : cfg.listItemPlural;

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
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-base font-bold text-slate-900">Connected successfully!</p>
            <p className="text-xs text-slate-500">
              Your {cfg.label} account is now linked to Limbu.ai
            </p>
          </div>

          {pages.length > 0 && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {pages.length} {noun} connected
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

          <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
              Returning to WhatsApp
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {countdown}
            </span>
          </div>

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

  const typeRaw     = (searchParams.get("type")     || "").toLowerCase().trim();
  const platformQP  = (searchParams.get("platform") || "").toLowerCase().trim();
  const phone       = normalizePhone(searchParams.get("phone") || "");

  const flowType =
    typeRaw === "youtube" ? "youtube" : typeRaw === "linkedin" ? "linkedin" : "meta";

  const waReturnUrl = normalizeChatbotWaReturnUrl(searchParams.get("wa_return"));

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

  const [connectedAccounts, setConnectedAccounts] = useState({
    loading: false,
    facebook: [],
    instagram: [],
    youtube: [],
    linkedin: [],
    error: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp    = new URLSearchParams(window.location.search);
    const done  = sp.get("done");
    const fbErr = sp.get("fb_error");
    const igErr = sp.get("ig_error");
    const ytErr = sp.get("yt_error");
    const liErr = sp.get("li_error");
    if (!done && !fbErr && !igErr && !ytErr && !liErr) return;

    setOauthFlash({
      done: done || "",
      fbError: fbErr || "",
      igError: igErr || "",
      ytError: ytErr || "",
      liError: liErr || "",
    });

    const u  = new URL(window.location.href);
    u.searchParams.delete("done");
    u.searchParams.delete("fb_error");
    u.searchParams.delete("ig_error");
    u.searchParams.delete("yt_error");
    u.searchParams.delete("li_error");
    const qs = u.searchParams.toString();
    router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  const isInstagramFlow =
    flowType === "meta" && (platformQP === "instagram" || platformQP === "ig");
  const activePlatform =
    flowType === "youtube"
      ? "youtube"
      : flowType === "linkedin"
        ? "linkedin"
        : isInstagramFlow
          ? "instagram"
          : "facebook";

  const cfg = PLATFORM_CONFIG[activePlatform];
  const { Icon: PlatformIcon } = cfg;

  const showBothUrls =
    flowType === "meta" &&
    (!platformQP || platformQP === "facebook" || platformQP === "fb") &&
    (!platformQP || platformQP === "instagram" || platformQP === "ig") &&
    !!phone;

  const fbLoginHref = useMemo(
    () => (phone ? `/api/facebook/login?phone=${encodeURIComponent(phone)}&source=chatbot` : "#"),
    [phone]
  );
  const igLoginHref = useMemo(
    () => (phone ? `/api/instagram/login?phone=${encodeURIComponent(phone)}&source=chatbot` : "#"),
    [phone]
  );
  const ytLoginHref = useMemo(
    () =>
      phone
        ? `/api/youtube/login?phone=${encodeURIComponent(phone)}&source=chatbot&wa_return=${encodeURIComponent(waReturnUrl)}`
        : "#",
    [phone, waReturnUrl]
  );
  const liLoginHref = useMemo(
    () =>
      phone
        ? `/api/linkedin/login?phone=${encodeURIComponent(phone)}&source=chatbot&wa_return=${encodeURIComponent(waReturnUrl)}`
        : "#",
    [phone, waReturnUrl]
  );

  const activeLoginHref =
    flowType === "youtube"
      ? ytLoginHref
      : flowType === "linkedin"
        ? liLoginHref
        : activePlatform === "facebook"
          ? fbLoginHref
          : igLoginHref;

  const activeConnectedPages = useMemo(() => {
    if (flowType === "youtube") {
      return connectedAccounts.youtube.map((c) => ({
        id: c.channelId || "",
        name: c.channelTitle || "Channel",
      }));
    }
    if (flowType === "linkedin") {
      return connectedAccounts.linkedin.map((p) => ({
        id: p.pageId || "",
        name: p.pageName || "LinkedIn",
      }));
    }
    if (activePlatform === "facebook") {
      return connectedAccounts.facebook.map((p) => ({
        id: p.pageId || "",
        name: p.pageName || "Connected",
      }));
    }
    return connectedAccounts.instagram.map((p) => ({
      id: p.igId || "",
      name: p.igUsername || p.igName || p.username || "Connected",
    }));
  }, [flowType, activePlatform, connectedAccounts]);

  const activeOauthError =
    flowType === "youtube"
      ? oauthFlash?.ytError
      : flowType === "linkedin"
        ? oauthFlash?.liError
        : activePlatform === "facebook"
          ? oauthFlash?.fbError
          : oauthFlash?.igError;

  const oauthErrorMessage =
    flowType === "youtube"
      ? platformErrorMessage(YOUTUBE_ERRORS, activeOauthError)
      : flowType === "linkedin"
        ? platformErrorMessage(LINKEDIN_ERRORS, activeOauthError)
        : platformErrorMessage(META_ERRORS, activeOauthError);

  const handleRedirectToWA = useCallback(() => {
    window.location.href = waReturnUrl;
  }, [waReturnUrl]);

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

  const type = typeRaw;

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
          "Your link must include a phone number, e.g. ?type=meta&phone=917740847114",
        userId: null,
      });
      return;
    }

    let cancelled = false;
    setResolveState({ loading: true, ok: false, error: "", userId: null });
    setConnectedAccounts({
      loading: false,
      facebook: [],
      instagram: [],
      youtube: [],
      linkedin: [],
      error: "",
    });

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

  useEffect(() => {
    if (type === "google" || !resolveState.ok || !resolveState.userId) return;

    let cancelled = false;
    setConnectedAccounts((prev) => ({ ...prev, loading: true, error: "" }));
    const uid = resolveState.userId;

    const load = async () => {
      try {
        if (flowType === "youtube") {
          const res = await fetch(
            `/api/youtube/channels?userId=${encodeURIComponent(uid)}&type=chatbot&phone=${encodeURIComponent(phone)}`,
            { cache: "no-store" }
          );
          const data = await res.json().catch(() => ({}));
          if (cancelled) return;
          setConnectedAccounts({
            loading: false,
            facebook: [],
            instagram: [],
            youtube: data.success && Array.isArray(data.channels) ? data.channels : [],
            linkedin: [],
            error: !data.success && data.message ? data.message : "",
          });
          return;
        }
        if (flowType === "linkedin") {
          const res = await fetch(
            `/api/linkedin/pages?userId=${encodeURIComponent(uid)}&type=chatbot&phone=${encodeURIComponent(phone)}`,
            { cache: "no-store" }
          );
          const data = await res.json().catch(() => ({}));
          if (cancelled) return;
          setConnectedAccounts({
            loading: false,
            facebook: [],
            instagram: [],
            youtube: [],
            linkedin: data.success && Array.isArray(data.pages) ? data.pages : [],
            error: data.error || (!data.success && data.message ? data.message : ""),
          });
          return;
        }

        const [fbRes, igRes] = await Promise.all([
          fetch(`/api/facebook/pages?userId=${encodeURIComponent(uid)}`, { cache: "no-store" }),
          fetch(`/api/instagram/pages?userId=${encodeURIComponent(uid)}`, { cache: "no-store" }),
        ]);
        const fbData = await fbRes.json().catch(() => ({}));
        const igData = await igRes.json().catch(() => ({}));
        if (cancelled) return;

        setConnectedAccounts({
          loading: false,
          facebook:  fbData.success && Array.isArray(fbData.pages)   ? fbData.pages   : [],
          instagram: igData.success && Array.isArray(igData.pages)   ? igData.pages   : [],
          youtube: [],
          linkedin: [],
          error:
            (!fbData.success && fbData.message  ? fbData.message  : "") ||
            (!igData.success && igData.message  ? igData.message  : ""),
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching connected accounts:", err);
          setConnectedAccounts({
            loading: false,
            facebook: [],
            instagram: [],
            youtube: [],
            linkedin: [],
            error: "Could not load connected pages. Please refresh after connecting.",
          });
        }
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [flowType, resolveState.ok, resolveState.userId, type]);

  useEffect(() => {
    const done = oauthFlash?.done;
    if (!done) return;
    if (flowType === "youtube" && done !== "youtube") return;
    if (flowType === "linkedin" && done !== "linkedin") return;
    if (flowType === "meta" && done !== activePlatform) return;
    if (connectedAccounts.loading) return;
    if (hasOpenedModal.current) return;
    hasOpenedModal.current = true;
    setShowModal(true);
  }, [flowType, activePlatform, oauthFlash, connectedAccounts.loading]);

  if (type === "google") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
      </div>
    );
  }

  const isSuccess =
    flowType === "youtube"
      ? oauthFlash?.done === "youtube"
      : flowType === "linkedin"
        ? oauthFlash?.done === "linkedin"
        : oauthFlash?.done === activePlatform;

  const isFetching = isSuccess && connectedAccounts.loading;

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
  const fullFacebookPageUrl  = `${baseUrl}/connect-business?type=meta&source=chatbot&platform=facebook&phone=${phone}`;
  const fullInstagramPageUrl = `${baseUrl}/connect-business?type=meta&source=chatbot&platform=instagram&phone=${phone}`;
  const waReturnEnc = encodeURIComponent(LIMBU_CHATBOT_WA_RETURN);
  const fullYoutubePageUrl   = `${baseUrl}/connect-business?type=youtube&phone=${phone}&wa_return=${waReturnEnc}`;
  const fullLinkedinPageUrl  = `${baseUrl}/connect-business?type=linkedin&phone=${phone}&wa_return=${waReturnEnc}`;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">

      {showModal && (
        <SuccessModal
          platform={activePlatform}
          pages={activeConnectedPages}
          onClose={() => setShowModal(false)}
          onRedirect={handleRedirectToWA}
        />
      )}

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

            {resolveState.loading && (
              <StatusBanner variant="info" icon={<Loader2 className="h-4 w-4 animate-spin" />} title="Resolving account…" />
            )}
            {!resolveState.loading && resolveState.error && (
              <StatusBanner variant="warning" icon={<AlertCircle className="h-4 w-4" />} title="Account not found" message={resolveState.error} />
            )}
            {activeOauthError && (
              <StatusBanner variant="error" icon={<AlertCircle className="h-4 w-4" />} title={cfg.oauthErrorTitle} message={oauthErrorMessage} />
            )}
            {isFetching && (
              <StatusBanner variant="info" icon={<Loader2 className="h-4 w-4 animate-spin" />} title={cfg.fetchingMessage} />
            )}

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

        {flowType === "youtube" && !!phone && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">YouTube URL</p>
            <p className="mt-0.5 break-all text-[10px] text-slate-500">{fullYoutubePageUrl}</p>
          </section>
        )}

        {flowType === "linkedin" && !!phone && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">LinkedIn URL</p>
            <p className="mt-0.5 break-all text-[10px] text-slate-500">{fullLinkedinPageUrl}</p>
          </section>
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
