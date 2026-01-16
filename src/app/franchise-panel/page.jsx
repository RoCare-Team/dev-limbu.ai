"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setRole(data.role));

    fetch("/api/franchise/dashboard")
      .then(res => res.json())
      .then(data => setStats(data.data));
  }, []);

  if (!stats || !role) return <p>Loading...</p>;

  return (
    <div className="space-y-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Posts" value={stats.totalPosts} />
        <StatCard title="Pending Posts" value={stats.pendingPosts} />
        <StatCard title="Approved Posts" value={stats.approvedPosts} />
      </div>

      {/* Recent Posts Table */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Posts</h2>

          {(role === "admin" || role === "franchise") && (
            <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Create Post
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Author</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {stats.recentPosts.map(post => (
                <PostRow key={post._id} post={post} role={role} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:scale-105 transition">
      <p className="text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  );
}

function PostRow({ post, role }) {
  const statusStyles = {
    "Pending": "bg-yellow-100 text-yellow-700",
    "Approved": "bg-green-100 text-green-700",
    "Rejected": "bg-red-100 text-red-700",
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-3 font-medium">{post.title}</td>
      <td className="p-3">{post.authorName}</td>
      <td className="p-3">{post.category}</td>
      <td className="p-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[post.status]}`}>
          {post.status}
        </span>
      </td>

      <td className="p-3 text-center space-x-2">
        <button className="bg-gray-200 px-3 py-1 rounded text-xs hover:bg-gray-300">
          View
        </button>

        {role === "admin" && (
          <>
            <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
              Approve
            </button>
            <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
              Reject
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
