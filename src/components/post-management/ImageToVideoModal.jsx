"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import {
  savePostAction,
  updatePostStatusAction,
  getUserWalletAction,
  deductFromWalletAction,
} from "@/app/actions/postActions";
import { getLocalStorage } from "@/utils/storage";

const AUDIO_FOLDER_FIXED = "basic";
const DURATION_OPTIONS = [4, 6, 8, 10, 12, 15];

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

const ImageToVideoModal = React.memo(({
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
}) => {
  const [ivPrompt, setIvPrompt] = useState("");
  const [ivDuration, setIvDuration] = useState(8);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [uploadedCloudinaryUrl, setUploadedCloudinaryUrl] = useState(null);
  const [mergeTargetPostId, setMergeTargetPostId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [result, setResult] = useState(null);
  
  const [uiState, setUiState] = useState({
    loading: false,
    uploadingToCloudinary: false,
    aiPromptLoading: false,
  });

  const updateUiState = useCallback((updates) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const fileInputRef = useRef(null);

  const initialPostId = initialPost?._id != null ? String(initialPost._id) : "";
  const initialOutput = initialPost?.aiOutput;

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setIvPrompt("");
    setIvDuration(8);
    setCopiedField(null);
    updateUiState({ aiPromptLoading: false });
    
    if (
      initialPostId &&
      typeof initialOutput === "string" &&
      isLikelyImageOutput(initialOutput)
    ) {
      setSelectedPostId(initialPostId);
      setUploadedS3Url(null);
      setMergeTargetPostId(initialPostId);
    } else {
      setSelectedPostId(null);
      setUploadedS3Url(null);
      setMergeTargetPostId(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpen, initialPostId, initialOutput, updateUiState]);

  /** Prefill movement-focused video prompt from the image prompt (OpenAI). */
  useEffect(() => {
    if (!isOpen) return;
    const base = (initialPost?.promat && String(initialPost.promat).trim()) ||
                 (postPrompt && String(postPrompt).trim()) || "";
    if (!base) return;
    
    let cancelled = false;
    const fetchAiPrompt = async () => {
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
      } catch { /* optional prefill */ }
    };
    
    fetchAiPrompt();
    return () => { cancelled = true; };
  }, [isOpen, initialPostId, initialPost?.promat, postPrompt]);

  const generatedImageChoices = useMemo(() => {
    return posts
      .filter(p => !isPostVideoMedia(p))
      .map(p => {
        const raw = p?.aiOutput;
        if (!raw || typeof raw !== "string" || !raw.trim() || !isLikelyImageOutput(raw)) return null;
        const id = p?._id != null ? String(p._id) : null;
        if (!id) return null;
        const desc = (p?.description || "").trim();
        const label = desc.length > 24 ? `${desc.slice(0, 24)}…` : desc || "Creative";
        return { id, url: raw.trim(), label };
      })
      .filter(Boolean);
  }, [posts]);

  const resolvedBusinessName = useMemo(
    () => resolveBusinessNameForGeneration({
      fromInput: "",
      selectedBusinessName: selectedBusiness?.name,
      bussinessTitle,
      availableLocations,
      prompt: postPrompt,
    }),
    [selectedBusiness?.name, bussinessTitle, availableLocations, postPrompt]
  );

  const selectedSourceUrl = useMemo(() => {
    if (uploadedS3Url) return uploadedS3Url;
    if (!selectedPostId) return null;
    const row = generatedImageChoices.find((c) => String(c.id) === String(selectedPostId));
    if (row?.url) return row.url;
    if (String(initialPostId) === String(selectedPostId) && typeof initialOutput === "string") {
      return initialOutput.trim() || null;
    }
    return null;
  }, [uploadedCloudinaryUrl, selectedPostId, generatedImageChoices, initialPostId, initialOutput]);

  const effectiveImagePayload = useMemo(() => {
    if (uploadedCloudinaryUrl) return { image_url: uploadedCloudinaryUrl, source: "upload" };
    if (!selectedSourceUrl) return null;
    const u = selectedSourceUrl;
    if (u.startsWith("http://") || u.startsWith("https://")) {
      return { image_url: u, source: "post" };
    }
    const dataUrl = u.startsWith("data:") ? u : `data:image/png;base64,${u}`;
    return { image: dataUrl, source: "post" };
  }, [uploadedS3Url, selectedSourceUrl]);

  const previewUrl = useMemo(() => {
    return selectedSourceUrl ? displayUrlForPostOutput(selectedSourceUrl) : null;
  }, [selectedSourceUrl]);

  const pickPost = useCallback((id) => {
    setUploadedCloudinaryUrl(null);
    setSelectedPostId(id);
    setMergeTargetPostId(id != null ? String(id) : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileChange = useCallback(async (e) => {
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

    updateUiState({ uploadingToCloudinary: true });
    setSelectedPostId(null);
    setUploadedS3Url(null);
    setMergeTargetPostId(null);
    try {
      const sigData = await getCloudinarySignatureAction();
      if (!sigData.success) throw new Error(sigData.error || "Failed to get upload signature");

      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await uploadToS3Action(formData);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
      }

      setUploadedS3Url(uploadResult.url);
      showToast?.("Image uploaded to S3", "success");
    } catch (err) {
      showToast?.(err.message || "Upload failed", "error");
    } finally {
      updateUiState({ uploadingToCloudinary: false });
      e.target.value = "";
    }
  }, [showToast, updateUiState]);

  const mergeTargetPost = useMemo(() => {
    return mergeTargetPostId ? posts.find((p) => String(p._id) === String(mergeTargetPostId)) : null;
  }, [mergeTargetPostId, posts]);

  const suggestMovementPrompt = useCallback(async () => {
    const base = (mergeTargetPost?.promat && String(mergeTargetPost.promat).trim()) ||
                 (initialPost?.promat && String(initialPost.promat).trim()) ||
                 (postPrompt && String(postPrompt).trim()) || ivPrompt.trim();
    if (!base) {
      showToast?.("Add an image prompt or video notes first.", "error");
      return;
    }
    updateUiState({ aiPromptLoading: true });
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
      updateUiState({ aiPromptLoading: false });
    }
  }, [mergeTargetPost, initialPost, postPrompt, ivPrompt, showToast, updateUiState]);

  const copyText = useCallback(async (text, field) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      showToast?.("Copied to clipboard", "success");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast?.("Could not copy", "error");
    }
  }, [showToast]);

  const handleGenerate = useCallback(async () => {
    if (!ivPrompt.trim()) return showToast?.("Enter a video effect / prompt.", "error");
    if (!effectiveImagePayload) return showToast?.("Select a creative below or upload via Cloudinary.", "error");

    const userId = getLocalStorage("userId");
    if (!userId) return showToast?.("Please sign in again.", "error");

    const walletRes = await getUserWalletAction(userId);
    const bal = Number(walletRes?.wallet ?? 0);
    if (bal < videoGenerationCoins) {
      onVideoInsufficientBalance?.();
      return showToast?.(`You need ${videoGenerationCoins} coins for video generation.`, "error");
    }

    updateUiState({ loading: true });
    setResult(null);
    try {
      const motionPrompt =
        ivPrompt.trim() ||
        "Create an engaging business promotional video.";
      const body = {
        prompt: ivPrompt.trim(),
        business_name: resolvedBusinessName || "Business",
        duration: ivDuration,
        audio_folder: AUDIO_FOLDER_FIXED,
        platform: "both",
      };
      if (effectiveImagePayload.image_url) body.image_url = effectiveImagePayload.image_url;
      else body.image = effectiveImagePayload.image;

      const res = await fetch("/api/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || data.message || "Video generation failed");
      if (data.success === false && !data.drive_link) throw new Error(typeof data.error === "string" ? data.error : data.message || "Video generation failed");

      const videoUrl = String(
        data.drive_link || data.video_url || ""
      ).trim();
      if (!videoUrl) {
        throw new Error("No video URL returned from generator");
      }

      if (userId && data.drive_link) {
        const wd = await deductFromWalletAction(userId, {
          amount: videoGenerationCoins,
          type: "deduct",
          reason: "video_generated",
          metadata: { source: mergeTargetPostId ? "image_to_video_merge" : "image_to_video_new" },
        });
        if (wd.error) showToast?.(wd.error, "error");
        else {
          onVideoChargeApplied?.();
          showToast?.(`${videoGenerationCoins} coins deducted for video generation ✅`, "success");
        }

        const ig = typeof data.instagram_caption === "string" ? data.instagram_caption.trim() : "";
        const fb = typeof data.facebook_caption === "string" ? data.facebook_caption.trim() : "";
        const description = [ig, fb].filter(Boolean).join("\n\n").trim() || ivPrompt.trim() || "Video creative";

        if (mergeTargetPostId) {
          const st = mergeTargetPost?.status || "pending";
          const upd = await updatePostStatusAction({
            id: mergeTargetPostId, userId, status: st, videoOutput: data.drive_link, videoPrompt: ivPrompt.trim(),
            ...(fb ? { fbDescription: fb } : {}), ...(ig ? { igDescription: ig } : {})
          });
          if (upd.success && upd.data) {
            onVideoSaved?.(upd.data);
            showToast?.("Video added — use Image / Video tabs in preview", "success");
          } else throw new Error(upd.error || "Video generated but could not attach to this post.");
        } else {
          const saveRes = await savePostAction({
            userId, aiOutput: data.drive_link, description, promat: "Image to Video",
            status: "pending", mediaType: "video", gmbDescription: ig || description,
            fbDescription: fb || description, igDescription: ig || description,
          });
          if (saveRes.success && saveRes.data) {
            onVideoSaved?.(saveRes.data);
            showToast?.("Video saved — see Videos tab", "success");
          } else throw new Error(saveRes.error || "Video generated but could not save to your library.");
        }
      } else showToast?.("Video generated successfully", "success");
    } catch (err) {
      showToast?.(err.message || "Something went wrong", "error");
    } finally {
      updateUiState({ loading: false });
    }
  }, [ivPrompt, effectiveImagePayload, videoGenerationCoins, resolvedBusinessName, ivDuration, mergeTargetPostId, mergeTargetPost?.status, onVideoChargeApplied, showToast, updateUiState, onVideoInsufficientBalance, onVideoSaved]);

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
              <h2 id="image-to-video-title" className="text-base font-bold text-gray-900 truncate">Image to Video</h2>
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
              <img src={previewUrl} alt="Selected source" referrerPolicy="no-referrer" className="w-full max-h-52 object-contain mx-auto" />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-xs text-gray-500">
              Pick a creative or upload an image
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Source (scroll)</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 max-w-full">
              {generatedImageChoices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickPost(c.id)}
                  className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${String(selectedPostId) === String(c.id) && !uploadedS3Url
                      ? "border-amber-500 ring-2 ring-amber-200"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                  title={c.label}
                >
                  <img src={displayUrlForPostOutput(c.url)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
              <button
                type="button"
                disabled={uiState.uploadingToCloudinary}
                onClick={() => fileInputRef.current?.click()}
                className={`w-14 h-14 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 shrink-0 transition-colors ${
                  uiState.uploadingToCloudinary
                    ? "border-amber-300 bg-amber-50/50 text-amber-800"
                    : uploadedS3Url
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "text-gray-500 border-gray-300 hover:border-amber-400 hover:text-amber-700"
                  }`}
              >
                {uiState.uploadingToCloudinary ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span className="text-[8px] font-medium">Cloud</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            {generatedImageChoices.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No other creatives — use Cloudinary or generate a post first.</p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label htmlFor="iv-modal-prompt" className="text-xs font-semibold text-gray-700">
                Video prompt <span className="font-normal text-gray-400">(movement &amp; motion)</span>
              </label>
              <button
                type="button"
                onClick={suggestMovementPrompt}
                disabled={uiState.aiPromptLoading || uiState.loading}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50 transition-colors"
              >
                {uiState.aiPromptLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
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
              <label htmlFor="iv-modal-duration" className="text-xs font-semibold text-gray-600 block mb-1">Duration (seconds)</label>
              <select
                id="iv-modal-duration"
                value={ivDuration}
                onChange={(e) => setIvDuration(Number(e.target.value))}
                className="w-full sm:w-36 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 bg-white"
              >
                {DURATION_OPTIONS.map((n) => <option key={n} value={n}>{n}s</option>)}
              </select>
            </div>
            <div className="flex-1 text-xs text-gray-600 sm:pb-2">
              <span className="font-semibold text-gray-700">Business name</span>
              <span className="text-gray-400"> (auto)</span>
              <p className="mt-0.5 text-gray-800 font-medium truncate" title={resolvedBusinessName || "—"}>{resolvedBusinessName || "—"}</p>
              <p className="mt-1 text-gray-400">Audio: <code className="text-gray-600">{AUDIO_FOLDER_FIXED}</code></p>
            </div>
          </div>

          <p className="text-[11px] text-center text-gray-500">After a successful render: <span className="font-semibold text-gray-800">{videoGenerationCoins} coins</span> deducted from wallet</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={uiState.loading || uiState.uploadingToCloudinary}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-semibold px-6 py-2.5 text-sm shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {uiState.loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Video className="w-4 h-4" /> Generate video</>}
          </button>

          {result && (result.success === true || result.drive_link) && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 space-y-3 text-sm">
              {result.job_id && <p className="text-xs text-gray-600">Job ID: <span className="font-mono">{result.job_id}</span></p>}
              {result.drive_link && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Video</p>
                  <video src={result.drive_link} controls className="w-full max-h-48 rounded-lg bg-black" playsInline />
                  <a href={result.drive_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-amber-700 font-medium text-xs underline">Open / download MP4</a>
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
                      <button type="button" onClick={() => copyText(String(text), key)} className="p-1 rounded-md hover:bg-green-100 text-gray-600" aria-label={`Copy ${label}`}>
                        {copiedField === key ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-800 whitespace-pre-wrap break-words bg-white/80 rounded-lg p-2 border border-green-100">{String(text)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ImageToVideoModal.displayName = "ImageToVideoModal";

export default ImageToVideoModal;