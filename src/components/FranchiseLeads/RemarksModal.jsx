"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function RemarksModal({
  user,
  onClose,
  remarksHistory = [],
  setRemarksHistory,
  setUsers, // 👈 ADD THIS
  setRemarksUser,
  showToast,
  getAuthHeaders,
}) {
  const authHeaders = () =>
    typeof getAuthHeaders === "function" ? getAuthHeaders() : {};
  const [remarksInput, setRemarksInput] = useState("");

  const defaultRemarks = [
    "Call Not Picked",
    "Not Interested",
    "Interested",
    "Call Back Later",
    "Wrong Number",
    "Switch Off",
    "Meeting Scheduled",
  ];

  const handleAddRemark = async () => {
    // console.log("CLICKED SUBMIT");
    const userId = user?._id || user?.userId;

    if (!userId) {
      console.error("User ID missing");
      return;
    }

    if (!remarksInput.trim()) {
      console.error("Input empty");
      return;
    }
    try {
      // console.log("API CALL START");

      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          userId,
          remark: remarksInput,
        }),
      });

      const data = await res.json();
      // console.log("API RESPONSE", data);
      if (data.success) {
        const updatedUser = data.user;

        // ✅ users list update
        setUsers((prev) =>
          prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)),
        );

        setRemarksHistory(updatedUser.remarksHistory);
        setRemarksUser(updatedUser);

        setRemarksInput("");
        showToast("Remark added successfully");
        // console.log("CLOSING MODAL");
        onClose();
      }
    } catch (err) {
      console.error("ERROR AA GAYA:", err);
    }
  };

  if (!user) return null;

  const handleDeleteRemark = async (remarkId, remarkText) => {
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          userId: user._id,
          remarkId,
          action: "delete",
        }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ parent + modal update
        setUsers((prev) =>
          prev.map((u) => (u._id === data.user._id ? data.user : u)),
        );

        setRemarksUser(data.user);

        // ✅ toast message (with name)
        showToast(`Remark "${remarkText}" deleted 🗑️`);

        // ✅ modal close
        onClose();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // console.log("REMARKS:", remarksHistory);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between mb-3">
          <h2 className="font-bold text-dark">Remarks History</h2>
          <button className="text-dark" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-3">
          <input
            value={remarksInput}
            onChange={(e) => setRemarksInput(e.target.value)}
            className="flex-1 border p-2 rounded-md text-dark"
            placeholder="Type remark..."
          />
          <button
            type="submit"
            onClick={() => {
              // console.log("BUTTON CLICKED");
              handleAddRemark();
            }}
            className="bg-dark text-white px-4 py-2 rounded-md bg-gray-800"
          >
            Submit
          </button>
        </div>

        {/* Default buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {defaultRemarks.map((r, i) => (
            <button
              key={i}
              onClick={() => setRemarksInput(r)}
              className="text-xs text-dark bg-gray-100 px-2 py-2 rounded-md border border-gray-400"
            >
              {r}
            </button>
          ))}
        </div>

        {/* History */}
        <div className="max-h-[250px] overflow-y-auto">
          {remarksHistory.length === 0 ? (
            <p className="text-center text-gray-400 text-sm text-dark">
              No remarks found
            </p>
          ) : (
            remarksHistory
              .slice()
              .reverse()
              .map((item) => (
                <div
                  key={item._id}
                  className="border p-4  bg-gray-100 rounded-xl mb-2 flex justify-between items-start text-dark"
                >
                  <div>
                    <p className="text-md   font-medium">{item.text}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteRemark(item._id, item.text)}
                    className="bg-red-200 p-2 pl-3 pr-3 rounded-xl  text-red-500 text-xs hover:underline mt-1 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
