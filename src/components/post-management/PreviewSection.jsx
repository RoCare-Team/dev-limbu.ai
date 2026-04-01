

"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  Calendar,
  Send,
  XCircle,
  Download,
  Edit3,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Video,
  Sparkles,
  Facebook,
  Instagram,
  Loader2,
} from "lucide-react";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";
import { isPostVideoMedia } from "./ImageToVideoModal";
import {
  postHasVideoAsset,
  postImageUrl,
  postVideoUrl,
} from "@/lib/postMediaUrls";

const PreviewSection = ({
  isGenerating,
  previewData,
  onDownload,
  countdown,
  onUpdateStatus,
  onReject,
  handlePost,
  onToggleCheckmark,
  onEditDescription,
  onRequestImageToVideo,
  onAutoConvertToVideo,
  isConvertingToVideo = false,
  videoConvertCoins = 200,
  handleFacebookPost,
  handleInstagramPost,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");
  const [mediaTab, setMediaTab] = useState("image");
  const lastVideoOutputRef = useRef("");

  useEffect(() => {
    if (previewData) {
      setEditedDesc(previewData.description || "");
    }
  }, [previewData]);

  useEffect(() => {
    setMediaTab("image");
    lastVideoOutputRef.current = "";
  }, [previewData?._id]);

  /** When a video is first attached to this post, open the Video tab. */
  useEffect(() => {
    const vo = previewData?.videoOutput || "";
    const img = postImageUrl(previewData);
    if (vo && img && vo !== lastVideoOutputRef.current) {
      lastVideoOutputRef.current = vo;
      setMediaTab("video");
    }
  }, [previewData?.videoOutput, previewData?._id]);

  if (isGenerating) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="relative">
          <Lottie
            animationData={animationData}
            loop
            autoplay
            className="w-24 h-24"
          />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Generating Magic...</h3>
          <p className="text-gray-500 mt-2">Creating your stunning post</p>
          {countdown > 0 && (
            <p className="text-sm font-mono text-dark mt-4 bg-lightPrimary px-3 py-1 rounded-full inline-block">
              {countdown}s remaining
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-gray-400">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <ImageIcon className="w-10 h-10 text-gray-400" />
        </div>
        <p className="font-medium text-lg text-gray-600">Your AI-generated preview will appear here</p>
        <p className="text-sm mt-2 text-gray-500">Fill the form and click Generate to start</p>
      </div>
    );
  }

  const status = previewData.status || 'pending';
  const handleSaveDescription = () => {
    onEditDescription(previewData._id, editedDesc);
    setIsEditing(false);
  };

  const imgUrl = postImageUrl(previewData);
  const vidUrl = postVideoUrl(previewData);
  const dualMedia = Boolean(imgUrl && vidUrl);
  const showVideoOffer =
    Boolean(
      imgUrl &&
        !previewData?.videoOutput &&
        !isPostVideoMedia(previewData) &&
        typeof onRequestImageToVideo === "function"
    );

  const activeMediaUrl = dualMedia
    ? mediaTab === "video"
      ? vidUrl
      : imgUrl
    : vidUrl || imgUrl || previewData.aiOutput;
  const activeIsVideo =
    dualMedia && mediaTab === "video"
      ? true
      : !dualMedia && postHasVideoAsset(previewData) && !imgUrl;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Eye className="w-5 h-5 text-dark" /> Live Preview
        </h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 uppercase tracking-wider ${status === "approved" ? "bg-green-100/90 text-green-700 border-green-200" :
            status === "pending" ? "bg-yellow-100/90 text-yellow-700 border-yellow-200" :
              status === "posted" ? "bg-purple-100/90 text-dark border-purple-200" :
                status === "scheduled" ? "bg-fullLight text-dark border-blue-200" :
                  status === "failed" ? "bg-red-100/90 text-red-700 border-red-200" :
                    "bg-blue-100/90 text-dark border-blue-200"
          }`}>
          {status}
        </span>
      </div>


      <div className="w-full bg-white rounded-lg overflow-hidden border border-gray-200">
        {dualMedia && (
          <div className="flex gap-1 p-1.5 bg-gradient-to-r from-slate-50 via-violet-50/40 to-amber-50/50 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setMediaTab("image")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                mediaTab === "image"
                  ? "bg-white text-gray-900 shadow-md ring-1 ring-gray-200/80"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Image
            </button>
            <button
              type="button"
              onClick={() => setMediaTab("video")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                mediaTab === "video"
                  ? "bg-white text-violet-900 shadow-md ring-1 ring-violet-200"
                  : "text-gray-500 hover:text-violet-800 hover:bg-white/60"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video
            </button>
          </div>
        )}

        {showVideoOffer && (
          <div className="mx-2 mt-2 mb-1 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-violet-50 p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="shrink-0 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 p-2 text-white shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  Turn this into a short video?
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                  One tap: AI motion prompt + MP4 on this card (<strong>Image</strong> / <strong>Video</strong> tabs).{" "}
                  <span className="text-amber-900 font-semibold">{videoConvertCoins} coins</span> when the video is generated successfully.
                </p>
                <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isConvertingToVideo}
                    onClick={() => onAutoConvertToVideo?.(previewData)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold text-white shadow hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isConvertingToVideo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating video…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Convert to video (auto)
                      </>
                    )}
                  </button>
                  {typeof onRequestImageToVideo === "function" && (
                    <button
                      type="button"
                      disabled={isConvertingToVideo}
                      onClick={() => onRequestImageToVideo()}
                      className="w-full sm:w-auto text-xs font-semibold text-violet-700 hover:text-violet-900 py-2 px-2 rounded-lg border border-violet-200 bg-violet-50/80 hover:bg-violet-100 transition-colors disabled:opacity-50"
                    >
                      Customize in modal
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media preview */}
        <a
          href={activeMediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block ${isConvertingToVideo ? "pointer-events-none" : ""}`}
        >
          <div className="relative h-36 sm:h-44 lg:h-48 w-full bg-gray-100 group overflow-hidden cursor-pointer">
            {isConvertingToVideo && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <p className="text-xs font-bold text-gray-800 px-2 text-center">
                  AI prompt + video render…
                </p>
              </div>
            )}
            {!activeIsVideo && imgUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
                style={{ backgroundImage: `url(${imgUrl})` }}
              />
            )}

            {activeIsVideo ? (
              <video
                src={activeMediaUrl}
                className="relative w-full h-full object-contain z-10 bg-black"
                controls
                playsInline
                muted
                preload="metadata"
              />
            ) : (
              <img
                src={activeMediaUrl}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="relative w-full h-full object-contain z-10 transition-transform duration-300 group-hover:scale-[1.015]"
              />
            )}

            <div className="absolute top-1.5 right-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onDownload({
                    ...previewData,
                    aiOutput: activeMediaUrl,
                  });
                }}
                className="p-1.5 bg-white/90 rounded-full shadow hover:scale-105 transition"
              >
                <Download className="w-3.5 h-3.5 text-gray-700" />
              </button>
            </div>
          </div>
        </a>

        {status === "approved" &&
          (handleFacebookPost || handleInstagramPost) &&
          postHasVideoAsset(previewData) && (
            <div className="flex gap-1.5 px-2 py-2 border-t border-gray-100 bg-gray-50/90">
              {handleFacebookPost && (
                <button
                  type="button"
                  onClick={() => handleFacebookPost(previewData)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#1877F2]/10 text-[#1877F2] py-2 text-[11px] font-bold hover:bg-[#1877F2]/15 transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5 fill-current" />
                  FB video
                </button>
              )}
              {handleInstagramPost && (
                <button
                  type="button"
                  onClick={() => handleInstagramPost(previewData)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-pink-50 text-pink-700 py-2 text-[11px] font-bold hover:bg-pink-100 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Insta video
                </button>
              )}
            </div>
          )}

        {/* DESCRIPTION */}
        <div className="px-2.5 py-2 border-t border-gray-200 relative group/desc ">
          {isEditing ? (
            <div className="space-y-1.5">
              <textarea
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                rows={2}
                className="w-full p-1.5 text-[11px] border border-gray-300 rounded-md bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedDesc(previewData.description);
                  }}
                  className="text-[11px] px-2 py-0.5 bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDescription}
                  className="text-[11px] px-2 py-0.5 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="max-h-[56px] sm:max-h-[72px] overflow-y-auto text-[11px] text-gray-700 leading-snug whitespace-pre-line pr-5">
                {previewData.description}
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover/desc:opacity-100 hover:bg-blue-50 transition"
              >
                <Edit3 className="w-3 h-3 text-gray-400" />
              </button>
            </>
          )}
        </div>

      </div>
      <div className="p-4 space-y-3 flex-1 flex flex-col bg-white ">

        {status === "pending" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateStatus(previewData._id, "approved")}
              className="flex items-center justify-center gap-2 bg-fullLight text-lighPrimary border border-green-200 hover:bg-green-100 hover:border-green-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onReject(previewData._id)}
              className="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {status === "approved" && (
          <div className="flex gap-2">

            <button
              onClick={() => handlePost(previewData)}
              className="flex-1 flex items-center justify-center gap-1.5
        bg-gradient-to-r from-neutral-200 to-neutral-300
        hover:from-neutral-300 hover:to-indigo-200
        text-white border border-neutral-300
        px-3 py-2.5 rounded-lg
        text-sm font-semibold
        transition-all duration-200 shadow-sm"
            >
              <Send className="w-4 h-4" />
              Post to GMB
            </button>

            <button
              onClick={() => onUpdateStatus(previewData)}
              className="flex-1 flex items-center justify-center gap-1.5
        bg-white text-gray-700 border border-gray-200
        hover:bg-gray-50 hover:border-gray-300
        px-3 py-2.5 rounded-lg
        text-sm font-semibold
        transition-all duration-200 shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>

          </div>
        )}
        {status === "scheduled" && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Scheduled For</p>
                <p className="text-sm font-bold text-gray-800">
                  {previewData.scheduledDate
                    ? new Date(previewData.scheduledDate).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "Date not set"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePost(previewData)}
              className="w-full flex items-center justify-center gap-2 bg-neutral-50 text-neutral-600 border border-blue-100 hover:bg-blue-100 hover:border-neutral-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <Send className="w-4 h-4" />
              Post to GMB 
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-3">
            <div className="bg-neutral-50 border border-neutral -200 rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-red-600 font-semibold uppercase flex items-center gap-1 leading-tight">
                <XCircle className="w-2.5 h-2.5" />
                Posting Failed
              </p>

              <p className="text-xs text-neutral-700 mt-0.5 leading-snug">
                {previewData.error || "Network Error"}
              </p>
            </div>


            <button
              onClick={() => handlePost(previewData)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 border border-blue-200 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Post to GMB
            </button>

            <button
              onClick={() => onUpdateStatus(previewData)}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              Schedule 
            </button>
          </div>
        )}

        {status === "posted" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePost(previewData)}
              className="flex items-center justify-center gap-2 bg-lightPrimary text-dark border border-yellow-600 hover:bg-fullLight hover:border-yellow-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Send className="w-4 h-4" />
              Repost
            </button>
            <button
              onClick={() => onUpdateStatus(previewData)}
              className="flex items-center justify-center gap-2 bg-fullLight text-dark border border-purple-200 hover:bg-yellow-100 hover:border-yellow-200  px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewSection;