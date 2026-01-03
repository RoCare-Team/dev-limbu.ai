import React, { useState } from "react";
import {
  Download,
  Share2,
  Calendar,
  CheckCircle,
  X,
  Edit,
  Save,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";

const PostCard = ({
  post,
  onUpdateStatus,
  onReject,
  handleDownload,
  handleShare,
  handlePost,
  onEditDescription,
  handleDeleteFromGMB,
}) => {
  const [showFull, setShowFull] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    post?.description || ""
  );

  const handleSave = () => {
    onEditDescription(post._id, editedDescription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDescription(post?.description || "");
    setIsEditing(false);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "approved":
        return "bg-green-500 text-white";
      case "scheduled":
        return "bg-blue-500 text-white";
      case "posted":
        return "bg-purple-500 text-white";
      case "rejected":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all flex flex-col">
      <a href={post.aiOutput} target="_blank" rel="noopener noreferrer">
        <div className="relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 w-full h-56 md:h-64">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          )}
          <img
            src={post?.aiOutput || "https://via.placeholder.com/400"}
            alt="Post"
            className={`w-full h-56 md:h-64 object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          <div
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${getStatusChip(
              post.status
            )}`}
          >
            {post.status.toUpperCase()}
          </div>
        </div>
      </a>

      <div className="p-5 space-y-4 flex-grow flex flex-col">
        <div className="flex-grow">
          <strong className="text-gray-900 block mb-1">Description:</strong>

          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 text-sm"
              rows={5}
            />
          ) : (
            <p
              className={`text-sm text-gray-700 ${
                showFull ? "" : "line-clamp-4"
              }`}
            >
              {post?.description || "No description available"}
            </p>
          )}

          {post?.description?.length > 150 && !isEditing && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-blue-600 text-sm font-medium mt-1 hover:underline"
            >
              {showFull ? "View Less" : "View More"}
            </button>
          )}

          <div className="mt-3 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 flex items-center gap-2"
                >
                  <XCircle size={16} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-2"
              >
                <Edit size={16} /> Edit
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1 pt-2 border-t border-gray-100">
          <Calendar className="w-3 h-3" />
          {post.status === "posted"
            ? `Posted: ${new Date(post.locations?.[0]?.postedAt || post.updatedAt).toLocaleDateString()}`
            : post.createdAt
            ? new Date(post.createdAt).toLocaleDateString()
            : ""}
        </p>

        <div className="flex flex-col gap-3 pt-2">
          {post.status === "pending" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onUpdateStatus(post._id, "approved")}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => onReject(post._id)}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {(post.status === "approved" || post.status === "scheduled") && (
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleDownload(post)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                >
                  <Share2 size={16} />
                </button>
              </div>
              <button
                onClick={() => handlePost(post)}
                className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LabelImportantIcon className="w-4 h-4" /> Post to GMB
              </button>
               <button
                onClick={() => handlePost(post)}
                className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LabelImportantIcon className="w-4 h-4" /> Schedule to GMB
              </button>
            </div>
          )}

          {post.status === "posted" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handlePost(post)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Repost
              </button>
              <button
                onClick={() => handleDeleteFromGMB(post)}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;