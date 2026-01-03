"use client";

import {
  fetchPostsAction,
  fetchAllPostsAction,
  getUserWalletAction,
  generateWithAiAgentAction,
  savePostAction,
  deductFromWalletAction,
  generateWithAssetsAction, deletePostFromGmbAction,
  updatePostStatusAction, postToGmbAction,
} from "@/app/actions/postActions";
import { deleteAssetAction, loadAssetsFromServerAction } from "@/app/actions/assetActions";
import { getCloudinarySignatureAction } from "@/app/actions/uploadCloudinary";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Loader2,
  CheckCircle,
  Clock,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Send,
  XCircle,
  Download,
  Share2,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  ChevronDown,
  MapPin,
  Pencil,
  Facebook,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Toast from "../../components/Toast";
import LocationSelectionModal from "../../components/LocationSelectionModal";
import InsufficientBalanceModal from "../../components/InsufficientBalanceModal";
import LoadingOverlay from "../../components/LoadingOverlay";
import SuccessOverlay from "../../components/SuccessOverlay"; // Corrected import path
import FirstPostModal from "../../components/FirstPostModal";
import PostInput from "@/components/PostInput";
import TabButton from "@/components/TabButton";
import RejectReasonModal from "../../components/RejectReasonModal";
import "./PostManagement.module.css";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public



// Scheduling Modal Component
const ScheduleModal = ({ isOpen, onClose, onConfirm, post }) => {
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const [slot, setSlot] = useState(() => {
    const now = new Date();
    return now.getHours() + 1;
  });

  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const scheduledTime = new Date(date);
    scheduledTime.setHours(parseInt(slot), 0, 0, 0);
    onConfirm(post._id, "scheduled", scheduledTime.toISOString());
    onClose();
  };

  // Generate time slots (00:00 - 01:00, etc.)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const formatTime = (hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h = hour % 12 || 12;
      return `${h}:00 ${ampm}`;
    };
    
    const label = `${formatTime(i)} - ${formatTime((i + 1) % 24)}`;
    return { value: i, label };
  });

  const isSlotDisabled = (slotValue) => {
    const now = new Date();
    const [y, m, d] = date.split('-').map(Number);
    const isToday = y === now.getFullYear() && (m - 1) === now.getMonth() && d === now.getDate();

    if (isToday) {
      return slotValue <= now.getHours();
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Schedule Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-4">Select a date and time slot.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            <div className="relative">
              <button
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-left flex justify-between items-center"
              >
                <span className="text-gray-700">
                  {timeSlots.find((s) => s.value === parseInt(slot))?.label || "Select Time"}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              
              {showTimeDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {timeSlots.map((s) => {
                    const disabled = isSlotDisabled(s.value);
                    return (
                    <div
                      key={s.value}
                      onClick={() => {
                        if (!disabled) {
                          setSlot(s.value);
                          setShowTimeDropdown(false);
                        }
                      }}
                      className={`p-3 text-sm ${parseInt(slot) === s.value ? 'bg-blue-50 text-blue-700 font-medium' : disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                    >
                      {s.label}
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700">
            Confirm & Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

// Preview Section Component
const PreviewSection = ({ 
  isGenerating, 
  previewData, 
  onDownload,
  countdown,
  onUpdateStatus,
  onReject,
  handlePost,
  onToggleCheckmark,
  onEditDescription
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");

  useEffect(() => {
    if (previewData) {
      setEditedDesc(previewData.description || "");
    }
  }, [previewData]);

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
             <p className="text-sm font-mono text-blue-600 mt-4 bg-blue-50 px-3 py-1 rounded-full inline-block">
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

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" /> Live Preview
        </h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 uppercase tracking-wider ${
            status === "approved" ? "bg-green-100/90 text-green-700 border-green-200" :
            status === "pending" ? "bg-yellow-100/90 text-yellow-700 border-yellow-200" :
            status === "posted" ? "bg-purple-100/90 text-purple-700 border-purple-200" :
            status === "scheduled" ? "bg-blue-100/90 text-blue-700 border-blue-200" :
            status === "failed" ? "bg-red-100/90 text-red-700 border-red-200" :
            "bg-blue-100/90 text-blue-700 border-blue-200"
          }`}>
          {status}
        </span>
      </div>

      
<div className="w-full bg-white rounded-lg overflow-hidden border border-gray-200">

  {/* IMAGE PREVIEW */}
  <a href={previewData.aiOutput} target="_blank" rel="noopener noreferrer">
    <div className="relative h-36 sm:h-44 lg:h-48 w-full bg-gray-100 group overflow-hidden cursor-pointer">
      
      {/* Blurred BG */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
        style={{ backgroundImage: `url(${previewData.aiOutput})` }}
      />

      {/* Image */}
      <img
        src={previewData.aiOutput}
        alt="Preview"
        className="relative w-full h-full object-contain z-10 transition-transform duration-300 group-hover:scale-[1.015]"
      />

      {/* Download */}
      <div className="absolute top-1.5 right-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.preventDefault();
            onDownload(previewData);
          }}
          className="p-1.5 bg-white/90 rounded-full shadow hover:scale-105 transition"
        >
          <Download className="w-3.5 h-3.5 text-gray-700" />
        </button>
      </div>
    </div>
  </a>

  {/* DESCRIPTION */}
  <div className="px-2.5 py-2 border-t border-gray-200 relative group/desc">
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
      <div className="p-4 space-y-3 flex-1 flex flex-col bg-white">
    
        {status === "pending" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateStatus(previewData._id, "approved")}
                className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
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
        bg-gradient-to-r from-blue-100 to-indigo-100
        hover:from-blue-200 hover:to-indigo-200
        text-blue-700 border border-blue-200
        px-3 py-2.5 rounded-lg
        text-sm font-semibold
        transition-all duration-200 shadow-sm"
    >
      <Send className="w-4 h-4" />
      Post Now
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
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                Post Now
              </button>
            </div>
        )}

        {status === "failed" && (
            <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
  <p className="text-[10px] text-red-600 font-semibold uppercase flex items-center gap-1 leading-tight">
    <XCircle className="w-2.5 h-2.5" />
    Posting Failed
  </p>

  <p className="text-xs text-red-700 mt-0.5 leading-snug">
    {previewData.error || "Network Error"}
  </p>
</div>


              <button
                onClick={() => handlePost(previewData)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 border border-blue-200 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Post Now
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
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Send className="w-4 h-4" />
              Repost
            </button>
            <button
              onClick={() => onUpdateStatus(previewData)}
              className="flex items-center justify-center gap-2 bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
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

// Main Component
// Post Card Component (Moved here from PostCard.jsx to be local as per user's request)
const PostCard = ({ post, scheduleDates, onDateChange, onUpdateStatus, onReject, handleDownload, handleShare, handlePost, onEditDescription, handleDeleteFromGMB, onToggleCheckmark, handleFacebookPost }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [editedDescription, setEditedDescription] = useState(post?.description || "");

  const handleSave = () => {
    onEditDescription(post._id, editedDescription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDescription(post?.description || "");
    setIsEditing(false);
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      {/* Image Section */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
        <a href={post.aiOutput} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          <img
            src={post?.aiOutput || "https://via.placeholder.com/400"}
            alt="Post content"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </a>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
              post.status === "pending"
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

        {/* Overlay Actions (Download/Share) */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI Caption
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
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
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
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
                {post?.description || "No description available"}
              </p>
              {post?.description?.length > 120 && (
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

        {/* Action Buttons Area */}
        <div className="pt-1">
          {post.status === "pending" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateStatus(post._id, "approved")}
                className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => onReject(post._id)}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
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
    bg-gradient-to-r from-blue-100 to-indigo-100
    hover:from-blue-200 hover:to-indigo-200
    text-blue-700
    border border-blue-200
    px-4 py-3 rounded-xl
    text-sm font-semibold
    transition-all duration-200
  "
>
  <Send className="w-4 h-4" />
  Post Now
</button>

              <button
                onClick={() => handleFacebookPost(post)}
                className="w-full flex items-center justify-center gap-2 bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 hover:bg-[#1877F2]/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Facebook className="w-4 h-4" />
                Post to Facebook
              </button>

              
              <button
                onClick={() => onUpdateStatus(post)}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600 font-bold uppercase flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Posting Failed
                </p>
                <p className="text-sm text-red-800 mt-1 font-medium">
                  {post.error || "Unknown error occurred"}
                </p>
              </div>

              <button
                onClick={() => handlePost(post)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 border border-blue-200 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Post Now
              </button>

              <button
                onClick={() => onUpdateStatus(post)}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          )}
{post.status === "posted" && (
  <div className="grid grid-cols-2 gap-3">
    {/* Repost */}
    <button
      onClick={() => handlePost(post)}
      className="
        flex items-center justify-center gap-2
        bg-blue-50 text-blue-600
        border border-blue-200
        hover:bg-blue-100 hover:border-blue-300
        px-4 py-2.5 rounded-xl text-sm font-semibold
        transition-all
      "
    >
      <Send className="w-4 h-4" />
      Repost
    </button>

    {/* Facebook Post */}
    <button
      onClick={() => handleFacebookPost(post)}
      className="
        flex items-center justify-center gap-2
        bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 hover:bg-[#1877F2]/20
        px-4 py-2.5 rounded-xl text-sm font-semibold
        transition-all
      "
    >
      <Facebook className="w-4 h-4" />
      FB Post
    </button>

    {/* Schedule */}
    <button
      onClick={() => onUpdateStatus(post)}
      className="
        flex items-center justify-center gap-2
        bg-purple-50 text-purple-600
        border border-purple-200
        hover:bg-purple-100 hover:border-purple-300
        px-4 py-2.5 rounded-xl text-sm font-semibold
        transition-all
      "
    >
      <Calendar className="w-4 h-4" />
      Schedule
    </button>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default function PostManagementPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const searchParams = useSearchParams();
  const pageId = searchParams.get("pageId");
  const [countdown, setCountdown] = useState(0);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userWallet, setUserWallet] = useState(0);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const { slug } = useParams();
  const { data: session } = useSession();


  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("total");
  const [prompt, setPrompt] = useState("");
  const [scheduleDates, setScheduleDates] = useState({});
  const [logo, setLogo] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [postsGeneratedCount, setPostsGeneratedCount] = useState(0);
  const [showFirstPostModal, setShowFirstPostModal] = useState(false);

  const [userAssets, setUserAssets] = useState([]);
  const [rejectPostId, setRejectPostId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [postToAction, setPostToAction] = useState(null);
  const [showDeleteLocationModal, setShowDeleteLocationModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false); // Moved here from PostCard
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState(null);
  const [scheduledDateForLocations, setScheduledDateForLocations] = useState(null); // New state for selected date
  const [previewData, setPreviewData] = useState(null);
  const [lastUsedAssetsFlow, setLastUsedAssetsFlow] = useState(false);

  const [assetId, setAssetId] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const previewRef = useRef(null);
  const [bussinessTitle,setBussinessTitle] = useState("")

  // Helper to strip base64 prefix
  const stripBase64 = (str) => {
    if (typeof str === 'string' && str.includes('base64,')) {
      return str.split('base64,')[1];
    }
    return str;
  };


  // Load locations from localStorage
  const [availableLocations, setAvailableLocations] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("locationDetails");
    if (stored) {
      try {
        const parsedLocations = JSON.parse(stored);
        // Transform the data to match the expected format
        const formattedLocations = parsedLocations.map((loc, index) => ({
          id: loc.id || index + 1,
          name: loc.name || loc.title || `Location ${index + 1}`,
          address: loc.address || loc.storefrontAddress?.addressLines?.join(", ") || "Address not available",
          city: loc.city || "",
          ...loc
        }));
        setAvailableLocations(formattedLocations);
      } catch (err) {
        console.error("Invalid JSON in localStorage:", err);
        // Fallback to empty array if parsing fails
        setAvailableLocations([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!previewData && posts.length > 0 && !isGenerating) {
      setPreviewData(posts[0]);
    }
  }, [posts, previewData, isGenerating]);

  useEffect(() => {
    if (previewData && posts.length > 0) {
      const updatedPost = posts.find(p => p._id === previewData._id);
      if (updatedPost && updatedPost !== previewData) {
        setPreviewData(updatedPost);
      }
    }
  }, [posts, previewData]);

  const fetchUserAssets = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const result = await loadAssetsFromServerAction(userId);

      if (result.success && result.data.length > 0) {
        const latestAssets = result.data[0];
        setAssetId(latestAssets._id);

        const productImagesArray = Array.isArray(latestAssets.productImage)
          ? latestAssets.productImage
          : latestAssets.productImage
            ? [latestAssets.productImage]
            : [];

        const imageAssets = [
          { name: "Logo", url: latestAssets.logoImage || "" },
          { name: "Character", url: latestAssets.characterImage || "" },
          { name: "Product", url: latestAssets.productImage || "" },
          { name: "Uniform", url: latestAssets.uniformImage || "" },
          { name: "Background", url: latestAssets.backgroundImage || "" },
          { name: "Size", url: latestAssets.size || "" },
          { name: "Color", url: latestAssets.colourPalette || "" },
        ];

        setUserAssets(imageAssets);
      } else {
        // If no assets are found, set default assets for the UI
        setUserAssets([
          { name: "Character", url: "" },
          { name: "Product", url: "" },
          { name: "Uniform", url: "" },
          { name: "Background", url: "" },
          { name: "Logo", url: "" },
          { name: "Size", url: "3:4" }, // Default aspect ratio
          { name: "Color", url: "" }, // Default color palette
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch user assets:", error);
    }
  }, []);



  useEffect(() => { fetchUserAssets(); }, [fetchUserAssets]);


  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [allCounts, setAllCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    scheduled: 0,
    posted: 0,
    rejected: 0,
  });

  const tabs = [
    { id: "total", label: "Total Posts", shortLabel: "Total", icon: ImageIcon, count: allCounts.total },
    { id: "pending", label: "Pending", shortLabel: "Pending", icon: Clock, count: allCounts.pending },
    { id: "approved", label: "Approved", shortLabel: "Approved", icon: CheckCircle, count: allCounts.approved }, // Corrected icon
    { id: "rejected", label: "Rejected", shortLabel: "Rejected", icon: XCircle, count: allCounts.rejected },
    { id: "scheduled", label: "Scheduled", shortLabel: "Scheduled", icon: Calendar, count: allCounts.scheduled },
    { id: "posted", label: "Posted", shortLabel: "Posted", icon: Send, count: allCounts.posted },
  ];

  const fetchPosts = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const allPostsData = await fetchAllPostsAction(userId);

      

      if (allPostsData.success) {
        const allPosts = allPostsData.data;
        setPosts(allPosts);

        setAllCounts({
          total: allPosts.filter((p) => p.status !== "rejected").length,
          approved: allPosts.filter((p) => p.status === "approved").length,
          pending: allPosts.filter((p) => p.status === "pending").length,
          scheduled: allPosts.filter((p) => p.status === "scheduled").length,
          posted: allPosts.filter((p) => p.status === "posted").length,
          rejected: allPosts.filter((p) => p.status === "rejected").length,
        });

        // Show magic modal if no posts exist
        if (allPosts.length === 0) {
          setShowFirstPostModal(true);
        }
      } else {
        throw new Error(allPostsData.error || "Failed to fetch posts");
      }
    } catch (err) {
      showToast(err.message || "Error fetching posts", "error");
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const handleGenerateClick = async (selectedAssets, useAssetsFlow, businessName, keywords) => {
    // Auto-scroll to preview section on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (useAssetsFlow === "manual") {
      await handleManualPost(selectedAssets);
      return;
    }

    setLastUsedAssetsFlow(useAssetsFlow);
    if (useAssetsFlow) {
      await handleImageGenerateWithAssets(selectedAssets, businessName, keywords);
    } else {
      await handleAiAgent(selectedAssets);
    }
  };

  const handleManualPost = async ({ image, description }) => {
    const userId = localStorage.getItem("userId");
    try {
      setIsGenerating(true);

      let imageUrl = image;

      if ((typeof image === "string" && image.startsWith("data:")) || (typeof image === "object" && image !== null)) {
        // 1. Get Secure Signature from Server
        const sigData = await getCloudinarySignatureAction();
        if (!sigData.success) {
          throw new Error(sigData.error || "Failed to get upload signature");
        }

        // 2. Upload directly to Cloudinary using the signature
        const formData = new FormData();
        formData.append("file", image);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp);
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
        }

        const data = await res.json();
        imageUrl = data.secure_url;
      }
      
      // Save Post
      const savedPostResponse = await savePostAction({
        userId,
        aiOutput: imageUrl,
        description: description,
        logoUrl: null,
        status: "pending",
        promat: "Manual Upload",
        locations: [],
      });

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
      setPreviewData(savedPost);
      showToast("Manual Post Created Successfully! 🎉");

    } catch (error) {
      console.error("Manual Post Error:", error);
      showToast(error.message || "Failed to create post!", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAgent = async (selectedAssets = []) => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt before generating!", "error");
      return;
    }

    const userId = localStorage.getItem("userId");

    try {
      // Check wallet balance for AI generation (150 coins)
      const userData = await getUserWalletAction(userId);
      const walletBalance = userData.wallet || 0;
      setUserWallet(walletBalance);

      // Check if user has sufficient balance for AI generation (80 coins)
      if (walletBalance < 80) {
        setRequiredCoins(80);
        setShowInsufficientBalance(true);
        return;
      }

      // Start AI generation process
      setIsGenerating(true);
      setAiResponse(null);
      setCountdown(59);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Convert logo to base64 if provided
      let logoBase64 = null;
      if (logo) {
        logoBase64 = await fileToBase64(logo);
      }

      // Prepare assets with stripped base64
      const strippedLogo = stripBase64(logoBase64);
      const strippedAssets = selectedAssets.map(asset => ({
        ...asset,
        url: stripBase64(asset.url)
      }));

      // Call AI Agent API (single generation, not per location)
      const apiResponse = await generateWithAiAgentAction(prompt, strippedLogo, strippedAssets);

      clearInterval(timer);

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || "AI agent failed.");
      }

      const data = apiResponse.data || {};
      


      // Deduct 80 coins for AI generation
      const walletData = await deductFromWalletAction(userId, {
        amount: 80,
        type: "deduct",
        reason: "image_generated",
        metadata: {
          aiPrompt: prompt,
          logoUsed: !!logo,
        }
      });

      if (walletData.error) {
        console.warn("Wallet deduction failed:", walletData.error);
        showToast(walletData.error, "error");
      } else {
        showToast("80 coins deducted for AI generation ✅", "success");
        setUserWallet((prev) => Math.max(0, prev - 80));
      }

      // Save Post Immediately
      const savedPostResponse = await savePostAction({
        userId,
        aiOutput: data.output,
        description: data.description,
        logoUrl: data.logoUrl,
        status: "pending",
        promat: data.user_input || prompt,
        locations: [],
      });

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
      setPreviewData(savedPost);
      showToast("Post Generated & Saved Successfully! 🎉");

      // Don't clear prompt/logo yet in case user wants to regenerate with tweaks
      setSelectedAssets([]);
      setCountdown(0);
    } catch (error) {
      console.error("Generation Error:", error);
      showToast(error.message || "Failed to generate AI post!", "error");
    } finally {
      setIsGenerating(false);
      setCountdown(0);
    }
  };



  const handleImageGenerateWithAssets = async (selectedAssets = [], businessName, keywords) => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt before generating!", "error");
      return;
    }

    

    const userId = localStorage.getItem("userId");



    try {
      // Check wallet balance for AI generation (150 coins)
      const userData = await getUserWalletAction(userId);
      const walletBalance = userData.wallet || 0;
      setUserWallet(walletBalance);

      // Check if user has sufficient balance for AI generation (80 coins)
      if (walletBalance < 80) {
        setRequiredCoins(80);
        setShowInsufficientBalance(true);
        return;
      }

      // Start AI generation process
      setIsGenerating(true);
      setAiResponse(null);
      setCountdown(120);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Convert logo to base64 if provided
      let logoBase64 = null;
      if (logo) {
        logoBase64 = await fileToBase64(logo);
      }

      // Call the asset generation API
      const apiResponse = await generateWithAssetsAction({
        topic: prompt,
        bussiness_name: businessName || "",
        keywords: keywords || "",
        colourPalette: userAssets.find(a => a.name === 'Color')?.url || "none",
        size: userAssets.find(a => a.name === 'Size')?.url || "1:1",
        characterImage: stripBase64(selectedAssets.find(a => a.name === 'Character')?.url || ""),
        uniformImage: stripBase64(selectedAssets.find(a => a.name === 'Uniform')?.url || ""),
        productImage: stripBase64(selectedAssets.find(a => a.name.startsWith('Product'))?.url || ""),
        backgroundImage: stripBase64(selectedAssets.find(a => a.name === 'Background')?.url || ""),
        logoImage: stripBase64(selectedAssets.find(a => a.name === 'Logo')?.url || logoBase64 || ""),
        platform: "gmb"
      });

      clearInterval(timer);

      


      // The direct response from n8n is now the data we need
      if (apiResponse.status !== "true" && !apiResponse.success) {
        throw new Error(apiResponse.error || apiResponse.message || "AI asset generation failed.");
      }

      const data = apiResponse.success ? apiResponse.data : apiResponse;


      // Deduct 80 coins for AI generation
      const walletData = await deductFromWalletAction(userId, {
        amount: 80,
        type: "deduct",
        reason: "image_generated",
        metadata: {
          aiPrompt: prompt,
          logoUsed: !!logo,
        }
      });

      if (walletData.error) {
        console.warn("Wallet deduction failed:", walletData.error);
        showToast(walletData.error, "error");
      } else {
        showToast("80 coins deducted for AI generation ✅", "success");
        setUserWallet((prev) => Math.max(0, prev - 80));
      }

      // Save Post Immediately
      const savedPostResponse = await savePostAction({
        userId,
        aiOutput: data.image || data.output,
        description: data.description || "Generated Content",
        logoUrl: data.logoUrl,
        status: "pending",
        promat: data.user_input || prompt,
        locations: [],
      });

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
      setPreviewData(savedPost);
      showToast("Post Generated & Saved Successfully! 🎉");

      setCountdown(0);
    } catch (error) {
      console.error("Generation Error:", error);
      showToast(error.message || "Failed to generate AI post!", "error");
    } finally {
      setIsGenerating(false);
      setCountdown(0);
    }
  };

  // const handleConfirmPost = async () => {
  //   if (!previewData) return;
    
  //   const userId = localStorage.getItem("userId");
  //   try {
  //     const postData = await savePostAction({
  //       userId,
  //       aiOutput: previewData.aiOutput,
  //       description: previewData.description,
  //       logoUrl: previewData.logoUrl,
  //       status: "pending",
  //       promat: previewData.user_input,
  //       locations: [],
  //     });

  //     if (!postData.success) {
  //       throw new Error(postData.error || "Failed to save post.");
  //     }

  //     setPosts((prev) => [postData.data, ...prev]);
  //     setAllCounts((prev) => ({
  //       ...prev,
  //       total: prev.total + 1,
  //       pending: prev.pending + 1,
  //     }));

  //     showToast("Post Saved Successfully! 💾");
  //     setPreviewData(postData.data);
  //     setPrompt("");
  //     setLogo(null);
  //   } catch (error) {
  //     showToast(error.message, "error");
  //   }
  // };

  const handleDateChange = (id, value) => {
    setScheduleDates((prev) => ({ ...prev, [id]: value }));
  };

  // Handler for when a date is confirmed in the ScheduleModal
  const handleScheduleDateConfirmed = (postId, status, selectedDate) => {
    setScheduledDateForLocations(selectedDate); // Store the selected date
    setPostToAction(posts.find(p => p._id === postId)); // Set the post to be scheduled
    setShowLocationModal(true); // Open the location selection modal
    setIsScheduleModalOpen(false); // Close the date picker modal
  };


 const handleUpdateStatus = async (
  postOrId,
  newStatus,
  scheduleDate = null,
  locations = [],
  checkmark = false,
) => {
  console.log("📍 Locations:", locations);
  console.log("✅ Checkmark:", checkmark);

  const postId = typeof postOrId === "string" ? postOrId : postOrId._id;

  // 🔹 Open schedule modal
  if (typeof postOrId === "object" && !newStatus) {
    setPostToSchedule(postOrId);
    setIsScheduleModalOpen(true);
    return;
  }  

  const userId = localStorage.getItem("userId");

  // When scheduling, we must have a refresh token to pass to the backend.
  if (newStatus === "scheduled" && !session?.refreshToken) {
    showToast("Please connect first Bussiness Account or  log in again to schedule posts.", "error");
    return;
  }


  try {
    // Deduplicate locations based on locationId to ensure unique targets
    const uniqueLocations = Array.isArray(locations) 
      ? Array.from(new Map(locations.map(item => [item.locationId, item])).values()) 
      : [];

    // 🔹 NORMALIZED PAYLOAD
    let payload = {
      id: postId,
      userId,
      status: newStatus,
      scheduledDate: scheduleDate || null,
      checkmark: checkmark,
      refreshToken: newStatus === "scheduled" ? session?.refreshToken : undefined,
      locations: uniqueLocations,
    };

    if (newStatus === "scheduled") {
      const locationData = uniqueLocations.map((loc) => ({
        city: loc.locationId,
        cityName: loc.locality,
        bookUrl: loc.websiteUrl || "",
      }));

      payload.locationData = locationData;
      payload.account = uniqueLocations.length > 0 ? uniqueLocations[0].accountId : "";
    }


    const res = await updatePostStatusAction(payload);
    console.log("resresres",res);
    

    if (!res?.success) {
      showToast(res?.error || "Failed to update post", "error");
      return;
    }

    showToast("Post Updated Successfully! ✅");

    // 🔹 Update local state correctly
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              status: newStatus,
              scheduledDate: res.data?.scheduledDate || scheduleDate,
              locations: res.data?.locations || locations,
              checkmark: res.data?.checkmark ?? checkmark,
            }
          : p
      )
    );

    await fetchPosts(activeTab);
  } catch (error) {
    console.error("❌ Update Error:", error);
    showToast("Error updating post", "error");
  }
};

  const handleToggleCheckmark = async (id, type) => {
    const post = posts.find((p) => p._id === id);
    if (!post) return;

    let current = post.checkmark || "post";
    // Handle legacy array case if any
    if (Array.isArray(current)) {
      if (current.includes("post") && current.includes("photo")) current = "both";
      else if (current.includes("photo")) current = "photo";
      else current = "post";
    }

    let isPost = current === "both" || current === "post";
    let isPhoto = current === "both" || current === "photo";

    if (type === "post") isPost = !isPost;
    if (type === "photo") isPhoto = !isPhoto;

    // Enforce at least one selected (default to post if both unchecked)
    if (!isPost && !isPhoto) {
      if (type === "post") isPost = true;
      else if (type === "photo") isPhoto = true;
    }

    let newVal = "post";
    if (isPost && isPhoto) newVal = "both";
    else if (isPhoto) newVal = "photo";
    else if (isPost) newVal = "post";

    // Optimistic update
    setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, checkmark: newVal } : p)));

    try {
      await updatePostStatusAction({ id, userId: localStorage.getItem("userId"), checkmark: newVal });
    } catch (e) {
      showToast("Failed to update selection", "error");
    }
  };

  const handleFacebookPost = async (post) => {
    if (!pageId) {
      showToast("No Facebook Page connected. Please connect from Dashboard.", "error");
      return;
    }

    const message = post.description;
    if (!message || !message.trim()) {
      showToast("Post description is empty.", "error");
      return;
    }

    try {
      showToast("Publishing to Facebook...", "success");

      const res = await fetch("/api/facebook/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          published: true,
          is_published: true,
          message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Post published on Facebook 🎉", "success");
      } else {
        showToast(data.error || "Failed to post to Facebook", "error");
      }
    } catch (err) {
      showToast("Something went wrong posting to Facebook", "error");
    }
  };

  const handleEditDescription = async (id, newDescription) => {
    const userId = localStorage.getItem("userId");

    try {
      const data = await updatePostStatusAction({
        id,
        description: newDescription,
        status: "pending",
        userId: userId
      });
      if (!data.success) {
        showToast(data.error || "Failed to update description", "error");
        return;
      }

      showToast("Description Updated Successfully! ✅");
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, description: newDescription } : p))
      );
    } catch (err) {
      showToast("Error updating description", "error");
    }
  };



  const handleDeleteFromGMB = async (post) => {
    // First, check if the post has been published anywhere.
    if (!post.locations || post.locations.length === 0) {
      showToast("This post hasn't been published to any locations yet.", "error");
      return;
    }

    // Set the specific post to be actioned and open the modal for location selection.
    setPostToAction(post);
    setShowDeleteLocationModal(true);
  };

  const handleLocationConfirm = async (selectedLocationIds, checkmark) => {
    setShowLocationModal(false);

    if (selectedLocationIds.length === 0) {
      showToast("Please select at least one location", "error");
      return;
    }

    if (!postToAction) {
      showToast("Post data not found", "error");
      return;
    }

    const userId = localStorage.getItem("userId");
    let selectedLocations = availableLocations.filter(loc =>
      selectedLocationIds.includes(loc.id)
    ).map(loc => ({ ...loc, isPosted: false }));

    // Normalize checkmark payload
    const checkmarkSource = checkmark || postToAction?.checkmark;
    let checkmarkPayload = "post"; // Default
    if (Array.isArray(checkmarkSource)) {
      if (checkmarkSource.includes("post") && checkmarkSource.includes("photo")) checkmarkPayload = "both";
      else if (checkmarkSource.includes("photo")) checkmarkPayload = "photo";
      else if (checkmarkSource.includes("post")) checkmarkPayload = "post";
    } else if (typeof checkmarkSource === "string") {
      checkmarkPayload = checkmarkSource;
    }

    // Determine if this is a "Post Now" or "Schedule Post" action
    if (scheduledDateForLocations && postToSchedule) {
      
      // This is a "Schedule Post" action
      // No direct cost deduction here for scheduling, as actual posting cost is handled by cron

      await handleUpdateStatus(
        postToSchedule._id,
        "scheduled",
        scheduledDateForLocations,
        selectedLocations,
        checkmarkPayload
      );
      showToast(`Post scheduled for ${selectedLocationIds.length} locations on ${new Date(scheduledDateForLocations).toLocaleDateString()}!`, "success");

      // Reset scheduling specific states
      setScheduledDateForLocations(null);
      setPostToSchedule(null);
      
    } else {
      // This is a "Post Now" action (existing logic)
      // Calculate cost: 20 coins per location for posting
      const totalPostCost = selectedLocationIds.length * 20;
      let deductionSuccessful = false;

      try {
        // Re-check wallet balance
        const userData = await getUserWalletAction(userId);
        const walletBalance = userData.wallet || 0;
        setUserWallet(walletBalance);

        // Check if user has sufficient balance
        if (walletBalance < totalPostCost) {
          showToast(`Insufficient wallet balance. Required: ${totalPostCost} coins`, "error");
          setRequiredCoins(totalPostCost);
          setShowInsufficientBalance(true);
          return;
        }

        setIsPosting(true);
        setPostsGeneratedCount(selectedLocationIds.length);

        // Deduct coins from wallet (20 per location) BEFORE posting
        const walletRes = await deductFromWalletAction(userId, {
          amount: totalPostCost,
          type: "deduct",
          reason: "Post-on-GMB",
          metadata: {
            aiPrompt: prompt,
            logoUsed: !!logo,
          }
        });
        

        if (walletRes.message === "Wallet updated") {
          const newBalance = walletBalance - totalPostCost;
          setUserWallet(newBalance);
          localStorage.setItem("walletBalance", newBalance);
          showToast(`${totalPostCost} coins deducted (${selectedLocationIds.length} locations × 20 coins)`, "info");
          deductionSuccessful = true;
        } else {
          showToast(walletRes.error || "Wallet deduction failed", "error");
          setIsPosting(false);
          return;
        }

        // Prepare location data for webhook
        const locationData = selectedLocations.map(loc => ({
          city: loc.locationId,
          cityName: loc.locality,
          bookUrl: loc.websiteUrl || "",
          originalLoc: loc,
        }));

        // Batch processing to prevent timeouts
        const BATCH_SIZE = 5;
        const successfulLocations = [];
        
        for (let i = 0; i < locationData.length; i += BATCH_SIZE) {
          const batch = locationData.slice(i, i + BATCH_SIZE);
          const batchPayload = batch.map(b => ({
            city: b.city,
            cityName: b.cityName,
            bookUrl: b.bookUrl
          }));

          try {
            const { ok: batchOk, data: batchData } = await postToGmbAction({
              account: selectedLocations[0]?.accountId || "",
              locationData: batchPayload,
              output: postToAction?.aiOutput || "",
              description: postToAction?.description || "",
              accessToken: session?.accessToken || "",
              checkmark: checkmarkPayload,
            });

            if (batchOk) {
              successfulLocations.push(...batch.map(b => b.originalLoc));

              // Update isPosted status incrementally for real-time updates
              const batchIds = batch.map(b => b.originalLoc.locationId);
              selectedLocations = selectedLocations.map(loc => 
                batchIds.includes(loc.locationId) ? { ...loc, isPosted: true } : loc
              );

              await updatePostStatusAction({
                id: postToAction._id,
                locations: selectedLocations,
                status: "posted",
                userId: userId,
              });
            } else {
              console.error("Batch failed:", batchData);
            }
          } catch (err) {
            console.error("Batch error:", err);
          }
        }

        // Handle results
        if (successfulLocations.length > 0) {
          if (successfulLocations.length < selectedLocations.length) {
            // Partial success - refund difference
            const refundAmount = (selectedLocations.length - successfulLocations.length) * 20;
            await deductFromWalletAction(userId, {
              amount: refundAmount,
              type: "credit",
              reason: "Refund-Partial-Post-Failed",
              metadata: { originalReason: "Post-on-GMB" }
            });
            
            const userData = await getUserWalletAction(userId);
            setUserWallet(userData.wallet);
            localStorage.setItem("walletBalance", userData.wallet);
            
            showToast(`Posted to ${successfulLocations.length}/${selectedLocations.length} locations. Refunded failed ones.`, "warning");
          } else {
            showToast("Post successfully sent to all locations!", "success");
            setShowSuccess(true);
          }

          // Update post with successful locations
          await updatePostStatusAction({
            id: postToAction._id,
            locations: successfulLocations.map(loc => ({ ...loc, isPosted: true })),
            status: "posted",
            userId: userId,
          });

          // Refresh posts
          await fetchPosts(activeTab);

        } else {
          throw new Error("All batches failed to post.");
        }

      } catch (error) {
        console.error("Post error:", error);
        
        // Update post status to failed
        if (postToAction) {
          const errorMsg = error.message || "Post failed";
          await updatePostStatusAction({
            id: postToAction._id,
            userId,
            status: "failed",
            error: errorMsg,
            locations: selectedLocations
          });

          setPosts(prev => prev.map(p => p._id === postToAction._id ? {
            ...p,
            status: "failed",
            error: errorMsg,
            locations: selectedLocations
          } : p));
        }

        if (deductionSuccessful) {
          showToast(`Failed to send post. Refunding coins...`, "error");
          // Refund coins
          await deductFromWalletAction(userId, {
            amount: totalPostCost,
            type: "credit",
            reason: "Refund-Post-Failed",
            metadata: {
              originalReason: "Post-on-GMB",
            }
          });
          const userData = await getUserWalletAction(userId);
          setUserWallet(userData.wallet);
          localStorage.setItem("walletBalance", userData.wallet);
        } else {
          showToast("Network error: Failed to send post", "error");
        }
      } finally {
        // Reset states related to posting
        setIsPosting(false);
      }
    }
    setPostToAction(null); // Clear postToAction after handling
  };
  

  const handlePost = async (post) => {
    // First check if user has approved the post
    if (post.status !== "approved" && post.status !== "scheduled" && post.status !== "posted" && post.status !== "failed") {
      showToast("Please approve the post first!", "error");
      return;
    }

    // Set the post to be actioned and open the location modal
    setPostToAction(post);
    setShowLocationModal(true);
  };

  const handleDeleteLocationConfirm = async (selectedLocationIds) => {
    setShowDeleteLocationModal(false);
    if (selectedLocationIds.length === 0) return;

    if (!postToAction || !postToAction.locations) {
      showToast("Post or location data is missing for deletion.", "error");
      return;
    }

    // Find the full location objects based on the selected IDs.
    // The `LocationSelectionModal` passes back the `id` property of the location objects.
    const locationsToDelete = postToAction.locations.filter(loc => 
      selectedLocationIds.includes(loc.id)
    );

    setIsPosting(true);
    let successCount = 0;

    for (const location of locationsToDelete) {
      const payload = {
        locationIds: location.locationId,
        acc_id: location.accountId,
        access_token: session?.accessToken,
      };
      try {
        const result = await deletePostFromGmbAction(payload);

        if (!result.success) {
          throw new Error(`Failed to delete from ${location.name}.`);
        }
        showToast(`Post deleted from ${location.name}.`, "success");
        successCount++;
      } catch (error) {
        showToast(error.message, "error");
      }
    }

    if (successCount > 0) {
      const remainingLocations = postToAction.locations.filter(
        (loc) => !selectedLocationIds.includes(loc.id)
      );

      const newStatus = remainingLocations.length === 0 ? 'approved' : postToAction.status;
      
      await updatePostStatusAction({ 
        id: postToAction._id, 
        userId, 
        locations: remainingLocations, 
        status: newStatus 
      });
      await fetchPosts(activeTab);
    }

    setIsPosting(false);
    setPostToAction(null);
  };

  const handleReject = async (id) => {
    if (confirm("Are you sure you want to reject this post?")) {
      setRejectPostId(id);
      setShowRejectModal(true);
    }
  };

  const submitRejection = async () => {
    const userId = localStorage.getItem("userId");

    if (!rejectReason.trim()) {
      showToast("Please enter a reason!", "error");
      return;
    }

    try {
      const data = await updatePostStatusAction({
        id: rejectPostId,
        userId,
        status: "rejected",
        reason: rejectReason,
      });
      if (data.success) {
        showToast("Post rejected successfully! ❌");

        // ✅ Update status only (do not delete)
        setPosts((prev) =>
          prev.map((p) =>
            p._id === rejectPostId
              ? { ...p, status: "rejected", rejectReason: rejectReason }
              : p
          )
        );
  
        // ✅ Update counts
        setAllCounts((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1,
        }));
      }

      // Reset modal data
      setRejectReason("");
      setRejectPostId(null);
      setShowRejectModal(false);

    } catch (error) {
      console.error(error);
      showToast("Error rejecting post", "error");
    }
  };


  const handleDownload = async (post) => {
    if (!post.aiOutput) {
      showToast("No image available to download.", "error");
      return
    }

    try {
      const apiUrl = `/api/downloadImage?url=${encodeURIComponent(post.aiOutput)}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        showToast("Failed to download image", "error");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `post-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      showToast("Image downloaded successfully! 📥");
    } catch (err) {
      showToast("Failed to download image", "error");
    }
  };
  const handleShare   = async (post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post",
          text: post.description || "AI-generated content",
          url: post.aiOutput,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(post.aiOutput || "");
      showToast("Link copied to clipboard! 📋");
    }
  };


useEffect(() => {
  const locationDetailsData = localStorage.getItem("locationDetails");

  if (!locationDetailsData) return;

  try {
    const parsedData = JSON.parse(locationDetailsData);

    if (!Array.isArray(parsedData)) return;

    // Get unique business titles
    const uniqueBusinesses = [];
    const seenTitles = new Set();

    parsedData.forEach((item) => {
      if (item?.title && !seenTitles.has(item.title)) {
        seenTitles.add(item.title);
        uniqueBusinesses.push(item);
      }
    });

    // Use first unique business title
    if (uniqueBusinesses.length > 0) {
      setBussinessTitle(uniqueBusinesses[0].title);
    }
  } catch (error) {
    console.error("Failed to parse locationDetails:", error);
  }
}, []);


  useEffect(() => {
    fetchPosts();
  }, []);

  // Load wallet balance on mount
  useEffect(() => {
    const storedBalance = localStorage.getItem("walletBalance");
    if (storedBalance) {
      setUserWallet(parseInt(storedBalance, 10));
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);
  const filteredPosts = activeTab === "total" ? posts : posts.filter((post) => post.status === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50  mt-[-8px]">
      {/* Back button for mobile view */}
      <div className="sm:hidden fixed top-4 left-4 z-50">
        <Link href="/dashboard" passHref>
          <button
            aria-label="Go back to dashboard"
            className="bg-white/80 backdrop-blur-sm p-2.5 rounded-full shadow-lg border border-gray-200 hover:scale-110 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-2 py-2">
        {toast && <Toast message={toast.message} type={toast.type} />}
        {showLocationModal && (
          <LocationSelectionModal
            locations={availableLocations} // Show all available locations for posting
            onClose={() => setShowLocationModal(false)}
            onConfirm={handleLocationConfirm}
            title="Select Locations to Post"
            confirmText="Post"
            walletBalance={userWallet}
            initialSelected={
              postToAction?.locations?.map((l) => {
                const match = availableLocations.find((al) => al.locationId === l.locationId);
                return match ? match.id : l.id;
              }) || []
            }
          />
        )}
        {showDeleteLocationModal && (
          <LocationSelectionModal
            locations={postToAction?.locations || []} // Show only posted locations for deleting
            onClose={() => setShowDeleteLocationModal(false)}
            onConfirm={handleDeleteLocationConfirm}
            title="Select Locations to Delete From"
            confirmText="Delete"
          />
        )}
        {showInsufficientBalance && (
          <InsufficientBalanceModal
            walletBalance={userWallet}
            required={requiredCoins}
            onClose={() => setShowInsufficientBalance(false)}
            onRecharge={() => {
              setShowInsufficientBalance(false);
              window.location.href = "/wallet";
            }}
          />
        )}
        {isScheduleModalOpen && (
          <ScheduleModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            post={postToSchedule} // Pass the post to the modal
            onConfirm={handleScheduleDateConfirmed} // New handler for date confirmation
            />
        )}
        {showRejectModal && (
          <RejectReasonModal
            onClose={() => setShowRejectModal(false)}
            onSubmit={submitRejection}
            reason={rejectReason}
            setReason={setRejectReason}
          />
        )}
        {showFirstPostModal && (
          <FirstPostModal onClose={() => setShowFirstPostModal(false)} />
        )}
        {isPosting && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center space-y-4 sm:space-y-6 max-w-md w-full border-4 border-white/30">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-300/40 rounded-full blur-2xl animate-pulse"></div>
                <div className="text-6xl sm:text-8xl animate-bounce-slow">🚀</div>
              </div>
              <div className="text-center space-y-2 sm:space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black text-white">Publishing Post...</h3>
                <p className="text-blue-100 text-xs sm:text-sm">Sending to Google My Business</p>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-300 via-yellow-300 to-green-300 h-full rounded-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}
        {showSuccess && <SuccessOverlay onComplete={() => setShowSuccess(false)} postsCount={postsGeneratedCount} />}

        <div>

<div
  className="
    flex items-center justify-between
    gap-3
  "
>
  
  {/* Post Management */}
  <div
    className="
      inline-flex items-center gap-2
      px-3 sm:px-5 py-1
      rounded-xl
      bg-white
      shadow-md
      border border-blue-100
      whitespace-nowrap
    "
  >
    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50">
      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
    </div>
    <span className="text-sm sm:text-xl font-bold text-blue-700">
      Post Management
    </span>
  </div>

  {/* 5000 > 2 video 2500  > 1 */}

  {/* Preview Button */}
  <a href={previewData?.aiOutput} target="_blank" rel="noopener noreferrer"
    className="
      inline-flex items-center gap-1.5
      px-3 sm:px-5 py-2
      rounded-xl
      bg-gradient-to-r from-indigo-500 to-blue-600
      hover:from-indigo-600 hover:to-blue-700
      text-white font-semibold
      shadow-md
      transition-all duration-200
      text-sm sm:text-base
      whitespace-nowrap
    "
  >
    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
    Preview
  </a>

</div>


  {/* <p className="text-blue/90 text-sm sm:text-sm font-medium text-center">
    Create stunning GMB posts with AI in seconds ✨
  </p> */}

</div>

        {/* Main Content Area - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-7">
            <PostInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerateClick}
              loading={isGenerating}
              logo={logo}
              setLogo={setLogo}
              assets={userAssets}
              setUserAssets={setUserAssets}
              fetchUserAssets={fetchUserAssets}
              assetId={assetId}
              showToast={showToast}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              bussinessTitle={bussinessTitle}
              availableLocations={availableLocations}
            />
          </div>

          {/* Right Column: Live Preview */}
          <div className="lg:col-span-5 sticky top-24 z-10" ref={previewRef}>
            <PreviewSection 
              isGenerating={isGenerating}
              previewData={previewData}
              onDownload={handleDownload}
              countdown={countdown}
              onUpdateStatus={handleUpdateStatus}
              onReject={handleReject}
              handlePost={handlePost}
              onToggleCheckmark={handleToggleCheckmark}
              onEditDescription={handleEditDescription}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              count={tab.count}
            />
          ))}
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                scheduleDates={scheduleDates}
                onDateChange={handleDateChange}
                handleDownload={handleDownload}
                handleShare={handleShare}
                onUpdateStatus={handleUpdateStatus}
                onReject={handleReject}
                handlePost={handlePost}
                onEditDescription={handleEditDescription}
                handleDeleteFromGMB={handleDeleteFromGMB}
                onToggleCheckmark={handleToggleCheckmark}
                handleFacebookPost={handleFacebookPost}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-10 sm:p-16 text-center border-3 border-dashed border-gray-300 shadow-xl">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No posts found</h3>
            <p className="text-gray-600 text-base">
              {activeTab === "total"
                ? "Create your first AI-powered post above!"
                : `No ${activeTab} posts yet`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}