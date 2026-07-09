"use client";

import { useEffect, useState } from "react";
import {
  X,
  Search,
  FileText,
  Send,
  Download,
  MapPin,
  Star,
  Phone,
  Globe2,
  CheckCircle,
  Loader2,
} from "lucide-react";

// "Generate Report" flow: search Google Places by business + city, pick one,
// generate a Limbu-watermarked PDF (saved to DB + S3), then send it on WhatsApp.
export default function GenerateReportModal({
  reportModalUser,
  setReportModalUser,
  showToast,
  onReportGenerated,
}) {
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [cached, setCached] = useState(false);

  const open = !!reportModalUser;

  useEffect(() => {
    if (!reportModalUser) return;
    // Prefill from existing report or user fields.
    setBusinessName(
      reportModalUser.businessReport?.businessName ||
        reportModalUser.businessListings?.[0]?.title ||
        reportModalUser.fullName ||
        "",
    );
    setCity(reportModalUser.businessReport?.city || "");
    setResults([]);
    setSelectedIdx(null);
    setPdfUrl(reportModalUser.businessReport?.pdfUrl || "");
    setCached(false);
  }, [reportModalUser]);

  if (!open) return null;

  const userId = reportModalUser.userId;

  const placeName = (p) => p?.displayName?.text || p?.displayName || "Unknown";

  const handleSearch = async () => {
    if (!businessName.trim() || !city.trim()) {
      showToast?.("Business name and city are required", "error");
      return;
    }
    setSearching(true);
    setResults([]);
    setSelectedIdx(null);
    try {
      const res = await fetch("/api/admin/business-report/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, businessName, city }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast?.(data.error || "Search failed", "error");
        return;
      }
      setResults(data.places || []);
      setCached(!!data.cached);
      if (data.cached && data.pdfUrl) setPdfUrl(data.pdfUrl);
      if ((data.places || []).length === 1) setSelectedIdx(0);
      if (!(data.places || []).length) {
        showToast?.("No businesses found", "error");
      } else if (data.cached) {
        showToast?.("Showing cached data (within 10 days)", "success");
      }
    } catch (e) {
      showToast?.("Something went wrong while searching", "error");
    } finally {
      setSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedIdx == null || !results[selectedIdx]) {
      showToast?.("Please select a business", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/business-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          place: results[selectedIdx],
          businessName,
          city,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast?.(data.error || "Failed to generate report", "error");
        return;
      }
      setPdfUrl(data.pdfUrl);
      onReportGenerated?.(userId, data.pdfUrl);
      showToast?.(
        data.cached ? "Using existing report (within 10 days)" : "Report generated",
        "success",
      );
    } catch (e) {
      showToast?.("Something went wrong while generating", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/business-report/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast?.(data.error || "Failed to send on WhatsApp", "error");
        return;
      }
      showToast?.("Report sent on WhatsApp", "success");
    } catch (e) {
      showToast?.("Something went wrong while sending", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Generate Business Report
              </h3>
              <p className="text-xs text-gray-500">
                {reportModalUser.fullName || reportModalUser.userId}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReportModalUser(null)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto">
          {/* Search inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Ankit Mobiles"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Narnaul"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70"
          >
            {searching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {searching ? "Searching..." : "Search"}
          </button>

          {cached && (
            <p className="mt-2 text-xs text-amber-600 font-medium">
              Showing cached data — Google is hit only once every 10 days per
              user.
            </p>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Select a business
              </p>
              {results.map((p, idx) => (
                <button
                  key={p.id || idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedIdx === idx
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                        {placeName(p)}
                        {selectedIdx === idx && (
                          <CheckCircle size={14} className="text-indigo-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {p.formattedAddress || "—"}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        {p.rating != null && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Star size={11} className="fill-amber-500" />
                            {p.rating} ({p.userRatingCount || 0})
                          </span>
                        )}
                        {p.nationalPhoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} /> {p.nationalPhoneNumber}
                          </span>
                        )}
                        {p.websiteUri && (
                          <span className="flex items-center gap-1 truncate max-w-[140px]">
                            <Globe2 size={11} /> {p.websiteUri}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Generated PDF actions */}
          {pdfUrl && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-800 font-medium truncate">
                  Report ready
                </span>
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 hover:bg-emerald-100"
              >
                <Download size={14} /> View / Download
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={() => setReportModalUser(null)}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || selectedIdx == null}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            {generating ? "Generating..." : "Generate PDF"}
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={sending || !pdfUrl}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {sending ? "Sending..." : "Send on WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
