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
} from "lucide-react";
import { isPostVideoMedia } from "./ImageToVideoModal";
import { postImageUrl, postVideoUrl } from "@/lib/postMediaUrls";
import Image from "next/image";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-100",
  approved: "bg-blue-50 text-blue-600 border-blue-100",
  posted: "bg-green-50 text-green-600 border-green-100",
  failed: "bg-red-50 text-red-600 border-red-100",
  scheduled: "bg-purple-50 text-purple-600 border-purple-100",
};

const PostCard = React.memo(({
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

  const { isPostedGmb, isPostedFb, isPostedIg } = useMemo(() => ({
    isPostedGmb: post.locations?.some((l) => l.isPosted) || post.whenPosted?.gmb,
    isPostedFb: !!post.facebookPostId || post.whenPosted?.facebook || post.fbPages?.some((p) => p.isPosted),
    isPostedIg: post.whenPosted?.instagram || post.igPages?.some((p) => p.isPosted),
  }), [post.locations, post.whenPosted, post.facebookPostId, post.fbPages, post.igPages]);

  const initialDescriptions = useMemo(() => ({
    gmb: post?.gmbDescription ?? post?.description ?? "",
    fb: post?.fbDescription ?? post?.description ?? "",
    ig: post?.igDescription ?? post?.description ?? "",
  }), [post]);

  const [drafts, setDrafts] = useState(initialDescriptions);

  useEffect(() => {
    if (!isEditing) setDrafts(initialDescriptions);
  }, [initialDescriptions, isEditing]);

  const imgUrl = useMemo(() => postImageUrl(post), [post]);
  const vidUrl = useMemo(() => postVideoUrl(post), [post]);
  const dualCardMedia = Boolean(imgUrl && vidUrl);

  const displayMediaUrl = useMemo(() => {
    return dualCardMedia ? (cardMediaTab === "video" ? vidUrl : imgUrl) : vidUrl || post?.aiOutput || "";
  }, [dualCardMedia, cardMediaTab, vidUrl, imgUrl, post?.aiOutput]);

  const cardShowVideo = useMemo(() => {
    return dualCardMedia ? cardMediaTab === "video" : isPostVideoMedia(post);
  }, [dualCardMedia, cardMediaTab, post]);

  const isConvertingThisPost = useMemo(() => {
    return convertingVideoPostId != null && String(convertingVideoPostId) === String(post._id);
  }, [convertingVideoPostId, post._id]);

  const handleSaveDescription = useCallback(() => {
    const field = activeDesc === "gmb" ? "gmbDescription" : activeDesc === "fb" ? "fbDescription" : "igDescription";
    onEditDescription(post._id, { [field]: drafts[activeDesc] });
    setIsEditing(false);
  }, [activeDesc, drafts, onEditDescription, post._id]);

  return (
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
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cardMediaTab === tab ? "bg-white text-black shadow-sm" : "text-white/70 hover:text-white"
                  }`}
              >
                {tab === "image" ? <ImageIconLucide size={12} /> : <Video size={12} />}
                {tab}
              </button>
            ))}
          </div>
        )}

        <a href={displayMediaUrl || post.aiOutput} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          {cardShowVideo ? (
            <video src={displayMediaUrl} className="w-full h-full object-cover" controls playsInline muted preload="metadata" />
          ) : (
            <Image
              src={displayMediaUrl?.startsWith("http") ? displayMediaUrl : "https://via.placeholder.com/400"}
              width={400}
              height={300}
              alt="Post Content"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
        </a>

        {/* Status Chip */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`px-3 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 shadow-sm ${STATUS_COLORS[post.status] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${post.status === "posted" ? "bg-green-500" : "bg-current"}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">{post.status}</span>
          </div>
        </div>

        {/* Floating Icons (Download/Share) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => { e.preventDefault(); handleDownload({ ...post, aiOutput: displayMediaUrl }); }}
            className="p-3 bg-white/90 backdrop-blur text-black rounded-2xl shadow-xl hover:bg-[#EAB308] hover:text-black transition-all"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); handleShare({ ...post, aiOutput: displayMediaUrl }); }}
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeDesc === p.id ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black/50"
                  }`}
              >
                <p.icon size={12} className={activeDesc === p.id ? "text-[#EAB308]" : ""} />
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
                onChange={(e) => setDrafts((prev) => ({ ...prev, [activeDesc]: e.target.value }))}
                className="w-full p-4 text-sm bg-slate-50 border border-black/5 rounded-2xl focus:ring-2 focus:ring-[#EAB308]/20 outline-none resize-none transition-all font-inter"
                rows={4}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveDescription} className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#EAB308] hover:text-black transition-all">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-black/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className={`text-sm text-black/60 leading-relaxed font-inter ${showFull ? "" : "line-clamp-3"}`}>
                {drafts[activeDesc] || `No specific content generated for ${activeDesc.toUpperCase()}.`}
              </p>
              {drafts[activeDesc]?.length > 120 && (
                <button onClick={() => setShowFull(!showFull)} className="text-[10px] font-black text-[#EAB308] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                  {showFull ? "Show Less" : "Read More"} <ChevronRight size={10} />
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
              <button onClick={() => onUpdateStatus(post._id, "approved")} className="py-4 bg-[#EAB308] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#EAB308]/10 hover:brightness-105 transition-all">Approve</button>
              <button onClick={() => onReject(post._id)} className="py-4 border border-black/5 text-black/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">Reject</button>
            </div>
          )}

          {post.status === "approved" && (
            <div className="space-y-3">
              <button onClick={() => handlePost(post)} className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#EAB308] hover:text-black transition-all group/btn shadow-lg shadow-black/10">
                <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> Post to GMB
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleFacebookPost(post)} className="py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm">
                  <Facebook size={14} /> Facebook
                </button>
                <button onClick={() => handleInstagramPost(post)} className="py-3.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] hover:text-black transition-all shadow-sm">
                  <Instagram size={14} /> Instagram
                </button>
              </div>
              <button onClick={() => onUpdateStatus(post)} className="w-full py-3.5 bg-white border-2 border-[#EAB308]/20 text-black/80 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308]/10 hover:border-[#EAB308] transition-all shadow-sm">
                <Calendar size={14} className="text-[#EAB308]" /> Schedule Post
              </button>
            </div>
          )}

          {post.status === "posted" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {isPostedGmb && <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-green-100">GMB Live</span>}
                {isPostedFb && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-100">FB Live</span>}
                {isPostedIg && <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-pink-100">IG Live</span>}
              </div>
              <button onClick={() => handlePost(post)} className="w-full py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-all shadow-sm">
                <RefreshCw size={14} className="text-[#EAB308] group-hover:text-black" /> Repost GMB
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleFacebookPost(post)} className="py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-all shadow-sm">
                  <Facebook size={14} className="text-[#EAB308] group-hover:text-black" /> Repost FB
                </button>
                <button onClick={() => handleInstagramPost(post)} className="py-3.5 bg-white border-2 border-[#EAB308] text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-all shadow-sm">
                  <Instagram size={14} className="text-[#EAB308] group-hover:text-black" /> Repost IG
                </button>
              </div>
            </div>
          )}

          {post.status === "scheduled" && (
            <div className="p-4 bg-[#EAB308]/5 rounded-3xl border border-[#EAB308]/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-[#EAB308] uppercase tracking-widest mb-0.5">Scheduled For</p>
                  <p className="text-xs font-black text-black/80">{post.scheduledDate ? new Date(post.scheduledDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "N/A"}</p>
                </div>
                <button onClick={() => onUpdateStatus(post)} className="p-2 bg-white rounded-full text-[#EAB308] shadow-sm hover:scale-110 transition-transform"><Pencil size={14} /></button>
              </div>
              <button onClick={() => handlePost(post)} className="w-full py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Post Now</button>
            </div>
          )}

          {post.status === "failed" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <XCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-[10px] text-red-700 font-bold uppercase line-clamp-1">{post.error || "Failed to publish"}</p>
              </div>
              <button onClick={() => handlePost(post)} className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"><RefreshCw size={14} /> Retry Delivery</button>
            </div>
          )}

          {/* AI Video Conversion Mini-CTA */}
          {imgUrl && !vidUrl && post.status !== "rejected" && (
            <button
              disabled={isConvertingThisPost}
              onClick={() => onConvertToVideo(post)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-black/[0.03] rounded-2xl hover:border-[#EAB308] hover:bg-white transition-all group/v"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm text-black group-hover/v:text-[#EAB308] transition-colors">
                  {isConvertingThisPost ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/80">Enhance Content</p>
                  <p className="text-[8px] font-bold text-black/30 uppercase tracking-tighter">AI Video Motion • {videoGenerationCoins} Coins</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-black/10 group-hover/v:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
