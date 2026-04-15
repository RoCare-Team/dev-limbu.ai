"use client";

import { useState } from "react";

export default function CreateFranchise() {
  const [form, setForm] = useState({
    franchiseName: "",
    ownerName: "",
    mobileNumber: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/franchise-panel/create-franchise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setMessage(
        `Franchise created successfully. Code: ${data.data.franchiseCode}`
      );

      setForm({
        franchiseName: "",
        ownerName: "",
        mobileNumber: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    


    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">

  <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-10 border border-gray-200 relative overflow-hidden">

    {/* Top Accent */}
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-black via-gray-700 to-black"></div>

    {/* Heading */}
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800">
        Create Franchise
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Add new franchise details below
      </p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Franchise Name */}
        <div className="relative">
          <input
            type="text"
            name="franchiseName"
            value={form.franchiseName}
            onChange={handleChange}
            required
            placeholder=" "
            className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
            Franchise Name
          </label>
        </div>

        {/* Owner Name */}
        <div className="relative">
          <input
            type="text"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            required
            placeholder=" "
            className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
            Owner Name
          </label>
        </div>

        {/* Mobile */}
        <div className="relative">
          <input
            type="tel"
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleChange}
            required
            placeholder=" "
            className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
            Mobile Number
          </label>
        </div>

        {/* Email */}
        <div className="relative">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder=" "
            className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
            Email Address
          </label>
        </div>

        {/* Password full width */}
        <div className="relative md:col-span-2">
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder=" "
            className="peer w-full px-4 pt-5 pb-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none"
          />
          <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs transition-all">
            Password
          </label>
        </div>

      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm text-center py-2 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-white bg-black hover:bg-gray-900 transition duration-300 flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        )}
        {loading ? "Creating..." : "Create Franchise"}
      </button>

    </form>
  </div>
</div>
  );
}
