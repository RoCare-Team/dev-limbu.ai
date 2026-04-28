"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminCityServices() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await axios.get("/api/admin/city-services");
      setPages(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (slug) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await axios.delete(`/api/admin/city-services/${slug}`);
      toast.success("Page deleted successfully");
      fetchPages();
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">City Service Pages</h1>
        <Link
          href="/admin/city-services/new"
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 px-4 rounded flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Page
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b">
              <th className="p-4 font-semibold">City Name</th>
              <th className="p-4 font-semibold">Slug</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page._id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium">{page.cityName}</td>
                <td className="p-4 text-slate-500">{page.citySlug}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      page.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {page.isActive ? "Active" : "Draft"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/city-services/edit/${page.citySlug}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => deletePage(page.citySlug)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">
                  No city service pages found. Create one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
