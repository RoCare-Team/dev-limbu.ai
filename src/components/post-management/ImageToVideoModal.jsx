"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  Video,
  Loader2,
  Copy,
  Check,
  UploadCloud,
  X,
  Sparkles,
} from "lucide-react";
import { resolveBusinessNameForGeneration } from "@/lib/businessNameFromPayload";
import { postHasVideoAsset } from "@/lib/postMediaUrls";
import { getCloudinarySignatureAction } from "@/app/actions/uploadCloudinary";
import { getUserWalletAction } from "@/app/actions/postActions";

const DURATION_OPTIONS = [5, 8, 10];
const PLATFORM_OPTIONS = ["instagram", "facebook", "both"];
const AUDIO_FOLDER_OPTIONS = ["dharmik", "motivational", "basic"];

export function displayUrlForPostOutput(url) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `data:image/png;base64,${url}`;
}

export function isLikelyImageOutput(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  if (u.startsWith("data:image")) return true;
  if (u.startsWith("http://") || u.startsWith("https://")) {
    if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return false;
    return true;
  }
  return true;
}

/** True when post row is stored as video or URL looks like video file. */
export function isPostVideoMedia(post) {
  if (!post) return false;
  if (post.mediaType === "video") return true;
  const u = post.aiOutput;
  if (!u || typeof u !== "string") return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(u);
}

export default function ImageToVideoModal({
  isOpen,
  onClose,
  posts = [],
  selectedBusiness,
  bussinessTitle,
  availableLocations = [],
  postPrompt = "",
  showToast,
  initialPost = null,
  onVideoSaved,
  videoGenerationCoins = 200,
  onVideoChargeApplied,
  onVideoInsufficientBalance,
}) {
  const [ivPrompt, setIvPrompt] = useState("");
  const [ivDuration, setIvDuration] = useState(5);
  const [ivPlatform, setIvPlatform] = useState("both");
  const [voiceMode, setVoiceMode] = useState("skip");
  const [audioFileUrl, setAudioFileUrl] = useState("");
  const [audioFolder, setAudioFolder] = useState("basic");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [uploadedCloudinaryUrl, setUploadedCloudinaryUrl] = useState(null);
  const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [mergeTargetPostId, setMergeTargetPostId] = useState(null);
  const [aiPromptLoading, setAiPromptLoading] = useState(false);

  const initialPostId =
    initialPost?._id != null ? String(initialPost._id) : "";
  const initialOutput = initialPost?.aiOutput;

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setIvPrompt("");
    setIvDuration(5);
    setIvPlatform("both");
    setVoiceMode("skip");
    setAudioFileUrl("");
    setAudioFolder("basic");
    setCopiedField(null);
    setAiPromptLoading(false);
    if (
      initialPostId &&
      typeof initialOutput === "string" &&
      isLikelyImageOutput(initialOutput)
    ) {
      setSelectedPostId(initialPostId);
      setUploadedCloudinaryUrl(null);
      setMergeTargetPostId(initialPostId);
    } else {
      setSelectedPostId(null);
      setUploadedCloudinaryUrl(null);
      setMergeTargetPostId(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpen, initialPostId, initialOutput]);

  /** Prefill movement-focused video prompt from the image prompt (OpenAI). */
  useEffect(() => {
    if (!isOpen) return;
    const base =
      (initialPost?.promat && String(initialPost.promat).trim()) ||
      (postPrompt && String(postPrompt).trim()) ||
      "";
    if (!base) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/image-prompt-to-video-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePrompt: base }),
        });
        const data = await res.json().catch(() => ({}));
        if (
          !cancelled &&
          data.success &&
          typeof data.videoPrompt === "string" &&
          data.videoPrompt.trim()
        ) {
          setIvPrompt(data.videoPrompt.trim());
        }
      } catch {
        /* optional prefill */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialPostId, initialPost?.promat, postPrompt]);

  const generatedImageChoices = useMemo(() => {
    const out = [];
    for (const p of posts) {
      if (isPostVideoMedia(p)) continue;
      const raw = p?.aiOutput;
      if (!raw || typeof raw !== "string" || !raw.trim()) continue;
      if (!isLikelyImageOutput(raw)) continue;
      const id = p?._id != null ? String(p._id) : null;
      if (!id) continue;
      const desc = (p?.description || "").trim();
      const label =
        desc.length > 24 ? `${desc.slice(0, 24)}…` : desc || "Creative";
      out.push({ id, url: raw.trim(), label });
    }
    return out;
  }, [posts]);

  const resolvedBusinessName = useMemo(
    () =>
      resolveBusinessNameForGeneration({
        fromInput: "",
        selectedBusinessName: selectedBusiness?.name,
        bussinessTitle,
        availableLocations,
        prompt: postPrompt,
      }),
    [
      selectedBusiness?.name,
      bussinessTitle,
      availableLocations,
      postPrompt,
    ]
  );

  const selectedSourceUrl = useMemo(() => {
    if (uploadedCloudinaryUrl) return uploadedCloudinaryUrl;
    if (!selectedPostId) return null;
    const row = generatedImageChoices.find(
      (c) => String(c.id) === String(selectedPostId)
    );
    if (row?.url) return row.url;
    if (
      String(initialPostId) === String(selectedPostId) &&
      typeof initialOutput === "string" &&
      initialOutput.trim()
    ) {
      return initialOutput.trim();
    }
    return null;
  }, [
    uploadedCloudinaryUrl,
    selectedPostId,
    generatedImageChoices,
    initialPostId,
    initialOutput,
  ]);

  const effectiveImagePayload = useMemo(() => {
    if (uploadedCloudinaryUrl) {
      return { image_url: uploadedCloudinaryUrl, source: "upload" };
    }
    if (!selectedSourceUrl) return null;
    const u = selectedSourceUrl;
    if (u.startsWith("http://") || u.startsWith("https://")) {
      return { image_url: u, source: "post" };
    }
    const dataUrl = u.startsWith("data:") ? u : `data:image/png;base64,${u}`;
    return { image: dataUrl, source: "post" };
  }, [uploadedCloudinaryUrl, selectedSourceUrl]);

  const previewUrl = useMemo(() => {
    if (!selectedSourceUrl) return null;
    return displayUrlForPostOutput(selectedSourceUrl);
  }, [selectedSourceUrl]);

  const pickPost = (id) => {
    setUploadedCloudinaryUrl(null);
    setSelectedPostId(id);
    setMergeTargetPostId(id != null ? String(id) : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      showToast?.("Please choose an image file.", "error");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast?.("Image must be under 10 MB.", "error");
      e.target.value = "";
      return;
    }

    setUploadingToCloudinary(true);
    setSelectedPostId(null);
    setUploadedCloudinaryUrl(null);
    setMergeTargetPostId(null);
    try {
      const sigData = await getCloudinarySignatureAction();
      if (!sigData.success) {
        throw new Error(sigData.error || "Failed to get upload signature");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", sigData.timestamp);
      formData.append("signature", sigData.signature);
      formData.append("folder", sigData.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || "Failed to upload image to Cloudinary"
        );
      }

      const data = await res.json();
      setUploadedCloudinaryUrl(data.secure_url);
      showToast?.("Image uploaded to Cloudinary", "success");
    } catch (err) {
      showToast?.(err.message || "Upload failed", "error");
    } finally {
      setUploadingToCloudinary(false);
      e.target.value = "";
    }
  };

  const mergeTargetPost = useMemo(() => {
    if (!mergeTargetPostId) return null;
    return posts.find((p) => String(p._id) === String(mergeTargetPostId));
  }, [mergeTargetPostId, posts]);

  const suggestMovementPrompt = async () => {
    const base =
      (mergeTargetPost?.promat && String(mergeTargetPost.promat).trim()) ||
      (initialPost?.promat && String(initialPost.promat).trim()) ||
      (postPrompt && String(postPrompt).trim()) ||
      ivPrompt.trim();
    if (!base) {
      showToast?.("Add an image prompt or video notes first.", "error");
      return;
    }
    setAiPromptLoading(true);
    try {
      const res = await fetch("/api/ai/image-prompt-to-video-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompt: base }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.videoPrompt) {
        throw new Error(data.error || "Could not suggest a prompt");
      }
      setIvPrompt(String(data.videoPrompt).trim());
      showToast?.("Movement-focused prompt ready ✨", "success");
    } catch (err) {
      showToast?.(err.message || "AI prompt failed", "error");
    } finally {
      setAiPromptLoading(false);
    }
  };

  const copyText = async (text, field) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      showToast?.("Copied to clipboard", "success");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast?.("Could not copy", "error");
    }
  };

  const handleGenerate = async () => {
    if (!effectiveImagePayload) {
      showToast?.(
        "Select a creative below or upload via Cloudinary.",
        "error"
      );
      return;
    }

    if (
      mergeTargetPostId &&
      mergeTargetPost &&
      postHasVideoAsset(mergeTargetPost)
    ) {
      showToast?.("This post already has a video — no need to generate again.", "info");
      return;
    }

    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("userId")
        : null;
    if (!userId) {
      showToast?.("Please sign in again.", "error");
      return;
    }

    const walletRes = await getUserWalletAction(userId);
    const bal = Number(walletRes?.wallet ?? 0);
    if (bal < videoGenerationCoins) {
      onVideoInsufficientBalance?.();
      showToast?.(
        `You need ${videoGenerationCoins} coins for video generation.`,
        "error"
      );
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const motionPrompt =
        ivPrompt.trim() ||
        "Create an engaging business promotional video.";
      const body = {
        image_url: null,
        image: null,
        prompt: motionPrompt,
        video_prompt: ivPrompt.trim(),
        business_name: resolvedBusinessName || "Business",
        duration: ivDuration,
        platform: ivPlatform,
        audio_file_url: null,
        audio_folder: voiceMode === "use-voice" ? null : audioFolder || null,
        userId,
        ...(mergeTargetPostId ? { postId: mergeTargetPostId } : {}),
      };
      if (voiceMode === "use-voice") {
        const trimmedAudioUrl = audioFileUrl.trim();
        if (trimmedAudioUrl) {
          body.audio_file_url = trimmedAudioUrl;
        }
      }
      if (effectiveImagePayload.image_url) {
        body.image_url = effectiveImagePayload.image_url;
      } else if (effectiveImagePayload.image) {
        body.image = effectiveImagePayload.image;
      } else {
        throw new Error(
          "No valid image source. Pick a creative, upload an image, or use a public URL.",
        );
      }

      const res = await fetch("/api/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 402) {
        onVideoInsufficientBalance?.();
        showToast?.(
          typeof data.error === "string"
            ? data.error
            : "Insufficient balance for video generation.",
          "error"
        );
        return;
      }
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || data.message || "Video generation failed";
        throw new Error(msg);
      }
      if (data.success === false && !data.drive_link) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.message || "Video generation failed";
        throw new Error(msg);
      }

      const videoUrl = String(
        data.drive_link || data.video_url || ""
      ).trim();
      if (!videoUrl) {
        throw new Error("No video URL returned from generator");
      }

      setResult({ ...data, drive_link: videoUrl, video_url: videoUrl });

      if (data.post) {
        onVideoSaved?.(data.post);
        if (data.alreadySaved) {
          showToast?.("This video is already saved on this post.", "info");
        } else {
          showToast?.(
            mergeTargetPostId
              ? "Video saved — use Image / Video tabs in preview"
              : "Video saved — see Videos tab",
            "success"
          );
        }
        if (Number(data.coinsDeducted) > 0) {
          onVideoChargeApplied?.();
          showToast?.(
            `${videoGenerationCoins} coins deducted for video generation ✅`,
            "success"
          );
        }
      } else {
        showToast?.("Video generated successfully", "success");
      }
    } catch (err) {
      showToast?.(err.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm mt-15"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-to-video-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-100/80 bg-white shadow-2xl shadow-amber-900/10 ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-amber-100/60 bg-gradient-to-r from-violet-50 via-amber-50 to-orange-50 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-amber-100/80 shrink-0">
              <Video className="w-5 h-5 text-amber-800" />
            </div>
            <div className="min-w-0">
              <h2
                id="image-to-video-title"
                className="text-base font-bold text-gray-900 truncate"
              >
                Image to Video
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {mergeTargetPostId
                  ? "Video attaches to this post — Image & Video tabs"
                  : "Pick a creative, upload, or attach to a post"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {previewUrl ? (
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 min-h-[160px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected source"
                referrerPolicy="no-referrer"
                className="w-full max-h-52 object-contain mx-auto"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-xs text-gray-500">
              Pick a creative or upload an image
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Source (scroll)
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 max-w-full">
              {generatedImageChoices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickPost(c.id)}
                  className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
                    String(selectedPostId) === String(c.id) && !uploadedCloudinaryUrl
                      ? "border-amber-500 ring-2 ring-amber-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  title={c.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayUrlForPostOutput(c.url)}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              <button
                type="button"
                disabled={uploadingToCloudinary}
                onClick={() => fileInputRef.current?.click()}
                className={`w-14 h-14 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 shrink-0 transition-colors ${
                  uploadingToCloudinary
                    ? "border-amber-300 bg-amber-50/50 text-amber-800"
                    : uploadedCloudinaryUrl
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "text-gray-500 border-gray-300 hover:border-amber-400 hover:text-amber-700"
                }`}
              >
                {uploadingToCloudinary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span className="text-[8px] font-medium">Cloud</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {generatedImageChoices.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No other creatives — use Cloudinary or generate a post first.
              </p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label
                htmlFor="iv-modal-prompt"
                className="text-xs font-semibold text-gray-700"
              >
                Video prompt <span className="font-normal text-gray-400">(movement &amp; motion)</span>
              </label>
              <button
                type="button"
                onClick={suggestMovementPrompt}
                disabled={aiPromptLoading || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50 transition-colors"
              >
                {aiPromptLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI movement prompt
              </button>
            </div>
            <textarea
              id="iv-modal-prompt"
              rows={3}
              value={ivPrompt}
              onChange={(e) => setIvPrompt(e.target.value)}
              placeholder="e.g. Slow orbit around the product, glowing lights pulsing softly, steam rising, shallow depth of field shifting"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 resize-y min-h-[88px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="iv-modal-duration"
                className="text-xs font-semibold text-gray-600 block mb-1"
              >
                Duration (seconds)
              </label>
              <select
                id="iv-modal-duration"
                value={ivDuration}
                onChange={(e) => setIvDuration(Number(e.target.value))}
                className="w-full sm:w-36 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 bg-white"
              >
                {DURATION_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}s
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="iv-modal-platform"
                className="text-xs font-semibold text-gray-600 block mb-1"
              >
                Platform
              </label>
              <select
                id="iv-modal-platform"
                value={ivPlatform}
                onChange={(e) => setIvPlatform(e.target.value)}
                className="w-full sm:w-44 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 bg-white"
              >
                {PLATFORM_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 text-xs text-gray-600 sm:pb-2">
              <span className="font-semibold text-gray-700">Business name</span>
              <span className="text-gray-400"> (auto)</span>
              <p
                className="mt-0.5 text-gray-800 font-medium truncate"
                title={resolvedBusinessName || "—"}
              >
                {resolvedBusinessName || "—"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-700">
              Audio (optional): Use your own voice or skip
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVoiceMode("use-voice")}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  voiceMode === "use-voice"
                    ? "border-amber-500 bg-amber-50 text-amber-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                Use my voice
              </button>
              <button
                type="button"
                onClick={() => setVoiceMode("skip")}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  voiceMode === "skip"
                    ? "border-amber-500 bg-amber-50 text-amber-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                Skip
              </button>
            </div>

            {voiceMode === "use-voice" ? (
              <div>
                <label
                  htmlFor="iv-modal-audio-url"
                  className="text-xs font-semibold text-gray-600 block mb-1"
                >
                  Audio file URL (optional)
                </label>
                <input
                  id="iv-modal-audio-url"
                  type="url"
                  value={audioFileUrl}
                  onChange={(e) => setAudioFileUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400"
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="iv-modal-audio-folder"
                  className="text-xs font-semibold text-gray-600 block mb-1"
                >
                  Audio mood (optional)
                </label>
                <select
                  id="iv-modal-audio-folder"
                  value={audioFolder}
                  onChange={(e) => setAudioFolder(e.target.value)}
                  className="w-full sm:w-44 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 bg-white"
                >
                  {AUDIO_FOLDER_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-[11px] text-center text-gray-500">
            After a successful render:{" "}
            <span className="font-semibold text-gray-800">
              {videoGenerationCoins} coins
            </span>{" "}
            deducted from wallet
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || uploadingToCloudinary}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-2.5 text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                Generate video
              </>
            )}
          </button>

          {result && (result.success === true || result.drive_link) && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 space-y-3 text-sm">
              {result.job_id && (
                <p className="text-xs text-gray-600">
                  Job ID: <span className="font-mono">{result.job_id}</span>
                </p>
              )}
              {result.drive_link && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Video
                  </p>
                  <video
                    src={result.drive_link}
                    controls
                    className="w-full max-h-48 rounded-lg bg-black"
                    playsInline
                  />
                  <a
                    href={result.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-amber-700 font-medium text-xs underline"
                  >
                    Open / download MP4
                  </a>
                </div>
              )}
              {[
                ["instagram_caption", "Instagram caption"],
                ["facebook_caption", "Facebook caption"],
                ["instagram_hashtags", "Instagram hashtags"],
                ["facebook_hashtags", "Facebook hashtags"],
              ].map(([key, label]) => {
                const val = result[key];
                const text = Array.isArray(val) ? val.join(" ") : val;
                if (!text) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-gray-700">{label}</p>
                      <button
                        type="button"
                        onClick={() => copyText(String(text), key)}
                        className="p-1 rounded-md hover:bg-green-100 text-gray-600"
                        aria-label={`Copy ${label}`}
                      >
                        {copiedField === key ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-800 whitespace-pre-wrap break-words bg-white/80 rounded-lg p-2 border border-green-100">
                      {String(text)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
