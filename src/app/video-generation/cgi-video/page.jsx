"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clapperboard,
  Coins,
  Sparkles,
  X,
  Wand2,
  Loader2,
  ImageIcon,
  ImagePlus,
  Check,
  Eye,
  Music2,
  Package,
  Plus,
  Building2,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";
import Toast from "@/components/Toast";
import { useKeywordPlanner } from "@/hooks/useKeywordPlanner";
import { emitWalletDeduct } from "@/utils/walletEvents";
import { getLocalStorage } from "@/utils/storage";
import PostCard from "@/components/post-management/PostCard";
import UnlinkedVideoCard from "@/components/video-posting/UnlinkedVideoCard";
import { useVideoHistoryPosting } from "@/hooks/useVideoHistoryPosting";

/* ----------------------------------------------------
   CONSTANTS
---------------------------------------------------- */
const GENERATION_COST = 300; // flat — every CGI ad is a fixed 10-second 9:16 video
const POLL_INTERVAL_MS = 6000;
const POLL_TIMEOUT_MS = 12 * 60 * 1000;
const MAX_POLL_ERRORS = 5; // consecutive network/5xx failures before giving up
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
// The in-flight job is kept in localStorage so a reload resumes polling instead
// of losing a video the user is about to pay for.
const PENDING_JOB_KEY = "cgiVideoPendingJob";

const PROGRESS_STEPS = [
  { key: "writing_copy", label: "Writing ad copy" },
  { key: "generating_video", label: "Rendering CGI video" },
  { key: "adding_music", label: "Mixing in music" },
  { key: "uploading", label: "Uploading" },
];

function readPendingJob() {
  try {
    const raw = localStorage.getItem(PENDING_JOB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePendingJob(job) {
  try {
    localStorage.setItem(PENDING_JOB_KEY, JSON.stringify(job));
  } catch {
    /* storage blocked */
  }
}

function clearPendingJob() {
  try {
    localStorage.removeItem(PENDING_JOB_KEY);
  } catch {
    /* storage blocked */
  }
}

/* ----------------------------------------------------
   WALLET DEDUCTION ACTION (mirrors /video-generation pattern)
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

// useSearchParams (inside the posting flow) must sit under a Suspense boundary in Next 16.
export default function CgiVideoPage() {
  return (
    <Suspense fallback={null}>
      <CgiVideoContent />
    </Suspense>
  );
}

function CgiVideoContent() {
  const [userId, setUserId] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* -------------------- Form state -------------------- */
  const [businessName, setBusinessName] = useState("");
  const [productName, setProductName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [productImage, setProductImage] = useState(null); // { file, preview }
  const [logo, setLogo] = useState(null); // File
  const [musicMood, setMusicMood] = useState("auto");
  const [moods, setMoods] = useState([]);
  const [loadingMoods, setLoadingMoods] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const productInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const historySectionRef = useRef(null);

  /* -------------------- Keywords (Google Keyword Planner ideas) -------------------- */
  // Wahi hook jo Keyword Planner / Competitor Analysis use karte hain — live
  // Google search volume ke saath keyword ideas deta hai.
  const { suggestions, isSearching, searchKeywords } = useKeywordPlanner();
  const [keywordInput, setKeywordInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // `keywords` (comma-separated string) hi source of truth rehta hai — API ko
  // wahi jaata hai. Chips sirf usi se derive hote hain.
  const keywordList = useMemo(
    () =>
      keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    [keywords]
  );

  const addKeyword = (kw) => {
    const clean = String(kw || "").replace(/,/g, "").trim();
    if (clean && !keywordList.some((k) => k.toLowerCase() === clean.toLowerCase())) {
      setKeywords([...keywordList, clean].join(", "));
    }
    setKeywordInput("");
    setShowSuggestions(false);
  };

  const removeKeyword = (kw) => {
    setKeywords(keywordList.filter((k) => k !== kw).join(", "));
  };

  /* -------------------- Generation -------------------- */
  const [isSubmitting, setIsSubmitting] = useState(false);
  // { taskId, userId, businessName, productName, keywords, adCopy, musicMood,
  //   musicMoodReason, status, progressMessage, startedAt }
  const [job, setJob] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [resultVideo, setResultVideo] = useState(null);

  /* -------------------- History -------------------- */
  // Each row is a CgiVideo record carrying its linked Post as `post` (or null).
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Signature matches /post-management's fetchPosts(pageNum, isBackground) — the
  // posting flow calls it after every publish to refresh statuses.
  const fetchPosts = useCallback(async (_pageNum = 1, isBackground = false) => {
    const uid = getLocalStorage("userId");
    if (!uid) {
      setLoadingHistory(false);
      return;
    }
    if (!isBackground) setLoadingHistory(true);
    try {
      const res = await fetch(`/api/cgi-video-history?userId=${uid}`, { cache: "no-store" });
      const d = await res.json();
      if (d.success) setHistory(d.data || []);
      else if (!isBackground) setHistory([]);
    } catch {
      if (!isBackground) setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const posting = useVideoHistoryPosting({
    userId,
    history,
    setHistory,
    fetchPosts,
    showToast,
    historyEndpoint: "/api/cgi-video-history",
  });

  /* ---------------------------- INIT ---------------------------- */
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (uid) {
      setUserId(uid);
      fetch(`/api/users/userbalance?userId=${uid}`)
        .then((r) => r.json())
        .then((d) => setWalletBalance(d?.user?.wallet ?? d?.wallet ?? 0))
        .catch(() => setWalletBalance(0));

      fetchPosts(1, false);

      const pending = readPendingJob();
      if (pending?.taskId && pending.userId === uid && Date.now() - pending.startedAt < POLL_TIMEOUT_MS) {
        setJob({ ...pending, progressMessage: "Resuming your CGI ad…" });
      } else if (pending) {
        clearPendingJob();
      }
    } else {
      setLoadingHistory(false);
    }

    setLoadingMoods(true);
    fetch("/api/cgi-video/music-library")
      .then((r) => r.json())
      .then((d) => setMoods(d.success ? d.tracks || [] : []))
      .catch(() => setMoods([]))
      .finally(() => setLoadingMoods(false));
  }, []);

  /* -------------------- Live keyword ideas (debounced) -------------------- */
  useEffect(() => {
    const frag = keywordInput.trim();
    if (frag.length <= 2 || !showSuggestions) return;
    const timer = setTimeout(() => searchKeywords(frag), 500);
    return () => clearTimeout(timer);
  }, [keywordInput, showSuggestions, searchKeywords]);

  // Bahar click par suggestions band.
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSuggestions]);

  /* -------------------- Elapsed timer while a job runs -------------------- */
  useEffect(() => {
    if (!job?.taskId) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [job?.taskId]);

  /* -------------------- Poll the job until it is terminal -------------------- */
  useEffect(() => {
    if (!job?.taskId) return;
    // Snapshot: everything below reads only this + state setters, so it never goes stale.
    const snapshot = job;
    let cancelled = false;
    let timer;
    let consecutiveErrors = 0;

    const failJob = (message) => {
      clearPendingJob();
      setJob(null);
      showToast(message, "error");
    };

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - snapshot.startedAt > POLL_TIMEOUT_MS) {
        failJob("Timed out waiting for your ad. You have not been charged — please try again.");
        return;
      }

      try {
        const res = await fetch(`/api/cgi-video/task?taskId=${snapshot.taskId}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.status === 404) {
          // Task state lives in memory upstream — a restart drops it. Resubmitting is the only fix.
          failJob("The video server restarted and this job was lost. Please generate again — you have not been charged.");
          return;
        }
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Status check failed (${res.status})`);
        }

        consecutiveErrors = 0;
        const task = data.data || {};

        if (task.status === "failed") {
          failJob(`${task.error || task.progress_message || "Video generation failed."} You have not been charged.`);
          return;
        }

        if (task.status === "success") {
          if (!task.video_url) {
            failJob("The ad finished but no video URL was returned. You have not been charged.");
            return;
          }
          await completeJob(snapshot, task);
          return;
        }

        setJob((prev) =>
          prev?.taskId === snapshot.taskId
            ? {
                ...prev,
                status: task.status || prev.status,
                progressMessage: task.progress_message || prev.progressMessage,
                musicMood: task.music_mood || prev.musicMood,
                musicMoodReason: task.music_mood_reason || prev.musicMoodReason,
              }
            : prev
        );
      } catch (err) {
        console.error("CGI video poll error:", err);
        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_POLL_ERRORS) {
          failJob("Lost connection while checking your ad. You have not been charged — please try again.");
          return;
        }
      }

      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Restart polling only when the job itself changes, not on every progress update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.taskId]);

  const completeJob = async (snapshot, task) => {
    const finished = {
      taskId: snapshot.taskId,
      businessName: snapshot.businessName,
      videoUrl: task.video_url,
      storageWarning: task.storage_warning || null,
      adCopy: snapshot.adCopy,
      musicMood: task.music_mood || snapshot.musicMood,
      musicMoodReason: task.music_mood_reason || snapshot.musicMoodReason,
    };
    setResultVideo(finished);
    showToast("🎬 CGI ad generated successfully!", "success");

    const persisted = await persistAndDeduct(snapshot, finished);
    // If saving failed, keep the pending job so the next visit retries the save + charge.
    if (persisted) clearPendingJob();
    setJob(null);
  };

  const persistAndDeduct = async (snapshot, finished) => {
    let created = false;
    try {
      const res = await fetch("/api/cgi-video-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: snapshot.userId,
          taskId: snapshot.taskId,
          businessName: snapshot.businessName,
          productName: snapshot.productName,
          keywords: snapshot.keywords,
          adCopy: snapshot.adCopy,
          musicMood: finished.musicMood,
          musicMoodReason: finished.musicMoodReason,
          videoUrl: finished.videoUrl,
          storageWarning: finished.storageWarning,
          cost: GENERATION_COST,
        }),
      });
      const saved = await res.json().catch(() => ({}));
      if (!res.ok || !saved.success) throw new Error(saved.error || "Failed to save CGI ad.");

      created = !!saved.created;
      if (saved.data) {
        setHistory((prev) =>
          prev.some((h) => h.taskId === saved.data.taskId) ? prev : [saved.data, ...prev]
        );
        // The Approve → posting buttons live on the ad's card below — bring it into view.
        setTimeout(
          () => historySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          400
        );
      }
    } catch (err) {
      console.error("Failed to save CGI video history:", err);
      showToast("Ad created, but saving it failed. Reload the page to retry.", "warning");
      return false;
    }

    // Already saved (and charged) by an earlier poll — another tab or a reload.
    if (!created) return true;

    try {
      const walletData = await deductFromWalletAction(snapshot.userId, {
        amount: GENERATION_COST,
        type: "deduct",
        reason: "video_generated_cgi",
        metadata: { taskId: snapshot.taskId, videoUrl: finished.videoUrl },
      });
      const newBalance = walletData?.wallet ?? walletData?.data?.wallet ?? walletData?.user?.wallet;
      setWalletBalance(
        typeof newBalance === "number" ? newBalance : (b) => Math.max(0, (b ?? 0) - GENERATION_COST)
      );
      emitWalletDeduct(GENERATION_COST);
      showToast(`${GENERATION_COST} coins deducted 💰`, "info");
    } catch (err) {
      console.error(err);
      showToast("Video created, but coin deduction failed. Please contact support.", "warning");
    }
    return true;
  };

  /* ---------------------------- Handlers ---------------------------- */
  const validateImage = (file, label) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast(`${label} must be a PNG, JPG or WEBP image.`, "error");
      return false;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast(`${label} must be under 15 MB.`, "error");
      return false;
    }
    return true;
  };

  const applyProductFile = (file) => {
    if (!file || !validateImage(file, "Product image")) return;
    setProductImage((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
  };

  const handleProductUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    applyProductFile(file);
  };

  const handleProductDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyProductFile(e.dataTransfer.files?.[0]);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !validateImage(file, "Logo")) return;
    setLogo(file);
  };

  const isBusy = isSubmitting || !!job;
  const insufficientBalance = walletBalance !== null && walletBalance < GENERATION_COST;

  const canGenerate =
    !isBusy && !!userId && !insufficientBalance && !!businessName.trim() && !!productImage;

  const handleGenerate = async () => {
    if (!userId) return showToast("Please log in to generate videos.", "error");
    if (!businessName.trim()) return showToast("Please enter your business name.", "error");
    if (!productImage) return showToast("Please upload a product image.", "error");
    if (insufficientBalance) {
      return showToast(`You need at least ${GENERATION_COST} coins in your wallet to generate a CGI ad.`, "error");
    }

    setIsSubmitting(true);
    setResultVideo(null);

    // Jo keyword type kiya hai par chip nahi banaya, wo bhi bheja jaaye.
    const pendingKeyword = keywordInput.replace(/,/g, "").trim();
    const finalKeywords = (
      pendingKeyword &&
      !keywordList.some((k) => k.toLowerCase() === pendingKeyword.toLowerCase())
        ? [...keywordList, pendingKeyword]
        : keywordList
    ).join(", ");

    try {
      const form = new FormData();
      form.append("business_name", businessName.trim());
      if (productName.trim()) form.append("product_name", productName.trim());
      if (finalKeywords) form.append("keywords", finalKeywords);
      form.append("product", productImage.file);
      if (logo) form.append("logo", logo);
      form.append("music_mood", musicMood);

      const res = await fetch("/api/cgi-video/generate", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start CGI ad generation.");
      }

      const started = data.data || {};
      if (!started.task_id) throw new Error("The video service did not return a job id.");

      const newJob = {
        taskId: started.task_id,
        userId,
        businessName: businessName.trim(),
        productName: productName.trim(),
        keywords: finalKeywords,
        adCopy: {
          headline: started.ad_copy?.headline || null,
          businessNameLine: started.ad_copy?.business_name_line || null,
          cta: started.ad_copy?.cta || null,
        },
        musicMood: started.music_mood || null,
        musicMoodReason: started.music_mood_reason || null,
        status: started.status || "generating_video",
        progressMessage: "Rendering your CGI video…",
        startedAt: Date.now(),
      };
      savePendingJob(newJob);
      setJob(newJob);
      showToast("Ad copy written — rendering your CGI video. This takes a few minutes.", "info");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to start CGI ad generation.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stage = resultVideo?.videoUrl ? "ready" : isBusy ? "rendering" : "idle";
  const activeAdCopy = job?.adCopy || resultVideo?.adCopy;
  const activeMood = job?.musicMood || resultVideo?.musicMood;
  const activeMoodReason = job?.musicMoodReason || resultVideo?.musicMoodReason;
  const currentStepIndex = job ? PROGRESS_STEPS.findIndex((s) => s.key === job.status) : -1;

  return (
    <div className="font-inter">
      {toast && <Toast message={toast.message} type={toast.type} />}
      {/* Post to GMB / FB / Instagram / Pinterest / LinkedIn / Schedule modals */}
      {posting.modals}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAB308] flex items-center justify-center shadow-[0_0_15px_rgba(253,224,71,0.3)] shrink-0">
            <Package className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
              CGI <span className="text-[#EAB308]">Product Video</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Turn one product photo into a 10-second CGI ad for Reels &amp; Shorts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-3">
          <Coins className="w-4 h-4 text-[#EAB308]" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-slate-900/70">{GENERATION_COST} coins / ad</span>
            <span className="text-[10px] text-slate-400 font-medium">Charged only when the video is ready</span>
          </div>
        </div>
      </div>

      {insufficientBalance && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
          <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-700">
            You need at least {GENERATION_COST} coins in your wallet to generate a CGI ad. Current balance:{" "}
            {walletBalance ?? 0} coins.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-3 space-y-4">
          <SectionCard step={1} title="Brand Details" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={isBusy}
                  placeholder="e.g., Dr Fresh"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={isBusy}
                  placeholder="e.g., Antioxidant Alkaline Bottle"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div className="space-y-1 mb-4 relative" ref={suggestionRef}>
              <label className="text-xs font-semibold text-slate-900/90">Keywords</label>

              <div
                className={`flex flex-wrap items-center gap-1.5 w-full p-2 bg-slate-50 border border-slate-200 rounded-lg transition-all focus-within:ring-2 focus-within:ring-[#EAB308]/50 focus-within:border-[#EAB308]/50 ${
                  isBusy ? "opacity-60" : ""
                }`}
              >
                {keywordList.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full bg-[#EAB308]/15 border border-[#EAB308]/30 px-2 py-0.5 text-[11px] font-bold text-[#92650a]"
                  >
                    {kw}
                    {!isBusy && (
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="hover:text-black"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}

                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => {
                    setKeywordInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addKeyword(keywordInput);
                    } else if (e.key === "Backspace" && !keywordInput && keywordList.length) {
                      removeKeyword(keywordList[keywordList.length - 1]);
                    }
                  }}
                  disabled={isBusy}
                  placeholder={keywordList.length ? "Add another…" : "e.g., alkaline water"}
                  className="flex-1 min-w-[130px] bg-transparent px-1 py-1 text-sm text-slate-900 outline-none disabled:cursor-not-allowed"
                />

                {isSearching && (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[#EAB308]" />
                )}
                {keywordInput.trim() && !isBusy && (
                  <button
                    type="button"
                    onClick={() => addKeyword(keywordInput)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                3+ letters type karo — Google ke keyword ideas search volume ke saath niche
                aayenge. The AI uses these to write the on-screen headline and CTA.
              </p>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 top-full mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl p-1.5">
                  {suggestions
                    .filter((s) => s.keyword)
                    .map((s, idx) => {
                      const already = keywordList.some(
                        (k) => k.toLowerCase() === s.keyword.toLowerCase()
                      );
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={already || isBusy}
                          onClick={() => addKeyword(s.keyword)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 mb-0.5 text-left transition-colors ${
                            already
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-[#EAB308]/10"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {already ? (
                              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#EAB308]" />
                            )}
                            <span className="truncate text-xs font-bold text-slate-700">
                              {s.keyword}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-400">
                            {(s.volume || 0).toLocaleString()} searches
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            <div
              onClick={() => !isBusy && logoInputRef.current?.click()}
              className={`flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 transition-all ${
                isBusy ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-[#EAB308]/50"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {logo ? logo.name : "Add brand logo (optional)"}
                  </p>
                  <p className="text-[10px] text-slate-400">Placed top-right. Transparent PNG looks cleanest.</p>
                </div>
              </div>
              {logo && !isBusy && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogo(null);
                  }}
                  className="p-1 rounded-md hover:bg-slate-200"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </SectionCard>

          <SectionCard step={2} title="Product Image" icon={Package}>
            <div className="space-y-3">
              <div
                onClick={() => !isBusy && productInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isBusy) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => (isBusy ? e.preventDefault() : handleProductDrop(e))}
                className={`relative flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-7 transition-all ${
                  isBusy ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                } ${
                  isDragging
                    ? "border-[#EAB308] bg-[#EAB308]/10 scale-[1.01]"
                    : productImage
                    ? "border-[#EAB308]/50 bg-[#EAB308]/5"
                    : "border-slate-300 bg-slate-50 hover:border-[#EAB308]/50 hover:bg-[#EAB308]/5"
                }`}
              >
                {productImage ? (
                  <>
                    <div className="relative">
                      <img
                        src={productImage.preview}
                        alt="Product"
                        className="w-28 h-28 rounded-xl object-contain bg-white ring-4 ring-white shadow-md"
                      />
                      {!isBusy && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            URL.revokeObjectURL(productImage.preview);
                            setProductImage(null);
                          }}
                          className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white shadow-md hover:bg-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 max-w-full truncate">
                      {productImage.file.name}
                    </p>
                    <p className="text-[10px] text-[#92650a] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Looks good — click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm">
                      <ImagePlus className="w-6 h-6 text-[#EAB308]" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-900">
                        Drag &amp; drop your product photo, or{" "}
                        <span className="text-[#EAB308] underline underline-offset-2">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG or WEBP — max 15 MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={productInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleProductUpload}
                className="hidden"
              />

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">
                  For the best result
                </p>
                {[
                  "Only the product — no people, this is a product-only ad",
                  "Whole product in frame, sharp and well lit",
                  "Plain or transparent background works best",
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-slate-600">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard step={3} title="Music & Format" icon={Music2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900/90 flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-[#EAB308]" />
                  Music Mood
                </label>
                <select
                  value={musicMood}
                  onChange={(e) => setMusicMood(e.target.value)}
                  disabled={isBusy || loadingMoods}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 capitalize focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                >
                  <option value="auto">{loadingMoods ? "Loading…" : "Auto — let AI pick"}</option>
                  {moods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["10 seconds", "9:16 vertical", "720 × 1280"].map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] py-3.5 text-sm font-black uppercase tracking-wide text-black shadow-md hover:brightness-95 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isSubmitting
              ? "Writing ad copy…"
              : job
              ? "Generating CGI ad…"
              : `Generate CGI Ad — ${GENERATION_COST} coins`}
          </button>
        </div>

        {/* Preview — sticky on desktop so it stays visible while filling the form */}
        <div className="lg:col-span-2 lg:sticky lg:top-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-[#EAB308]" />
                Preview
              </h2>
              <StatusPill stage={stage} />
            </div>

            <div
              className="relative h-[60vh] max-h-[520px] max-w-full mx-auto rounded-lg bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-3 overflow-hidden"
              style={{ aspectRatio: "9 / 16" }}
            >
              {resultVideo?.videoUrl ? (
                <video
                  src={resultVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : job ? (
                <div className="flex flex-col items-center gap-3 px-5 text-center w-full">
                  <div className="relative w-14 h-14">
                    <Loader2 className="w-14 h-14 text-[#EAB308] animate-spin" />
                    <Wand2 className="w-5 h-5 text-[#EAB308] absolute inset-0 m-auto" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">{job.progressMessage}</p>
                  <p className="text-[11px] font-mono text-slate-500">{formatElapsed(now - job.startedAt)}</p>

                  <div className="w-full max-w-[200px] space-y-1.5 text-left">
                    {PROGRESS_STEPS.map((s, i) => {
                      const done = currentStepIndex > i;
                      const active = currentStepIndex === i;
                      return (
                        <div key={s.key} className="flex items-center gap-2">
                          <span
                            className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${
                              done
                                ? "bg-emerald-500 text-white"
                                : active
                                ? "bg-[#EAB308] text-black"
                                : "bg-slate-200 text-slate-400"
                            }`}
                          >
                            {done ? (
                              <Check className="w-2.5 h-2.5" />
                            ) : active ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : null}
                          </span>
                          <span
                            className={`text-[11px] ${
                              done ? "text-slate-500" : active ? "font-bold text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Usually takes a few minutes. You can reload — we'll pick up where we left off.
                  </p>
                </div>
              ) : productImage ? (
                <img src={productImage.preview} alt="Product preview" className="w-full h-full object-contain p-6" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Package className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 px-4 text-center">
                    Upload a product image to get started
                  </p>
                </>
              )}
            </div>

            {resultVideo?.videoUrl && (
              <a
                href={resultVideo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:border-[#EAB308]/50 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open / download video
              </a>
            )}

            {resultVideo?.storageWarning && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <TriangleAlert className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800">{resultVideo.storageWarning}</p>
              </div>
            )}

            {activeAdCopy && (activeAdCopy.headline || activeAdCopy.cta) && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide">On-screen copy</p>
                {activeAdCopy.headline && (
                  <p className="text-sm font-black text-slate-900">{activeAdCopy.headline}</p>
                )}
                {activeAdCopy.businessNameLine && (
                  <p className="text-[11px] text-slate-500">{activeAdCopy.businessNameLine}</p>
                )}
                {activeAdCopy.cta && (
                  <span className="inline-block rounded-full bg-[#EAB308] px-2.5 py-0.5 text-[10px] font-black uppercase text-black">
                    {activeAdCopy.cta}
                  </span>
                )}
                {activeMood && (
                  <p className="text-[11px] text-slate-500 pt-1 flex items-start gap-1">
                    <Music2 className="w-3 h-3 mt-0.5 shrink-0 text-[#EAB308]" />
                    <span>
                      <span className="font-bold capitalize text-slate-700">{activeMood}</span>
                      {activeMoodReason ? ` — ${activeMoodReason}` : ""}
                    </span>
                  </p>
                )}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              On-screen text is AI-rendered and can occasionally be imperfect — preview before using the
              ad on a paid channel. Videos are hosted on a public link; download any you want to keep.
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-8 scroll-mt-4" ref={historySectionRef}>
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900/60 mb-3 px-1">
          <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
          Your CGI Ads — Approve &amp; Post
        </h2>

        {loadingHistory ? (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900/60">No CGI ads yet</p>
            <p className="text-xs text-slate-900/30">Generate one above and it'll show up here</p>
          </div>
        ) : (
          // Same grid + card as /post-management: an ad with a Post shows Approve →
          // all posting buttons; one without gets Approve / Reject that creates its Post.
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
            {history.map((item) =>
              item.post ? (
                <PostCard key={item._id} post={item.post} {...posting.cardProps} />
              ) : (
                <UnlinkedVideoCard
                  key={item._id}
                  item={item}
                  title={item.productName || item.businessName}
                  subtitle={item.adCopy?.headline}
                  onApprove={posting.approveUnlinked}
                  onReject={posting.rejectUnlinked}
                  busy={posting.enablingId === item._id}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   UI HELPERS
---------------------------------------------------- */
function SectionCard({ step, title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 text-slate-900">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black shrink-0">
          {step}
        </span>
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-[#EAB308]" />
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ stage }) {
  const config = {
    idle: { label: "Not started", cls: "bg-slate-100 text-slate-500 border-slate-200" },
    rendering: { label: "Rendering", cls: "bg-[#EAB308]/15 text-[#92650a] border-[#EAB308]/40" },
    ready: { label: "Ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  }[stage];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${config.cls}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          stage === "ready" ? "bg-emerald-500" : stage === "rendering" ? "bg-[#EAB308] animate-pulse" : "bg-slate-400"
        }`}
      />
      {config.label}
    </span>
  );
}

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}
