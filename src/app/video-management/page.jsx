"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  Share2,
  Video,
  ArrowLeft,
  PlayCircle,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Toast from "../../components/Toast";
import LoadingOverlay from "../../components/LoadingOverlay";
import RejectReasonModal from "../../components/RejectReasonModal";

/* ----------------------------------------------------
   CONSTANTS
---------------------------------------------------- */
const VIDEO_GENERATION_TIMEOUT = 6 * 60 * 1000; // 6 minutes in milliseconds
const POLLING_INTERVAL = 5000; // 5 seconds between status checks
const COUNTDOWN_SECONDS = 360; // 6 minutes in seconds

/* ----------------------------------------------------
   WALLET DEDUCTION ACTION
---------------------------------------------------- */
async function deductFromWalletAction(userId, payload) {
  try {
    const walletRes = await fetch(
      `/api/auth/signup?userId=${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!walletRes.ok) {
      const errorData = await walletRes.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to deduct from wallet");
    }

    return await walletRes.json();
  } catch (error) {
    console.error("Wallet deduction error:", error);
    throw error;
  }
}

/* ----------------------------------------------------
   VIDEO GENERATION WITH TIMEOUT
---------------------------------------------------- */
async function generateVideoWithTimeout(payload, timeoutMs = VIDEO_GENERATION_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("/api/video-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Video generation timed out after 6 minutes");
    }
    throw error;
  }
}

/* ----------------------------------------------------
   FILE TO BASE64 CONVERTER
---------------------------------------------------- */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
  });

/* ----------------------------------------------------
   IMAGE + INPUT FORM COMPONENT
---------------------------------------------------- */
const VideoInput = ({
  prompt,
  setPrompt,
  productName,
  setProductName,
  size,
  setSize,
  productImage,
  setProductImage,
  onGenerate,
  loading,
}) => {
  const removeImage = () => setProductImage(null);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-blue-200 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col space-y-4 sm:space-y-6">
        {/* Video Prompt */}
        <div className="space-y-2 sm:space-y-3">
          <label className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            What video would you like to create?
          </label>

          <textarea
            placeholder="Describe your video idea in detail..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800 focus:ring-4 focus:ring-blue-300 outline-none resize-none min-h-[120px]"
            disabled={loading}
          />
        </div>

        {/* Product Name */}
        <div className="space-y-2 sm:space-y-3">
          <label className="text-base sm:text-lg font-bold text-gray-800">
            Product Name
          </label>

          <input
            type="text"
            placeholder="e.g., My Awesome Product"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800 focus:ring-4 focus:ring-blue-300 outline-none"
            disabled={loading}
          />
        </div>

        {/* Product Image Upload */}
        <div className="space-y-2 sm:space-y-3">
          <label className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-green-500" />
            Product Image
          </label>

          {!productImage ? (
            <label className="flex flex-col items-center justify-center w-full h-36 border-3 border-dashed border-gray-400 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-base text-gray-700 font-semibold">
                Click to upload image
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      alert("File size must be less than 10MB");
                      return;
                    }
                    setProductImage(file);
                  }
                }}
                className="hidden"
                disabled={loading}
              />
            </label>
          ) : (
            <div className="relative w-full h-36 bg-gray-100 rounded-xl border-2 border-gray-300 p-4">
              <img
                src={URL.createObjectURL(productImage)}
                className="w-full h-full object-contain rounded-lg"
                alt="Product preview"
              />

              <button
                onClick={removeImage}
                disabled={loading}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Video Size */}
        <div className="space-y-3">
          <label className="text-lg font-bold text-gray-800">Video Size</label>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSize("9:16")}
              disabled={loading}
              className={`p-4 border-2 rounded-xl flex flex-col items-center transition ${
                size === "9:16"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                  : "border-gray-300 bg-white hover:border-blue-300"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="w-8 h-14 bg-gray-300 mb-2 rounded-md" />
              <span className="font-semibold text-gray-800">Portrait</span>
              <span className="text-xs text-gray-500">9:16</span>
            </button>

            <button
              onClick={() => setSize("16:9")}
              disabled={loading}
              className={`p-4 border-2 rounded-xl flex flex-col items-center transition ${
                size === "16:9"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                  : "border-gray-300 bg-white hover:border-blue-300"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="w-14 h-8 bg-gray-300 mb-2 rounded-md" />
              <span className="font-semibold text-gray-800">Landscape</span>
              <span className="text-xs text-gray-500">16:9</span>
            </button>
          </div>
        </div>

        {/* Generate Button */}
        {/* <button
          onClick={onGenerate}
          disabled={
            loading || !prompt.trim() || !productName.trim() || !productImage
          }
          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-black text-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Video className="w-6 h-6 inline-block mr-2" />
          {loading ? "Generating Video..." : "Generate Video with AI"}
        </button> */}

        {loading && (
          <p className="text-center text-sm text-gray-600">
            ⏱️ This may take up to 6 minutes. Please wait...
          </p>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   VIDEO CARD COMPONENT
---------------------------------------------------- */
const VideoCard = ({
  video,
  handleDownload,
  handleShare,
  onApprove,
  onReject,
}) => {
  const { videoUrl, prompt, productName, status, _id } = video;

  return (
    <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition flex flex-col">
      <div className="relative group">
        <video
          src={videoUrl}
          className="w-full h-48 object-cover bg-black"
          controls
          loop
          muted
        />
        <div
          className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm
          ${
            status === "approved"
              ? "bg-green-500 text-white"
              : status === "rejected"
              ? "bg-red-500 text-white"
              : "bg-yellow-500 text-white"
          }`}
        >
          {status || "pending"}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow space-y-3">
        <div>
          <h3 className="font-bold text-gray-800 truncate">
            {productName || "Product Video"}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2" title={prompt}>
            {prompt || "No description"}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          {status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(_id)}
                className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-sm font-bold hover:bg-green-200 transition flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => onReject(_id)}
                className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => handleDownload(videoUrl)}
              className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:text-blue-600 transition text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={() => handleShare(videoUrl)}
              className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:text-purple-600 transition text-sm font-medium"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------
   MAIN PAGE
---------------------------------------------------- */
export default function VideoManagementPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [videos, setVideos] = useState([]);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [productName, setProductName] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [size, setSize] = useState("16:9");
  const [userId, setUserId] = useState("");

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [videoToReject, setVideoToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchVideos(storedUserId);
    }
  }, []);

  /* ---------------------------
      FETCH VIDEOS
  --------------------------- */
  const fetchVideos = async (uid) => {
    try {
      const res = await fetch(`/api/video-status?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setVideos(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      showToast("Failed to load videos", "error");
    }
  };

  /* ---------------------------
      TOAST NOTIFICATION
  --------------------------- */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ---------------------------
      COUNTDOWN TIMER
  --------------------------- */
  const startCountdown = () => {
    setCountdown(COUNTDOWN_SECONDS);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return timer;
  };

  /* ---------------------------
      SAVE VIDEO TO DATABASE
  --------------------------- */
  const saveVideoToDatabase = async (videoUrl, videoPrompt, productNameValue) => {
    try {
      const saveRes = await fetch("/api/video-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          videoUrl,
          prompt: videoPrompt,
          productName: productNameValue,
          status:"pending"
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save video to database");
      }

      const saveData = await saveRes.json();

      if (saveData.success) {
        setVideos((prev) => [saveData.data, ...prev]);
        return saveData.data;
      } else {
        throw new Error(saveData.message || "Failed to save video");
      }
    } catch (error) {
      console.error("Save video error:", error);
      throw error;
    }
  };

  /* ---------------------------
      GENERATE VIDEO HANDLER (REFACTORED)
  --------------------------- */
  const handleGenerateClick = async () => {
    // Validation
    if (!prompt.trim()) {
      return showToast("Please enter a video description", "error");
    }

    if (!productName.trim()) {
      return showToast("Please enter a product name", "error");
    }

    if (!productImage) {
      return showToast("Please upload a product image", "error");
    }

    if (!userId) {
      return showToast("User not authenticated. Please log in.", "error");
    }

    // Start generation process
    setIsGenerating(true);
    const countdownTimer = startCountdown();

    try {
      // Step 1: Convert image to Base64
      showToast("Processing image...", "info");
      const base64Image = await fileToBase64(productImage);

      // Step 2: Prepare payload
      const payload = {
        product_name: productName,
        product_image: base64Image,
        user_insturction: prompt, // Note: keeping original typo from API
        size,
        duration: "8",
      };

      console.log("📤 Sending video generation request...");
      console.log("Payload:", {
        ...payload,
        product_image: `${base64Image.substring(0, 50)}...`, // Log truncated image
      });

      // Step 3: Generate video with timeout (waits up to 7 minutes)
      showToast("Generating video... This may take up to 6 minutes ⏱️", "info");
      const result = await generateVideoWithTimeout(payload);

      console.log("📥 Video generation response:", result);

      // Step 4: Validate response
      let videoUrl = null;

      // 1. Handle Object Response (New Format)
      if (result?.success && result?.data?.output) {
        videoUrl = result.data.output;
      }
      // 2. Handle Array Response (Old Format / Fallback)
      else if (Array.isArray(result) && result.length > 0) {
        const videoData = result[0];
        if (videoData.status === "true" && videoData.url) {
          videoUrl = videoData.url;
        }
      }

      if (!videoUrl) {
        console.error("❌ Invalid Response Structure:", result);
        throw new Error("Invalid response format from video generation API");
      }

      console.log("✅ Video generated successfully:", videoUrl);

      // Step 5: Save video to database (First save, then deduct)
      let savedVideo = null;
      try {
        showToast("Saving video...", "info");
        savedVideo = await saveVideoToDatabase(videoUrl, prompt, productName);
        // Update UI immediately
        setVideos((prev) => [savedVideo, ...prev]);
        showToast("✨ Video generated & saved successfully! 🎉", "success");
      } catch (saveError) {
        console.error("❌ Save error:", saveError);
        showToast("Video generated but failed to save to database", "warning");
        // We continue to deduction if saving failed? Or stop? 
        // Usually if save fails, we might still want to deduct or handle manually. 
        // For now, we proceed but log error.
      }

      // Step 6: Deduct coins from wallet
      try {
        showToast("Deducting coins from wallet...", "info");
        const walletData = await deductFromWalletAction(userId, {
          amount: 750,
          type: "deduct",
          reason: "video_generated",
          metadata: {
            videoPrompt: prompt,
            productName: productName,
            videoSize: size,
            videoUrl: videoUrl,
            timestamp: new Date().toISOString(),
          },
        });

        console.log("💰 Wallet deduction response:", walletData);

        if (walletData.success) {
          showToast("750 coins deducted successfully! 💰", "success");
        } else {
          console.warn("Wallet deduction warning:", walletData);
          showToast("Video created but wallet deduction may have failed", "warning");
        }
      } catch (walletError) {
        console.error("❌ Wallet deduction error:", walletError);
        showToast("Video created but wallet deduction failed", "warning");
        // Continue anyway - video is still generated
      }

      // Step 7: Reset form fields
      setPrompt("");
      setProductName("");
      setProductImage(null);
      setSize("16:9");

      // Clear countdown timer
      clearInterval(countdownTimer);
    } catch (error) {
      console.error("❌ GENERATION ERROR:", error);
      clearInterval(countdownTimer);

      // Handle specific error types
      if (error.message.includes("timed out")) {
        showToast(
          "Video generation timed out after 6 minutes. Please try again with a simpler prompt.",
          "error"
        );
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        showToast("Network error. Please check your connection and try again.", "error");
      } else {
        showToast(error.message || "Failed to generate video. Please try again.", "error");
      }
    } finally {
      setIsGenerating(false);
      setCountdown(0);
    }
  };

  /* ---------------------------
      DOWNLOAD VIDEO
  --------------------------- */
  const handleDownload = async (url) => {
    try {
      showToast("Starting download...", "info");

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch video");

      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `limbu-ai-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the blob URL
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 100);

      showToast("Download started! 📥", "success");
    } catch (error) {
      console.error("Download error:", error);
      showToast("Download failed. Please try again.", "error");
    }
  };

  /* ---------------------------
      SHARE VIDEO
  --------------------------- */
  const handleShare = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Generated Video",
          text: "Check out this AI-generated video!",
          url,
        });
        showToast("Shared successfully! 🎉", "success");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.log("Share error:", error);
          // Fallback to clipboard
          fallbackCopyToClipboard(url);
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      fallbackCopyToClipboard(url);
    }
  };

  const fallbackCopyToClipboard = (url) => {
    try {
      navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard! 📋", "info");
    } catch (error) {
      console.error("Clipboard error:", error);
      showToast("Failed to copy link", "error");
    }
  };

  /* ---------------------------
      APPROVE VIDEO
  --------------------------- */
  const handleApprove = async (id) => {
    try {
      const res = await fetch("/api/video-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });

      if (!res.ok) throw new Error("Failed to approve video");

      const data = await res.json();

      if (data.success) {
        setVideos((prev) =>
          prev.map((v) => (v._id === id ? { ...v, status: "approved" } : v))
        );
        showToast("Video approved successfully! ✅", "success");
      } else {
        throw new Error(data.message || "Approval failed");
      }
    } catch (error) {
      console.error("Approve error:", error);
      showToast("Failed to approve video", "error");
    }
  };

  /* ---------------------------
      REJECT VIDEO
  --------------------------- */
  const handleRejectClick = (id) => {
    setVideoToReject(id);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!videoToReject) return;

    try {
      const res = await fetch("/api/video-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: videoToReject,
          status: "rejected",
          rejectionReason: rejectionReason || "No reason provided",
        }),
      });

      if (!res.ok) throw new Error("Failed to reject video");

      const data = await res.json();

      if (data.success) {
        setVideos((prev) =>
          prev.map((v) => (v._id === videoToReject ? { ...v, status: "rejected" } : v))
        );
        showToast("Video rejected. ❌", "info");
        setIsRejectModalOpen(false);
        setVideoToReject(null);
        setRejectionReason("");
      } else {
        throw new Error(data.message || "Rejection failed");
      }
    } catch (error) {
      console.error("Reject error:", error);
      showToast("Failed to reject video", "error");
    }
  };

  /* ---------------------------
      RENDER
  --------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {toast && <Toast message={toast.message} type={toast.type} />}
      {isGenerating && <LoadingOverlay countdown={countdown} />}

      {isRejectModalOpen && (
        <RejectReasonModal
          onClose={() => {
            setIsRejectModalOpen(false);
            setVideoToReject(null);
            setRejectionReason("");
          }}
          onSubmit={confirmReject}
          reason={rejectionReason}
          setReason={setRejectionReason}
        />
      )}

      <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl border-4 border-white flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-black flex items-center gap-3 justify-center">
            <Video className="w-8 h-8" /> Video Management
          </h1>
          <p className="text-blue-100 mt-2">
            Create stunning AI-powered videos from text in seconds 🎬
          </p>
        </div>

        {/* Video Input Form */}
        <VideoInput
          prompt={prompt}
          setPrompt={setPrompt}
          productName={productName}
          setProductName={setProductName}
          productImage={productImage}
          setProductImage={setProductImage}
          size={size}
          setSize={setSize}
          onGenerate={handleGenerateClick}
          loading={isGenerating}
        />

        {/* Videos Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((v) => (
              <VideoCard
                key={v._id || v.id}
                video={v}
                handleDownload={handleDownload}
                handleShare={handleShare}
                onApprove={handleApprove}
                onReject={handleRejectClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-16 rounded-3xl border-3 border-dashed border-gray-300 text-center shadow-xl">
            <div className="text-8xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-gray-800">No videos yet</h3>
            <p className="text-gray-600 mt-2">
              Generate your first AI-powered video above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}