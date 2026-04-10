"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Facebook,
  Instagram,
  Download,
  Share2,
  Edit3,
  Calendar,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Pencil,
  Loader2,
  Video,
  Image as ImageIconLucide,
} from "lucide-react";
import { isPostVideoMedia } from "./ImageToVideoModal";
import { postImageUrl, postVideoUrl } from "@/lib/postMediaUrls";
import Image from "next/image";

const PostCard = ({
  post,
  scheduleDates,
  onDateChange,
  onUpdateStatus,
  onReject,
  handleDownload,
  handleShare,
  handlePost,
  onEditDescription,
  handleDeleteFromGMB,
  onToggleCheckmark,
  handleFacebookPost,
  handleInstagramPost,
  onConvertToVideo,
  convertingVideoPostId = null,
  videoGenerationCoins = 200,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [activeDesc, setActiveDesc] = useState("gmb");
  const [cardMediaTab, setCardMediaTab] = useState("image");

  const isPostedGmb =
    post.locations?.some((l) => l.isPosted) || post.whenPosted?.gmb;
  const isPostedFb =
    !!post.facebookPostId ||
    post.whenPosted?.facebook ||
    post.fbPages?.some((p) => p.isPosted);
  const isPostedIg =
    post.whenPosted?.instagram || post.igPages?.some((p) => p.isPosted);

  // Helper to get current values from post
  const getDescriptions = () => ({
    gmb: post?.gmbDescription ?? post?.description ?? "",
    fb: post?.fbDescription ?? post?.description ?? "",
    ig: post?.igDescription ?? post?.description ?? "",
  });

  // State to hold drafts for all platforms
  const [drafts, setDrafts] = useState(getDescriptions());
  const [fbStats, setFbStats] = useState(null);

  // Sync drafts with post only when NOT editing to avoid overwriting user input
  useEffect(() => {
    if (!isEditing) {
      setDrafts(getDescriptions());
    }
  }, [post, isEditing]);

  const handleSave = () => {
    const field =
      activeDesc === "gmb"
        ? "gmbDescription"
        : activeDesc === "fb"
          ? "fbDescription"
          : "igDescription";
    onEditDescription(post._id, { [field]: drafts[activeDesc] });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDrafts(getDescriptions());
    setIsEditing(false);
  };

  useEffect(() => {
    setCardMediaTab("image");
  }, [post._id]);

  useEffect(() => {
    const fetchFbStats = async () => {
      if (
        post.status === "posted" &&
        post.facebookPostId &&
        post.facebookPageAccessToken
      ) {
        try {
          // Fetch Likes
          const likesRes = await fetch(
            `https://graph.facebook.com/v19.0/${post.facebookPostId}/likes?summary=true&limit=0&access_token=${post.facebookPageAccessToken}`,
          );
          const likesData = await likesRes.json();

          // Fetch Comments
          const commentsRes = await fetch(
            `https://graph.facebook.com/v19.0/${post.facebookPostId}/comments?summary=true&limit=0&access_token=${post.facebookPageAccessToken}`,
          );
          const commentsData = await commentsRes.json();

          setFbStats({
            likes: likesData.summary?.total_count || 0,
            comments: commentsData.summary?.total_count || 0,
          });
        } catch (error) {
          console.error("Failed to fetch FB stats", error);
        }
      }
    };
    fetchFbStats();
  }, [post]);

  const imgUrl = postImageUrl(post);
  const vidUrl = postVideoUrl(post);
  const dualCardMedia = Boolean(imgUrl && vidUrl);
  const displayMediaUrl = dualCardMedia
    ? cardMediaTab === "video"
      ? vidUrl
      : imgUrl
    : vidUrl || post?.aiOutput || "";
  const cardShowVideo =
    dualCardMedia && cardMediaTab === "video"
      ? true
      : !dualCardMedia && isPostVideoMedia(post);

  const postForDownloadShare = () => ({
    ...post,
    aiOutput: displayMediaUrl || post.aiOutput,
  });

  const canConvertImageToVideo = Boolean(
    onConvertToVideo &&
    imgUrl &&
    !post?.videoOutput &&
    !isPostVideoMedia(post) &&
    post.status !== "rejected" &&
    post.status !== "processing",
  );
  const isConvertingThisPost =
    convertingVideoPostId != null &&
    String(convertingVideoPostId) === String(post._id);

  const convertToVideoButton = canConvertImageToVideo ? (
    <button
      type="button"
      disabled={isConvertingThisPost}
      onClick={() => onConvertToVideo(post)}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#EAB308]/50 bg-slate-50 backdrop-blur hover:bg-[#EAB308] hover:text-black px-4 py-2.5 text-sm font-bold text-[#EAB308] shadow-[0_0_15px_rgba(253,224,71,0.1)] transition-all disabled:opacity-50 disabled:cursor-wait font-inter"
    >
      {isConvertingThisPost ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      ) : (
        <Video className="w-4 h-4 shrink-0" />
      )}
      {isConvertingThisPost
        ? "Generating video…"
        : `Convert to video (${videoGenerationCoins} coins)`}
    </button>
  ) : null;

  return (
    <div className="group bg-slate-50 rounded-2xl shadow-2xl shadow-yellow-400/5 border border-slate-200 overflow-hidden hover:scale-[1.01] transition-all duration-300 flex flex-col font-inter">
      {/* Image | Video tabs — top of card */}
      {dualCardMedia && (
        <div className="flex gap-1.5 p-2 bg-slate-50 backdrop-blur border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setCardMediaTab("image")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
              cardMediaTab === "image"
                ? "bg-[#EAB308] text-black shadow-[0_0_20px_rgba(253,224,71,0.3)]"
                : "text-slate-900/60 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ImageIconLucide className="w-4 h-4" />
            Image
          </button>
          <button
            type="button"
            onClick={() => setCardMediaTab("video")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
              cardMediaTab === "video"
                ? "bg-[#EAB308] text-black shadow-[0_0_20px_rgba(253,224,71,0.3)]"
                : "text-slate-900/60 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        </div>
      )}

      {/* Image / Video preview */}
      <div className="relative w-full h-52 overflow-hidden bg-white aspect-[4/3]">
        <a
          href={displayMediaUrl || post.aiOutput}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          {cardShowVideo ? (
            <video
              src={displayMediaUrl}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 bg-black"
              controls
              playsInline
              muted
              preload="metadata"
            />
          ) : (
            <Image
              src={
                displayMediaUrl && displayMediaUrl.startsWith("http")
                  ? displayMediaUrl
                  : "https://via.placeholder.com/400"
              }
              width={400}
              height={300}
              alt="Post content"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </a>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-anton uppercase tracking-[0.1em] shadow-sm backdrop-blur-md border ${
              post.status === "pending"
                ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                : post.status === "approved"
                  ? "bg-green-400/20 text-green-400 border-green-400/30"
                  : post.status === "posted"
                    ? "bg-blue-400/20 text-blue-400 border-blue-400/30"
                    : post.status === "failed"
                      ? "bg-red-400/20 text-red-400 border-red-400/30"
                      : "bg-slate-100 text-slate-900/80 border-slate-200"
            }`}
          >
            {post.status}
          </span>
        </div>

        {/* Posted Platforms Badges */}
        {(isPostedGmb || isPostedFb || isPostedIg) && (
          <div className="absolute top-3 right-3 flex gap-1 z-10">
            {isPostedGmb && (
              <div
                className="bg-slate-100 backdrop-blur-md text-[#EAB308] p-1.5 rounded-full border border-slate-200 shadow-lg"
                title="Posted on GMB"
              >
                <MapPin className="w-3 h-3" />
              </div>
            )}
            {isPostedFb && (
              <div
                className="bg-slate-100 backdrop-blur-md text-[#EAB308] p-1.5 rounded-full border border-slate-200 shadow-lg"
                title="Posted on Facebook"
              >
                <Facebook className="w-3 h-3" />
              </div>
            )}
            {isPostedIg && (
              <div
                className="bg-slate-100 backdrop-blur-md text-[#EAB308] p-1.5 rounded-full border border-slate-200 shadow-lg"
                title="Posted on Instagram"
              >
                <Instagram className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {/* Overlay Actions (Download/Share) */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDownload(postForDownloadShare());
            }}
            className="p-2 bg-black/60 hover:bg-[#EAB308] text-slate-900 hover:text-black border border-slate-200 rounded-full shadow-xl backdrop-blur-sm transition-all hover:scale-110"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleShare(postForDownloadShare());
            }}
            className="p-2 bg-black/60 hover:bg-[#EAB308] text-slate-900 hover:text-black border border-slate-200 rounded-full shadow-xl backdrop-blur-sm transition-all hover:scale-110"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 space-y-4">
        {/* Description Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button
              onClick={() => setActiveDesc("gmb")}
              className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md flex items-center gap-1.5 transition-all ${activeDesc === "gmb" ? "bg-[#EAB308] text-black font-bold shadow-[0_0_10px_rgba(253,224,71,0.2)]" : "text-slate-900/50 hover:text-slate-900"}`}
            >
              <MapPin className="w-3 h-3" /> GMB
            </button>
            <button
              onClick={() => setActiveDesc("fb")}
              className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md flex items-center gap-1.5 transition-all ${activeDesc === "fb" ? "bg-[#EAB308] text-black font-bold shadow-[0_0_10px_rgba(253,224,71,0.2)]" : "text-slate-900/50 hover:text-slate-900"}`}
            >
              <Facebook className="w-3 h-3" /> FB
            </button>
            <button
              onClick={() => setActiveDesc("ig")}
              className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md flex items-center gap-1.5 transition-all ${activeDesc === "ig" ? "bg-[#EAB308] text-black font-bold shadow-[0_0_10px_rgba(253,224,71,0.2)]" : "text-slate-900/50 hover:text-slate-900"}`}
            >
              <Instagram className="w-3 h-3" /> Insta
            </button>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-bold uppercase tracking-wider text-[#EAB308] hover:bg-[#EAB308]/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1 border border-[#EAB308]/20"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>

        {/* Description Text */}
        <div className="flex-grow">
          {isEditing ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <textarea
                value={drafts[activeDesc]}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [activeDesc]: e.target.value,
                  }))
                }
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#EAB308] focus:border-transparent outline-none resize-none bg-slate-50 text-slate-900/90 placeholder:text-slate-900/20"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-[#EAB308] text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#EAB308]/90 transition-colors shadow-lg"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <p
                className={`text-sm text-slate-900/70 leading-relaxed font-inter ${showFull ? "" : "line-clamp-3"}`}
              >
                {drafts[activeDesc] ||
                  "No description available for this platform."}
              </p>
              {drafts[activeDesc]?.length > 120 && (
                <button
                  onClick={() => setShowFull(!showFull)}
                  className="mt-1 text-xs font-bold text-[#EAB308] hover:text-[#EAB308]/80 flex items-center gap-1 uppercase tracking-tighter"
                >
                  {showFull ? "Show Less" : "Read More"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="pt-3 border-t border-slate-100 flex items-center text-[10px] uppercase tracking-[0.1em] text-slate-900/40 font-medium">
          <Calendar className="w-3 h-3 mr-1.5 text-[#EAB308]/50" />
          {post.status === "posted"
            ? `Posted: ${new Date(post.locations?.[0]?.postedAt || post.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}`
            : post.createdAt
              ? new Date(post.createdAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })
              : "Date unknown"}
        </div>

        {/* Action Buttons Area */}
        <div className="pt-1 mt-auto">
          {post.status === "processing" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 mb-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
                <p className="text-[10px] text-blue-400/60 text-center mt-1 uppercase">
                  Post is being published. You can retry if stuck.
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-1">
                {isPostedGmb && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> GMB
                  </span>
                )}
                {isPostedFb && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> FB
                  </span>
                )}
                {isPostedIg && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> IG
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePost(post)}
                  className="flex items-center justify-center gap-2 bg-slate-50 text-slate-900/80 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry GMB
                </button>

                <button
                  onClick={() => handleFacebookPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPostedFb ? "bg-slate-50 text-slate-900/40 border-slate-100" : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Facebook className="w-3 h-3" />
                  {isPostedFb ? "Repost FB" : "Post FB "}
                </button>

                <button
                  onClick={() => handleInstagramPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPostedIg ? "bg-slate-50 text-slate-900/40 border-slate-100" : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Instagram className="w-3 h-3" />
                  {isPostedIg ? "Repost IG" : "Post IG"}
                </button>

                <button
                  onClick={() => onUpdateStatus(post)}
                  className="flex items-center justify-center gap-2 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <Calendar className="w-3 h-3" />
                  Schedule
                </button>
              </div>
            </div>
          )}

          {post.status === "pending" && (
            <div className="space-y-2">
              {convertToVideoButton}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onUpdateStatus(post._id, "approved")}
                  className="flex items-center justify-center gap-2 bg-[#EAB308] text-black border border-[#EAB308] hover:bg-[#EAB308]/90 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(253,224,71,0.2)]"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => onReject(post._id)}
                  className="flex items-center justify-center gap-2 bg-slate-50 text-slate-900/80 border border-slate-200 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {post.status === "approved" && (
            <div className="space-y-2">
              {convertToVideoButton}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handlePost(post)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#EAB308] text-[#EAB308] hover:text-black border border-[#EAB308]/30 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  Post GMB
                </button>

                <button
                  onClick={() => handleInstagramPost(post)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#EAB308] text-[#EAB308] hover:text-black border border-[#EAB308]/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap"
                >
                  <Instagram size={16} />
                  Post Instagram
                </button>

                <button
                  onClick={() => handleFacebookPost(post)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#EAB308] text-[#EAB308] hover:text-black border border-[#EAB308]/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap"
                >
                  <Facebook size={16} />
                  Post Facebook
                </button>

                <button
                  onClick={() => onUpdateStatus(post)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#EAB308] text-[#EAB308] hover:text-black border border-[#EAB308]/30 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>
          )}

          {post.status === "scheduled" && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 backdrop-blur rounded-xl p-3 flex items-start gap-3 transition-all">
                {/* Calendar Icon */}
                <div className="bg-[#EAB308]/10 p-2 rounded-lg border border-[#EAB308]/20">
                  <Calendar className="w-5 h-5 text-[#EAB308]" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-[10px] text-[#EAB308]/80 font-bold uppercase tracking-[0.1em]">
                    Scheduled For
                  </p>

                  <p className="text-sm font-bold text-slate-900/90">
                    {post.scheduledDate
                      ? new Date(post.scheduledDate).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Date not set"}
                  </p>

                  {post.locations?.length > 0 && (
                    <p className="text-[10px] text-[#EAB308]/80 mt-1.5 font-bold uppercase flex items-center gap-1.5 bg-[#EAB308]/5 px-2 py-0.5 rounded-md w-fit border border-[#EAB308]/10">
                      <MapPin className="w-3 h-3" />
                      {post.locations.length === 1
                        ? `${post.locations[0].name || post.locations[0].title || "1 Location"} ${
                            post.locations[0].locality
                              ? `(${post.locations[0].locality})`
                              : ""
                          }`
                        : `${post.locations.length} Locations`}
                    </p>
                  )}
                </div>

                {/* ✏️ Edit Schedule Button */}
                <button
                  onClick={() => onUpdateStatus(post)}
                  title="Edit Schedule"
                  className="p-2 rounded-lg bg-slate-50 text-[#EAB308] hover:bg-[#EAB308] hover:text-black border border-slate-200 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Platform Checkboxes Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-900/40 uppercase tracking-[0.1em] mb-3">
                  Scheduled On Platforms
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {/* GMB Checkbox */}
                  <div className="flex items-center gap-2 p-2.5 bg-black/40 border border-slate-100 rounded-lg hover:border-[#EAB308]/30 transition-colors group/chk">
                    <input
                      type="checkbox"
                      checked={post.locations && post.locations.length > 0}
                      readOnly
                      className="w-4 h-4 accent-[#EAB308] cursor-not-allowed bg-transparent border-slate-200"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-900/40 group-hover/chk:text-[#EAB308] transition-colors" />
                    </div>
                  </div>

                  {/* Facebook Checkbox */}
                  <div className="flex items-center gap-2 p-2.5 bg-black/40 border border-slate-100 rounded-lg hover:border-[#EAB308]/30 transition-colors group/chk">
                    <input
                      type="checkbox"
                      checked={post.fbPages && post.fbPages.length > 0}
                      readOnly
                      className="w-4 h-4 accent-[#EAB308] cursor-not-allowed bg-transparent border-slate-200"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      <Facebook className="w-3.5 h-3.5 text-slate-900/40 group-hover/chk:text-[#EAB308] transition-colors" />
                    </div>
                  </div>

                  {/* Instagram Checkbox */}
                  <div className="flex items-center gap-2 p-2.5 bg-black/40 border border-slate-100 rounded-lg hover:border-[#EAB308]/30 transition-colors group/chk">
                    <input
                      type="checkbox"
                      checked={post.igPages && post.igPages.length > 0}
                      readOnly
                      className="w-4 h-4 accent-[#EAB308] cursor-not-allowed bg-transparent border-slate-200"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      <Instagram className="w-3.5 h-3.5 text-slate-900/40 group-hover/chk:text-[#EAB308] transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {convertToVideoButton}

              {/* Post Now Button */}
              <button
                onClick={() => handlePost(post)}
                className="w-full flex items-center justify-center gap-2 bg-[#EAB308] text-black hover:bg-[#EAB308]/90 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-yellow-400/10"
              >
                <Send className="w-4 h-4" />
                Post Now
              </button>
            </div>
          )}

          {post.status === "failed" && (
            <div className="space-y-3">
              {convertToVideoButton}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1 tracking-wider">
                  <XCircle className="w-3 h-3" /> Posting Failed
                </p>
                <p className="text-xs text-slate-900/70 mt-1 font-medium">
                  {post.error || "Unknown error occurred"}
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-1">
                {isPostedGmb && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> GMB
                  </span>
                )}
                {isPostedFb && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> FB
                  </span>
                )}
                {isPostedIg && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> IG
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePost(post)}
                  className="flex items-center justify-center gap-2 bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry GMB
                </button>

                <button
                  onClick={() => handleFacebookPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPostedFb ? "bg-slate-50 text-slate-900/40 border-slate-100" : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Facebook className="w-3 h-3" />
                  {isPostedFb ? "Repost FB" : "Post FB "}
                </button>

                <button
                  onClick={() => handleInstagramPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPostedIg ? "bg-slate-50 text-slate-900/40 border-slate-100" : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Instagram className="w-3 h-3" />
                  {isPostedIg ? "Repost IG" : "Post IG"}
                </button>

                <button
                  onClick={() => onUpdateStatus(post)}
                  className="flex items-center justify-center gap-2 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <Calendar className="w-3 h-3" />
                  Schedule
                </button>
              </div>
            </div>
          )}

          {post.status === "posted" && (
            <div className="space-y-3">
              {convertToVideoButton}
              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-1">
                {isPostedGmb && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> GMB
                  </span>
                )}
                {isPostedFb && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> FB
                  </span>
                )}
                {isPostedIg && (
                  <span className="text-[10px] uppercase tracking-wider bg-slate-50 text-slate-900/80 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3 h-3 text-green-400" /> IG
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPostedGmb ? "bg-slate-50 text-slate-900/40 border-slate-100" : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Send className="w-3 h-3" />
                  {isPostedGmb ? "Repost GMB" : "Post GMB"}
                </button>

                <button
                  onClick={() => handleFacebookPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPostedFb ? "bg-slate-50 text-slate-900/40 border-slate-100" : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Facebook className="w-3 h-3" />
                  {isPostedFb ? "Repost FB" : "Post FB"}
                </button>

                <button
                  onClick={() => handleInstagramPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isPostedIg ? "bg-slate-50 text-slate-900/40 border-slate-100" : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"}`}
                >
                  <Instagram className="w-3 h-3" />
                  {isPostedIg ? "Repost IG" : "Post IG"}
                </button>

                <button
                  onClick={() => onUpdateStatus(post)}
                  className="flex items-center justify-center gap-2 bg-[#EAB308] text-black border border-[#EAB308] hover:bg-[#EAB308]/90 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <Calendar className="w-3 h-3" />
                  Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
