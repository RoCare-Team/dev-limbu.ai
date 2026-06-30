"use client";

import { X, Calendar, MessageSquare, CheckCircle } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Remarks Modal).
// Behaviour is unchanged — only moved into its own component.
export default function RemarksModal({
  remarksModalUser,
  setRemarksModalUser,
  remarksInput,
  setRemarksInput,
  followUpDate,
  setFollowUpDate,
  followUpTime,
  setFollowUpTime,
  loadingRemarks,
  remarksHistory,
  handleAddRemark,
  handleDefaultRemarkClick,
  FOLLOW_UP_REMARKS,
  defaultRemarks,
}) {
  if (!remarksModalUser) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">
            Remarks History
          </h2>
          <button
            onClick={() => setRemarksModalUser(null)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Add Remark Section (Input + Button in one line) */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={remarksInput}
            onChange={(e) => setRemarksInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Type a new remark..."
          />
          <button
            onClick={handleAddRemark}
            disabled={!remarksInput.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-sm whitespace-nowrap"
          >
            Submit
          </button>
        </div>

        {/* Follow-up date picker — shown when remark requires a callback */}
        {FOLLOW_UP_REMARKS.some((r) => remarksInput.startsWith(r)) && (
          <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={13} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700">
                Schedule Follow-up
              </span>
              {followUpDate && (
                <span className="ml-auto text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold tabular-nums">
                  {new Date(
                    `${followUpDate}T${(followUpTime && /^\d{1,2}:\d{2}$/.test(followUpTime.trim()) ? followUpTime.trim() : "09:00").padStart(5, "0")}:00`,
                  ).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            {/* Quick date buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: "Today", days: 0 },
                { label: "Tomorrow", days: 1 },
                { label: "Next 7 Days", days: 7 },
                { label: "This Month", days: null },
              ].map(({ label, days }) => {
                const getDate = () => {
                  const d = new Date();
                  if (days === null) {
                    // last day of this month
                    d.setMonth(d.getMonth() + 1, 0);
                  } else {
                    d.setDate(d.getDate() + days);
                  }
                  return d.toISOString().split("T")[0];
                };
                const val = getDate();
                const isActive = followUpDate === val;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFollowUpDate(isActive ? "" : val)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                      isActive
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Custom date + time */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={followUpDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="flex-1 min-w-[8rem] text-xs border border-amber-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none bg-white"
              />
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                disabled={!followUpDate}
                className="text-xs border border-amber-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-400 outline-none bg-white disabled:opacity-40"
              />
              {followUpDate && (
                <button
                  type="button"
                  onClick={() => {
                    setFollowUpDate("");
                    setFollowUpTime("09:00");
                  }}
                  className="text-amber-500 hover:text-red-500 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Default Remarks */}
        <div className="flex flex-wrap gap-2 mb-3">
          {defaultRemarks.map((remark, idx) => (
            <button
              key={idx}
              onClick={() => handleDefaultRemarkClick(remark)}
              className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-gray-200"
            >
              {remark}
            </button>
          ))}
        </div>

        {/* Remarks List */}
        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
          {loadingRemarks ? (
            <div className="text-center py-6 text-gray-500 text-xs">
              Loading history...
            </div>
          ) : !remarksHistory || remarksHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs flex flex-col items-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <MessageSquare size={20} className="mb-1 opacity-20" />
              No remarks found
            </div>
          ) : (
            remarksHistory
              .slice()
              .reverse()
              .map((r, idx) => {
                const isLatest = idx === 0;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all shadow-sm
                      ${
                        isLatest
                          ? "bg-green-50 border-green-300"
                          : "bg-white border-gray-200"
                      }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-600">
                        Remark
                      </span>

                      {isLatest && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500 text-white font-bold">
                          Latest
                        </span>
                      )}
                    </div>

                    {/* Remark Text */}
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {r.text}
                    </p>

                    {r.messageSent && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle
                          size={12}
                          className="text-green-500"
                        />
                        <span className="text-[10px] text-green-600 font-medium">
                          Message Sent
                        </span>
                      </div>
                    )}

                    {r.followUpDate && (
                      <div className="flex items-center gap-1 mt-1 bg-amber-50 rounded-lg px-2 py-0.5 w-fit">
                        <Calendar size={10} className="text-amber-500" />
                        <span className="text-[10px] text-amber-700 font-semibold">
                          Follow-up:{" "}
                          {new Date(r.followUpDate).toLocaleString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-[9px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                      <Calendar size={9} />
                      {new Date(r.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
