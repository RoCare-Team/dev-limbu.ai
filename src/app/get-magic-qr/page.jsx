"use client";
import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import { 
  Star, Download, Copy, Check, Sparkles, QrCode, 
  MessageSquare, Share2, Printer, ArrowLeft,
  Phone, AlertCircle, X, Send
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PowerRedLogo from "../../../public/images/bg-logo.png"
import { toast, Toaster } from "react-hot-toast";

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
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueText, setIssueText] = useState("");

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
    // Get locality from storefrontAddress (matching MongoDB structure)
    const locality = location.storefrontAddress?.locality || location.locality || "";
    
    // Create slug for SEO-friendly URL with locality
    const slug = `${title}${locality ? `-${locality}` : ""}`
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

    // Fetch Google Review URL
    getGoogleReviewURL(firstLocation.title);

    // Create review URL with encoded data
    const finalReviewURL = createReviewUrl(firstLocation);
    setReviewUrl(finalReviewURL);

    // Generate QR code
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}`;
    setQrImage(qr);
  }, []);

  // Show support popup after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSupportPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto hide support popup after 5 seconds
  useEffect(() => {
    if (showSupportPopup) {
      const timer = setTimeout(() => {
        setShowSupportPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSupportPopup]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    
    const loadingToast = toast.loading("Submitting issue...");
    
    // Simulate API call
    setTimeout(() => {
        toast.success("Issue reported! We'll contact you shortly.", { id: loadingToast });
        setShowIssueModal(false);
        setIssueText("");
        setShowSupportPopup(false);
    }, 1500);
  };

  // Handle location change
  const handleLocationChange = (locationId) => {
    setSelectedLocationId(locationId);
    
    const selected = allLocations.find(loc => loc.locationId === locationId);
    if (!selected) return;

    const displayName = getDisplayName(selected);
    setBusiness(displayName);

    if (!selected.title) return;

    // Fetch Google Review URL for this specific location
    getGoogleReviewURL(selected.title);

    // Create review URL with encoded data
    const finalReviewURL = createReviewUrl(selected);
    setReviewUrl(finalReviewURL);

    // Generate QR code
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}`;
    setQrImage(qr);
  };

  const selectedLocation = allLocations.find(loc => loc.locationId === selectedLocationId);

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
    } catch (err) {
      console.error(err);
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
                @page {
                  size: auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  width: 100vw;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
              }
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #fff;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border-radius: 1.5rem;
              }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="bg-white shadow-xl rounded-3xl p-10 max-w-md w-full text-center border border-blue-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Connect Your Business First
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Please connect your business before accessing the review system.
          </p>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg 
                       hover:bg-blue-700 transition shadow-lg w-full font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Back button for mobile view */}
      <div className="sm:hidden fixed top-25 left-5 z-50">
        <Link href="/dashboard" passHref>
          <button
            aria-label="Go back to dashboard"
            className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg border border-gray-200 hover:scale-110 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
        </Link>
      </div>
      <Toaster />
      <div className="container mx-auto px-4 pt-20 sm:pt-12 pb-12">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-5 py-2 rounded-full text-sm font-semibold mb-4 shadow-sm">
            <Sparkles size={16} />
            <span>Smart Review System</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-800 mb-2">
            {business}
          </h1>
          {/* {selectedLocation && selectedLocation.address && (
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              {selectedLocation.address}
            </p>
          )} */}

          {allLocations.length > 1 && (
            <div className="max-w-md mx-auto mt-4 mb-4">
              <select
                value={selectedLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl 
                           text-gray-800 font-semibold shadow-sm hover:border-blue-300 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                           transition-all cursor-pointer"
              >
                {allLocations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {getDisplayName(loc)} {loc.address ? `- ${loc.address}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="text-gray-600 text-lg max-w-xl mx-auto mt-4">
            Collect feedback, grow your reputation, and guide customers effortlessly.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
                <QrCode className="text-blue-600" size={26} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Your QR Code</h2>
            </div>

           <div className="mb-8 flex justify-center">
  <div ref={qrCardRef} className="relative w-[340px] rounded-3xl overflow-hidden shadow-xl">

    {/* Google Color Background */}
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-yellow-400 rounded-br-[120px]" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500 rounded-bl-[120px]" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-green-500 rounded-tr-[120px]" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tl-[120px]" />
    </div>

    {/* White Card */}
    <div className="relative bg-white m-4 rounded-2xl p-6 text-center">

      {/* Google Logo */}
      <div className="flex justify-center mb-2">
        <span className="text-4xl font-extrabold">
          <span className="text-blue-500">G</span>
          <span className="text-red-500">o</span>
          <span className="text-yellow-500">o</span>
          <span className="text-blue-500">g</span>
          <span className="text-green-500">l</span>
          <span className="text-red-500">e</span>
        </span>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-1 text-yellow-400 mb-2">
        ★ ★ ★ ★ ★
      </div>

      {/* Heading */}
      <p className="text-sm font-semibold text-gray-700">
        Scan to Rate Us on <span className="font-bold">Google</span>
      </p>

      {/* Business Name */}
      <h3 className="text-base font-bold text-gray-900 mt-2 mb-4">
        {business}
      </h3>

      {/* QR Code Box */}
      {qrImage && (
        <div className="relative inline-block bg-white p-4 rounded-xl shadow-md">
          <img
            src={qrImage}
            alt="Google Review QR"
            className="w-52 h-52 mx-auto"
          />

          {/* Corner Accents */}
          <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
          <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
          <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg" />
          <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
        </div>
      )}

      {/* Review URL (Optional) */}
      <p className="text-[11px] text-gray-500 mt-3 break-all px-2">
        {reviewUrl}
      </p>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
        <p className="text-[10px] text-gray-500">Powered by</p>
        <Image
          src={PowerRedLogo}
          alt="LimbuAI Logo"
          width={18}
          height={18}
        />
        <p className="text-xs font-bold text-indigo-700">LimbuAI</p>
      </div>

    </div>
  </div>
</div>


            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                onClick={downloadQR}
                className="bg-blue-600 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 
                           hover:bg-blue-700 transition shadow-md font-semibold"
              >
                <Download size={20} />
                Download
              </button>
              
              <button
                onClick={printQR}
                className="bg-indigo-600 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 
                           hover:bg-indigo-700 transition shadow-md font-semibold"
              >
                <Printer size={20} />
                Print
              </button>
            </div>

            {reviewUrl && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <Share2 size={20} className="text-blue-600" />
                  <span>Share Review Link</span>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <input
                      type="text"
                      readOnly
                      value={reviewUrl}
                      className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
                    />

                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      {copied ? (
                        <Check size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} className="text-gray-600" />
                      )}
                    </button>
                  </div>

                  {copied && (
                    <p className="mt-2 flex items-center gap-2 text-green-600 text-sm font-medium">
                      <Check size={16} /> Link copied successfully!
                    </p>
                  )}
                </div>

                <button
                  onClick={shareLink}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 
                             rounded-xl flex items-center justify-center gap-2 hover:opacity-90 
                             transition-all shadow-md font-semibold"
                >
                  <Share2 size={20} />
                  Share Review Link
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl shadow-sm">
                  <MessageSquare className="text-indigo-600" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">How It Works</h2>
              </div>

              <button
                onClick={() => setShowDemo(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                View Demo
              </button>
            </div>

            <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <Star key={i} size={20} className="text-orange-500" fill="currentColor" />
                  ))}
                </div>
                <span className="font-bold text-gray-800">1–3 Stars</span>
                <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Private
                </span>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">
                Customers can share concerns privately — protecting your reputation while helping you improve.
              </p>
            </div>

            <div className="bg-green-50 p-5 rounded-xl border border-green-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={20} className="text-green-600" fill="currentColor" />
                  ))}
                </div>
                <span className="font-bold text-gray-800">4–5 Stars</span>
                <span className="ml-auto bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Public
                </span>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">
                Positive reviewers are redirected directly to your Google Profile to boost your public ratings.
              </p>
            </div>

            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 mt-6 shadow-sm">
              <p className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                🎯 QR Destination
              </p>

              <div className="bg-white rounded-lg p-3 border border-indigo-100 shadow-sm">
                <code className="text-xs text-indigo-700 break-all block">
                  {reviewUrl}
                </code>
              </div>

              <p className="text-xs text-gray-600 mt-2 flex items-center gap-2">
                <Check size={14} className="text-green-600" />
                Customers see this page when they scan your QR code.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100">
            <h2 className="text-2xl font-bold text-center mb-6">Quick Guide</h2>

            <div className="space-y-4">
              <div className="flex gap-4 items-start p-5 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map(n => (
                    <Star key={n} size={18} className="text-orange-500" fill="currentColor" />
                  ))}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 mb-1">1–3 Stars (Private)</p>
                  <p className="text-sm text-gray-600">Customer submits private feedback.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-5 bg-green-50 rounded-xl border border-green-200">
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={18} className="text-green-600" fill="currentColor" />
                  ))}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 mb-1">4–5 Stars (Public)</p>
                  <p className="text-sm text-gray-600">Redirects to Google Reviews.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDemo(false)}
              className="w-full mt-6 bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reopen Support Popup Button */}
      {!showSupportPopup && (
        <button
          onClick={() => setShowSupportPopup(true)}
          className="fixed bottom-4 right-4 z-50 bg-white p-3 rounded-full shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:scale-110 group animate-in fade-in zoom-in duration-300"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </button>
      )}

      {/* Support Popup */}
      {showSupportPopup && (
        <div className="fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-sm w-full animate-in slide-in-from-right fade-in duration-500">
          <div className="bg-white/95 backdrop-blur-md border border-blue-100 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
            <button 
              onClick={() => setShowSupportPopup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-4 items-start">
              <div className="bg-blue-50 p-3 rounded-full flex-shrink-0 animate-pulse">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Need Help?</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Facing any issues? Let us know and we'll fix it for you.
                </p>
                <div className="flex gap-2 mt-3">
                    <button 
                        onClick={() => setShowIssueModal(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
                    >
                    Report Issue
                    </button>
                    <a href="tel:9289344726" className="flex-1 inline-flex items-center justify-center gap-2 text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all whitespace-nowrap">
                        <Phone className="w-3 h-3" /> 9289344726
                    </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-50 p-3 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
                    <p className="text-sm text-gray-500">We'll help you resolve it quickly.</p>
                </div>
            </div>

            <form onSubmit={handleIssueSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe the issue</label>
                    <textarea
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                        placeholder="e.g., I cannot connect my GMB account..."
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[120px] text-sm resize-none"
                        required
                    />
                </div>
                
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowIssueModal(false)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] text-sm flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Submit Ticket
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}