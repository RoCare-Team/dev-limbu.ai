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
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Create Franchise
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Franchise Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Franchise Name
          </label>
          <input
            type="text"
            name="franchiseName"
            value={form.franchiseName}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Limbu Telecom"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Owner Name
          </label>
          <input
            type="text"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Robin Khan"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2"
            placeholder="9876543210"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2"
            placeholder="franchise@email.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2"
            placeholder="••••••"
          />
        </div>

        {/* Messages */}
        {message && (
          <p className="text-green-600 text-sm text-center">{message}</p>
        )}
        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Franchise"}
        </button>
      </form>
    </div>
  );
}
