"use client";

import { X } from "lucide-react";

// Extracted verbatim from user-management/page.jsx (Reported Issues modal).
// Behaviour is unchanged — only moved into its own component.
export default function IssuesModal({ showIssuesModal, setShowIssuesModal, issues }) {
  if (!showIssuesModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-5xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Reported Issues
          </h2>
          <button
            onClick={() => setShowIssuesModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.map((issue, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(issue.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    <div>{issue.fullName || "Unknown"}</div>
                    <div className="text-xs text-gray-500">
                      {issue.mobile}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                    {issue.issue}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        issue.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {issue.status || "open"}
                    </span>
                  </td>
                </tr>
              ))}
              {issues.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No issues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
