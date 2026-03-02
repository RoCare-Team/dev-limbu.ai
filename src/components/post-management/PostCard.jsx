

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
  Loader2
} from "lucide-react";

const PostCard = ({ post, scheduleDates, onDateChange, onUpdateStatus, onReject, handleDownload, handleShare, handlePost, onEditDescription, handleDeleteFromGMB, onToggleCheckmark, handleFacebookPost, handleInstagramPost }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [activeDesc, setActiveDesc] = useState('gmb');

  const isPostedGmb = post.locations?.some(l => l.isPosted) || post.whenPosted?.gmb;
  const isPostedFb = !!post.facebookPostId || post.whenPosted?.facebook || post.fbPages?.some(p => p.isPosted);
  const isPostedIg = post.whenPosted?.instagram || post.igPages?.some(p => p.isPosted);

  // Helper to get current values from post
  const getDescriptions = () => ({
    gmb: post?.gmbDescription ?? post?.description ?? "",
    fb: post?.fbDescription ?? post?.description ?? "",
    ig: post?.igDescription ?? post?.description ?? ""
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
    const field = activeDesc === 'gmb' ? 'gmbDescription' : activeDesc === 'fb' ? 'fbDescription' : 'igDescription';
    onEditDescription(post._id, { [field]: drafts[activeDesc] });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDrafts(getDescriptions());
    setIsEditing(false);
  };

  useEffect(() => {
    const fetchFbStats = async () => {
      if (post.status === 'posted' && post.facebookPostId && post.facebookPageAccessToken) {
        try {
          // Fetch Likes
          const likesRes = await fetch(`https://graph.facebook.com/v19.0/${post.facebookPostId}/likes?summary=true&limit=0&access_token=${post.facebookPageAccessToken}`);
          const likesData = await likesRes.json();

          // Fetch Comments
          const commentsRes = await fetch(`https://graph.facebook.com/v19.0/${post.facebookPostId}/comments?summary=true&limit=0&access_token=${post.facebookPageAccessToken}`);
          const commentsData = await commentsRes.json();

          setFbStats({
            likes: likesData.summary?.total_count || 0,
            comments: commentsData.summary?.total_count || 0
          });
        } catch (error) {
          console.error("Failed to fetch FB stats", error);
        }
      }
    };
    fetchFbStats();
  }, [post]);

  return (
    <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      {/* Image Section */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
        <a href={post.aiOutput} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          <img
            src={post?.aiOutput || "https://via.placeholder.com/400"}
            alt="Post content"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </a>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${post.status === "pending"
              ? "bg-yellow-100/90 text-yellow-700 border border-yellow-200"
              : post.status === "approved"
                ? "bg-green-100/90 text-green-700 border border-green-200"
                : post.status === "posted"
                  ? "bg-purple-100/90 text-purple-700 border border-purple-200"
                  : post.status === "failed"
                    ? "bg-red-100/90 text-red-700 border border-red-200"
                    : post.status === "failed"
                      ? "bg-red-100/90 text-red-700 border border-red-200"
                      : "bg-blue-100/90 text-blue-700 border border-blue-200"
            }`}
          >
            {post.status}
          </span>
        </div>

        {/* Posted Platforms Badges */}
        {(isPostedGmb || isPostedFb || isPostedIg) && (
          <div className="absolute top-3 right-3 flex gap-1 z-10">
             {isPostedGmb && <div className="bg-blue-100 text-blue-700 p-1 rounded-full shadow-sm" title="Posted on GMB"><MapPin className="w-3 h-3" /></div>}
             {isPostedFb && <div className="bg-[#1877F2] text-white p-1 rounded-full shadow-sm" title="Posted on Facebook"><Facebook className="w-3 h-3" /></div>}
             {isPostedIg && <div className="bg-gradient-to-tr from-yellow-400 to-purple-600 text-white p-1 rounded-full shadow-sm" title="Posted on Instagram"><Instagram className="w-3 h-3" /></div>}
          </div>
        )}

        {/* Overlay Actions (Download/Share) */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button
            onClick={(e) => { e.preventDefault(); handleDownload(post); }}
            className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md backdrop-blur-sm transition-transform hover:scale-110"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); handleShare(post); }}
            className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md backdrop-blur-sm transition-transform hover:scale-110"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow space-y-4">

        {/* Description Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            <button onClick={() => setActiveDesc('gmb')} className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 ${activeDesc === 'gmb' ? 'bg-white shadow-sm text-reutral-600 font-semibold' : 'text-gray-500'}`}>
              <MapPin className="w-3 h-3" /> GMB
            </button>
            <button onClick={() => setActiveDesc('fb')} className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 ${activeDesc === 'fb' ? 'bg-white shadow-sm text-[#1877F2] font-semibold' : 'text-gray-500'}`}>
              <Facebook className="w-3 h-3" /> FB
            </button>
            <button onClick={() => setActiveDesc('ig')} className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 ${activeDesc === 'ig' ? 'bg-white shadow-sm text-[#E1306C] font-semibold' : 'text-gray-500'}`}>
              <Instagram className="w-3 h-3" /> Insta 
            </button>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-reutral-600 hover:text-reutral-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
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
                onChange={(e) => setDrafts(prev => ({ ...prev, [activeDesc]: e.target.value }))}
                className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-gray-50"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <p className={`text-sm text-gray-600 leading-relaxed ${showFull ? "" : "line-clamp-3"}`}>
                {drafts[activeDesc] || "No description available for this platform."}
              </p>
              {drafts[activeDesc]?.length > 120 && (
                <button
                  onClick={() => setShowFull(!showFull)}
                  className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {showFull ? "Show Less" : "Read More"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="pt-3 border-t border-gray-100 flex items-center text-xs text-gray-400">
          <Calendar className="w-3 h-3 mr-1.5" />
          {post.status === "posted"
            ? `Posted: ${new Date(post.locations?.[0]?.postedAt || post.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}`
            : post.createdAt
              ? new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })
              : "Date unknown"}
        </div>

        {/* Facebook Stats */}
        {/* {fbStats && (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
              <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
              <span>{fbStats.likes} Likes</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
              <MessageCircle className="w-3.5 h-3.5 text-green-600" />
              <span>{fbStats.comments} Comments</span>
            </div>
          </div>
        )} */}

        {/* Action Buttons Area */}
        <div className="pt-1">
          {post.status === "processing" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-2">
                <div className="flex items-center gap-2 text-blue-700 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
                <p className="text-xs text-blue-500 text-center mt-1">Post is being published. You can retry if stuck.</p>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-1">
                {isPostedGmb && <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md border border-neutral-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3" /> GMB Posted</span>}
                {isPostedFb && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md border border-blue-yellow-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3" /> FB Posted</span>}
                {isPostedIg && <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md border border-neutral-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3" /> IG Posted</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePost(post)}
                  className="flex items-center justify-center gap-2 bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry GMB
                </button>

                <button
                  onClick={() => handleFacebookPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isPostedFb ? 'bg-neutral-100 text-neutral-600 border-gray-200 hover:bg-neutral-200' : 'bg-neural-200 text-neutral-600 border-neutral-200 hover:bg-neutral-200'}`}
                >
                  <Facebook className="w-3 h-3" />
                  {isPostedFb ? "Repost FB" : "Post FB "}
                </button>

                <button
                  onClick={() => handleInstagramPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isPostedIg ? 'bg-gray-50 text-gray-600 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-100 text-nautral-600 border-neutrl-200 hover:bg-pink-100'}`}
                >
                  <Instagram className="w-3 h-3" />
                  {isPostedIg ? "Repost IG" : "Post IG"}
                </button>

                <button
                  onClick={() => onUpdateStatus(post)}
                  className="flex items-center justify-center gap-2 bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                >
                  <Calendar className="w-3 h-3" />
                  Schedule 
                </button>
              </div>
            </div>
          )}

          {post.status === "pending" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateStatus(post._id, "approved")}
                className="flex items-center justify-center gap-2 bg-primary text-dark border border-yellow-200 hover:bg-yellow-300 hover:border-neutral-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4" />
                Approve 
              </button>
              <button
                onClick={() => onReject(post._id)}
                className="flex items-center justify-center gap-2 bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-300 hover:border-neutral-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}

          {post.status === "approved" && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                {/* <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={post.checkmark === "both" || post.checkmark === "post" || !post.checkmark}
                      onChange={() => onToggleCheckmark(post._id, 'post')}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Post</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={post.checkmark === "both" || post.checkmark === "photo"}
                      onChange={() => onToggleCheckmark(post._id, 'photo')}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>Photo</span>
                  </label> */}
              </div>

              <button
                onClick={() => handlePost(post)}
                className="
    w-full flex items-center justify-center gap-2
    bg-dark
    hover:bg-gray-500
    text-primary
    border border-gray-800
    px-4 py-3 rounded-xl
    text-sm font-semibold
    transition-all duration-200
  "
              >
                <Send className="w-4 h-4" />
                Post to GMB 
              </button>

              <button
                onClick={() => handleInstagramPost(post)}
                className="w-full flex items-center justify-center gap-2 bg-dark text-primary border border-gray-800 hover:bg-gray-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Instagram className="w-4 h-4" />
                Post to Instagram
              </button>

              <button
                onClick={() => handleFacebookPost(post)}
                className="w-full flex items-center justify-center gap-2 bg-dark  text-primary border border-gray-800 hover:bg-gray-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Facebook className="w-4 h-4" />
                Post to Facebook
              </button>

              {/* <span className="text-xs text-gray-500">
  Post will be published only after you click Publish
</span> */}

              {/* <p>like: 0, comment: 0</p> */}

              <button
                onClick={() => onUpdateStatus(post)}
                className="w-full flex items-center justify-center gap-2 bg-dark text-primary border border-gray-800 hover:bg-gray-500 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          )}

          {post.status === "scheduled" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3 transition-all">

                {/* Calendar Icon */}
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                    Scheduled For
                  </p>

                  <p className="text-sm font-bold text-gray-800">
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
                    <p className="text-xs text-blue-700 mt-1.5 font-medium flex items-center gap-1 bg-blue-100/50 px-2 py-0.5 rounded-md w-fit">
                      <svg viewBox="0 0 24 24" className="w-3 h-3">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      {post.locations.length === 1
                        ? `${post.locations[0].name || post.locations[0].title || "1 Location"} ${post.locations[0].locality
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
                  className="
          p-2 rounded-lg
          bg-blue-100 text-blue-600
          hover:bg-blue-200
          transition-colors
        "
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Platform Checkboxes Section */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Scheduled On Platforms</p>
                <div className="grid grid-cols-3 gap-3">
                  {/* GMB Checkbox */}
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={post.locations && post.locations.length > 0}
                      readOnly
                      className="w-4 h-4 accent-blue-600 cursor-not-allowed"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {/* <span className="text-xs font-medium text-gray-700">GMB</span> */}
                    </div>
                  </div>

                  {/* Facebook Checkbox */}
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#1877F2] transition-colors">
                    <input
                      type="checkbox"
                      checked={post.fbPages && post.fbPages.length > 0}
                      readOnly
                      className="w-4 h-4 accent-[#1877F2] cursor-not-allowed"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                      {/* <span className="text-xs font-medium text-gray-700">FB</span> */}
                    </div>
                  </div>

                  {/* Instagram Checkbox */}
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#E1306C] transition-colors">
                    <input
                      type="checkbox"
                      checked={post.igPages && post.igPages.length > 0}
                      readOnly
                      className="w-4 h-4 accent-[#E1306C] cursor-not-allowed"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                      {/* <span className="text-xs font-medium text-gray-700">Insta</span> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Now Button */}
              <button
                onClick={() => handlePost(post)}
                className="
        w-full flex items-center justify-center gap-2
        bg-blue-50 text-blue-600
        border border-blue-100
        hover:bg-blue-100 hover:border-blue-200
        px-4 py-2.5 rounded-xl
        text-sm font-semibold
        transition-all duration-200
      "
              >
                <Send className="w-4 h-4" />
                Post Now
              </button>
            </div>
          )}

          {post.status === "failed" && (
            <div className="space-y-3">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <p className="text-xs text-neutral-600 font-bold uppercase flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Posting Failed
                </p>
                <p className="text-sm text-red-800 mt-1 font-medium">
                  {post.error || "Unknown error occurred"}
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-1">
                  {isPostedGmb && <span className="text-[10px] bg-reutral-50 text-reutral-700 px-2 py-1 rounded-md border border-reutral-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> GMB Posted</span>}
                  {isPostedFb && <span className="text-[10px] bg-reutral-50 text-yellow-300 px-2 py-1 rounded-md border border-reutral-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> FB Posted</span>}
                  {isPostedIg && <span className="text-[10px] bg-reutral-50 text-reutral-700 px-2 py-1 rounded-md border border-reutral-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> IG Posted</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePost(post)}
                  className="flex items-center justify-center gap-2 bg-neutral-200 text-neutral-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry GMB
                </button>

                <button
                  onClick={() => handleFacebookPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isPostedFb ? 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:b-neutral-100' : 'bg-neutral-100 text-neutral-600 border-neutral hover:bg-neutral-200'}`}
                >
                  <Facebook className="w-3 h-3" />
                  {isPostedFb ? "Repost FB" : "Post FB "}
                </button>

                <button
                  onClick={() => handleInstagramPost(post)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isPostedIg ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'}`}
                >
                  <Instagram className="w-3 h-3" />
                  {isPostedIg ? "Repost IG" : "Post IG"}
                </button>

                <button
                  onClick={() => onUpdateStatus(post)}
                  className="flex items-center justify-center gap-2 bg-yellow-100 text-neutral-600 border border-yellow-200 hover:bg-purple-100 hover:border-purple-300 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                >
                  <Calendar className="w-3 h-3" />
                  Schedule
                </button>
              </div>
            </div>
          )}
          
          {post.status === "posted" && (
            <div className="space-y-3">
              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-1">
                  {isPostedGmb && <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md border border-neutral-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> GMB Posted</span>}
                  {isPostedFb && <span className="text-[10px] bg-neutral-100 text-neutral px-2 py-1 rounded-md border border-neutal-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> FB Posted</span>}
                  {isPostedIg && <span className="text-[10px] bg-yellow-100 text-neutral-700 px-2 py-1 rounded-md border border-yellow-100 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> IG Posted</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePost(post)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isPostedGmb ? 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-gray-100' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'}`}
              >
                <Send className="w-3 h-3" />
                {isPostedGmb ? "Repost GMB" : "Post GMB"}
              </button>

              <button
                onClick={() => handleFacebookPost(post)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isPostedFb ? 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-gray-100' : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'}`}
              >
                <Facebook className="w-3 h-3" />
                {isPostedFb ? "Repost FB" : "Post FB"}
              </button>

              <button
                onClick={() => handleInstagramPost(post)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${isPostedIg ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'}`}
              >
                <Instagram className="w-3 h-3" />
                {isPostedIg ? "Repost IG" : "Post IG"}
              </button>

              <button
                onClick={() => onUpdateStatus(post)}
                className="flex items-center justify-center gap-2 bg-primary text-dark border border-yellow-200 hover:bg-yellow-300 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
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