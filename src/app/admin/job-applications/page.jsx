"use client";

import { useEffect, useState } from "react";

import { Trash2 } from "lucide-react";

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const res = await fetch("/api/admin/job-applications");
    const data = await res.json();

    if (data.success) {
      setApplications(data.applications);
    }
  };

  const filteredApplications = applications.filter((item) =>
    `${item.fullName} ${item.email} ${item.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
  const ok = confirm(
    "Are you sure you want to delete this application?"
  );

  if (!ok) return;

  const res = await fetch(
    `/api/admin/job-applications?id=${id}`,
    {
      method: "DELETE",
    }
  );

  const data = await res.json();

  if (data.success) {
    setApplications((prev) =>
      prev.filter((item) => item._id !== id)
    );
  }
};

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Job Applications
        </h1>

        <input
          type="text"
          placeholder="Search candidate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-xl px-4 py-2 w-72"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            Candidate
          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            Email
          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            Phone
          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            Job Role
          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            Resume
          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            Applied On
          </th>

          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            Action
          </th>
        </tr>
      </thead>

      <tbody>
        {filteredApplications.map((item) => (
          <tr
            key={item._id}
            className="border-b border-slate-100 hover:bg-slate-50 transition-all"
          >
            {/* Candidate */}
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {item.fullName?.charAt(0)?.toUpperCase()}
                </div>

                <div>
                  <p className="font-semibold text-slate-800">
                    {item.fullName}
                  </p>

                  
                </div>
              </div>
            </td>

            {/* Email */}
            <td className="px-6 py-4">
              <span className="text-sm text-slate-700">
                {item.email}
              </span>
            </td>

            {/* Phone */}
            <td className="px-6 py-4">
              <span className="font-medium text-slate-700">
                {item.phone}
              </span>
            </td>

            {/* Job */}
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                {item.jobTitle || "None"}
              </span>
            </td>

            {/* Resume */}
            <td className="px-6 py-4">
              <a
                href={item.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition"
              >
                📄 View Resume
              </a>
            </td>

            {/* Date */}
            <td className="px-6 py-4">
              <span className="text-sm text-slate-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </td>

            <td className="px-6 py-4">
  <button
  onClick={() => handleDelete(item._id)}
  className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
>
  <Trash2 size={18} />
</button>
</td>
          </tr>
        ))}
      </tbody>
    </table>

    {filteredApplications.length === 0 && (
      <div className="py-20 text-center">
        <div className="text-5xl mb-3">📄</div>

        <h3 className="text-lg font-semibold text-slate-700">
          No Applications Found
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          Applications will appear here automatically.
        </p>
      </div>
    )}
  </div>
</div>
    </div>
  );
}