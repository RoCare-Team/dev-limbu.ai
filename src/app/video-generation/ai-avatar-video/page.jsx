"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clapperboard,
  Coins,
  Sparkles,
  X,
  User as UserIcon,
  Mic2,
  Globe2,
  ScrollText,
  Wand2,
  PlayCircle,
  Loader2,
  ImageIcon,
  RefreshCw,
  ImagePlus,
  Check,
  Eye,
  Clock,
} from "lucide-react";
import Toast from "@/components/Toast";
import { emitWalletDeduct } from "@/utils/walletEvents";

/* ----------------------------------------------------
   CONSTANTS
---------------------------------------------------- */
const COST_PER_SECOND = 20; // actual charge = round(video duration in seconds) * this, after generation
const MIN_BALANCE_REQUIRED = 500; // wallet must hold at least this to even attempt a generation
const LANGUAGES = ["Hindi", "English", "Hinglish", "Tamil", "Telugu", "Marathi", "Bengali"];
const ASPECT_RATIOS = ["16:9", "9:16", "4:5", "5:4", "1:1"];
// The API holds the connection open for the whole render — allow a generous client timeout.
const GENERATE_TIMEOUT_MS = 14.5 * 60 * 1000;

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

export default function AiAvatarVideoPage() {
  const [userId, setUserId] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* -------------------- Characters / Voices -------------------- */
  const [characters, setCharacters] = useState([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  /* -------------------- Form state -------------------- */
  const [mode, setMode] = useState("character"); // "character" | "photo"
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [customPhoto, setCustomPhoto] = useState(null); // { file, preview }
  const [photoGender, setPhotoGender] = useState("female");

  const [script, setScript] = useState("");
  const [background, setBackground] = useState("");
  const [pose, setPose] = useState("");
  const [logo, setLogo] = useState(null);

  const [language, setLanguage] = useState("Hindi");
  const [voiceId, setVoiceId] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const audioRef = useRef(null);

  /* -------------------- Preview image -------------------- */
  const [previewImage, setPreviewImage] = useState(null); // object URL
  const [generatingPreview, setGeneratingPreview] = useState(false);

  /* -------------------- Video generation -------------------- */
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultVideo, setResultVideo] = useState(null); // { videoUrl, videoId, storage, durationSeconds }

  /* -------------------- History -------------------- */
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const scriptWordCount = useMemo(
    () => script.trim().split(/\s+/).filter(Boolean).length,
    [script],
  );

  /* ---------------------------- INIT ---------------------------- */
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (uid) {
      setUserId(uid);
      fetch(`/api/users/userbalance?userId=${uid}`)
        .then((r) => r.json())
        .then((d) => setWalletBalance(d?.user?.wallet ?? d?.wallet ?? 0))
        .catch(() => setWalletBalance(0));

      setLoadingHistory(true);
      fetch(`/api/ai-avatar-video-history?userId=${uid}`)
        .then((r) => r.json())
        .then((d) => setHistory(d.success ? d.data || [] : []))
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    } else {
      setLoadingHistory(false);
    }

    setLoadingCharacters(true);
    fetch("/api/ai-avatar-video/characters")
      .then((r) => r.json())
      .then((d) => {
        const list = d.success ? d.characters || [] : [];
        setCharacters(list);
        if (list.length) setSelectedCharacterId(list[0].id);
      })
      .catch(() => setCharacters([]))
      .finally(() => setLoadingCharacters(false));
  }, []);

  /* -------------------- Load voices when language/gender change -------------------- */
  useEffect(() => {
    const gender =
      mode === "photo" ? photoGender : characters.find((c) => c.id === selectedCharacterId)?.gender;
    setLoadingVoices(true);
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    if (gender) params.set("gender", gender);
    fetch(`/api/ai-avatar-video/voices?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.success ? d.voices || [] : [];
        setVoices(list);
        setVoiceId((prev) => (list.some((v) => v.voice_id === prev) ? prev : ""));
      })
      .catch(() => setVoices([]))
      .finally(() => setLoadingVoices(false));
  }, [language, mode, photoGender, selectedCharacterId, characters]);

  const persistAndDeduct = async (videoUrl, videoId, storage, durationSeconds) => {
    if (!userId || !videoUrl) return;

    // Actual charge is metered by the finished video's length — 20 coins per second,
    // rounded up so a 15.7s video is billed as 16s, never under-charged.
    const actualCost =
      typeof durationSeconds === "number" && durationSeconds > 0
        ? Math.ceil(durationSeconds) * COST_PER_SECOND
        : MIN_BALANCE_REQUIRED;

    const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
    const selectedVoice = voices.find((v) => v.voice_id === voiceId);

    try {
      const res = await fetch("/api/ai-avatar-video-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mode,
          characterId: mode === "character" ? selectedCharacterId : null,
          characterName: mode === "character" ? selectedCharacter?.name : null,
          script: script.trim(),
          background: background.trim(),
          pose: pose.trim(),
          language,
          voiceId: voiceId || null,
          voiceName: selectedVoice?.name || null,
          aspectRatio,
          videoUrl,
          videoId,
          storage,
          durationSeconds,
          cost: actualCost,
        }),
      });
      const saved = await res.json().catch(() => ({}));
      if (saved.success && saved.data) {
        setHistory((prev) => [saved.data, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save avatar video history:", err);
    }

    try {
      const walletData = await deductFromWalletAction(userId, {
        amount: actualCost,
        type: "deduct",
        reason: "video_generated_ai_avatar",
        metadata: { mode, characterId: selectedCharacterId, videoUrl, durationSeconds },
      });
      const newBalance = walletData?.wallet ?? walletData?.data?.wallet ?? walletData?.user?.wallet;
      setWalletBalance(
        typeof newBalance === "number" ? newBalance : (b) => Math.max(0, (b ?? 0) - actualCost)
      );
      emitWalletDeduct(actualCost);
      showToast(`${actualCost} coins deducted (${durationSeconds?.toFixed(1) ?? "?"}s video) 💰`, "info");
    } catch (err) {
      console.error(err);
      showToast("Video created, but coin deduction failed. Please contact support.", "warning");
    }
  };

  /* ---------------------------- Handlers ---------------------------- */
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  const applyPhotoFile = (file) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast("Please upload a PNG, JPG or WEBP photo.", "error");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast("Photo must be under 25 MB.", "error");
      return;
    }
    setCustomPhoto((prev) => {
      if (prev?.preview) URL.revokeObjectURL(prev.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
    setMode("photo");
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    applyPhotoFile(file);
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    applyPhotoFile(e.dataTransfer.files?.[0]);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogo(file);
  };

  const insufficientBalance = walletBalance !== null && walletBalance < MIN_BALANCE_REQUIRED;

  const canGeneratePreview =
    !generatingPreview && (mode === "character" ? !!selectedCharacterId : !!customPhoto);

  const canGenerateVideo =
    !isGenerating &&
    !!userId &&
    !insufficientBalance &&
    script.trim() &&
    (mode === "character" ? !!selectedCharacterId : !!customPhoto);

  const buildBaseForm = () => {
    const form = new FormData();
    form.append("mode", mode);
    if (mode === "character") {
      form.append("character_id", selectedCharacterId);
    } else {
      form.append("image", customPhoto.file);
      form.append("gender", photoGender);
    }
    if (background.trim()) form.append("background", background.trim());
    if (pose.trim()) form.append("pose", pose.trim());
    if (logo) form.append("logo", logo);
    form.append("aspect_ratio", aspectRatio);
    return form;
  };

  const handleGeneratePreview = async () => {
    if (!canGeneratePreview) return;
    setGeneratingPreview(true);
    try {
      const form = buildBaseForm();
      const res = await fetch("/api/ai-avatar-video/generate-image", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Preview generation failed.");
      }
      const blob = await res.blob();
      if (previewImage) URL.revokeObjectURL(previewImage);
      setPreviewImage(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to generate preview.", "error");
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!userId) return showToast("Please log in to generate videos.", "error");
    if (!script.trim()) return showToast("Please write a script for your avatar to speak.", "error");
    if (mode === "photo" && !customPhoto) return showToast("Please upload a photo.", "error");
    if (insufficientBalance) {
      return showToast(`You need at least ${MIN_BALANCE_REQUIRED} coins in your wallet to generate a video.`, "error");
    }

    setIsGenerating(true);
    setResultVideo(null);
    showToast("Generation started — this usually takes 5–12 minutes. Please keep this tab open.", "info");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

    try {
      const form = buildBaseForm();
      form.append("script", script.trim());
      form.append("resolution", "1080p");
      form.append("engine", "avatar_iv");
      form.append("expressiveness", "high");
      form.append("captions", "true");
      if (language) form.append("language", language.toLowerCase());
      if (voiceId) form.append("voice_id", voiceId);

      // The API is synchronous — this single request stays open for the entire render
      // (5-12 min) and resolves with the finished video_url. Nothing to poll.
      const res = await fetch("/api/ai-avatar-video/generate-video", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Video generation failed.");
      }

      const result = data.data || {};
      const videoUrl = result.video_url;
      if (!videoUrl) throw new Error("Video generated but no video URL was returned.");

      setResultVideo({
        videoUrl,
        videoId: result.video_id,
        storage: result.storage,
        durationSeconds: result.duration_seconds,
      });
      showToast("🎬 Avatar video generated successfully!", "success");
      await persistAndDeduct(videoUrl, result.video_id, result.storage, result.duration_seconds);
    } catch (err) {
      console.error(err);
      if (err.name === "AbortError") {
        showToast("Video generation timed out. Please try again.", "error");
      } else {
        showToast(err.message || "Failed to generate video.", "error");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  // Preview frame keeps the chosen aspect ratio visually true instead of always filling a fixed box.
  const ratioParts = aspectRatio.split(":").map(Number);
  const previewAspect = ratioParts.length === 2 && ratioParts[1] ? ratioParts[0] / ratioParts[1] : 16 / 9;

  const stage = resultVideo?.videoUrl ? "ready" : isGenerating ? "rendering" : "idle";

  return (
    <div className="font-inter">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAB308] flex items-center justify-center shadow-[0_0_15px_rgba(253,224,71,0.3)] shrink-0">
            <UserIcon className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-wide">
              AI <span className="text-[#EAB308]">Avatar Video</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Turn a script into a talking-avatar video for your business
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-2xl px-4 py-3">
          <Coins className="w-4 h-4 text-[#EAB308]" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-slate-900/70">{COST_PER_SECOND} coins / second</span>
            <span className="text-[10px] text-slate-400 font-medium">Min. {MIN_BALANCE_REQUIRED} coins to start</span>
          </div>
        </div>
      </div>

      {insufficientBalance && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
          <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-700">
            You need at least {MIN_BALANCE_REQUIRED} coins in your wallet to generate a video. Current balance:{" "}
            {walletBalance ?? 0} coins.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form — sections flow top to bottom: avatar first, then scene & script, then voice & format */}
        <div className="lg:col-span-3 space-y-4">
            <SectionCard step={1} title="Choose Your Avatar" icon={UserIcon}>
              <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-100 max-w-xs mb-4">
                {["character", "photo"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setMode(m)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                      mode === m ? "bg-[#EAB308] text-black shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {m === "character" ? "Preset Character" : "Upload Photo"}
                  </button>
                ))}
              </div>

              {mode === "character" ? (
                loadingCharacters ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading characters…
                  </div>
                ) : characters.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No characters available right now.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {characters.map((c) => {
                      const active = selectedCharacterId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => setSelectedCharacterId(c.id)}
                          className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                            active
                              ? "border-[#EAB308] bg-[#EAB308]/10 ring-2 ring-[#EAB308]/40 shadow-sm"
                              : "border-slate-200 bg-slate-50 hover:border-[#EAB308]/40 hover:-translate-y-0.5"
                          }`}
                        >
                          {active && (
                            <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-[#EAB308] text-black">
                              <CheckIcon />
                            </span>
                          )}
                          <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-black text-white shadow-inner ${avatarGradient(
                              c.name
                            )}`}
                          >
                            {initials(c.name)}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{c.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium capitalize">
                            {c.gender} · {c.language}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handlePhotoDrop}
                    className={`relative flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-7 cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#EAB308] bg-[#EAB308]/10 scale-[1.01]"
                        : customPhoto
                        ? "border-[#EAB308]/50 bg-[#EAB308]/5"
                        : "border-slate-300 bg-slate-50 hover:border-[#EAB308]/50 hover:bg-[#EAB308]/5"
                    }`}
                  >
                    {customPhoto ? (
                      <>
                        <div className="relative">
                          <img
                            src={customPhoto.preview}
                            alt="Custom avatar"
                            className="w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-md"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomPhoto(null);
                            }}
                            className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white shadow-md hover:bg-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-slate-900">{customPhoto.file.name}</p>
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
                            Drag &amp; drop a photo, or{" "}
                            <span className="text-[#EAB308] underline underline-offset-2">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG or WEBP — max 25 MB</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* Photo guidance checklist — the single biggest factor in a natural-looking avatar */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">
                      For the best result
                    </p>
                    {[
                      "Waist-up shot with both hands visible",
                      "Front-facing, looking at the camera",
                      "Good even lighting, neutral expression",
                      "No sunglasses or hat covering the forehead",
                    ].map((tip) => (
                      <div key={tip} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] text-slate-600">{tip}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    {["female", "male"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setPhotoGender(g)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                          photoGender === g
                            ? "bg-[#EAB308] border-[#EAB308] text-black"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#EAB308]/40"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard step={2} title="Scene & Script" icon={ScrollText}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900/90">Background</label>
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    disabled={isGenerating}
                    placeholder="e.g., modern office cabin, soft window light"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900/90">Pose</label>
                  <input
                    type="text"
                    value={pose}
                    onChange={(e) => setPose(e.target.value)}
                    disabled={isGenerating}
                    placeholder="e.g., standing, both hands relaxed in front"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 cursor-pointer hover:border-[#EAB308]/50 transition-all mb-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    {logo ? logo.name : "Add brand logo (optional)"}
                  </p>
                </div>
                {logo && (
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

              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={!canGeneratePreview}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#EAB308] bg-[#EAB308]/10 py-2.5 text-xs font-bold text-slate-900 hover:bg-[#EAB308]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {generatingPreview ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {generatingPreview ? "Generating preview…" : "Preview Look (free)"}
              </button>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900/90">Script *</label>
                  <span className="text-[10px] text-slate-400 font-medium">{scriptWordCount} words</span>
                </div>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  disabled={isGenerating}
                  rows={5}
                  placeholder="Write what your avatar should say, e.g. Namaste! Main aapki AI avatar hoon..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all resize-none disabled:opacity-60"
                />
              </div>
            </SectionCard>

            <SectionCard step={3} title="Voice & Format" icon={Mic2}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900/90 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-[#EAB308]" />
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isGenerating}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900/90 flex items-center gap-1.5">
                    <Mic2 className="w-3.5 h-3.5 text-[#EAB308]" />
                    Voice
                  </label>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    disabled={isGenerating || loadingVoices}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                  >
                    <option value="">{loadingVoices ? "Loading…" : "Auto-select"}</option>
                    {voices.slice(0, 100).map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900/90">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    disabled={isGenerating}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all disabled:opacity-60"
                  >
                    {ASPECT_RATIOS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </SectionCard>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={!canGenerateVideo}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] py-3.5 text-sm font-black uppercase tracking-wide text-black shadow-md hover:brightness-95 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isGenerating
              ? "Generating… (5–12 min)"
              : `Generate Avatar Video — ${COST_PER_SECOND} coins/sec`}
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
              className="relative w-full rounded-lg bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-3 overflow-hidden mx-auto"
              style={{ aspectRatio: previewAspect, maxHeight: "60vh" }}
            >
              {resultVideo?.videoUrl ? (
                <video
                  src={resultVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain rounded-lg bg-black"
                />
              ) : isGenerating ? (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div className="relative w-14 h-14">
                    <Loader2 className="w-14 h-14 text-[#EAB308] animate-spin" />
                    <Wand2 className="w-5 h-5 text-[#EAB308] absolute inset-0 m-auto" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Rendering your avatar video…</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    This usually takes 5–12 minutes. Please keep this tab open — the render runs
                    on this connection and closing the tab will stop it.
                  </p>
                </div>
              ) : previewImage ? (
                <img
                  src={previewImage}
                  alt="Avatar preview"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <>
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-inner text-2xl font-black text-white ${
                      customPhoto ? "" : avatarGradient(selectedCharacter?.name || mode)
                    }`}
                  >
                    {customPhoto ? (
                      <img
                        src={customPhoto.preview}
                        alt="Selected avatar"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      initials(selectedCharacter?.name || "?")
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {mode === "photo" ? "Your photo" : selectedCharacter?.name || "Select an avatar"}
                  </p>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-400">
                    <PlayCircle className="w-3.5 h-3.5" />
                    No preview yet
                  </div>
                </>
              )}
            </div>

            {resultVideo?.videoUrl && typeof resultVideo.durationSeconds === "number" && (
              <p className="mt-3 text-center text-[10px] text-slate-400 font-medium">
                Duration: {resultVideo.durationSeconds.toFixed(1)}s
              </p>
            )}

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Tip: a waist-up photo with both hands visible produces the most natural hand gestures.
              Preview the look first — it's free and skips wasting a full render on a background you
              don't want.
            </p>
          </div>
        </div>
      </div>

      {/* History — every avatar video this user has generated */}
      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900/60 mb-3 px-1">
          <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
          Your Generated Videos
        </h2>

        {loadingHistory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900/60">No AI Avatar videos yet</p>
            <p className="text-xs text-slate-900/30">Generate one above and it'll show up here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {history.map((item) => (
              <HistoryVideoCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   HISTORY CARD
---------------------------------------------------- */
function HistoryVideoCard({ item }) {
  const createdLabel = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : "";

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative h-40 bg-black group">
        <video src={item.videoUrl} className="w-full h-full object-contain bg-black" controls />

        {createdLabel && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full border border-white/70 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm pointer-events-none">
            {createdLabel}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-bold text-slate-900 text-xs truncate">
          {item.mode === "photo" ? "Uploaded Photo" : item.characterName || "Avatar"}
        </h3>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">{item.script}</p>
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {item.language && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 px-1.5 py-0.5 rounded-full">
              <Globe2 className="w-2.5 h-2.5" /> {item.language}
            </span>
          )}
          {typeof item.durationSeconds === "number" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" /> {item.durationSeconds.toFixed(1)}s
            </span>
          )}
          {item.mode === "photo" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full">
              <UserIcon className="w-2.5 h-2.5" /> Photo
            </span>
          )}
        </div>
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
      <path d="M2 6.2 4.8 9 10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-rose-400 to-pink-500",
  "bg-gradient-to-br from-sky-400 to-blue-500",
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-br from-violet-400 to-purple-500",
];

function avatarGradient(seed = "") {
  const idx = String(seed)
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
}

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}
