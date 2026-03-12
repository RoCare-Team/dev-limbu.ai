

"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  Calendar,
  Send,
  XCircle,
  Download,
  Edit3,
  RefreshCw,
  Eye,
  Image as ImageIcon
} from "lucide-react";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";

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