"use client";

import { X, Image as ImageIcon, ZoomIn } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (User Posts modal).
// The original file rendered two near-identical copies of this modal that differ
// only in (a) where the stat numbers come from and (b) the close handler. Those
// differences are passed in as props so behaviour stays exactly the same.
export default function UserPostsModal({
  open,
  user,
  loadingPosts,
  userPosts,
  totalCount,
  postedCount,
  rejectedCount,
  onCloseX,
  onCloseFooter,
  setFullViewImage,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Posts</h2>
            <p className="text-gray-600 text-sm mt-1">{user.email}</p>
          </div>
          <button
            onClick={onCloseX}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
              <p className="text-2xl font-bold text-indigo-600">
                {user.wallet || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Posts</p>
              <p className="text-2xl font-bold text-purple-600">
                {loadingPosts ? "..." : totalCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Posted</p>
              <p className="text-2xl font-bold text-green-600">
                {loadingPosts ? "..." : postedCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {loadingPosts ? "..." : rejectedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No posts yet</p>
              <p className="text-gray-400 text-sm">
                This user hasn't created any posts
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPosts.map((post, index) => (
                <div
                  key={post._id || index}
                  className="relative group bg-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-square relative">
                    <img
                      src={post.aiOutput}
                      alt={`Post ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setFullViewImage(post.aiOutput)}
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='16' text-anchor='middle' dy='.3em' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />

                    <div className="absolute top-2 right-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          post.status === "posted"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : post.status === "rejected"
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            post.status === "posted"
                              ? "bg-green-500"
                              : post.status === "rejected"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        ></div>
                        {post.status === "posted"
                          ? "Posted"
                          : post.status === "rejected"
                            ? "Rejected"
                            : "Pending"}
                      </span>
                    </div>

                    <button
                      onClick={() => setFullViewImage(post.aiOutput)}
                      className="absolute top-2 left-2 p-2 bg-white/90 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ZoomIn size={16} className="text-gray-700" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        Post #{index + 1}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {post.promat && (
                      <p className="text-sm text-gray-700 line-clamp-2">
                        <span className="font-bold">Prompt:</span>{" "}
                        {post.promat}
                      </p>
                    )}
                    {post.status === "rejected" && post.rejectReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                          Rejection Reason:
                        </p>
                        <p className="text-xs text-red-600">
                          {post.rejectReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onCloseFooter}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
