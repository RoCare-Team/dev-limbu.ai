"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportIssueWidget({ showToast }) {
  const router = useRouter();
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isAutoOpened, setIsAutoOpened] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [adminResponse, setAdminResponse] = useState(null);

  // Auto open popup after 5 sec
  useEffect(() => {
    const popupTimer = setTimeout(() => {
      setShowSupportPopup(true);
      setIsAutoOpened(true);
    }, 5000);

    return () => clearTimeout(popupTimer);
  }, []);

  

  // Auto close popup
  useEffect(() => {
    if (showSupportPopup && isAutoOpened) {
      const timer = setTimeout(() => {
        setShowSupportPopup(false);
        setIsAutoOpened(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSupportPopup, isAutoOpened]);

  // 🔽 Fetch Admin Response (GET API)
  const fetchAdminResponse = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      if (!userId) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/issue-check?userId=${userId}`);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        setAdminResponse(data.data[0]); // latest issue
      }
    } catch (error) {
      console.error("Failed to fetch admin response");
    }
  };

  // Fetch response when popup opens
  useEffect(() => {
    if (showSupportPopup) {
      fetchAdminResponse();
    }
  }, [showSupportPopup]);

  // 🔼 Submit Issue (POST API)
const handleIssueSubmit = async () => {
  if (!issueText.trim()) {
    showToast("Please enter your issue", "warning");
    return;
  }

  const userId = localStorage.getItem("userId");

  // 🔴 If user not logged in → redirect
  if (!userId) {
    showToast("Please login to report an issue", "warning");
    router.push("/login");
    return;
  }

  try {
    showToast("Submitting issue...", "info");

    const res = await fetch("/api/issue-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        issue: issueText,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    showToast("Issue reported successfully", "success");

    setIssueText("");
    setShowIssueModal(false);
    setShowSupportPopup(true);

    fetchAdminResponse(); // refresh data
  } catch (error) {
    showToast("Failed to submit issue", "error");
  }
};


  return (
    <>
      {/* Floating Button */}
      {!showSupportPopup && (
        <button
          onClick={() => {
            setShowSupportPopup(true);
            setIsAutoOpened(false);
          }}
          className="fixed bottom-4 right-4 z-50 bg-white p-3 rounded-full shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:scale-110 mb-20"
        >
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </button>
      )}

      {/* Support Popup */}
      {showSupportPopup && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
          <div className="bg-white border border-blue-100 p-5 rounded-2xl shadow-2xl relative">

            <button 
              onClick={() => setShowSupportPopup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-gray-900 text-sm mb-1">Support Update</h3>

            {/* Admin Response Section */}
            {adminResponse ? (
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-700 mt-2">
                <p><strong>Status:</strong> {adminResponse.status}</p>
                <p className="mt-1">
                  <strong>Admin:</strong>{" "}
                  {adminResponse.adminResponse || 
                   "Our team is reviewing your issue. We'll update you soon."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-600 mt-2">
                Thanks for reaching out!  
                Our support team will contact you shortly. 😊
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowIssueModal(true)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
              >
                Report New Issue
              </button>

              <a 
                href="tel:9289344726"
                className="flex-1 text-blue-700 bg-blue-50 border px-3 py-2 rounded-lg text-xs font-bold text-center"
              >
                <Phone className="inline w-3 h-3" /> Call Support
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-5 w-[90%] max-w-sm">
            <h3 className="font-bold mb-2">Report Issue</h3>

            <textarea
              className="w-full border p-2 rounded-md text-sm"
              rows="4"
              placeholder="Describe your issue..."
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-3 py-1 text-sm border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleIssueSubmit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
