"use client";
import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import { 
  Star, Download, Copy, Check, Sparkles, QrCode, 
  Share2, Printer, ArrowLeft,
  Phone, X,
  MessageSquare,
  Info,
  Zap,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";

export default function BusinessQR() {
  const [business, setBusiness] = useState("");
  const [reviewUri, setReviewUri] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [qrImage, setQrImage] = useState("");
  
  const [copied, setCopied] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  
  const [allLocations, setAllLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const qrCardRef = useRef(null);

  // Get all locations from localStorage
  const getAllLocations = () => {
    try {
      const raw = localStorage.getItem("locationDetails");
      if (!raw) return [];
      
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.error("localStorage parse error", e);
      return [];
    }
  };

  // Fetch Google Review URL via API
  const getGoogleReviewURL = async (title) => {
    try {
      const encoded = encodeURIComponent(title);
      const res = await fetch(`/api/user-bussiness/${encoded}`);
      const data = await res.json();

      if (data?.newReviewUri) {
        setReviewUri(data.newReviewUri);
      } else {
        setReviewUri("");
      }
    } catch (e) {
      console.error("API error:", e);
      setReviewUri("");
    }
  };

  // Create review URL - clean URL without query params
  const createReviewUrl = (location) => {
    const title = location.title || "";
    const locality = location.storefrontAddress?.locality || location.locality || "";
    const address = location.address || "";
    
    const slug = `${title}${locality ? `-${locality}` : ""}${address ? `-${address}` : ""}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/reviews/${slug}`;
  };

  // Create display name with locality
  const getDisplayName = (location) => {
    const title = location.title || "";
    const locality = location.storefrontAddress?.locality || location.locality || "";
    return locality ? `${title} - ${locality}` : title;
  };

  // Init Load
  useEffect(() => {
    const locations = getAllLocations();
    setAllLocations(locations);

    if (locations.length === 0) return;

    const firstLocation = locations[0];
    setSelectedLocationId(firstLocation.locationId);

    const displayName = getDisplayName(firstLocation);
    setBusiness(displayName);

    if (!firstLocation.title) return;
    
    if (firstLocation.reviewUri) {
      setReviewUri(firstLocation.reviewUri);
    } else {
      getGoogleReviewURL(firstLocation.title);
    }

    const finalReviewURL = createReviewUrl(firstLocation);
    setReviewUrl(finalReviewURL);

    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}`;
    setQrImage(qr);
  }, []);

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  // Handle location change
  const handleLocationChange = (locationId) => {
    setSelectedLocationId(locationId);
    
    const selected = allLocations.find(loc => loc.locationId === locationId);
    if (!selected) return;

    const displayName = getDisplayName(selected);
    setBusiness(displayName);

    if (!selected.title) return;

    if (selected.reviewUri) {
      setReviewUri(selected.reviewUri);
    } else {
      getGoogleReviewURL(selected.title);
    }

    const finalReviewURL = createReviewUrl(selected);
    setReviewUrl(finalReviewURL);

    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}`;
    setQrImage(qr);
  };

  // Download QR with branding
  const downloadQR = async () => {
    if (qrCardRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(qrCardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `${business}-qr-review.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Magic QR downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate download");
    }
  };

  const printQR = async () => {
    if (qrCardRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(qrCardRef.current, { cacheBust: true, pixelRatio: 3 });
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR - ${business}</title>
            <style>
              @media print {
                @page { size: auto; margin: 0; }
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              }
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #fff; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border-radius: 2rem; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reviewUrl).then(() => {
      setCopied(true);
      toast.success("Magic Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review ${business}`,
          text: "Share your feedback!",
          url: reviewUrl,
        });
      } catch (e) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="bg-white border border-black/5 rounded-[2rem] p-10 text-center max-w-lg mx-auto shadow-2xl relative z-10 transition-all hover:shadow-lemon">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-black/5">
             <QrCode className="w-8 h-8 text-slate-200" />
          </div>
          <h2 className="text-xl font-bold text-black mb-3 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Business Required
          </h2>
          <p className="text-slate-500 font-medium mb-8 text-xs leading-relaxed">
            Please connect your Google Business Profile to initialize the Magic QR reputation hub.
          </p>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="w-full btn-lemon px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg"
          >
            Connect Business Node <ArrowRight className="inline-block w-3 h-3 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-center" />

      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(250, 204, 21, 0.2) 0%, transparent 65%)",
        }}
      />
      
      {/* Page Header - Non-sticky */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Magic <span className="text-lemon-hover">QR</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Reputation Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-lemon-glow/20 bg-lemon-glow/10">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[8px] font-bold uppercase text-lemon-hover tracking-widest">Active Node</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {business}
          </h2>
          
          {allLocations.length > 1 && (
            <div className="max-w-xs mx-auto mt-4">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Switch Active Business</label>
              <select
                value={selectedLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-black/5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
              >
                {allLocations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {getDisplayName(loc)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* QR Preview Card */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 sm:p-10 relative overflow-hidden transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-black rounded-xl shadow-lg">
                  <QrCode className="text-lemon-glow w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Asset Preview</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Reputation Portal</p>
                </div>
              </div>
              <button 
                onClick={shareLink}
                className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all"
              >
                <Share2 className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="flex justify-center mb-10">
              <div ref={qrCardRef} className="relative w-[300px] bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-black/5">
                <div className="absolute inset-0 p-[2px] bg-gradient-to-br from-blue-500 via-red-500 via-yellow-400 to-green-500">
                  <div className="absolute inset-0 bg-white m-[2px] rounded-[1.9rem]" />
                </div>

                <div className="relative p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <span className="text-2xl font-black tracking-tighter">
                      <span className="text-blue-500">G</span>
                      <span className="text-red-500">o</span>
                      <span className="text-yellow-500">o</span>
                      <span className="text-blue-500">g</span>
                      <span className="text-green-500">l</span>
                      <span className="text-red-500">e</span>
                    </span>
                  </div>

                  <div className="flex justify-center gap-1 text-yellow-400 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                  </div>

                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Scan to Rate Us</p>
                  <h4 className="text-xs font-black text-black uppercase tracking-tight mb-6 line-clamp-1">{business}</h4>

                  {qrImage && (
                    <div className="relative inline-block bg-white p-4 rounded-2xl shadow-inner border border-slate-50 mb-6">
                      <img src={qrImage} alt="Magic QR" className="w-40 h-40" />
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-black rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-black rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-black rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-black rounded-br-lg" />
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">Asset by</p>
                    <div className="flex items-center gap-1">
                       <div className="w-4 h-4 bg-black rounded flex items-center justify-center">
                         <Sparkles size={8} className="text-lemon-glow" />
                       </div>
                       <span className="text-[8px] font-black text-black tracking-tighter">Limbu AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={downloadQR} className="btn-lemon py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2">
                <Download size={14} /> PNG
              </button>
              <button onClick={printQR} className="btn-ghost py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2">
                <Printer size={14} /> Print
              </button>
            </div>
          </div>

          {/* Logic & Sharing Panel */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-lemon-glow rounded-xl">
                    <MessageSquare className="text-black w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Reputation Shield</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Guard</p>
                  </div>
                </div>
                <button onClick={() => setShowDemo(true)} className="text-[9px] font-black text-lemon-hover uppercase tracking-widest hover:underline">View Logic</button>
              </div>

              <div className="space-y-3 mb-8">
                <div className="group bg-slate-50 border border-black/5 p-4 rounded-xl transition-all hover:bg-black">
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex gap-0.5">
                       {[1,2,3].map(i => <Star key={i} size={12} className="text-lemon-hover group-hover:text-lemon-glow" fill="currentColor" />)}
                     </div>
                     <span className="text-[8px] font-black bg-white/10 text-slate-400 group-hover:text-lemon-glow px-2 py-0.5 rounded-full uppercase tracking-widest">Privacy</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300 leading-relaxed">
                    Negative feedback is captured privately — protecting your public rating.
                  </p>
                </div>

                <div className="group bg-lemon-glow/5 border border-lemon-glow/10 p-4 rounded-xl transition-all hover:bg-lemon-glow">
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-lemon-hover group-hover:text-black" fill="currentColor" />)}
                     </div>
                     <span className="text-[8px] font-black bg-black/5 text-lemon-hover group-hover:text-black px-2 py-0.5 rounded-full uppercase tracking-widest">Growth</span>
                  </div>
                  <p className="text-[10px] font-medium text-lemon-hover group-hover:text-black leading-relaxed">
                    Happy customers are instantly routed to your official Google Profile.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-black/5 space-y-4">
                <div className="flex items-center gap-3">
                  <Share2 size={14} className="text-black" />
                  <span className="text-[9px] font-black text-black uppercase tracking-widest">Magic Link</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-black/5">
                  <code className="flex-1 text-[9px] font-bold text-slate-400 truncate px-2">{reviewUrl}</code>
                  <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-lg transition-all ${copied ? "bg-green-500 text-white" : "bg-white hover:bg-lemon-glow hover:text-black border border-black/5"}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <button onClick={shareLink} className="w-full btn-lemon py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Share Portal ↗
                </button>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-black rounded-3xl p-6 relative overflow-hidden shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-lemon-glow/5 rounded-full blur-3xl" />
               <div className="relative z-10 flex items-start gap-4">
                  <div className="p-2 bg-lemon-glow rounded-lg shrink-0">
                    <Zap size={14} className="text-black fill-black" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Reputation Protocol</h4>
                    <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                      Deploy this QR at point-of-sale to drive high-intent customer feedback.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {showDemo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-black/5 animate-scaleUp">
            <h2 className="text-lg font-black text-black text-center mb-6 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Reputation <span className="text-lemon-hover">Logic</span></h2>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-black/5">
                <div className="flex gap-0.5 mt-1 shrink-0">
                  {[1, 2, 3].map(n => <Star key={n} size={10} className="text-slate-300" fill="currentColor" />)}
                </div>
                <div className="flex-1">
                  <p className="font-black text-black text-[10px] uppercase tracking-tight mb-1">Low Score (1-3)</p>
                  <p className="text-[9px] font-medium text-slate-400 leading-relaxed">Feedback is intercepted and captured internally.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-lemon-glow/5 rounded-xl border border-lemon-glow/10">
                <div className="flex gap-0.5 mt-1 shrink-0">
                  {[1, 2, 3, 4, 5].map(n => <Star key={n} size={10} className="text-lemon-hover" fill="currentColor" />)}
                </div>
                <div className="flex-1">
                  <p className="font-black text-lemon-hover text-[10px] uppercase tracking-tight mb-1">High Score (4-5)</p>
                  <p className="text-[9px] font-medium text-slate-400 leading-relaxed">Direct path unlocked to Google Profile.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDemo(false)}
              className="btn-ghost w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      <SupportModal showToast={showToast} />
    </div>
  );
}
