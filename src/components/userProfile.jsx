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
  Image as ImageIconIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  Sparkles,
  TrendingUp,
  Award,
  ImageIcon,
  Download,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Activity,
  X,
} from "lucide-react";

function ImageModal({ image, onClose }) {
  const [loaded, setLoaded] = useState(false);

  const handleDownload = async () => {
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `limbu-asset-${image.id}.png`;
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
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[2rem] max-w-2xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-black/5 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[11px] font-black text-black uppercase tracking-tight">
            Asset Detail
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        <div className="relative bg-slate-100 flex items-center justify-center min-h-[250px] max-h-[40vh] border-b border-black/5">
          {!loaded && (
            <Loader2 className="w-6 h-6 text-black animate-spin absolute" />
          )}
          <img
            src={image.url}
            alt="Asset"
            className={`max-w-full max-h-[40vh] object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
        </div>

        <div className="p-5">
          <p className="text-[9px] font-medium text-slate-600 mb-6 italic leading-relaxed">
            "{image.prompt}"
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Status
                </p>
                <p className="text-[9px] font-black text-black uppercase">
                  {image.status}
                </p>
              </div>
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Origin
                </p>
                <p className="text-[9px] font-black text-black uppercase">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="btn-lemon px-5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-2"
            >
              <Download className="w-3 h-3" /> Save Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileWithStats() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [aiImages, setAiImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Pagination for AI Images
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 10;

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
        const images = allPosts
          .filter((post) => post.aiOutput && post.aiOutput.trim() !== "")
          .map((post) => ({
            id: post._id,
            url: post.aiOutput,
            prompt: post.caption || "No caption",
            createdAt: post.createdAt,
            status: post.status,
          }));
        images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-lemon-hover animate-spin" />
      </div>
    );
  }

  const { fullName, email, phone, wallet } = userData;
  const paidPackage =
    userData.paidPackage || userData.subscription?.plan || "No active plan";
  const planDuration = userData.planDuration || "-";
  const expiry = userData.subscription?.expiry
    ? new Date(userData.subscription.expiry).toLocaleDateString()
    : "-";

  const totalPages = Math.ceil(aiImages.length / imagesPerPage);
  const currentImages = aiImages.slice(
    (currentPage - 1) * imagesPerPage,
    currentPage * imagesPerPage,
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* ---------------- HERO PROFILE CARD ---------------- */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lemon-glow/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-lemon-glow/10"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center text-lemon-glow text-3xl font-black shadow-xl border border-black/5">
              {fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white w-7 h-7 rounded-xl border border-black/5 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-lemon-hover" />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center md:text-left flex-1">
            <h1
              className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-1"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {fullName}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
              <Award className="w-3 h-3 text-lemon-hover" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Global Identity Verified
              </span>
            </div>
            <button
              onClick={() => router.push("/user-activity")}
              className="btn-lemon px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 mx-auto md:mx-0 shadow-lg"
            >
              <Activity className="w-3.5 h-3.5" />
              Intelligence Log ↗
            </button>
          </div>

          {/* Wallet Quick Access */}
          <div className="bg-slate-50 border border-black/5 rounded-2xl p-5 shrink-0 min-w-[180px] text-center md:text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Vault Credit
            </p>
            <div className="flex items-center justify-center md:justify-end gap-2 mb-4">
              <Coins className="text-lemon-hover w-5 h-5" />
              <span
                className="text-2xl font-black text-black tracking-tighter"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {wallet}
              </span>
            </div>
            <button
              onClick={() => router.push("/wallet")}
              className="w-full btn-ghost py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border-black/10 text-black hover:bg-black hover:text-lemon-glow hover:border-black transition-all"
            >
              Sync Coins
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- MAIN CONTENT GRID ---------------- */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column - Contact & Plan */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <User className="w-3.5 h-3.5 text-black" />
              </div>
              <h3
                className="text-[11px] font-bold text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Registry Detail
              </h3>
            </div>
            <div className="space-y-2.5">
              <InfoRow
                icon={<Mail className="w-3 h-3" />}
                label="Electronic Mail"
                value={email}
              />
              <InfoRow
                icon={<Phone className="w-3 h-3" />}
                label="Digital Node"
                value={phone}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-lemon-glow/10 rounded-lg">
                  <CalendarDays className="w-3.5 h-3.5 text-lemon-hover" />
                </div>
                <h3
                  className="text-[11px] font-bold text-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Active Node
                </h3>
              </div>
              <span
                className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${paidPackage !== "No active plan" ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
              >
                {paidPackage !== "No active plan" ? "Live" : "Idle"}
              </span>
            </div>

            <div className="bg-slate-50 border border-black/5 rounded-xl p-4">
              <p
                className="text-base font-black text-black uppercase tracking-tight mb-3"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {paidPackage}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Cycle
                  </span>
                  <span className="text-[9px] font-black text-black">
                    {planDuration}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Expiry
                  </span>
                  <span className="text-[9px] font-black text-black">
                    {expiry}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Transactions */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm p-6 sm:p-8 border border-black/5">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-black" />
              </div>
              <h2
                className="text-[11px] font-bold text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Performance Metrics
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatCard
                title="Volume"
                value={allCounts.total}
                icon={<ImageIconIcon className="w-3.5 h-3.5" />}
              />
              <StatCard
                title="Ready"
                value={allCounts.approved}
                icon={<CheckCircle className="w-3.5 h-3.5" />}
              />
              <StatCard
                title="Queued"
                value={allCounts.pending}
                icon={<Clock className="w-3.5 h-3.5" />}
              />
              <StatCard
                title="Syncing"
                value={allCounts.scheduled}
                icon={<CalendarDays className="w-3.5 h-3.5" />}
              />
              <StatCard
                title="Deployed"
                value={allCounts.posted}
                icon={<Send className="w-3.5 h-3.5" />}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm p-6 sm:p-8 border border-black/5">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <Coins className="w-3.5 h-3.5 text-black" />
              </div>
              <h2
                className="text-[11px] font-bold text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Credit Ledger
              </h2>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2 custom-scroll">
              {loadingTx ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Loader2 className="w-6 h-6 text-black animate-spin mb-2" />
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                    Syncing...
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">
                    No Ledger Records
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-black/5 hover:border-black/20 bg-slate-50/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${tx.type === "credit" ? "bg-green-100 text-green-700" : "bg-white border border-black/10 text-black"}`}
                      >
                        {tx.type === "credit" ? (
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-black uppercase tracking-tight mb-0.5">
                          {tx.reason}
                        </p>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="w-2 h-2" /> {tx.date} • {tx.time}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-black tracking-tighter ${tx.type === "credit" ? "text-green-600" : "text-black"}`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {tx.amount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- AI GENERATED IMAGES GALLERY ---------------- */}
      <div className="bg-white rounded-[2.5rem] shadow-sm p-6 sm:p-8 border border-black/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black rounded-lg shadow-md">
              <ImageIcon className="w-3.5 h-3.5 text-lemon-glow" />
            </div>
            <h2
              className="text-xs font-black text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Synthesized Asset Stream
            </h2>
          </div>
          <span className="text-[8px] font-black bg-slate-50 border border-black/5 text-black px-2.5 py-1 rounded-full uppercase tracking-widest">
            {aiImages.length} Entries
          </span>
        </div>

        {loadingImages ? (
          <div className="text-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
          </div>
        ) : aiImages.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-black/10 rounded-[1.5rem]">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Stream Offline
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {currentImages.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-50 border border-black/5 hover:bg-white disabled:opacity-20 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-black" />
                </button>
                <span className="text-[8px] font-black text-black px-3 uppercase tracking-widest">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-50 border border-black/5 hover:bg-white disabled:opacity-20 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

// ---------------- UTILITY COMPONENTS ----------------

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-black/5 hover:border-black/10 transition-all shadow-sm">
      <div className="p-1.5 bg-slate-50 rounded-lg border border-black/5 text-black">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-[10px] font-bold text-black truncate">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-black/5 flex flex-col items-center text-center transition-all hover:bg-white hover:shadow-md">
      <div className="p-1.5 bg-white rounded-lg border border-black/5 text-black mb-2 shadow-sm">
        {icon}
      </div>
      <p className="text-xl font-black text-black tracking-tighter mb-0.5">
        {value}
      </p>
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
        {title}
      </p>
    </div>
  );
}

function ImageCard({ image, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm border border-black/5 hover:shadow-lg transition-all bg-slate-50"
      onClick={onClick}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-slate-200 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <ImageIcon className="w-5 h-5 text-slate-400" />
        </div>
      ) : (
        <>
          <img
            src={image.url}
            alt="AI Gen"
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-4 h-4 text-lemon-glow" />
          </div>
        </>
      )}
    </div>
  );
}
