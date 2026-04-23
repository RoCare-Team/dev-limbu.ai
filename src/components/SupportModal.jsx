"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { MessageSquare, X, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

// Hardcoded constants moved outside to prevent re-creation
const CONTACT_NUMBER = "9289344726";
const WHATSAPP_LINK = "https://wa.me/919289344726";
const AUTO_OPEN_DELAY = 5000;
const AUTO_CLOSE_DELAY = 5000;

const SupportModal = memo(({ showToast }) => {
  const router = useRouter();
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [adminResponse, setAdminResponse] = useState(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  // 🔽 Fetch Admin Response (GET API)
  const fetchAdminResponse = useCallback(async () => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) return;

    try {
      setIsLoadingResponse(true);
      const res = await fetch(`/api/issue-check?userId=${userId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAdminResponse(data.data[0]); // Latest issue
      }
    } catch (error) {
      console.error("Support Center: Failed to fetch admin response");
    } finally {
      setIsLoadingResponse(false);
    }
  }, []);

  // Timer logic for auto-show and auto-hide
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowSupportPopup(true);
      setIsAutoOpened(true);
    }, AUTO_OPEN_DELAY);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    let hideTimer;
    if (showSupportPopup && isAutoOpened) {
      hideTimer = setTimeout(() => {
        setShowSupportPopup(false);
        setIsAutoOpened(false);
      }, AUTO_CLOSE_DELAY);
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [showSupportPopup, isAutoOpened]);

  // Fetch updates when popup is visible
  useEffect(() => {
    if (showSupportPopup) {
      fetchAdminResponse();
    }
  }, [showSupportPopup, fetchAdminResponse]);

  // 🔼 Submit Issue (POST API)
  const handleIssueSubmit = useCallback(async () => {
    if (!issueText.trim()) {
      showToast?.("Please enter your issue", "warning");
      return;
    }

    const userId = localStorage.getItem("userId");
    const fullName = localStorage.getItem("fullName");
    const mobile = localStorage.getItem("mobileNumber");

    if (!userId) {
      showToast?.("Please login to report an issue", "warning");
      router.push("/login");
      return;
    }

    try {
      showToast?.("Submitting issue...", "info");

      const res = await fetch("/api/issue-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName,
          mobile,
          issue: issueText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      showToast?.("Issue reported successfully", "success");
      setIssueText("");
      setShowIssueModal(false);
      setShowSupportPopup(true);

      fetchAdminResponse();
    } catch (error) {
      showToast?.(error.message || "Failed to submit issue", "error");
    }
  }, [issueText, router, showToast, fetchAdminResponse]);

  const openManualPopup = useCallback(() => {
    setShowSupportPopup(true);
    setIsAutoOpened(false);
  }, []);

  const closePopup = useCallback(() => {
    setShowSupportPopup(false);
    setIsAutoOpened(false);
  }, []);

  return (
    <>
      {/* Floating Button */}
      {!showSupportPopup && !showIssueModal && (
        <button
          onClick={openManualPopup}
          className="fixed bottom-28 right-4 z-50 bg-black text-yellow-400 p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all active:scale-95 border border-yellow-400/20"
          title="Support Center"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Support Popup */}
      {showSupportPopup && (
        <div className="fixed bottom-28 right-4 z-50 max-w-sm w-full animate-slideInUp">
          <div className="bg-white border border-black/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16" />

            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <MessageSquare className="w-4 h-4 text-black" />
              </div>
              <h3 className="font-black text-black text-sm uppercase tracking-widest">
                Support Center
              </h3>
            </div>

            {isLoadingResponse ? (
              <div className="py-4 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase animate-pulse">Checking for updates...</p>
              </div>
            ) : adminResponse ? (
              <div className="bg-slate-50 border border-black/5 p-4 rounded-2xl text-xs text-black mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full ${adminResponse.status === "Resolved" ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
                  />
                  <p className="font-black uppercase tracking-widest text-[10px]">
                    Status: {adminResponse.status}
                  </p>
                </div>
                <div className="font-semibold leading-relaxed text-slate-600">
                  <strong className="text-black uppercase text-[10px] tracking-widest block mb-1">
                    Response:
                  </strong>
                  {adminResponse.adminResponse || "Our team is working on your request."}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-400/5 border border-yellow-400/10 p-4 rounded-2xl mt-2">
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Need help? Our experts are here to assist you with your business listings. 🚀
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => setShowIssueModal(true)}
                className="btn-lemon w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Report Issue ↗
              </button>

              <a
                href={`tel:${CONTACT_NUMBER}`}
                className="btn-ghost w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center"
              >
                <Phone className="inline w-3 h-3 mr-2" /> Direct Call
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 w-full max-w-md shadow-2xl border border-black/5 animate-scaleUp">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-black rounded-2xl">
                <MessageSquare className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                Report <span className="text-yellow-500">Issue</span>
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Issue Details
                </label>
                <textarea
                  className="input w-full min-h-[120px] resize-none"
                  placeholder="Tell us what's happening..."
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="btn-ghost flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  Cancel
                </button>

                <button
                  onClick={handleIssueSubmit}
                  className="btn-lemon flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg"
                >
                  Submit ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-10 right-4 z-50 w-14 h-14 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 hover:rotate-6"
        aria-label="Chat on WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-7 h-7 fill-white">
          <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z" />
        </svg>
      </a>
    </>
  );
});

SupportModal.displayName = "SupportModal";

export default SupportModal;
