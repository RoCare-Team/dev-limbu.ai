"use client";

import { Phone, X, Clock, User } from "lucide-react";

/**
 * Popup when a scheduled follow-up time is reached (user + franchise flows).
 */
export default function FollowUpDueAlertModal({ alert, onDismiss, onVoiceCall }) {
  if (!alert) return null;

  const { name, phone, followUpDate, kind } = alert;
  const when = followUpDate
    ? new Date(followUpDate).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const canCall = Boolean(phone && typeof onVoiceCall === "function");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fu-due-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-indigo-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 id="fu-due-title" className="text-lg font-bold leading-tight">
                Follow-up time
              </h2>
              <p className="text-sm text-white/90 mt-0.5">
                {kind === "franchise" ? "Franchise lead" : "User"} — call now
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 rounded-lg hover:bg-white/15 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100">
            <User className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                Contact
              </p>
              <p className="text-base font-bold text-gray-900 truncate">
                {name || "Unknown"}
              </p>
              {when && (
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Scheduled: {when}
                </p>
              )}
              {phone && (
                <p className="text-sm font-mono text-gray-700 mt-1">{phone}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {canCall && (
              <button
                type="button"
                onClick={() => {
                  onVoiceCall(phone);
                  onDismiss();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Voice call
              </button>
            )}
            {phone && !canCall && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Dial
              </a>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
