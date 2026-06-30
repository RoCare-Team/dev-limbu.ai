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
  Youtube,
  Image as ImageIconLucide,
  ChevronRight,
  Clock,
  Linkedin,
  YoutubeIcon,
} from "lucide-react";
import { isPostVideoMedia } from "./ImageToVideoModal";
import {
  // looksLikeVideoUrl,
  postHasVideoAsset,
  postImageUrl,
  postVideoUrl,
} from "@/lib/postMediaUrls";
import Image from "next/image";
import MediaSelectionModal from "./MediaSelectionModal";
// import VideoGenerationModal from "./component-modal/VideoGenerationModal";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-100",
  approved: "bg-blue-50 text-blue-600 border-blue-100",
  posted: "bg-green-50 text-green-600 border-green-100",
  partial_failed: "bg-orange-50 text-orange-600 border-orange-100",
  failed: "bg-red-50 text-red-600 border-red-100",
  scheduled: "bg-purple-50 text-purple-600 border-purple-100",
};

const FALLBACK_POST_IMAGE = "/images/fallback_image.png";

const PLATFORM_ALIASES = {
  gmb: "gmb",
  fb: "facebook",
  facebook: "facebook",
  ig: "instagram",
  instagram: "instagram",
  pi: "pinterest",
  pin: "pinterest",
  pinterest: "pinterest",
  li: "linkedin",
  linkedin: "linkedin",
  yt: "youtube",
  youtube: "youtube",
};

const formatPostedDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

const formatCreatedDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
  });
};

const getPlatformPost = (whenPosted, platformKey) => {
  const platform = PLATFORM_ALIASES[platformKey] || platformKey;
  if (!whenPosted || !platform) return null;

  if (Array.isArray(whenPosted)) {
    return (
      whenPosted.find(
        (item) =>
          PLATFORM_ALIASES[item?.platform] === platform ||
          item?.platform === platform,
      ) || null
    );
  }

  const raw = whenPosted[platform] ?? whenPosted[platformKey];
  if (raw === undefined || raw === null) return null;

  if (typeof raw === "object") {
    return { platform, ...raw };
  }

  if (raw === true || raw === "posted" || raw === "true") {
    return { platform, posted: true, postedDate: null };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return { platform, posted: true, postedDate: raw };
  }

  return null;
};

const isPlatformPosted = (whenPosted, platformKey) => {
  const entry = getPlatformPost(whenPosted, platformKey);
  return Boolean(entry?.posted || entry?.postedDate);
};

const getPlatformPostedDate = (whenPosted, platformKey) => {
  const entry = getPlatformPost(whenPosted, platformKey);
  return entry?.postedDate || entry?.postedAt || entry?.date || null;
};

const getPlatformError = (whenPosted, platformKey) => {
  const entry = getPlatformPost(whenPosted, platformKey);
  return entry?.posted ? "" : entry?.error || "";
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
    handlePinterestPost,
    handleLinkedinPost,
    handleYoutubePost,
    onConvertToVideo,
    convertingVideoPostId = null,
    videoGenerationCoins = 200,
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showFull, setShowFull] = useState(false);
    const [activeDesc, setActiveDesc] = useState("gmb");
    const [cardMediaTab, setCardMediaTab] = useState("image");

    const { isPostedGmb, isPostedFb, isPostedIg, isPostedYoutube } = useMemo(
      () => ({
        isPostedGmb:
          post.locations?.some((l) => l.isPosted) ||
          isPlatformPosted(post.whenPosted, "gmb"),
        isPostedFb:
          !!post.facebookPostId ||
          isPlatformPosted(post.whenPosted, "facebook") ||
          post.fbPages?.some((p) => p.isPosted),
        isPostedIg:
          isPlatformPosted(post.whenPosted, "instagram") ||
          post.igPages?.some((p) => p.isPosted),
        isPostedYoutube: isPlatformPosted(post.whenPosted, "youtube"),
      }),
      [
        post.locations,
        post.whenPosted,
        post.facebookPostId,
        post.fbPages,
        post.igPages,
      ],
    );

    const scheduledPlatforms = useMemo(() => {
      const sources = Array.isArray(post.scheduledDateSource)
        ? post.scheduledDateSource
        : post.scheduledDateSource
          ? [post.scheduledDateSource]
          : [];

      return new Set(
        sources
          .map((source) => PLATFORM_ALIASES[source] || source)
          .filter(Boolean),
      );
    }, [post.scheduledDateSource]);

    const isPlatformScheduled = useCallback(
      (platformKey) => {
        const platform = PLATFORM_ALIASES[platformKey] || platformKey;
        return scheduledPlatforms.has(platform);
      },
      [scheduledPlatforms],
    );

    const initialDescriptions = useMemo(
      () => ({
        gmb: post?.gmbDescription ?? post?.description ?? "",
        fb: post?.fbDescription ?? post?.description ?? "",
        ig: post?.igDescription ?? post?.description ?? "",
        pin: post?.piDescription ?? post?.description ?? "",
        li: post?.liDescription ?? "",
        yt:post?.ytDescription
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
    const generatedVideoOutputUrl = useMemo(
      () =>
        typeof post?.videoOutput === "string" ? post.videoOutput.trim() : "",
      [post?.videoOutput],
    );
    const hasGeneratedVideoOutput = useMemo(
      () => generatedVideoOutputUrl.length > 0,
      [generatedVideoOutputUrl],
    );
    const hasVideoAsset = useMemo(
      () =>
        Boolean(hasGeneratedVideoOutput || vidUrl || postHasVideoAsset(post)),
      [hasGeneratedVideoOutput, post, vidUrl],
    );

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

    const createdDateLabel = useMemo(
      () =>
        formatCreatedDate(
          post.createdAt || post.created_at || post.createdDate || post.date,
        ),
      [post.createdAt, post.created_at, post.createdDate, post.date],
    );

    const isConvertingThisPost = useMemo(() => {
      return (
        convertingVideoPostId != null &&
        String(convertingVideoPostId) === String(post._id)
      );
    }, [convertingVideoPostId, post._id]);

    const lastPostedDate = useMemo(() => {
      if (post.status !== "posted" && post.status !== "partial_failed")
        return null;
      let latest = null;

      const checkDate = (dateStr) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return;
        if (!latest || d > latest) latest = d;
      };

      [
        "gmb",
        "facebook",
        "instagram",
        "pinterest",
        "linkedin",
        "youtube",
      ].forEach((platform) => {
        checkDate(getPlatformPostedDate(post.whenPosted, platform));
      });

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

    const publishedPlatforms = useMemo(() => {
      const platformMeta = [
        {
          key: "gmb",
          label: "Google",
          title: "Google Business",
          icon: "/social-icon/gmb-icon.png",
          color: "border-green-100",
          accent: "bg-green-50 text-green-700",
          posted: isPostedGmb,
          fallbackDate: post.locations?.find((l) => l.isPosted && l.postedAt)
            ?.postedAt,
        },
        {
          key: "facebook",
          label: "Facebook",
          title: "Facebook",
          icon: "/social-icon/facebook-icon.png",
          color: "border-blue-100",
          accent: "bg-blue-50 text-blue-700",
          posted: isPostedFb,
          fallbackDate: post.fbPages?.find((p) => p.isPosted && p.postedAt)
            ?.postedAt,
        },
        {
          key: "instagram",
          label: "Instagram",
          title: "Instagram",
          icon: "/social-icon/instagram-icon.png",
          color: "border-pink-100",
          accent: "bg-pink-50 text-pink-700",
          posted: isPostedIg,
          fallbackDate: post.igPages?.find((p) => p.isPosted && p.postedAt)
            ?.postedAt,
        },
        {
          key: "pinterest",
          label: "Pinterest",
          title: "Pinterest",
          icon: "/social-icon/pinterest-icon.png",
          color: "border-red-100",
          accent: "bg-red-50 text-red-700",
          posted: isPlatformPosted(post.whenPosted, "pinterest"),
        },
        {
          key: "linkedin",
          label: "LinkedIn",
          title: "LinkedIn",
          icon: "/social-icon/linkedin.png",
          color: "border-sky-100",
          accent: "bg-sky-50 text-sky-700",
          posted: isPlatformPosted(post.whenPosted, "linkedin"),
        },
        {
          key: "youtube",
          label: "YouTube",
          title: "YouTube",
          icon: "/social-icon/youtube-short.png",
          color: "border-rose-100",
          accent: "bg-rose-50 text-rose-700",
          posted: isPostedYoutube,
        },
      ];

      return platformMeta
        .filter((platform) => platform.posted)
        .map((platform) => ({
          ...platform,
          postedAt:
            getPlatformPostedDate(post.whenPosted, platform.key) ||
            platform.fallbackDate,
        }));
    }, [
      isPostedFb,
      isPostedGmb,
      isPostedIg,
      isPostedYoutube,
      post.fbPages,
      post.igPages,
      post.locations,
      post.whenPosted,
    ]);

    const failedPlatforms = useMemo(() => {
      const platformMeta = [
        {
          key: "gmb",
          label: "Google",
          title: "Google Business",
          icon: "/social-icon/gmb-icon.png",
          color: "border-red-100",
          accent: "bg-red-50 text-red-700",
          error:
            getPlatformError(post.whenPosted, "gmb") ||
            post.locations?.find((l) => l.error && !l.isPosted)?.error ||
            "",
          wasTargeted:
            scheduledPlatforms.has("gmb") ||
            (Array.isArray(post.locations) && post.locations.length > 0),
        },
        {
          key: "facebook",
          label: "Facebook",
          title: "Facebook",
          icon: "/social-icon/facebook-icon.png",
          color: "border-red-100",
          accent: "bg-red-50 text-red-700",
          error:
            getPlatformError(post.whenPosted, "facebook") ||
            post.fbPages?.find((p) => p.error && !p.isPosted)?.error ||
            "",
          wasTargeted:
            scheduledPlatforms.has("facebook") ||
            (Array.isArray(post.fbPages) && post.fbPages.length > 0),
        },
        {
          key: "instagram",
          label: "Instagram",
          title: "Instagram",
          icon: "/social-icon/instagram-icon.png",
          color: "border-red-100",
          accent: "bg-red-50 text-red-700",
          error:
            getPlatformError(post.whenPosted, "instagram") ||
            post.igPages?.find((p) => p.error && !p.isPosted)?.error ||
            "",
          wasTargeted:
            scheduledPlatforms.has("instagram") ||
            (Array.isArray(post.igPages) && post.igPages.length > 0),
        },
      ];

      return platformMeta.filter(
        (platform) =>
          platform.wasTargeted &&
          platform.error &&
          !isPlatformPosted(post.whenPosted, platform.key),
      );
    }, [
      post.fbPages,
      post.igPages,
      post.locations,
      post.whenPosted,
      scheduledPlatforms,
    ]);

    const [isVideoSuccess, setIsVideoSuccess] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (isConvertingThisPost) {
        setIsLoading(true);
      } else if (isLoading) {
        setIsLoading(false);
        setIsVideoSuccess(true);
      }
    }, [isConvertingThisPost]);
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
      const fieldMap = {
        gmb: "gmbDescription",
        fb: "fbDescription",
        ig: "igDescription",
        pinterest: "pinterestDescription",
        li: "liDescription",
      };
      const field = fieldMap[activeDesc] || "description";
      onEditDescription(post._id, { [field]: drafts[activeDesc] });
      setIsEditing(false);
    }, [activeDesc, drafts, onEditDescription, post._id]);

    // Modal state for showing all scheduled targets
    const [showMoreModal, setShowMoreModal] = useState({
      isOpen: false,
      title: "",
      items: [],
    });

    const openShowMoreModal = (title, items) => {
      setShowMoreModal({ isOpen: true, title, items });
    };

    const closeShowMoreModal = () => {
      setShowMoreModal({ isOpen: false, title: "", items: [] });
    };

    const [selectionModal, setSelectionModal] = useState({
      isOpen: false,
      type: "",
    });

    const handleMediaChoice = (type) => {
      if (type === "gmb") {
        if (dualCardMedia) {
          const forcedMedia =
            cardMediaTab === "video"
              ? { type: "video", url: vidUrl }
              : { type: "image", url: imgUrl };
          handlePost(post, forcedMedia);
        } else {
          handlePost(post);
        }
      } else if (type === "youtube") {
        const youtubeUrl = generatedVideoOutputUrl || vidUrl;
        const forcedMedia = youtubeUrl
          ? { type: "video", url: youtubeUrl }
          : null;
        handleYoutubePost(post, forcedMedia);
      } else if (dualCardMedia) {
        setSelectionModal({ isOpen: true, type });
      } else {
        if (type === "fb") handleFacebookPost(post);
        else if (type === "ig") handleInstagramPost(post);
        else if (type === "pinterest") handlePinterestPost(post);
        else if (type === "linkedin") handleLinkedinPost(post);
      }
    };

    const onMediaSelect = (choice) => {
      const forcedMedia =
        choice === "video"
          ? { type: "video", url: vidUrl }
          : { type: "image", url: imgUrl };
      const type = selectionModal.type;
      setSelectionModal({ isOpen: false, type: "" });

      if (type === "gmb") handlePost(post, forcedMedia);
      else if (type === "fb") handleFacebookPost(post, forcedMedia);
      else if (type === "ig") handleInstagramPost(post, forcedMedia);
      else if (type === "pinterest") handlePinterestPost(post, forcedMedia);
      else if (type === "linkedin") handleLinkedinPost(post, forcedMedia);
    };

    const canPostToYoutube =
      hasGeneratedVideoOutput && post.status !== "rejected" && post.status !== "pending";

    const youtubePostButton = canPostToYoutube ? (
      <button
        onClick={() => handleMediaChoice("youtube")}
        className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-300 transition-all shadow-lg shadow-red-500/20"
      >
        <Youtube size={13} />{" "}
        {isPostedYoutube ? "Repost to YouTube" : "Post to YouTube"}
      </button>
    ) : null;

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
                      : FALLBACK_POST_IMAGE
                  }
                  width={400}
                  height={300}
                  alt="Post Content"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
            </a>

            {/* Status Chip */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
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
              {createdDateLabel && (
                <div className="px-3 py-1 rounded-full border border-white/70 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                  {createdDateLabel}
                </div>
              )}
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
              <div className="flex p-1 bg-slate-50 rounded-xl border border-black/5 overflow-x-auto no-scrollbar max-w-[280px]">
                {[
                  { id: "gmb", icon: MapPin, label: "GMB" },
                  { id: "fb", icon: Facebook, label: "FB" },
                  { id: "ig", icon: Instagram, label: "Insta" },
                  { id: "pin", icon: Share2, label: "Pin" },
                  { id: "li", icon: Linkedin, label: "LinkedIn" },
                  { id: "yt", icon: YoutubeIcon, label: "YT" }, // YouTube button
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveDesc(p.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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
                  <div className="relative">
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
                    <div className="absolute bottom-3 right-4">
                      <span
                        className={`text-[9px] font-black uppercase tracking-tighter ${drafts[activeDesc]?.length > (activeDesc === "li" ? 3000 : activeDesc === "pinterest" ? 800 : activeDesc === "gmb" ? 1500 : 2200) ? "text-red-500" : "text-black/20"}`}
                      >
                        {drafts[activeDesc]?.length || 0} /{" "}
                        {activeDesc === "li"
                          ? 3000
                          : activeDesc === "pinterest"
                            ? 800
                            : activeDesc === "gmb"
                              ? 1500
                              : 2200}
                      </span>
                    </div>
                  </div>
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
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        onUpdateStatus(
                          post._id,
                          "approved",
                          null,
                          [],
                          undefined,
                          null,
                          [],
                          [],
                          cardShowVideo ? "video" : "image",
                        )
                      }
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
                  {youtubePostButton}
                </div>
              )}

              {post.status === "approved" && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleMediaChoice("gmb")}
                    className="w-full py-4 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.14em] flex items-center justify-center gap-3 hover:bg-[#EAB308] hover:text-black transition-all group/btn shadow-lg shadow-black/10"
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
                      className="py-3.5 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                    >
                      <Facebook size={13} /> Post to FB Pages
                    </button>
                    <button
                      onClick={() => handleMediaChoice("ig")}
                      className="py-3.5 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                    >
                      <Instagram size={13} /> Post to Instagram
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMediaChoice("pinterest")}
                      className="w-full py-3.5 bg-[#E60023] text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#c5001f] transition-all shadow-sm"
                    >
                      <Image
                        src="/social-icon/pinterest-icon.png"
                        width={13}
                        height={13}
                        className="object-contain"
                        alt="Pinterest"
                      />{" "}
                      Create Pin
                    </button>
                    <button
                      onClick={() => handleMediaChoice("linkedin")}
                      className="w-full py-3.5 bg-[#0A66C2] text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#004182] transition-all shadow-sm"
                    >
                      <Image
                        src="/social-icon/linkedin.png"
                        width={13}
                        height={13}
                        className="object-contain"
                        alt="LinkedIn"
                      />{" "}
                      Post to LinkedIn
                    </button>
                  </div>
                  {youtubePostButton}
                  <button
                    onClick={() => onUpdateStatus(post)}
                    className="w-full py-3.5 bg-white border-2 border-[#EAB308]/20 text-black/80 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308]/10 hover:border-[#EAB308] transition-all shadow-sm"
                  >
                    <Calendar size={14} className="text-[#EAB308]" /> Schedule
                    Post
                  </button>
                </div>
              )}

              {(post.status === "posted" ||
                post.status === "partial_failed") && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-black/[0.04] bg-slate-50/80 p-2 shadow-inner shadow-white">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Published
                        </p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-300">
                          {publishedPlatforms.length} platform
                          {publishedPlatforms.length === 1 ? "" : "s"} live
                        </p>
                      </div>
                      {lastPostedDate && (
                        <div className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
                          <Clock size={9} className="text-emerald-500" />
                          {lastPostedDate.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </div>
                      )}
                    </div>

                    {publishedPlatforms.length > 0 && (
                      <div className="grid grid-cols-3 gap-1">
                        {publishedPlatforms.map((platform) => (
                          <div
                            key={platform.key}
                            className={`min-w-0 rounded-lg border bg-white px-1.5 py-1.5 shadow-sm ${platform.color}`}
                          >
                            <div className="mb-0.5 flex min-w-0 items-center">
                              <span
                                className={`truncate rounded px-1 py-0.5 text-[7px] font-black uppercase tracking-widest ${platform.accent}`}
                              >
                                {platform.label}
                              </span>
                            </div>
                            <div
                              className="flex min-w-0 items-center gap-0.5 text-[8px] font-bold text-slate-500"
                              title={
                                formatPostedDate(platform.postedAt) ||
                                "Posted date not saved"
                              }
                            >
                              <Clock
                                size={8}
                                className="shrink-0 text-slate-300"
                              />
                              <span className="truncate">
                                {formatPostedDate(platform.postedAt) ||
                                  "No date"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {publishedPlatforms.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Platform publish details not saved
                      </div>
                    )}
                    {failedPlatforms.length > 0 && (
                      <div className="mt-2 rounded-xl border border-red-100 bg-red-50/70 p-2">
                        <p className="mb-1.5 text-[8px] font-black uppercase tracking-widest text-red-500">
                          Failed
                        </p>
                        <div className="space-y-1">
                          {failedPlatforms.map((platform) => (
                            <div
                              key={platform.key}
                              className="flex min-w-0 items-center gap-2 rounded-lg border border-red-100 bg-white px-2 py-1.5"
                              title={platform.error}
                            >
                              <Image
                                src={platform.icon}
                                width={14}
                                height={14}
                                alt={platform.title}
                                className="shrink-0 object-contain"
                              />
                              <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-red-600">
                                {platform.label}
                              </span>
                              <span className="truncate text-[8px] font-bold text-red-500/80">
                                {platform.error}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleMediaChoice("gmb")}
                    className="w-full py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[9px] font-black uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-all shadow-sm"
                  >
                    <RefreshCw
                      size={14}
                      className="text-[#EAB308] group-hover:text-black"
                    />{" "}
                    {isPostedGmb ? "Repost to GMB" : "Post to GMB"}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMediaChoice("fb")}
                      className="py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] transition-all shadow-sm"
                    >
                      <Facebook
                        size={13}
                        className="text-[#EAB308] group-hover:text-black"
                      />{" "}
                      {isPostedFb ? "Repost to FB Pages" : "Post to FB Pages"}
                    </button>
                    <button
                      onClick={() => handleMediaChoice("ig")}
                      className="py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] transition-all shadow-sm"
                    >
                      <Instagram
                        size={13}
                        className="text-[#EAB308] group-hover:text-black"
                      />{" "}
                      {isPostedIg ? "Repost to Instagram" : "Post to Instagram"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMediaChoice("pinterest")}
                      className="w-full py-3.5 bg-[#E60023] text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#c5001f] transition-all shadow-sm"
                    >
                      <Image
                        src="/social-icon/pinterest-icon.png"
                        width={13}
                        height={13}
                        className="object-contain"
                        alt="Pinterest"
                      />
                      {isPlatformPosted(post.whenPosted, "pinterest")
                        ? "Repost to Pinterest"
                        : "Create Pin"}
                    </button>
                    <button
                      onClick={() => handleMediaChoice("linkedin")}
                      className="w-full py-3.5 bg-[#0A66C2] text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#004182] transition-all shadow-sm"
                    >
                      <Image
                        src="/social-icon/linkedin.png"
                        width={13}
                        height={13}
                        className="object-contain"
                        alt="LinkedIn"
                      />
                      {isPlatformPosted(post.whenPosted, "linkedin")
                        ? "Repost to LinkedIn"
                        : "Post to LinkedIn"}
                    </button>
                  </div>
                  {youtubePostButton}
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
                    {post.scheduledDateSource &&
                      post.scheduledDateSource.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-[#EAB308]/10">
                          {post.scheduledDateSource.map((src) => {
                            let items = [];
                            let label = "";
                            let title = "";

                            if (src === "gmb" && post.locations) {
                              items = post.locations.map(
                                (loc) => loc.locality || "Location",
                              );
                              title = "Google Business Locations";
                            } else if (src === "fb" && post.fbPages) {
                              items = post.fbPages.map(
                                (pg) => pg.pageName || pg.name || "Page",
                              );
                              title = "Facebook Pages";
                            } else if (src === "ig" && post.igPages) {
                              items = post.igPages.map(
                                (acc) => acc.igUsername || "Profile",
                              );
                              title = "Instagram Profiles";
                            }

                            if (items.length === 0) return null;

                            const firstItem = items[0];
                            const extraCount = items.length - 1;

                            return (
                              <div key={src} className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  {src === "gmb" && (
                                    <MapPin
                                      size={10}
                                      className="text-[#EAB308]"
                                    />
                                  )}
                                  {src === "fb" && (
                                    <Facebook
                                      size={10}
                                      className="text-blue-600"
                                    />
                                  )}
                                  {src === "ig" && (
                                    <Instagram
                                      size={10}
                                      className="text-pink-600"
                                    />
                                  )}
                                  <span className="text-[9px] font-black uppercase tracking-widest text-black/60">
                                    {src === "gmb"
                                      ? "Google Business"
                                      : src === "fb"
                                        ? "Facebook"
                                        : "Instagram"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 pl-4">
                                  <span className="px-2 py-0.5 bg-white border border-black/5 rounded-md text-[8px] font-bold text-black/40">
                                    {firstItem}
                                  </span>
                                  {extraCount > 0 && (
                                    <button
                                      onClick={() =>
                                        openShowMoreModal(title, items)
                                      }
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

                    {!isPlatformScheduled("gmb") && !isPostedGmb && (
                      <button
                        onClick={() => handleMediaChoice("gmb")}
                        className="w-full py-3 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em]"
                      >
                        Post to GMB
                      </button>
                    )}
                  </div>

                  {/* Quick Post to other platforms if not scheduled/posted */}
                  {((!isPlatformScheduled("fb") && !isPostedFb) ||
                    (!isPlatformScheduled("ig") && !isPostedIg) ||
                    (!isPlatformScheduled("pinterest") &&
                      !isPlatformPosted(post.whenPosted, "pinterest")) ||
                    (!isPlatformScheduled("linkedin") &&
                      !isPlatformPosted(post.whenPosted, "linkedin")) ||
                    canPostToYoutube) && (
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {!isPlatformScheduled("fb") && !isPostedFb && (
                          <button
                            onClick={() => handleMediaChoice("fb")}
                            className="py-3.5 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                          >
                            <Facebook size={13} /> Post to FB Pages
                          </button>
                        )}
                        {!isPlatformScheduled("ig") && !isPostedIg && (
                          <button
                            onClick={() => handleMediaChoice("ig")}
                            className="py-3.5 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm"
                          >
                            <Instagram size={13} /> Post to Instagram
                          </button>
                        )}
                      </div>
                      {((!isPlatformScheduled("pinterest") &&
                        !isPlatformPosted(post.whenPosted, "pinterest")) ||
                        (!isPlatformScheduled("linkedin") &&
                          !isPlatformPosted(post.whenPosted, "linkedin"))) && (
                        <div className="grid grid-cols-2 gap-3">
                          {!isPlatformScheduled("pinterest") &&
                            !isPlatformPosted(post.whenPosted, "pinterest") && (
                              <button
                                onClick={() => handleMediaChoice("pinterest")}
                                className="w-full py-3.5 bg-[#E60023] text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#c5001f] transition-all shadow-sm"
                              >
                                <Image
                                  src="/social-icon/pinterest-icon.png"
                                  width={13}
                                  height={13}
                                  className="object-contain"
                                  alt="Pinterest"
                                />
                                Post to Pinterest
                              </button>
                            )}
                          {!isPlatformScheduled("linkedin") &&
                            !isPlatformPosted(post.whenPosted, "linkedin") && (
                              <button
                                onClick={() => handleMediaChoice("linkedin")}
                                className="w-full py-3.5 bg-[#0A66C2] text-white rounded-xl text-[8px] font-black uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:bg-[#004182] transition-all shadow-sm"
                              >
                                <Image
                                  src="/social-icon/linkedin.png"
                                  width={13}
                                  height={13}
                                  className="object-contain"
                                  alt="LinkedIn"
                                />
                                Post to LinkedIn
                              </button>
                            )}
                        </div>
                      )}
                      {youtubePostButton}
                    </div>
                  )}
                </>
              )}

              {(post.status === "failed" ||
                post.status === "partial_failed") && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <XCircle size={18} className="text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-700 font-bold uppercase line-clamp-1">
                      {post.error || "Failed to publish"}
                    </p>
                  </div>
                  {failedPlatforms.length > 0 && (
                    <div className="space-y-1.5 rounded-2xl border border-red-100 bg-red-50/70 p-3">
                      {failedPlatforms.map((platform) => (
                        <div
                          key={platform.key}
                          className="flex min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2"
                          title={platform.error}
                        >
                          <Image
                            src={platform.icon}
                            width={14}
                            height={14}
                            alt={platform.title}
                            className="shrink-0 object-contain"
                          />
                          <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-red-600">
                            {platform.label}
                          </span>
                          <span className="truncate text-[9px] font-bold text-red-500/80">
                            {platform.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleMediaChoice("gmb")}
                    className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Retry Delivery
                  </button>
                  {youtubePostButton}
                </div>
              )}

              {/* AI Video Conversion Mini-CTA */}
              {imgUrl && !vidUrl && post.status !== "rejected" && (
                <button
                  disabled={isConvertingThisPost}
                  onClick={() => {
                    console.log("VIDEO API CALLED", post._id);
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
                        {isConvertingThisPost
                          ? "Generating Video..."
                          : "Convert into video"}
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

        {(isLoading || isVideoSuccess) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[200] flex items-center justify-center px-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center animate-scaleIn relative">
              {/* ❌ CLOSE BUTTON */}
              {isVideoSuccess && (
                <button
                  onClick={() => setIsVideoSuccess(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 transition"
                >
                  ✕
                </button>
              )}

              {isVideoSuccess ? (
                <>
                  {/* ✅ SUCCESS ICON */}
                  <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-black shadow-inner">
                    <svg
                      className="w-14 h-14 text-[#EAB308] animate-tick"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="tick-path"
                      />
                    </svg>
                  </div>

                  {/* TITLE */}
                  <h3 className="text-2xl font-extrabold text-[#EAB308] mb-2 animate-fadeUp">
                    Video Ready 
                  </h3>

                  {/* SUBTEXT */}
                  <p className="text-sm text-slate-600 mb-6 animate-fadeUp delay-100">
                    Aapki video successfully generate ho gayi hai. Ab aap ise
                    post ya download kar sakte ho 
                  </p>

                  {/* DONE BUTTON */}
                  <button
                    onClick={() => setIsVideoSuccess(false)}
                    className="px-6 py-2.5 bg-[#EAB308] text-black rounded-xl font-semibold hover:scale-105 transition shadow-md animate-fadeUp delay-200"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  {/* 🔄 LOADING UI */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-[#EAB308]/20 rounded-full blur-xl animate-pulse"></div>

                    <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-black/50">
                      <Video className="w-10 h-10 text-[#EAB308] animate-pulse" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Generating Video...
                  </h3>

                  <p className="text-sm text-slate-500 mb-5">
                    ⏳{" "}
                    {timeLeft > 0 ? `${timeLeft}s remaining` : "Almost done..."}
                  </p>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative mb-4">
                    <div
                      className="absolute top-0 left-0 h-full w-1/2 bg-[#EAB308] rounded-full"
                      style={{
                        animation: "slide 1.2s linear infinite",
                      }}
                    ></div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Estimated Time
                    </span>
                    <span className="text-2xl font-black text-[#EAB308] font-mono tracking-wider">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </>
              )}

              {/* ✨ ANIMATIONS */}
              <style>
                {`

          @keyframes tickDraw {
          0% {
            stroke-dasharray: 0 50;
          }
          100% {
            stroke-dasharray: 50 0;
          }
        }

        .tick-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: tickDraw 0.6s ease forwards;
        }

        .animate-tick {
          animation: popIn 0.3s ease;
        }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-fadeIn { animation: fadeIn 0.3s ease; }
        .animate-scaleIn { animation: scaleIn 0.35s ease; }
        .animate-fadeUp { animation: fadeUp 0.4s ease forwards; }
        .animate-bounceIn { animation: bounceIn 0.4s ease; }
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
                <h3 className="text-sm font-bold text-slate-800">
                  {showMoreModal.title}
                </h3>
                <button
                  onClick={closeShowMoreModal}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {showMoreModal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 font-medium"
                  >
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
