"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Coins,
  Clock,
  CheckCircle,
  CalendarDays,
  Send,
  Image,
  ArrowUpCircle,
  ArrowDownCircle,
  Sparkles,
  TrendingUp,
  Award,
  ImageIcon,
  Download,
  Eye,
  Loader2,
} from "lucide-react";

export default function ProfileWithStats() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [aiImages, setAiImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const [allCounts, setAllCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    scheduled: 0,
    posted: 0,
  });


  useEffect(() => {
    fetchUser();
    fetchPosts();
    fetchTransactions();
    fetchAiImages();
  }, []);

  // ---------------- FETCH USER DATA ----------------
  const fetchUser = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`/api/auth/signup?userId=${userId}`);
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error("User fetch failed");
    }
  };

  // ---------------- FETCH POST COUNTS ----------------
  const fetchPosts = async () => {
    try {
      const userId = localStorage.getItem("userId");

      const res = await fetch(`/api/post-status?userId=${userId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        const allPosts = data.data;

        setAllCounts({
          total: allPosts.length,
          approved: allPosts.filter((p) => p.status === "approved").length,
          pending: allPosts.filter((p) => p.status === "pending").length,
          scheduled: allPosts.filter((p) => p.status === "scheduled").length,
          posted: allPosts.filter((p) => p.status === "posted").length,
        });
      }
    } catch (err) {
      console.error("Post fetch failed");
    }
  };

  // ---------------- FETCH TRANSACTIONS ----------------
  const fetchTransactions = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`/api/transactions?userId=${userId}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Transaction fetch failed:", err);
    } finally {
      setLoadingTx(false);
    }
  };

  // ---------------- FETCH AI GENERATED IMAGES ----------------
  const fetchAiImages = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`/api/post-status?userId=${userId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        const allPosts = data.data;
        // Extract images from aiOutput field
        const images = allPosts
          .filter((post) => post.aiOutput && post.aiOutput.trim() !== "")
          .map((post) => ({
            id: post._id,
            url: post.aiOutput,
            prompt: post.caption || "No caption",
            createdAt: post.createdAt,
            status: post.status,
          }));
        setAiImages(images);
      }
    } catch (err) {
      console.error("AI Images fetch failed:", err);
    } finally {
      setLoadingImages(false);
    }
  };

  if (!userData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const { fullName, email, phone, wallet } = userData;
  const paidPackage = userData.paidPackage || userData.subscription?.plan || "No active plan";
  const planDuration = userData.planDuration || "-";
  const expiry = userData.subscription?.expiry
    ? new Date(userData.subscription.expiry).toLocaleDateString()
    : "-";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-4 sm:p-8 mt-10">
      <div className="max-w-6xl mx-auto">
        {/* ---------------- HERO PROFILE CARD ---------------- */}
        <div className="relative bg-lightPrimary rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              {/* Avatar with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-white to-purple-100 flex items-center justify-center text-dark text-5xl font-bold shadow-2xl ring-4 ring-white/50">
                  {fullName?.charAt(0)}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-lightPrimary w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-dark" />
                </div>
              </div>

              {/* User Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-dark  mb-2 drop-shadow-lg">
                  {fullName}
                </h1>
                <p className="text-dark text-sm md:text-base flex items-center gap-2 justify-center md:justify-start">
                  <Award className="w-4 h-4" />
                  Premium Member • Active Since 2024
                </p>
                <button
      onClick={() => router.push("/user-activity")}
      className="mt-4 bg-dark text-primary px-6 py-2 rounded-xl font-semibold shadow-md hover:scale-105 transition flex items-center gap-2 mx-auto md:mx-0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      User Activity
    </button>
              </div>

              {/* Wallet Quick Access */}
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 shadow-xl">
                <p className="text-dark text-sm mb-1">Wallet Balance</p>
                <div className="flex items-center gap-3">
                  <Coins className="text-yellow-300 w-8 h-8" />
                  <span className="text-3xl font-bold text-dark">{wallet}</span>
                </div>
                <button
                  onClick={() => router.push("/wallet")}
                  className="mt-3 w-full bg-dark text-primary px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Add Coins
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- MAIN CONTENT GRID ---------------- */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={phone} />
              </div>
            </div>

            {/* Plan Card */}
            <div className="bg-dark rounded-2xl shadow-xl p-6 mt-6 text-lightPrimary relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Active Plan</h3>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <p className="text-2xl font-bold mb-2">{paidPackage}</p>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span className="text-purple-100">Duration:</span>
                      <span className="font-semibold">{planDuration}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-purple-100">Expires:</span>
                      <span className="font-semibold">{expiry}</span>
                    </p>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    paidPackage !== "No active plan"
                      ? "bg-green-400 text-green-900"
                      : "bg-gray-400 text-gray-900"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                  {paidPackage !== "No active plan" ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Statistics */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100  ">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-dark" />
                Post Analytics
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard
                  title="Total Posts"
                  value={allCounts.total}
                  icon={<Image className="w-5 h-5" />}
                  gradient="bg-dark"
                  textColor="text-lightPrimary"
                />
                <StatCard
                  title="Approved"
                  value={allCounts.approved}
                  icon={<CheckCircle className="w-5 h-5" />}
                  gradient="bg-dark"
                  textColor="text-lightPrimary"
                />
                <StatCard
                  title="Pending"
                  value={allCounts.pending}
                  icon={<Clock className="w-5 h-5" />}
                  gradient="bg-dark"
                  textColor="text-lightPrimary"
                />
                <StatCard
                  title="Scheduled"
                  value={allCounts.scheduled}
                  icon={<CalendarDays className="w-5 h-5" />}
                  gradient="bg-dark"
                  textColor="text-lightPrimary"
                />
                <StatCard
                  title="Posted"
                  value={allCounts.posted}
                  icon={<Send className="w-5 h-5" />}
                  gradient="bg-dark"
                  textColor="text-lightPrimary"
                />
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Coins className="w-6 h-6 text-dark" />
                Recent Transactions
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {loadingTx ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Coins className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx, index) => (
                    <div
                      key={tx.id}
                      className="group relative bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:border-dark hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            tx.type === "credit"
                              ? "bg-white text-dark"
                              : "bg-lightPrimary text-dark"
                          }`}
                        >
                          {tx.type === "credit" ? (
                            <ArrowUpCircle className="w-6 h-6" />
                          ) : (
                            <ArrowDownCircle className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 mb-1 truncate">
                            {tx.reason}
                          </p>

                          {tx.metadata?.aiPrompt && (
                            <p className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 inline-block mb-2">
                              💬 {tx.metadata.aiPrompt}
                            </p>
                          )}

                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {tx.date} • {tx.time}
                          </p>
                        </div>

                        <div
                          className={`text-xl font-bold whitespace-nowrap ${
                            tx.type === "credit" ? "text-lightPrimary" : "text-dark"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {tx.amount}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- AI GENERATED IMAGES GALLERY ---------------- */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-dark" />
            AI Generated Images
            <span className="ml-auto text-sm font-normal text-gray-500">
              {aiImages.length} {aiImages.length === 1 ? "image" : "images"}
            </span>
          </h2>

          {loadingImages ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading AI images...</p>
            </div>
          ) : aiImages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No AI Images Yet</h3>
              <p className="text-gray-500 text-sm">
                Your AI-generated images will appear here once created
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {aiImages.map((img, index) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  index={index}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a5b4fc;
        }
      `}</style>
    </div>
  );
}

// ---------------- IMAGE CARD COMPONENT ----------------
function ImageCard({ image, index, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
      )}

      {/* Error state */}
      {imageError ? (
        <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-600 font-medium">Failed to load</p>
          </div>
        </div>
      ) : (
        <>
          <img
            src={image.url}
            alt={image.prompt}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-xs font-medium line-clamp-2 mb-2">
                {image.prompt}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    image.status === "posted"
                      ? "bg-blue-500 text-white"
                      : image.status === "approved"
                      ? "bg-green-500 text-white"
                      : image.status === "scheduled"
                      ? "bg-purple-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {image.status}
                </span>
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------- IMAGE MODAL COMPONENT ----------------
function ImageModal({ image, onClose }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-image-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">AI Generated Image</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="relative bg-gray-100 flex items-center justify-center min-h-[300px] max-h-[60vh]">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
          )}
          <img
            src={image.url}
            alt={image.prompt}
            className={`max-w-full max-h-[60vh] object-contain transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-1">Prompt</h4>
            <p className="text-gray-800">{image.prompt}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Status</h4>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    image.status === "posted"
                      ? "bg-blue-100 text-blue-700"
                      : image.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : image.status === "scheduled"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {image.status}
                </span>
              </div>
              {image.createdAt && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-1">Created</h4>
                  <p className="text-gray-800 text-sm">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
      <div className="text-indigo-600">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient, textColor }) {
  return (
    <div className="group relative bg-white p-5 rounded-2xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      ></div>

      <div className="relative z-10">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>

        <h3 className="text-sm text-gray-600 font-medium mb-1">{title}</h3>
        <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      </div>

      <div
        className={`absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br ${gradient} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`}
      ></div>
    </div>
  );
}