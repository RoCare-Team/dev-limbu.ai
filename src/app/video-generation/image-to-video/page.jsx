"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Video,
  Coins,
  Sparkles,
  X,
  Wand2,
  Loader2,
  ImagePlus,
  Check,
  ExternalLink,
  UploadCloud,
} from "lucide-react";
import Toast from "@/components/Toast";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import { emitWalletDeduct } from "@/utils/walletEvents";
import { getLocalStorage } from "@/utils/storage";
import PostCard from "@/components/post-management/PostCard";
import { useVideoPostingFlow } from "@/hooks/useVideoPostingFlow";

/* ----------------------------------------------------
   CONSTANTS
---------------------------------------------------- */
// Charged server-side by /api/image-to-video once the render succeeds.
const GENERATION_COST = 200;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Fixed length — this page only ever renders 12-second videos.
const VIDEO_DURATION = 12;

// useSearchParams (inside the posting flow) must sit under a Suspense boundary in Next 16.
export default function ImageToVideoPage() {
  return (
    <Suspense fallback={null}>
      <ImageToVideoContent />
    </Suspense>
  );
}

function ImageToVideoContent() {
  const [userId, setUserId] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* -------------------- Generation form -------------------- */
  const [preview, setPreview] = useState(null); // local object URL, just for the UI
  const [imageUrl, setImageUrl] = useState(""); // S3 URL — what actually gets sent
  const [isUploading, setIsUploading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [resultVideo, setResultVideo] = useState(null);

  /* -------------------- Videos (history rows + their Posts) -------------------- */
  const [historyRows, setHistoryRows] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const postsSectionRef = useRef(null);

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
      const res = await fetch(`/api/image-to-video-history?userId=${uid}`, { cache: "no-store" });
      const d = await res.json();
      const rows = d.success ? d.data || [] : [];
      setHistoryRows(rows);
      setPosts(rows.map((r) => r.post).filter(Boolean));
    } catch {
      if (!isBackground) {
        setHistoryRows([]);
        setPosts([]);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const { cardProps, modals } = useVideoPostingFlow({
    userId,
    posts,
    setPosts,
    fetchPosts,
    showToast,
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
    }
    fetchPosts(1, false);
  }, [fetchPosts]);

  useEffect(() => {
    if (!isGenerating) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isGenerating]);

  // Local preview URLs must be released or they leak for the life of the tab.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ---------------------------- Upload ---------------------------- */
  const applyFile = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      return showToast("Please choose an image file.", "error");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return showToast("Image must be under 10 MB.", "error");
    }

    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setImageUrl("");
    setResultVideo(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadToS3Action(formData);
      if (!res.success) throw new Error(res.error || "Failed to upload image.");
      setImageUrl(res.url);
      showToast("Image uploaded ✅", "success");
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast(err.message || "Upload failed. Please try again.", "error");
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    applyFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyFile(e.dataTransfer.files?.[0]);
  };

  const clearImage = () => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageUrl("");
    setResultVideo(null);
  };

  const isBusy = isUploading || isGenerating;
  const insufficientBalance = walletBalance !== null && walletBalance < GENERATION_COST;
  const canGenerate = !isBusy && !!userId && !!imageUrl && !insufficientBalance;

  /* -------------------- Persist to this page's own history -------------------- */
  const saveToHistory = async ({ videoUrl, post }) => {
    try {
      const res = await fetch("/api/image-to-video-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          videoUrl,
          sourceImageUrl: imageUrl,
          prompt: prompt.trim(),
          postId: post?._id ? String(post._id) : null,
          cost: GENERATION_COST,
        }),
      });
      const saved = await res.json().catch(() => ({}));
      if (!res.ok || !saved.success) throw new Error(saved.error || "Failed to save.");
      if (saved.data) {
        const row = { ...saved.data, post: post || null };
        setHistoryRows((prev) => (prev.some((h) => h._id === row._id) ? prev : [row, ...prev]));
      }
    } catch (err) {
      console.error("Failed to save image-to-video history:", err);
      showToast("Video ban gayi, par history me save nahi hui.", "warning");
    }
  };

  /* ---------------------------- Generate ---------------------------- */
  const handleGenerate = async () => {
    if (!userId) return showToast("Please log in to convert images.", "error");
    if (!imageUrl) return showToast("Please upload an image first.", "error");
    if (insufficientBalance) {
      return showToast(`You need at least ${GENERATION_COST} coins to convert an image.`, "error");
    }

    setIsGenerating(true);
    setStartedAt(Date.now());
    setResultVideo(null);

    try {
      const res = await fetch("/api/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: prompt.trim(),
          video_prompt: prompt.trim(),
          duration: VIDEO_DURATION,
          platform: "both",
          userId,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        const message =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || data.message || "Video generation failed.";
        throw new Error(message);
      }

      const videoUrl = String(data.drive_link || data.video_url || "").trim();
      if (!videoUrl) throw new Error("No video URL was returned by the generator.");

      setResultVideo(videoUrl);
      showToast("🎬 Video ready — approve karke post karein!", "success");

      // The route already charged the wallet; just mirror the new balance here.
      if (typeof data.wallet === "number") setWalletBalance(data.wallet);
      if (data.coinsDeducted) {
        emitWalletDeduct(data.coinsDeducted);
        showToast(`${data.coinsDeducted} coins deducted 💰`, "info");
      }

      // The route created a pending Post — surface it straight into the approve flow.
      if (data.post?._id) {
        setPosts((prev) => [
          data.post,
          ...prev.filter((p) => String(p._id) !== String(data.post._id)),
        ]);
        setTimeout(
          () => postsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          400
        );
      }

      await saveToHistory({ videoUrl, post: data.post });
    } catch (err) {
      console.error("Image-to-video failed:", err);
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ---------------------------- Render ---------------------------- */
  const elapsed = startedAt ? formatElapsed(now - startedAt) : "0:00";
  // Rows whose Post was deleted (or never linked) still deserve a plain video card.
  const orphanRows = historyRows.filter((r) => !r.post);

  return (
    <div className="font-inter">
      {toast && <Toast message={toast.message} type={toast.type} />}
      {modals}

      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAB308] flex items-center justify-center shadow-[0_0_15px_rgba(253,224,71,0.3)] shrink-0">
            <Video className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Image To <span className="text-[#EAB308]">Video</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Upload any image and turn it into a short motion video
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-3">
          <Coins className="w-4 h-4 text-[#EAB308]" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-slate-900/70">{GENERATION_COST} coins / video</span>
            <span className="text-[10px] text-slate-400 font-medium">
              Charged only when the video is ready
            </span>
          </div>
        </div>
      </div>

      {insufficientBalance && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
          <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-700">
            You need at least {GENERATION_COST} coins to convert an image. Current balance:{" "}
            {walletBalance ?? 0} coins.
          </p>
        </div>
      )}

      {/* ---------------- Generator ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <SectionCard step={1} title="Your Image" icon={ImagePlus}>
            <div
              onClick={() => !isBusy && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isBusy) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => (isBusy ? e.preventDefault() : handleDrop(e))}
              className={`relative flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-7 transition-all ${
                isBusy ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              } ${
                isDragging
                  ? "border-[#EAB308] bg-[#EAB308]/10 scale-[1.01]"
                  : preview
                  ? "border-[#EAB308]/50 bg-[#EAB308]/5"
                  : "border-slate-300 bg-slate-50 hover:border-[#EAB308]/50 hover:bg-[#EAB308]/5"
              }`}
            >
              {preview ? (
                <>
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Uploaded"
                      className="w-28 h-28 rounded-xl object-contain bg-white ring-4 ring-white shadow-md"
                    />
                    {!isBusy && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearImage();
                        }}
                        className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white shadow-md hover:bg-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {isUploading ? (
                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                    </p>
                  ) : imageUrl ? (
                    <p className="text-[10px] text-[#92650a] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded — click to replace
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm">
                    <UploadCloud className="w-6 h-6 text-[#EAB308]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-900">
                      Drag &amp; drop your image, or{" "}
                      <span className="text-[#EAB308] underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG or WEBP — max 10 MB</p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </SectionCard>

          <SectionCard step={2} title="Motion & Format" icon={Wand2}>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-semibold text-slate-900/90">
                Motion prompt <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isBusy}
                rows={3}
                placeholder="e.g., slow zoom in, camera pans right, product rotates gently"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60 resize-none"
              />
              <p className="text-[10px] text-slate-400 font-medium">
                Describe the movement, not the picture. Khaali chhoda to ek default motion lag jayega.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[`${VIDEO_DURATION} seconds`, "9:16 vertical", "720p"].map((spec) => (
                <span
                  key={spec}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                >
                  {spec}
                </span>
              ))}
            </div>
          </SectionCard>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] py-3.5 text-sm font-black uppercase tracking-wide text-black shadow-md hover:brightness-95 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isUploading
              ? "Uploading image…"
              : isGenerating
              ? `Converting… ${elapsed}`
              : `Convert To Video — ${GENERATION_COST} coins`}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 lg:sticky lg:top-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#EAB308]" />
                Preview
              </h2>
              <StatusPill stage={resultVideo ? "ready" : isGenerating ? "rendering" : "idle"} />
            </div>

            <div
              className="relative h-[60vh] max-h-[520px] max-w-full mx-auto rounded-lg bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-3 overflow-hidden"
              style={{ aspectRatio: "9 / 16" }}
            >
              {resultVideo ? (
                <video
                  src={resultVideo}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : isGenerating ? (
                <div className="flex flex-col items-center gap-3 px-5 text-center">
                  <div className="relative w-14 h-14">
                    <Loader2 className="w-14 h-14 text-[#EAB308] animate-spin" />
                    <Wand2 className="w-5 h-5 text-[#EAB308] absolute inset-0 m-auto" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Rendering your video…</p>
                  <p className="text-[11px] font-mono text-slate-500">{elapsed}</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Ismein kuch minute lag sakte hain — is tab ko khula rehne dein.
                  </p>
                </div>
              ) : preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-contain p-6" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <ImagePlus className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 px-4 text-center">
                    Upload an image to get started
                  </p>
                </>
              )}
            </div>

            {resultVideo && (
              <a
                href={resultVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:border-[#EAB308]/50 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open / download video
              </a>
            )}

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Video banne ke baad niche <b>Your Videos</b> me aayegi — pehle Approve karein, phir GMB,
              Facebook, Instagram, Pinterest, LinkedIn par post ya schedule karein.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------- Your Videos — approve & publish ---------------- */}
      <div className="mt-8 scroll-mt-4" ref={postsSectionRef}>
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900/60 mb-3 px-1">
          <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
          Your Videos — Approve &amp; Post
        </h2>

        {loadingHistory ? (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 rounded-4xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 && orphanRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Video className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900/60">No videos yet</p>
            <p className="text-xs text-slate-900/30">Convert an image above and it'll show up here</p>
          </div>
        ) : (
          <>
            {posts.length > 0 && (
              <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} {...cardProps} />
                ))}
              </div>
            )}

            {orphanRows.length > 0 && (
              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
                  Purani videos (post library se hata di gayi)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {orphanRows.map((item) => (
                    <HistoryVideoCard key={item._id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   HISTORY CARD (only for rows whose Post no longer exists)
---------------------------------------------------- */
function HistoryVideoCard({ item }) {
  const createdLabel = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : "";

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative bg-black" style={{ aspectRatio: "9 / 16" }}>
        <video
          src={item.videoUrl}
          className="w-full h-full object-contain bg-black"
          controls
          playsInline
          preload="metadata"
        />
        {createdLabel && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full border border-white/70 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm pointer-events-none">
            {createdLabel}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
          {item.prompt || "Image to Video"}
        </p>
        <span className="inline-flex w-fit items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full">
          {item.durationSeconds ?? VIDEO_DURATION}s
        </span>
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
          stage === "ready"
            ? "bg-emerald-500"
            : stage === "rendering"
            ? "bg-[#EAB308] animate-pulse"
            : "bg-slate-400"
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
