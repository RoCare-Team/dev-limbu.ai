"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  AlertTriangle,
  Film,
  FileText,
  ScrollText,
  Eye,
} from "lucide-react";
import Toast from "@/components/Toast";
import { emitWalletDeduct } from "@/utils/walletEvents";
import { getLocalStorage } from "@/utils/storage";
import PostCard from "@/components/post-management/PostCard";
import UnlinkedVideoCard from "@/components/video-posting/UnlinkedVideoCard";
import { useVideoHistoryPosting } from "@/hooks/useVideoHistoryPosting";
import { VIDEO_DURATION_OPTIONS, coinsPerSecondFor } from "@/lib/videoPricing";

/* ----------------------------------------------------
   CONSTANTS
---------------------------------------------------- */
// Charged per second of video (300 coins / 10s). Lengths 10..60s, same list as the API route.
const COINS_PER_SECOND = coinsPerSecondFor("text_to_video");
const DURATION_OPTIONS = VIDEO_DURATION_OPTIONS;
const GENERATE_TIMEOUT_MS = 20 * 60 * 1000; // give up polling after 20 minutes
const POLL_INTERVAL_MS = 5000;

const VISUAL_STYLE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "cinematic", label: "Cinematic" },
  { value: "infographic", label: "Infographic" },
  { value: "hybrid", label: "Hybrid" },
];
// On-screen labels are only drawn on infographic scenes.
const LABEL_STYLES = ["infographic", "hybrid"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
   SKELETON CARD (loading state)
---------------------------------------------------- */
function VideoSkeletonCard({ elapsed, progressMessage }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative h-56 sm:h-64 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 animate-pulse flex items-center justify-center">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="relative flex flex-col items-center gap-2 text-slate-900/40">
          <Film className="w-8 h-8 animate-pulse text-[#EAB308]" />
          <span className="text-xs font-bold text-center px-4">{progressMessage || "Rendering video…"}</span>
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
// useSearchParams (inside the posting flow) must sit under a Suspense boundary in Next 16.
export default function VideoGenerationPage() {
  return (
    <Suspense fallback={null}>
      <VideoGenerationContent />
    </Suspense>
  );
}

function VideoGenerationContent() {
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
  const [duration, setDuration] = useState(DURATION_OPTIONS[0]);
  const generationCost = duration * COINS_PER_SECOND;
  const [visualStyle, setVisualStyle] = useState("auto");
  const [onScreenLabels, setOnScreenLabels] = useState("");
  const [captionsOn, setCaptionsOn] = useState(true);
  const [presenterLed, setPresenterLed] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [files, setFiles] = useState({ logo: null, character: null, background: null, product: null });

  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState(null);
  // Each row is a TextToVideo record carrying its linked Post as `post` (or null).
  const [history, setHistory] = useState([]);

  const elapsedTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Signature matches /post-management's fetchPosts(pageNum, isBackground) — the
  // posting flow calls it after every publish to refresh statuses.
  const fetchPosts = useCallback(async (_pageNum = 1, isBackground = false) => {
    const uid = getLocalStorage("userId");
    if (!uid) return;
    try {
      const res = await fetch(`/api/video-generation-history?userId=${uid}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setHistory(data.data || []);
    } catch (err) {
      if (!isBackground) console.error("Failed to load video history:", err);
    }
  }, []);

  const posting = useVideoHistoryPosting({
    userId,
    history,
    setHistory,
    fetchPosts,
    showToast,
    historyEndpoint: "/api/video-generation-history",
  });

  /* ---------------------------- INIT ---------------------------- */
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    setUserId(uid);

    fetch(`/api/users/userbalance?userId=${uid}`)
      .then((r) => r.json())
      .then((d) => setWalletBalance(d?.user?.wallet ?? d?.wallet ?? 0))
      .catch(() => setWalletBalance(0));

    fetchPosts(1, false);

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
  }, [fetchPosts]);

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

  const insufficientBalance = walletBalance !== null && walletBalance < generationCost;
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
      return showToast(`You need at least ${generationCost} coins to generate a video.`, "error");
    }

    setIsGenerating(true);
    setProgressMessage("Starting…");

    try {
      const form = new FormData();
      form.append("business_name", businessName.trim());
      form.append(inputMode, activeContent.trim());
      // Language only applies to plain-text generation — a script already carries its own language.
      if (inputMode === "text") form.append("language", language);
      // Returns a task_id straight away; the video is polled below.
      form.append("wait", "false");
      form.append("presenter_gender", presenterGender);
      form.append("duration", String(duration));
      form.append("captions", String(captionsOn));
      form.append("presenter_led", String(presenterLed));
      form.append("visual_style", visualStyle);
      if (LABEL_STYLES.includes(visualStyle) && onScreenLabels.trim()) {
        form.append("on_screen_labels", onScreenLabels.trim());
      }
      if (keywords.trim()) form.append("keywords", keywords.trim());
      Object.entries(files).forEach(([key, file]) => {
        if (file) form.append(key, file);
      });

      const res = await fetch("/api/video-generation", {
        method: "POST",
        body: form,
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) {
        throw new Error(result.error || result.message || "Video generation failed.");
      }

      const d = result.data || {};
      const taskId = d.task_id || null;
      if (!taskId) throw new Error("Video generation did not start. Please try again.");

      // Poll until the reel is ready. Script + captions come from the start response;
      // the task status only carries progress and the final video_url.
      let videoUrl = d.video_url || null;
      const deadline = Date.now() + GENERATE_TIMEOUT_MS;
      while (!videoUrl) {
        if (Date.now() > deadline) throw new Error("Video generation timed out. Please try again.");
        await sleep(POLL_INTERVAL_MS);

        const pollRes = await fetch(`/api/video-generation/task/${encodeURIComponent(taskId)}`, {
          cache: "no-store",
        });
        const poll = await pollRes.json().catch(() => ({}));
        // A failed poll (network blip, 5xx) is retried on the next tick.
        if (!pollRes.ok || !poll.success) continue;

        const task = poll.data || {};
        if (task.progress_message) setProgressMessage(task.progress_message);
        if (task.status === "failed") throw new Error(task.error || "Video generation failed.");
        if (task.status === "success") {
          videoUrl = task.video_url;
          if (!videoUrl) throw new Error("Video generated but no video URL was returned.");
        }
      }

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
          durationSeconds: duration,
          taskId,
          finalScript,
          captions,
          cost: generationCost,
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
            durationSeconds: duration,
            taskId,
            finalScript,
            captions,
          },
          ...prev,
        ]);
        showToast("Video created, but saving to your history failed.", "warning");
      }
      showToast("🎬 Video ready — Approve karke post karein!", "success");

      // Deduct coins after a successful generation
      try {
        const walletData = await deductFromWalletAction(userId, {
          amount: generationCost,
          type: "deduct",
          reason: "video_generated_texttovideo",
          metadata: { businessName: businessName.trim(), inputMode, language, videoUrl },
        });
        const newBalance =
          walletData?.wallet ?? walletData?.data?.wallet ?? walletData?.user?.wallet;
        setWalletBalance(
          typeof newBalance === "number" ? newBalance : (b) => Math.max(0, (b ?? 0) - generationCost)
        );
        if (typeof newBalance !== "number") {
          setWalletBalance((b) => Math.max(0, (b ?? generationCost) - generationCost));
        }
        emitWalletDeduct(generationCost);
        showToast(`${generationCost} coins deducted 💰`, "info");
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
      showToast(err.message || "Failed to generate video.", "error");
    } finally {
      setIsGenerating(false);
      setProgressMessage("");
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

  // A video with a Post gets the full /post-management card (Approve → all posting
  // buttons); one without gets a card that can create its Post.
  const renderVideo = (item) =>
    item.post ? (
      <PostCard post={item.post} {...posting.cardProps} />
    ) : (
      <UnlinkedVideoCard
        item={item}
        title={item.businessName}
        onDownload={handleDownload}
        onShare={handleShare}
        onApprove={posting.approveUnlinked}
        onReject={posting.rejectUnlinked}
        busy={posting.enablingId === item._id}
      />
    );

  return (
    <div className="font-inter">
      {toast && <Toast message={toast.message} type={toast.type} />}
      {posting.modals}

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
          <span className="text-xs font-bold text-slate-900/70">Cost ({duration}s video)</span>
          <span className="text-sm font-black text-[#EAB308]">{generationCost} coins</span>
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

            {/* Video duration */}
            <div className="space-y-1.5">
              <label htmlFor="ttv-duration" className="text-xs font-semibold text-slate-900/90">
                Duration
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  id="ttv-duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full max-w-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {DURATION_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec} sec — {sec * COINS_PER_SECOND} coins
                    </option>
                  ))}
                </select>
                <span className="text-xs font-semibold text-slate-900/50">
                  {COINS_PER_SECOND} coins / sec
                </span>
              </div>
            </div>

            {/* Visual style */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900/90">Visual Style</label>
              <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-100">
                {VISUAL_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setVisualStyle(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all disabled:cursor-not-allowed ${
                      visualStyle === opt.value
                        ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                        : "text-slate-900/50 hover:text-slate-900/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* On-screen labels — only drawn on infographic scenes */}
            {LABEL_STYLES.includes(visualStyle) && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90">
                  On-screen Labels <span className="text-slate-900/30 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={onScreenLabels}
                  onChange={(e) => setOnScreenLabels(e.target.value)}
                  disabled={isGenerating}
                  placeholder="RO Service|Home Visit|Call Now"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                />
                <p className="text-[11px] text-slate-900/40">
                  Up to 3 headings separated by &quot;|&quot;, max 6 words each. Shown on screen, never spoken.
                </p>
              </div>
            )}

            {/* Captions + presenter-led */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-900/90 cursor-pointer">
                <input
                  type="checkbox"
                  checked={captionsOn}
                  onChange={(e) => setCaptionsOn(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 accent-[#EAB308]"
                />
                Captions on video
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-900/90 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presenterLed}
                  onChange={(e) => setPresenterLed(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 accent-[#EAB308]"
                />
                Presenter-led (talking to camera)
              </label>
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
                  You need {generationCost} coins to generate a video. Current balance:{" "}
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
                  Generate Video — {generationCost} coins
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
              <VideoSkeletonCard elapsed={elapsed} progressMessage={progressMessage} />
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
              renderVideo(history[0])
            )}
          </div>
        </div>

        {/* Rest of the history — below, full width */}
        {history.length > 1 && (
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 px-1">
              Earlier Videos — Approve &amp; Post
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.slice(1).map((item) => (
                <div key={item._id || item.id}>{renderVideo(item)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
