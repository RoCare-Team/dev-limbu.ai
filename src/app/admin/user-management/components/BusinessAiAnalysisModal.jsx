"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Loader2, RefreshCw, Building2 } from "lucide-react";
import BusinessAiAnalysisPanel from "./BusinessAiAnalysisPanel";

/**
 * Read-only view of a lead's saved AI sales analysis, opened from the
 * "AI Analysis" button in the user-management table.
 */
export default function BusinessAiAnalysisModal({
  aiAnalysisModalUser,
  setAiAnalysisModalUser,
  showToast,
}) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [business, setBusiness] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysedAt, setAnalysedAt] = useState(null);

  const open = !!aiAnalysisModalUser;
  const userId = aiAnalysisModalUser?.userId;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);
    setAnalysis(null);
    setBusiness(null);
    setAnalysedAt(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/admin/business-report/ai-analysis?userId=${encodeURIComponent(userId)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) {
          showToast?.(data.error || "Analysis load nahi hua", "error");
          return;
        }
        setBusiness(data.business || null);
        setAnalysis(data.aiAnalysis || null);
        setAnalysedAt(data.aiAnalysedAt || null);
      } catch {
        if (!cancelled) showToast?.("Analysis load nahi hua", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `showToast` is recreated every render upstream — depending on it here
    // would re-trigger the fetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!open) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/business-report/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          placeId: business?.placeId || undefined,
          force: true,
          adminEmail:
            typeof window !== "undefined"
              ? localStorage.getItem("email") || ""
              : "",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast?.(data.error || "AI analysis fail ho gaya", "error");
        return;
      }
      setAnalysis(data.aiAnalysis);
      setAnalysedAt(data.aiAnalysedAt);
      showToast?.("Nayi AI analysis ready hai", "success");
    } catch {
      showToast?.("AI analysis ke dauran kuch galat ho gaya", "error");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">AI Sales Analysis</h3>
              <p className="text-xs text-gray-500 truncate">
                {aiAnalysisModalUser.fullName || userId}
                {business?.displayName && (
                  <span className="inline-flex items-center gap-1 ml-1 text-gray-400">
                    <Building2 size={11} /> {business.displayName}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiAnalysisModalUser(null)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-violet-600">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm font-semibold text-gray-600">
                Analysis load ho rahi hai...
              </p>
            </div>
          ) : analysis ? (
            <BusinessAiAnalysisPanel
              analysis={analysis}
              analysedAt={analysedAt}
              businessName={
                business?.displayName || business?.searchedBusinessName || ""
              }
              showToast={showToast}
            />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">
              Is lead ki abhi koi AI analysis nahi hai. Business Report modal se
              business select karke analysis generate kijiye.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={() => setAiAnalysisModalUser(null)}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {refreshing ? "Analysing..." : "Re-run Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}
