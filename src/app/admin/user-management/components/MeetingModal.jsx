"use client";

import { X } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Meeting Schedule Modal).
// Behaviour is unchanged — only moved into its own component.
export default function MeetingModal({
  showMeetingModal,
  setShowMeetingModal,
  meetingData,
  setMeetingData,
  handleMeetingSubmit,
}) {
  if (!showMeetingModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Schedule Meeting</h2>
          <button
            onClick={() => setShowMeetingModal(false)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Date & Time
            </label>
            <input
              type="datetime-local"
              value={meetingData.date}
              onChange={(e) =>
                setMeetingData({ ...meetingData, date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Link
            </label>
            <input
              type="text"
              placeholder="https://zoom.us/..."
              value={meetingData.link}
              onChange={(e) =>
                setMeetingData({ ...meetingData, link: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting ID
            </label>
            <input
              type="text"
              placeholder="Meeting ID"
              value={meetingData.meetingId}
              onChange={(e) =>
                setMeetingData({
                  ...meetingData,
                  meetingId: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passcode (Optional)
            </label>
            <input
              type="text"
              placeholder="123456"
              value={meetingData.passcode}
              onChange={(e) =>
                setMeetingData({
                  ...meetingData,
                  passcode: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={handleMeetingSubmit}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
          >
            Schedule & Send
          </button>
        </div>
      </div>
    </div>
  );
}
