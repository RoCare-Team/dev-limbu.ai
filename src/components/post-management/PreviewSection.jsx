
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
import Image from "next/image";

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
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="relative">
          <Lottie
            animationData={animationData}
            loop
            autoplay
            className="w-24 h-24"
          />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-anton">Generating Magic...</h3>
          <p className="text-slate-900/70 mt-2 font-sans">Creating your stunning post</p>
          {countdown > 0 && (
            <p className="text-sm font-mono text-[#EAB308] mt-4 bg-[#EAB308]/10 border border-[#EAB308]/30 px-4 py-1.5 rounded-full inline-block">
              {countdown}s remaining
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-slate-900/40">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
          <ImageIcon className="w-10 h-10 text-slate-900/40" />
        </div>
        <p className="font-medium text-lg text-slate-900/60 font-inter">Your AI-generated preview will appear here</p>
        <p className="text-sm mt-2 text-slate-900/40 font-inter">Fill the form and click Generate to start</p>
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
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 backdrop-blur-sm">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 font-anton tracking-wide">
          <Eye className="w-5 h-5 text-[#EAB308]" /> Live Preview
        </h3>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 uppercase tracking-widest ${
          status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/30" :
          status === "pending" ? "bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/30" :
          status === "posted" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
          status === "scheduled" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
          status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/30" :
          "bg-blue-500/10 text-blue-400 border-blue-500/30"
        }`}>
          {status}
        </span>
      </div>


      <div className="w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
        {dualMedia && (
          <div className="flex gap-1 p-1.5 bg-slate-50 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setMediaTab("image")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                mediaTab === "image"
                  ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                  : "text-slate-900/50 hover:text-slate-900 hover:bg-slate-100"
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
                  ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                  : "text-slate-900/50 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video
            </button>
          </div>
        )}

        {showVideoOffer && (
          <div className="mx-2 mt-2 mb-1 rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/5 p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="shrink-0 rounded-lg bg-[#EAB308] p-2 text-black shadow-[0_0_10px_rgba(253,224,71,0.4)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  Turn this into a short video?
                </p>
                <p className="text-[11px] text-slate-900/70 mt-1 leading-snug">
                  One tap: AI motion prompt + MP4 on this card (<strong>Image</strong> / <strong>Video</strong> tabs).{" "}
                  <span className="text-[#EAB308] font-semibold">{videoConvertCoins} coins</span> when the video is generated successfully.
                </p>
                <div className="mt-2.5 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isConvertingToVideo}
                    onClick={() => onAutoConvertToVideo?.(previewData)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#EAB308] px-3 py-2 text-xs font-bold text-black shadow-[0_0_15px_rgba(253,224,71,0.2)] hover:bg-[#EAB308]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                      className="w-full sm:w-auto text-xs font-semibold text-[#EAB308] hover:text-slate-900 py-2 px-2 rounded-lg border border-[#EAB308]/30 bg-[#EAB308]/10 hover:bg-[#EAB308]/20 transition-colors disabled:opacity-50"
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
          <div className="relative h-36 sm:h-44 lg:h-48 w-full bg-slate-50 group overflow-hidden cursor-pointer">
            {isConvertingToVideo && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-black/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-[#EAB308] animate-spin" />
                <p className="text-xs font-bold text-slate-900 px-2 text-center">
                  AI prompt + video render…
                </p>
              </div>
            )}
            {!activeIsVideo && imgUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110"
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
              <Image
                width={400}
                height={300}
                src={activeMediaUrl}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="relative w-full h-full object-contain z-10 transition-transform duration-500 group-hover:scale-[1.015]"
              />
            )}

            <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onDownload({
                    ...previewData,
                    aiOutput: activeMediaUrl,
                  });
                }}
                className="p-2 bg-black/60 backdrop-blur-md border border-slate-200 rounded-full shadow-lg hover:scale-110 transition-all hover:bg-black/80"
              >
                <Download className="w-3.5 h-3.5 text-[#EAB308]" />
              </button>
            </div>
          </div>
        </a>

        {status === "approved" &&
          (handleFacebookPost || handleInstagramPost) &&
          postHasVideoAsset(previewData) && (
            <div className="flex gap-1.5 px-2 py-2 border-t border-slate-200 bg-slate-50">
              {handleFacebookPost && (
                <button
                  type="button"
                  onClick={() => handleFacebookPost(previewData)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#1877F2]/10 text-[#1877F2] py-2 text-[11px] font-bold hover:bg-[#1877F2]/20 transition-colors border border-[#1877F2]/20"
                >
                  <Facebook className="w-3.5 h-3.5 fill-current" />
                  FB video
                </button>
              )}
              {handleInstagramPost && (
                <button
                  type="button"
                  onClick={() => handleInstagramPost(previewData)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-pink-500/10 text-pink-500 py-2 text-[11px] font-bold hover:bg-pink-500/20 transition-colors border border-pink-500/20"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Insta video
                </button>
              )}
            </div>
          )}

        {/* DESCRIPTION */}
        <div className="px-3 py-2.5 border-t border-slate-200 relative group/desc bg-white">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                rows={2}
                className="w-full p-2 text-[11px] border border-slate-200 rounded-md bg-slate-50 text-slate-900 focus:ring-1 focus:ring-[#EAB308]/50 outline-none resize-none placeholder-white/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedDesc(previewData.description);
                  }}
                  className="text-[10px] px-3 py-1 bg-slate-50 text-slate-900/70 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDescription}
                  className="text-[10px] px-3 py-1 bg-[#EAB308] text-black font-bold rounded shadow-[0_0_10px_rgba(253,224,71,0.2)] hover:bg-[#EAB308]/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="max-h-[56px] sm:max-h-[72px] overflow-y-auto text-[11px] text-slate-900/80 leading-relaxed whitespace-pre-line pr-5 custom-scrollbar">
                {previewData.description}
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover/desc:opacity-100 hover:bg-[#EAB308]/10 transition-all border border-slate-100"
              >
                <Edit3 className="w-3 h-3 text-slate-900/40" />
              </button>
            </>
          )}
        </div>

      </div>
      <div className="p-4 space-y-3 flex-1 flex flex-col bg-white">

        {status === "pending" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateStatus(previewData._id, "approved")}
              className="flex items-center justify-center gap-2 bg-[#EAB308] text-black hover:bg-[#EAB308]/90 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(253,224,71,0.15)] hover:shadow-[0_0_25px_rgba(253,224,71,0.25)]"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onReject(previewData._id)}
              className="flex items-center justify-center gap-2 bg-slate-50 text-red-500 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
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
                bg-[#EAB308] text-black hover:bg-[#EAB308]/90
                px-3 py-2.5 rounded-lg
                text-sm font-bold
                transition-all duration-300 shadow-[0_0_20px_rgba(253,224,71,0.15)] hover:shadow-[0_0_25px_rgba(253,224,71,0.25)]"
            >
              <Send className="w-4 h-4" />
              Post to GMB
            </button>

            <button
              onClick={() => onUpdateStatus(previewData)}
              className="flex-1 flex items-center justify-center gap-1.5
                bg-slate-50 text-slate-900 border border-slate-200
                hover:bg-slate-100 hover:border-slate-200
                px-3 py-2.5 rounded-lg
                text-sm font-bold
                transition-all duration-300 shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </div>
        )}

        {status === "scheduled" && (
          <div className="space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Scheduled For</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
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
              className="w-full flex items-center justify-center gap-2 bg-[#EAB308] text-black hover:bg-[#EAB308]/90 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(253,224,71,0.15)]"
            >
              <Send className="w-4 h-4" />
              Post to GMB 
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1.5 leading-tight tracking-widest">
                <XCircle className="w-3 h-3" />
                Posting Failed
              </p>
              <p className="text-xs text-slate-900/70 mt-1 leading-snug">
                {previewData.error || "Network Error"}
              </p>
            </div>

            <button
              onClick={() => handlePost(previewData)}
              className="w-full flex items-center justify-center gap-2 bg-[#EAB308] text-black hover:bg-[#EAB308]/90 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(253,224,71,0.15)]"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Post to GMB
            </button>

            <button
              onClick={() => onUpdateStatus(previewData)}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
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
              className="flex items-center justify-center gap-2 bg-[#EAB308] text-black hover:bg-[#EAB308]/90 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(253,224,71,0.15)]"
            >
              <Send className="w-4 h-4" />
              Repost
            </button>
            <button
              onClick={() => onUpdateStatus(previewData)}
              className="flex items-center justify-center gap-2 bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
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
