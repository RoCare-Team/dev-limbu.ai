"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  XCircle,
  Pencil,
  Loader2,
  Video,
  Image as ImageIconLucide,
  ChevronRight,
  Clock,
} from "lucide-react";
import { isPostVideoMedia } from "./ImageToVideoModal";
import { postImageUrl, postVideoUrl } from "@/lib/postMediaUrls";
import Image from "next/image";
import MediaSelectionModal from "./MediaSelectionModal";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-100",
  approved: "bg-blue-50 text-blue-600 border-blue-100",
  posted: "bg-green-50 text-green-600 border-green-100",
  failed: "bg-red-50 text-red-600 border-red-100",
  scheduled: "bg-purple-50 text-purple-600 border-purple-100",
};

const PostCard = React.memo(
  ({
    post,
    onUpdateStatus,
    onReject,
    handleDownload,
    handleShare,
    handlePost,
    onEditDescription,
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


    const { isPostedGmb, isPostedFb, isPostedIg } = useMemo(
      () => ({
        isPostedGmb:
          post.locations?.some((l) => l.isPosted) || post.whenPosted?.gmb,
        isPostedFb:
          !!post.facebookPostId ||
          post.whenPosted?.facebook ||
          post.fbPages?.some((p) => p.isPosted),
        isPostedIg:
          post.whenPosted?.instagram || post.igPages?.some((p) => p.isPosted),
      }),
      [
        post.locations,
        post.whenPosted,
        post.facebookPostId,
        post.fbPages,
        post.igPages,
      ],
    );

    const initialDescriptions = useMemo(
      () => ({
        gmb: post?.gmbDescription ?? post?.description ?? "",
        fb: post?.fbDescription ?? post?.description ?? "",
        ig: post?.igDescription ?? post?.description ?? "",
      }),
      [post],
    );

    const [drafts, setDrafts] = useState(initialDescriptions);

    useEffect(() => {
      if (!isEditing) setDrafts(initialDescriptions);
    }, [initialDescriptions, isEditing]);

    const imgUrl = useMemo(() => postImageUrl(post), [post]);
    const vidUrl = useMemo(() => postVideoUrl(post), [post]);
    const dualCardMedia = Boolean(imgUrl && vidUrl);

    const displayMediaUrl = useMemo(() => {
      return dualCardMedia
        ? cardMediaTab === "video"
          ? vidUrl
          : imgUrl
        : vidUrl || post?.aiOutput || "";
    }, [dualCardMedia, cardMediaTab, vidUrl, imgUrl, post?.aiOutput]);

    const cardShowVideo = useMemo(() => {
      return dualCardMedia ? cardMediaTab === "video" : isPostVideoMedia(post);
    }, [dualCardMedia, cardMediaTab, post]);

    const isConvertingThisPost = useMemo(() => {
      return (
        convertingVideoPostId != null &&
        String(convertingVideoPostId) === String(post._id)
      );
    }, [convertingVideoPostId, post._id]);

    const lastPostedDate = useMemo(() => {
      if (post.status !== "posted") return null;
      let latest = null;

      const checkDate = (dateStr) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (!latest || d > latest) latest = d;
      };

      post.locations?.forEach((l) => {
        if (l.isPosted) checkDate(l.postedAt);
      });
      post.fbPages?.forEach((p) => {
        if (p.isPosted) checkDate(p.postedAt);
      });
      post.igPages?.forEach((i) => {
        if (i.isPosted) checkDate(i.postedAt);
      });

      if (!latest && post.updatedAt) {
        latest = new Date(post.updatedAt);
      }

      return latest;
    }, [post]);

    const isLoading = isConvertingThisPost;

    // Countdown Timer State
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
    
    useEffect(() => {
      let interval;
      if (isConvertingThisPost) {
        setTimeLeft(120); // Reset timer
        interval = setInterval(() => {
          setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
      } else {
        clearInterval(interval);
      }
      return () => clearInterval(interval);
    }, [isConvertingThisPost]);

    // Format time left (e.g., 1:59)
    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleSaveDescription = useCallback(() => {
      const field =
        activeDesc === "gmb"
          ? "gmbDescription"
          : activeDesc === "fb"
            ? "fbDescription"
            : "igDescription";
      onEditDescription(post._id, { [field]: drafts[activeDesc] });
      setIsEditing(false);
    }, [activeDesc, drafts, onEditDescription, post._id]);

    // Modal state for showing all scheduled targets
    const [showMoreModal, setShowMoreModal] = useState({ isOpen: false, title: "", items: [] });

    const openShowMoreModal = (title, items) => {
      setShowMoreModal({ isOpen: true, title, items });
    };

    const closeShowMoreModal = () => {
      setShowMoreModal({ isOpen: false, title: "", items: [] });
    };

    const [selectionModal, setSelectionModal] = useState({ isOpen: false, type: "" });

    const handleMediaChoice = (type) => {
      if (dualCardMedia) {
        setSelectionModal({ isOpen: true, type });
      } else {
        if (type === "gmb") handlePost(post);
        else if (type === "fb") handleFacebookPost(post);
        else if (type === "ig") handleInstagramPost(post);
      }
    };

    const onMediaSelect = (choice) => {
      const forcedMedia = choice === "video" ? { type: "video", url: vidUrl } : { type: "image", url: imgUrl };
      const type = selectionModal.type;
      setSelectionModal({ isOpen: false, type: "" });
      
      if (type === "gmb") handlePost(post, forcedMedia);
      else if (type === "fb") handleFacebookPost(post, forcedMedia);
      else if (type === "ig") handleInstagramPost(post, forcedMedia);
    };

    return (
      <>
        <div className="group relative bg-white rounded-4xl border border-black/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 flex flex-col font-inter">
          {/* ── Media Engine ── */}
          <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
            {/* Media Tabs */}
            {dualCardMedia && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex p-1 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 z-20 shadow-xl">
                {["image", "video"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCardMediaTab(tab)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      cardMediaTab === tab
                        ? "bg-white text-black shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {tab === "image" ? (
                      <ImageIconLucide size={12} />
                    ) : (
                      <Video size={12} />
                    )}
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <a
              href={displayMediaUrl || post.aiOutput}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full"
            >
              {cardShowVideo ? (
                <video
                  src={displayMediaUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  muted
                  preload="metadata"
                />
              ) : (
                <Image
                  src={
                    displayMediaUrl?.startsWith("http")
                      ? displayMediaUrl
                      : "https://via.placeholder.com/400"
                  }
                  width={400}
                  height={300}
                  alt="Post Content"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
            </a>

            {/* Status Chip */}
            <div className="absolute top-4 left-4 z-10">
              <div
                className={`px-3 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 shadow-sm ${STATUS_COLORS[post.status] || "bg-slate-50 text-slate-600 border-slate-100"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${post.status === "posted" ? "bg-green-500" : "bg-current"}`}
                />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {post.status}
                </span>
              </div>
            </div>

            {/* Floating Icons (Download/Share) */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDownload({ ...post, aiOutput: displayMediaUrl });
                }}
                className="p-3 bg-white/90 backdrop-blur text-black rounded-2xl shadow-xl hover:bg-[#EAB308] hover:text-black transition-all"
              >
                <Download size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleShare({ ...post, aiOutput: displayMediaUrl });
                }}
                className="p-3 bg-white/90 backdrop-blur text-black rounded-2xl shadow-xl hover:bg-[#EAB308] hover:text-black transition-all"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* ── Content Area ── */}
          <div className="p-6 flex flex-col flex-1">
            {/* Platform Selector & Edit */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex p-1 bg-slate-50 rounded-xl border border-black/5">
                {[
                  { id: "gmb", icon: MapPin, label: "GMB" },
                  { id: "fb", icon: Facebook, label: "FB" },
                  { id: "ig", icon: Instagram, label: "Insta" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveDesc(p.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeDesc === p.id
                        ? "bg-white text-black shadow-sm"
                        : "text-black/30 hover:text-black/50"
                    }`}
                  >
                    <p.icon
                      size={12}
                      className={activeDesc === p.id ? "text-[#EAB308]" : ""}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-black/30 hover:text-[#EAB308] hover:bg-[#EAB308]/5 rounded-xl transition-all"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            {/* Text Body */}
            <div className="flex-1 mb-6">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={drafts[activeDesc]}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [activeDesc]: e.target.value,
                      }))
                    }
                    className="w-full p-4 text-sm bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-[#EAB308]/20 outline-none resize-none transition-all font-inter"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDescription}
                      className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#EAB308] hover:text-black transition-all"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-slate-100 text-black/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p
                    className={`text-sm text-black/60 leading-relaxed font-inter ${showFull ? "" : "line-clamp-3"}`}
                  >
                    {drafts[activeDesc] ||
                      `No specific content generated for ${activeDesc.toUpperCase()}.`}
                  </p>
                  {drafts[activeDesc]?.length > 120 && (
                    <button
                      onClick={() => setShowFull(!showFull)}
                      className="text-[10px] font-black text-[#EAB308] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      {showFull ? "Show Less" : "Read More"}{" "}
                      <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action Zone */}
            <div className="space-y-4 pt-4 border-t border-black/5">
              {/* Status Specific Actions */}
              {post.status === "pending" && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateStatus(post._id, "approved")}
                    className="py-4 bg-[#EAB308] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#EAB308]/10 hover:brightness-105 transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(post._id)}
                    className="py-4 border border-black/5 text-black/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}

              {post.status === "approved" && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleMediaChoice("gmb")}
                    className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#EAB308] hover:text-black transition-all group/btn shadow-lg shadow-black/10"
                  >
                    <Send
                      size={14}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />{" "}
                    Post to GMB
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMediaChoice("fb")}
                      className="py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                    >
                      <Facebook size={14} /> Facebook
                    </button>
                    <button
                      onClick={() => handleMediaChoice("ig")}
                      className="py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                    >
                      <Instagram size={14} /> Instagram
                    </button>
                  </div>
                  <button
                    onClick={() => onUpdateStatus(post)}
                    className="w-full py-3.5 bg-white border-2 border-[#EAB308]/20 text-black/80 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308]/10 hover:border-[#EAB308] transition-all shadow-sm"
                  >
                    <Calendar size={14} className="text-[#EAB308]" /> Schedule
                    Post
                  </button>
                </div>
              )}

              {post.status === "posted" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex flex-wrap gap-2">
                      {isPostedGmb && (
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-green-100">
                          GMB Live
                        </span>
                      )}
                      {isPostedFb && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-100">
                          FB Live
                        </span>
                      )}
                      {isPostedIg && (
                        <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-pink-100">
                          IG Live
                        </span>
                      )}
                    </div>
                    {lastPostedDate && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock size={10} className="text-slate-300" />
                        {lastPostedDate.toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleMediaChoice("gmb")}
                    className="w-full py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-all shadow-sm"
                  >
                    <RefreshCw
                      size={14}
                      className="text-[#EAB308] group-hover:text-black"
                    />{" "}
                    Repost GMB
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMediaChoice("fb")}
                      className="py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-all shadow-sm"
                    >
                      <Facebook
                        size={14}
                        className="text-[#EAB308] group-hover:text-black"
                      />{" "}
                      Repost FB
                    </button>
                    <button
                      onClick={() => handleMediaChoice("ig")}
                      className="py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-all shadow-sm"
                    >
                      <Instagram
                        size={14}
                        className="text-[#EAB308] group-hover:text-black"
                      />{" "}
                      Repost IG
                    </button>
                  </div>
                  <button
                    onClick={() => onUpdateStatus(post)}
                    className="w-full py-3.5 bg-white border-2 border-[#EAB308]/20 text-black/80 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308]/10 hover:border-[#EAB308] transition-all shadow-sm"
                  >
                    <Calendar size={14} className="text-[#EAB308]" /> Schedule
                    Post
                  </button>
                </div>
              )}

              {post.status === "scheduled" && (
                <>
                <div className="p-4 bg-[#EAB308]/5 rounded-3xl border border-[#EAB308]/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-[#EAB308] uppercase tracking-widest mb-0.5">
                        Scheduled For
                      </p>
                      <p className="text-xs font-black text-black/80">
                        {post.scheduledDate
                          ? new Date(post.scheduledDate).toLocaleString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => onUpdateStatus(post)}
                      className="p-2 bg-white rounded-full text-[#EAB308] shadow-sm hover:scale-110 transition-transform"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  {/* Scheduled Targets Details */}
                  {post.scheduledDateSource && post.scheduledDateSource.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-[#EAB308]/10">
                      {post.scheduledDateSource.map((src) => {
                        let items = [];
                        let label = "";
                        let title = "";

                        if (src === "gmb" && post.locations) {
                          items = post.locations.map(loc => loc.locality || "Location");
                          title = "Google Business Locations";
                        } else if (src === "fb" && post.fbPages) {
                          items = post.fbPages.map(pg => pg.pageName || pg.name || "Page");
                          title = "Facebook Pages";
                        } else if (src === "ig" && post.igPages) {
                          items = post.igPages.map(acc => acc.igUsername || "Profile");
                          title = "Instagram Profiles";
                        }

                        if (items.length === 0) return null;

                        const firstItem = items[0];
                        const extraCount = items.length - 1;

                        return (
                          <div key={src} className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              {src === "gmb" && <MapPin size={10} className="text-[#EAB308]" />}
                              {src === "fb" && <Facebook size={10} className="text-blue-600" />}
                              {src === "ig" && <Instagram size={10} className="text-pink-600" />}
                              <span className="text-[9px] font-black uppercase tracking-widest text-black/60">
                                {src === "gmb" ? "Google Business" : src === "fb" ? "Facebook" : "Instagram"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 pl-4">
                              <span className="px-2 py-0.5 bg-white border border-black/5 rounded-md text-[8px] font-bold text-black/40">
                                {firstItem}
                              </span>
                              {extraCount > 0 && (
                                <button
                                  onClick={() => openShowMoreModal(title, items)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-black/5 rounded-md text-[8px] font-bold text-black/60 transition-colors"
                                >
                                  +{extraCount} more
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => handleMediaChoice("gmb")}
                    className="w-full py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                  >
                    Post Now
                  </button>
                </div>

                {/* Quick Post to other platforms if not scheduled/posted */}
                {((!post.scheduledDateSource?.includes("fb") && !isPostedFb) ||
                  (!post.scheduledDateSource?.includes("ig") && !isPostedIg)) && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {!post.scheduledDateSource?.includes("fb") && !isPostedFb && (
                      <button
                        onClick={() => handleMediaChoice("fb")}
                        className="py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                      >
                        <Facebook size={14} /> Facebook
                      </button>
                    )}
                    {!post.scheduledDateSource?.includes("ig") && !isPostedIg && (
                      <button
                        onClick={() => handleMediaChoice("ig")}
                        className="py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                      >
                        <Instagram size={14} /> Instagram
                      </button>
                    )}
                  </div>
                )}
              </>
              )}

              {post.status === "failed" && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <XCircle size={18} className="text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-700 font-bold uppercase line-clamp-1">
                      {post.error || "Failed to publish"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMediaChoice("gmb")}
                    className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Retry Delivery
                  </button>
                </div>
              )}

              {/* AI Video Conversion Mini-CTA */}
              {imgUrl && !vidUrl && post.status !== "rejected" && (
                <button
                  disabled={isConvertingThisPost}
                  onClick={() => {
                    onConvertToVideo(post);
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-black/[0.03] rounded-2xl hover:border-[#EAB308] hover:bg-white transition-all group/v"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm text-black group-hover/v:text-[#EAB308] transition-colors">
                      {isConvertingThisPost ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Video size={16} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/80">
                        {isConvertingThisPost ? "Generating Video..." : "Convert into video"}
                      </p>
                      <p className="text-[8px] font-bold text-black/30 uppercase tracking-tighter">
                        AI Video Motion • {videoGenerationCoins} Coins
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-black/10 group-hover/v:translate-x-1 transition-transform"
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-[200] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center">
              {/* ICON */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#EAB308]/20 rounded-full blur-xl animate-pulse"></div>

                <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-black/50">
                  <Video className="w-10 h-10 text-[#EAB308] animate-pulse" />
                </div>
              </div>

              {/* TITLE */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Generating Video...
              </h3>

              {/* SUBTEXT */}
              <p className="text-sm text-slate-500 mb-5">
                     ⏳ {timeLeft > 0 ? `${timeLeft}s remaining` : "Almost done..."}
                </p>

              {/* SLIDING BAR */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative mb-4">
                <div
                  className="absolute top-0 left-0 h-full w-1/2 bg-[#EAB308] rounded-full"
                  style={{
                    animation: "slide 1.2s linear infinite",
                  }}
                ></div>
              </div>

              {/* COUNTDOWN TIMER */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Time</span>
                <span className="text-2xl font-black text-[#EAB308] font-mono tracking-wider">{formatTime(timeLeft)}</span>
              </div>

              {/* KEYFRAME */}
              <style>
                {`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}
              </style>
            </div>
          </div>
        )}

        {/* Show More Modal */}
        {showMoreModal.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-black/5 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">{showMoreModal.title}</h3>
                <button
                  onClick={closeShowMoreModal}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {showMoreModal.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <MediaSelectionModal
          isOpen={selectionModal.isOpen}
          onClose={() => setSelectionModal({ isOpen: false, type: "" })}
          onSelect={onMediaSelect}
          imageUrl={imgUrl}
          videoUrl={vidUrl}
        />
      </>
    );
  },
);

PostCard.displayName = "PostCard";

export default PostCard;
