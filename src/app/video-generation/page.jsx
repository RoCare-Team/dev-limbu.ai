"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Clapperboard,
  Coins,
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  User as UserIcon,
  Building2,
  Package,
  Download,
  Share2,
  AlertTriangle,
  Globe2,
  Film,
  FileText,
  ScrollText,
  Eye,
  Copy,
  Instagram,
  Facebook,
  Linkedin,
  Pin,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import Toast from "@/components/Toast";
import { emitWalletDeduct } from "@/utils/walletEvents";
import FacebookShareModal from "@/components/post-management/FacebookShareModal";
import InstagramShareModal from "@/components/post-management/InstagramShareModal";

/* ----------------------------------------------------
   CONSTANTS
---------------------------------------------------- */
const GENERATION_COST = 300;
const GENERATE_TIMEOUT_MS = 14.5 * 60 * 1000; // 14.5 minutes — server allows up to 15

const UPLOAD_FIELDS = [
  { key: "logo", label: "Logo", icon: ImageIcon },
  { key: "character", label: "Character", icon: UserIcon },
  { key: "background", label: "Background", icon: Building2 },
  { key: "product", label: "Product", icon: Package },
];

const MAX_FILE_MB = 10;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/* ----------------------------------------------------
   WALLET DEDUCTION ACTION (mirrors /video-management pattern)
---------------------------------------------------- */
async function deductFromWalletAction(userId, payload) {
  const res = await fetch(`/api/auth/signup?userId=${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to deduct from wallet");
  }
  return data;
}

/* ----------------------------------------------------
   FILE UPLOAD TILE — matches the "Your Brand Assets" tiles in PostInput
---------------------------------------------------- */
function UploadTile({ field, file, onChange, onRemove, disabled, showToast }) {
  const Icon = field.icon;
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after an error
    if (!f) return;

    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
      showToast?.(
        `${field.label}: unsupported file format "${f.type || f.name.split(".").pop()}" — upload a PNG, JPG or WEBP image.`,
        "error"
      );
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      showToast?.(`${field.label}: file is too large — must be under ${MAX_FILE_MB}MB.`, "error");
      return;
    }
    onChange(f);
  };

  return (
    <div className="border border-slate-200 rounded-lg flex flex-col bg-white overflow-hidden">
      <div className="px-2 py-1.5 bg-slate-50 border-b border-slate-100">
        <span className="text-[10px] font-bold text-slate-900/70 uppercase tracking-wider truncate">
          {field.label}
        </span>
      </div>
      <div className="p-1.5">
        {!file ? (
          <label
            className={`flex flex-col items-center justify-center w-full h-20 rounded-md transition ${
              disabled
                ? "opacity-50 cursor-not-allowed bg-slate-50"
                : "bg-slate-50 hover:bg-[#EAB308]/5 cursor-pointer group"
            }`}
          >
            <Icon className="w-4 h-4 text-slate-900/30 mb-0.5 group-hover:text-[#EAB308] transition-colors" />
            <span className="text-[8px] text-slate-900/40 font-bold uppercase tracking-widest">
              Upload
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={disabled}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative w-full h-20 bg-slate-50 rounded-md overflow-hidden border border-slate-100 group">
            <img src={previewUrl} alt={field.label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center disabled:opacity-0"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   LANGUAGE PICKER
---------------------------------------------------- */
function LanguagePicker({ value, onChange, disabled, groups }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-900/40">
            {group.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.languages.map((lang) => {
              const active = value === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(lang)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    active
                      ? "bg-[#EAB308] border-[#EAB308] text-black shadow-[0_0_10px_rgba(253,224,71,0.3)]"
                      : "bg-white border-slate-200 text-slate-700 hover:border-[#EAB308]/50 hover:bg-[#EAB308]/10"
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------
   VIDEO CARD (result / history)
---------------------------------------------------- */
const CAPTION_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "pinterest", label: "Pinterest", icon: Pin },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
];

/* ----------------------------------------------------
   CAPTION TABS — ready-to-post caption per platform, with copy
---------------------------------------------------- */
function CaptionTabs({ captions, showToast, onUpdateCaption }) {
  const available = CAPTION_PLATFORMS.filter((p) => captions?.[p.key]?.caption);
  const [active, setActive] = useState(available[0]?.key || null);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [available.length]);

  useEffect(() => {
    setExpanded(false);
    setIsEditing(false);
  }, [active]);

  if (available.length === 0) return null;

  const activePlatform = captions[active];

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 120, behavior: "smooth" });
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(activePlatform.caption);
      showToast?.("Caption copied 📋", "info");
    } catch {
      showToast?.("Could not copy caption.", "error");
    }
  };

  const startEditing = () => {
    setDraft(activePlatform.caption || "");
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const saveEditing = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === activePlatform.caption) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdateCaption?.(active, trimmed);
      showToast?.("Caption updated ✅", "success");
      setIsEditing(false);
    } catch (err) {
      showToast?.(err.message || "Could not update caption.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-slate-100 pt-3 space-y-2">
      <div className="relative flex items-center gap-1">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll platforms left"
            className="shrink-0 p-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-[#EAB308] hover:border-[#EAB308]/50 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="relative min-w-0 flex-1">
          <div
            ref={scrollRef}
            className="captiontabs-scroll flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-50 rounded-xl border border-slate-100"
          >
            {available.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setActive(p.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                    active === p.key
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active === p.key ? "text-[#EAB308]" : ""}`} />
                  {p.label}
                </button>
              );
            })}
          </div>
          {/* Fade hints at whichever edge still has more to scroll to */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-slate-50 to-transparent rounded-l-xl" />
          )}
          {canScrollRight && (
            <div className="pointer-events-none absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-slate-50 to-transparent rounded-r-xl" />
          )}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll platforms right"
            className="shrink-0 p-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-[#EAB308] hover:border-[#EAB308]/50 transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <style>{`
        .captiontabs-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .captiontabs-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      {activePlatform && (
        <div className="relative bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          {activePlatform.title && !isEditing && (
            <p className="text-xs font-bold text-slate-900 mb-1 pr-14">{activePlatform.title}</p>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                autoFocus
                disabled={saving}
                className="w-full p-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 resize-none focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none disabled:opacity-60"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditing}
                  disabled={saving}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EAB308] text-black hover:bg-[#EAB308]/90 transition disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`text-xs text-slate-600 whitespace-pre-line pr-14 ${expanded ? "" : "line-clamp-4"}`}>
                {activePlatform.caption}
              </p>
              {activePlatform.caption?.length > 160 && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="mt-1 text-[10px] font-black text-[#EAB308] uppercase tracking-widest hover:underline"
                >
                  {expanded ? "Show Less" : "Read More"}
                </button>
              )}

              <div className="absolute top-2 right-2 flex items-center gap-1">
                {onUpdateCaption && (
                  <button
                    type="button"
                    onClick={startEditing}
                    title="Edit caption"
                    className="p-1 rounded-md text-slate-400 hover:text-[#EAB308] hover:bg-[#EAB308]/10 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyCaption}
                  title="Copy caption"
                  className="p-1 rounded-md text-slate-400 hover:text-[#EAB308] hover:bg-[#EAB308]/10 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   VIDEO CARD — post-management style: status/date badges, floating
   download/share icons, and separate Facebook / Instagram publish buttons
   that each open their own share modal.
---------------------------------------------------- */
function VideoResultCard({ item, onDownload, onShare, showToast, connections, onOpenFacebook, onOpenInstagram, publishing, onUpdateCaption }) {
  const fbConnected = connections.facebook?.length > 0;
  const igConnected = connections.instagram?.length > 0;
  const fbDone = item.published?.facebook?.posted;
  const igDone = item.published?.instagram?.posted;
  const createdLabel = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : "";

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Media — capped height so tall/vertical (9:16) generations don't blow up the card */}
      <div className="relative h-56 sm:h-64 bg-black group">
        <video src={item.videoUrl} className="w-full h-full object-contain bg-black" controls />

        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <div
            className={`px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 shadow-sm ${
              fbDone || igDone
                ? "bg-green-50/95 text-green-600 border-green-100"
                : "bg-white/90 text-slate-500 border-white/70"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${fbDone || igDone ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">
              {fbDone || igDone ? "Published" : "Ready"}
            </span>
          </div>
          {createdLabel && (
            <div className="px-2.5 py-1 rounded-full border border-white/70 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
              {createdLabel}
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-2 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => onDownload(item.videoUrl)}
            title="Download"
            className="p-2.5 bg-white/90 backdrop-blur text-black rounded-xl shadow-lg hover:bg-[#EAB308] transition-all"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => onShare(item.videoUrl)}
            title="Share"
            className="p-2.5 bg-white/90 backdrop-blur text-black rounded-xl shadow-lg hover:bg-[#EAB308] transition-all"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-slate-900 text-sm truncate">{item.businessName}</h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          {item.language && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 px-2 py-0.5 rounded-full">
              <Globe2 className="w-3 h-3" /> {item.language}
            </span>
          )}
          {item.inputMode === "script" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
              <ScrollText className="w-3 h-3" /> Script
            </span>
          )}
          {item.presenterGender && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full capitalize">
              <UserIcon className="w-3 h-3" /> {item.presenterGender}
            </span>
          )}
        </div>

        <CaptionTabs
          captions={item.captions}
          showToast={showToast}
          onUpdateCaption={
            onUpdateCaption ? (platform, caption) => onUpdateCaption(item, platform, caption) : undefined
          }
        />

        {/* Publish — separate Facebook and Instagram buttons, each opening its own share modal */}
        <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!fbConnected || publishing?.facebook}
            title={fbConnected ? "Share to Facebook" : "Connect a Facebook page first"}
            onClick={() => onOpenFacebook(item)}
            className="py-3 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            {publishing?.facebook ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <img src="/social-icon/facebook-icon.png" alt="Facebook" className="w-3.5 h-3.5 object-contain" />
            )}
            {fbDone && <CheckCircle2 size={11} className="text-green-600" />}
            {fbDone ? "Repost to FB" : "Post to FB Pages"}
          </button>
          <button
            type="button"
            disabled={!igConnected || publishing?.instagram}
            title={igConnected ? "Share to Instagram" : "Connect an Instagram account first"}
            onClick={() => onOpenInstagram(item)}
            className="py-3 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            {publishing?.instagram ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <img src="/social-icon/instagram-icon.png" alt="Instagram" className="w-3.5 h-3.5 object-contain" />
            )}
            {igDone && <CheckCircle2 size={11} className="text-green-600" />}
            {igDone ? "Repost to IG" : "Post to Instagram"}
          </button>
        </div>
        {!fbConnected && !igConnected && (
          <p className="text-[10px] text-slate-400 text-center -mt-1">
            Connect your Facebook / Instagram business account to publish directly.
          </p>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   SKELETON CARD (loading state)
---------------------------------------------------- */
function VideoSkeletonCard({ elapsed }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative h-56 sm:h-64 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 animate-pulse flex items-center justify-center">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="relative flex flex-col items-center gap-2 text-slate-900/40">
          <Film className="w-8 h-8 animate-pulse text-[#EAB308]" />
          <span className="text-xs font-bold">Rendering video…</span>
          <span className="text-[11px] tabular-nums font-mono bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/30 px-2.5 py-0.5 rounded-full">
            {elapsed}s elapsed
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse" />
        <div className="flex gap-2 pt-2">
          <div className="h-7 flex-1 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-7 flex-1 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </div>
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

/* ----------------------------------------------------
   MAIN PAGE
---------------------------------------------------- */
export default function VideoGenerationPage() {
  const [userId, setUserId] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  const [businessName, setBusinessName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [language, setLanguage] = useState("Hinglish");
  const [languageGroups, setLanguageGroups] = useState([]);
  const [inputMode, setInputMode] = useState("text"); // "text" | "script" — mutually exclusive
  const [text, setText] = useState("");
  const [script, setScript] = useState("");
  const [presenterGender, setPresenterGender] = useState("male");
  const [files, setFiles] = useState({ logo: null, character: null, background: null, product: null });

  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);

  // Connected Facebook pages / Instagram accounts — same source as post-management's publish flow
  const [fbPages, setFbPages] = useState([]);
  const [igAccounts, setIgAccounts] = useState([]);

  const elapsedTimerRef = useRef(null);

  /* ---------------------------- INIT ---------------------------- */
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    setUserId(uid);

    fetch(`/api/users/userbalance?userId=${uid}`)
      .then((r) => r.json())
      .then((d) => setWalletBalance(d?.user?.wallet ?? d?.wallet ?? 0))
      .catch(() => setWalletBalance(0));

    fetch(`/api/facebook/pages?userId=${uid}`)
      .then((r) => r.json())
      .then((d) => setFbPages(d.success ? d.pages || [] : []))
      .catch(() => setFbPages([]));

    fetch(`/api/instagram/pages?userId=${uid}`)
      .then((r) => r.json())
      .then((d) => setIgAccounts(d.success ? d.pages || [] : []))
      .catch(() => setIgAccounts([]));

    fetchHistory(uid);

    // Language options now come from a dynamic API instead of being hardcoded.
    fetch("/api/video-generation/languages")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLanguageGroups(d.data.groups || []);
          if (d.data.default) setLanguage(d.data.default);
        }
      })
      .catch(() => setLanguageGroups([]));
  }, []);

  const fetchHistory = async (uid) => {
    try {
      const res = await fetch(`/api/video-generation-history?userId=${uid}`);
      const data = await res.json();
      if (data.success) setHistory(data.data || []);
    } catch (err) {
      console.error("Failed to load video history:", err);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Persists the generation to MongoDB (TextToVideo model) so it survives across devices.
  const saveHistoryRecord = async (payload) => {
    const res = await fetch("/api/video-generation-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to save video record");
    }
    return data.data;
  };

  /* ---------------------------- ELAPSED TIMER ---------------------------- */
  useEffect(() => {
    if (isGenerating) {
      setElapsed(0);
      elapsedTimerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }
    return () => elapsedTimerRef.current && clearInterval(elapsedTimerRef.current);
  }, [isGenerating]);

  const setFile = (key, file) => setFiles((prev) => ({ ...prev, [key]: file }));
  const removeFile = (key) => setFiles((prev) => ({ ...prev, [key]: null }));

  const insufficientBalance = walletBalance !== null && walletBalance < GENERATION_COST;
  const activeContent = inputMode === "script" ? script : text;
  const canSubmit =
    !isGenerating &&
    businessName.trim() &&
    activeContent.trim() &&
    userId &&
    !insufficientBalance;

  const switchMode = (mode) => {
    if (isGenerating || mode === inputMode) return;
    setInputMode(mode);
  };

  /* ---------------------------- GENERATE ---------------------------- */
  const handleGenerate = async () => {
    if (!userId) return showToast("Please log in to generate videos.", "error");
    if (!businessName.trim()) return showToast("Business name is required.", "error");
    if (!activeContent.trim()) {
      return showToast(
        inputMode === "script" ? "Please enter your script." : "Please enter the video offer text.",
        "error"
      );
    }
    if (insufficientBalance) {
      return showToast(`You need at least ${GENERATION_COST} coins to generate a video.`, "error");
    }

    setIsGenerating(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const form = new FormData();
      form.append("business_name", businessName.trim());
      form.append(inputMode, activeContent.trim());
      // Language only applies to plain-text generation — a script already carries its own language.
      if (inputMode === "text") form.append("language", language);
      form.append("wait", "true");
      form.append("presenter_gender", presenterGender);
      if (keywords.trim()) form.append("keywords", keywords.trim());
      Object.entries(files).forEach(([key, file]) => {
        if (file) form.append(key, file);
      });

      const res = await fetch("/api/video-generation", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) {
        throw new Error(result.error || result.message || "Video generation failed.");
      }

      const d = result.data || {};
      const videoUrl =
        d.video_url || d.videoUrl || d.output || d.url || d.secure_url || d.playback_url || null;

      if (!videoUrl) {
        throw new Error("Video generated but no video URL was returned.");
      }

      const taskId = d.task_id || null;
      const finalScript = d.final_script || null;
      const captions = d.captions || null; // { instagram, facebook, pinterest, linkedin }

      // Persist to MongoDB (TextToVideo collection) so it's available on any device.
      try {
        const savedRecord = await saveHistoryRecord({
          userId,
          videoUrl,
          businessName: businessName.trim(),
          inputMode,
          content: activeContent.trim(),
          language: inputMode === "text" ? language : null,
          keywords: keywords.trim(),
          presenterGender,
          taskId,
          finalScript,
          captions,
          cost: GENERATION_COST,
        });
        setHistory((prev) => [savedRecord, ...prev]);
      } catch (saveErr) {
        console.error(saveErr);
        // Still show the video even if the DB write failed, just not persisted.
        setHistory((prev) => [
          {
            _id: `local-${Date.now()}`,
            videoUrl,
            businessName: businessName.trim(),
            inputMode,
            content: activeContent.trim(),
            language: inputMode === "text" ? language : null,
            presenterGender,
            taskId,
            finalScript,
            captions,
          },
          ...prev,
        ]);
        showToast("Video created, but saving to your history failed.", "warning");
      }
      showToast("🎬 Video generated successfully!", "success");

      // Deduct coins after a successful generation
      try {
        const walletData = await deductFromWalletAction(userId, {
          amount: GENERATION_COST,
          type: "deduct",
          reason: "video_generated_texttovideo",
          metadata: { businessName: businessName.trim(), inputMode, language, videoUrl },
        });
        const newBalance =
          walletData?.wallet ?? walletData?.data?.wallet ?? walletData?.user?.wallet;
        setWalletBalance(
          typeof newBalance === "number" ? newBalance : (b) => Math.max(0, (b ?? 0) - GENERATION_COST)
        );
        if (typeof newBalance !== "number") {
          setWalletBalance((b) => Math.max(0, (b ?? GENERATION_COST) - GENERATION_COST));
        }
        emitWalletDeduct(GENERATION_COST);
        showToast(`${GENERATION_COST} coins deducted 💰`, "info");
      } catch (walletErr) {
        console.error(walletErr);
        showToast("Video created, but coin deduction failed. Please contact support.", "warning");
      }

      // Reset form (keep mode + language selection)
      setText("");
      setScript("");
      setKeywords("");
      setFiles({ logo: null, character: null, background: null, product: null });
    } catch (err) {
      console.error(err);
      if (err.name === "AbortError") {
        showToast("Video generation timed out. Please try again.", "error");
      } else {
        showToast(err.message || "Failed to generate video.", "error");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  /* ---------------------------- DOWNLOAD / SHARE ---------------------------- */
  const handleDownload = async (url) => {
    try {
      const filename = `limbu-ai-video-${Date.now()}.mp4`;
      // Fetch through our own backend, not the S3 URL directly — S3 doesn't allow
      // cross-origin blob reads from the browser, which silently killed the download before.
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Download failed (${res.status}).`);
      }
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(objUrl), 200);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Download failed.", "error");
    }
  };

  const handleShare = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "AI Generated Video", url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard 📋", "info");
    } catch {
      showToast("Could not copy link.", "error");
    }
  };

  /* ---------------------------- PUBLISH TO FACEBOOK / INSTAGRAM ---------------------------- */
  // Same publish flow/API routes as post-management, each platform has its own share modal.
  const [publishingMap, setPublishingMap] = useState({}); // { [itemId]: { facebook: bool, instagram: bool } }
  const [fbModal, setFbModal] = useState({ open: false, item: null });
  const [igModal, setIgModal] = useState({ open: false, item: null });

  const setItemPublishing = (itemId, platform, value) => {
    setPublishingMap((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [platform]: value },
    }));
  };

  const persistPublishStatus = async (itemId, platform, posted, postId, error) => {
    try {
      await fetch("/api/video-generation-history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, userId, platform, posted, postId, error }),
      });
    } catch (err) {
      console.error("Failed to persist publish status:", err);
    }
  };

  const markPublishResult = async (itemId, platform, posted, postId, error) => {
    setHistory((prev) =>
      prev.map((v) =>
        v._id === itemId
          ? { ...v, published: { ...v.published, [platform]: { posted, postId, error } } }
          : v
      )
    );
    await persistPublishStatus(itemId, platform, posted, postId, error);
  };

  const openFacebookModal = (item) => setFbModal({ open: true, item });
  const openInstagramModal = (item) => setIgModal({ open: true, item });

  // Lets the user tweak a generated caption before posting it — saved back to MongoDB.
  const handleUpdateCaption = async (item, platform, caption) => {
    const res = await fetch("/api/video-generation-history", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item._id, userId, platform, caption }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to update caption");
    }
    setHistory((prev) =>
      prev.map((v) =>
        v._id === item._id
          ? { ...v, captions: { ...v.captions, [platform]: { ...v.captions?.[platform], caption } } }
          : v
      )
    );
  };

  // FacebookShareModal calls onConfirm(post, selectedPages, caption)
  const confirmFacebookPublish = async (_post, selectedPages, caption) => {
    const item = fbModal.item;
    if (!item) return;
    setFbModal({ open: false, item: null });
    setItemPublishing(item._id, "facebook", true);
    try {
      const res = await fetch("/api/facebook/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: { _id: item._id, aiOutput: item.videoUrl },
          pageData: selectedPages,
          caption,
          media: { type: "video", url: item.videoUrl },
          userId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to publish to Facebook");
      await markPublishResult(item._id, "facebook", true, data.id || "", "");
      showToast("Published to Facebook 🎉", "success");
    } catch (err) {
      console.error(err);
      await markPublishResult(item._id, "facebook", false, "", err.message);
      showToast(err.message || "Failed to publish to Facebook", "error");
    } finally {
      setItemPublishing(item._id, "facebook", false);
    }
  };

  // InstagramShareModal calls onConfirm(post, selectedAccounts, caption, igVideoKind)
  const confirmInstagramPublish = async (_post, selectedAccounts, caption, igVideoKind) => {
    const item = igModal.item;
    if (!item) return;
    setIgModal({ open: false, item: null });
    setItemPublishing(item._id, "instagram", true);
    try {
      const res = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: { _id: item._id, aiOutput: item.videoUrl },
          accountData: selectedAccounts,
          caption,
          media: { type: "video", url: item.videoUrl },
          userId,
          instagramVideoMediaType: igVideoKind || "REELS",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to publish to Instagram");
      await markPublishResult(item._id, "instagram", true, data.id || "", "");
      showToast("Published to Instagram 🎉", "success");
    } catch (err) {
      console.error(err);
      await markPublishResult(item._id, "instagram", false, "", err.message);
      showToast(err.message || "Failed to publish to Instagram", "error");
    } finally {
      setItemPublishing(item._id, "instagram", false);
    }
  };

  const connections = { facebook: fbPages, instagram: igAccounts };

  // Lightweight "post" objects the share modals use for prefill captions
  const fbModalPost = fbModal.item
    ? {
        _id: fbModal.item._id,
        fbDescription: fbModal.item.captions?.facebook?.caption || fbModal.item.finalScript || fbModal.item.content,
      }
    : null;
  const igModalPost = igModal.item
    ? {
        _id: igModal.item._id,
        igDescription: igModal.item.captions?.instagram?.caption || igModal.item.finalScript || igModal.item.content,
      }
    : null;

  return (
    <div className="font-inter">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header — matches the "POST MANAGEMENT" page-title bar pattern */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAB308] flex items-center justify-center shadow-[0_0_15px_rgba(253,224,71,0.3)] shrink-0">
            <Clapperboard className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Text To <span className="text-[#EAB308]">Video</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Turn an offer or script into a ready-to-post video
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-3">
          <Coins className="w-4 h-4 text-[#EAB308]" />
          <span className="text-xs font-bold text-slate-900/70">Cost per video</span>
          <span className="text-sm font-black text-[#EAB308]">{GENERATION_COST} coins</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-5 text-slate-900">
            {/* Business + Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={isGenerating}
                  placeholder="e.g., Sharma Electronics"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90">Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={isGenerating}
                  placeholder="mobile repair, fast service"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Mode toggle: Text vs Script — mutually exclusive */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900/90">Content Type</label>
              <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-100">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => switchMode("text")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all disabled:cursor-not-allowed ${
                    inputMode === "text"
                      ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                      : "text-slate-900/50 hover:text-slate-900/80"
                  }`}
                >
                  <FileText className="w-4 h-4" /> Text
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => switchMode("script")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all disabled:cursor-not-allowed ${
                    inputMode === "script"
                      ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                      : "text-slate-900/50 hover:text-slate-900/80"
                  }`}
                >
                  <ScrollText className="w-4 h-4" /> Script
                </button>
              </div>
            </div>

            {/* Offer text (only in Text mode) */}
            {inputMode === "text" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                  Offer Text *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Diwali offer on all smartphones, 10% off, home delivery"
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 resize-none focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all placeholder:text-slate-900/30 disabled:opacity-60"
                />
                <p className="text-[11px] text-slate-900/40">
                  We'll write the script for you and voice it in the language you pick below.
                </p>
              </div>
            )}

            {/* Script (only in Script mode) */}
            {inputMode === "script" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90 flex items-center gap-2">
                  <ScrollText className="w-3.5 h-3.5 text-[#EAB308]" />
                  Your Script *
                </label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Write the exact script / voiceover lines you want in the video…"
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 resize-none focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all placeholder:text-slate-900/30 disabled:opacity-60"
                />
                <p className="text-[11px] text-slate-900/40">
                  Your script is used as-is — it already carries its own language, so language selection isn't needed.
                </p>
              </div>
            )}

            {/* Language — only relevant for Text mode; a custom script already fixes its own language */}
            {inputMode === "text" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900/90">Language</label>
                  <span className="text-[10px] font-black text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {language}
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto pr-1 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                  {languageGroups.length > 0 ? (
                    <LanguagePicker
                      value={language}
                      onChange={setLanguage}
                      disabled={isGenerating}
                      groups={languageGroups}
                    />
                  ) : (
                    <p className="text-xs text-slate-900/40 text-center py-4">Loading languages…</p>
                  )}
                </div>
              </div>
            )}

            {/* Presenter gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900/90">Presenter Gender</label>
              <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-100 max-w-xs">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setPresenterGender("male")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all disabled:cursor-not-allowed ${
                    presenterGender === "male"
                      ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                      : "text-slate-900/50 hover:text-slate-900/80"
                  }`}
                >
                  <UserIcon className="w-4 h-4" /> Male
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setPresenterGender("female")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all disabled:cursor-not-allowed ${
                    presenterGender === "female"
                      ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                      : "text-slate-900/50 hover:text-slate-900/80"
                  }`}
                >
                  <UserIcon className="w-4 h-4" /> Female
                </button>
              </div>
            </div>

            {/* Media uploads */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-900/90">
                Media Assets <span className="text-slate-900/30 font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {UPLOAD_FIELDS.map((field) => (
                  <UploadTile
                    key={field.key}
                    field={field}
                    file={files[field.key]}
                    disabled={isGenerating}
                    onChange={(f) => setFile(field.key, f)}
                    onRemove={() => removeFile(field.key)}
                    showToast={showToast}
                  />
                ))}
              </div>
            </div>

            {insufficientBalance && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  You need {GENERATION_COST} coins to generate a video. Current balance:{" "}
                  {walletBalance ?? 0}.{" "}
                  <Link href="/wallet" className="font-bold underline underline-offset-2">
                    Recharge wallet
                  </Link>
                </span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-3 bg-[#EAB308] text-black px-6 py-4 rounded-xl hover:shadow-[0_0_25px_rgba(253,224,71,0.4)] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100 font-black text-sm uppercase tracking-widest"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating… {elapsed}s
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Video — {GENERATION_COST} coins
                </>
              )}
            </button>
            {isGenerating && (
              <p className="text-center text-[11px] text-slate-900/40">
                This can take a few minutes — feel free to wait, we'll keep this tab updated.
              </p>
            )}
          </div>
        </div>

        {/* Latest video — pinned on the side */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 px-1">
              Latest Video
            </h2>
            {isGenerating ? (
              <VideoSkeletonCard elapsed={elapsed} />
            ) : history.length === 0 ? (
              <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-white min-h-[280px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <Eye className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-medium text-base text-slate-900/60">
                  Your AI-generated video will appear here
                </p>
                <p className="text-xs text-slate-900/30 mt-1">Fill the form and click Generate to start</p>
              </div>
            ) : (
              <VideoResultCard
                item={history[0]}
                onDownload={handleDownload}
                onShare={handleShare}
                showToast={showToast}
                connections={connections}
                onOpenFacebook={openFacebookModal}
                onOpenInstagram={openInstagramModal}
                publishing={publishingMap[history[0]._id]}
                onUpdateCaption={handleUpdateCaption}
              />
            )}
          </div>
        </div>

        {/* Rest of the history — below, full width */}
        {history.length > 1 && (
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 px-1">
              Earlier Videos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(1).map((item) => (
                <VideoResultCard
                  key={item._id || item.id}
                  item={item}
                  onDownload={handleDownload}
                  onShare={handleShare}
                  showToast={showToast}
                  connections={connections}
                  onOpenFacebook={openFacebookModal}
                  onOpenInstagram={openInstagramModal}
                  publishing={publishingMap[item._id]}
                  onUpdateCaption={handleUpdateCaption}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <FacebookShareModal
        isOpen={fbModal.open}
        onClose={() => setFbModal({ open: false, item: null })}
        onConfirm={confirmFacebookPublish}
        post={fbModalPost}
        pages={fbPages}
        loading={false}
      />

      <InstagramShareModal
        isOpen={igModal.open}
        onClose={() => setIgModal({ open: false, item: null })}
        onConfirm={confirmInstagramPublish}
        post={igModalPost}
        accounts={igAccounts}
        selectedMedia={igModal.item ? { type: "video", url: igModal.item.videoUrl } : null}
        loading={false}
      />
    </div>
  );
}
