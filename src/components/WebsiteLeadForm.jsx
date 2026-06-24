"use client";

import { useState } from "react";

/**
 * Contact / inquiry form for the live generated website.
 * Saves the submission to /api/website-leads and (optionally) opens WhatsApp.
 */
export default function WebsiteLeadForm({
  slug,
  services = [],
  whatsappUrl = "#",
  primary = "#3E4E50",
}) {
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.target;
    const fd = new FormData(formEl);

    const payload = {
      slug,
      name: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      service: fd.get("service"),
      message: fd.get("message"),
    };

    if (!payload.name || !payload.phone) {
      setError("Please enter your name and phone number.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setError("");

    try {
      const res = await fetch("/api/website-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to submit");
      }

      setStatus("success");
      formEl.reset();

      // Also forward the enquiry to WhatsApp if a number is available
      if (whatsappUrl && whatsappUrl !== "#") {
        const msg =
          `Hi! I'm interested in your services.%0A%0A` +
          `Name: ${payload.name}%0A` +
          `Phone: ${payload.phone}%0A` +
          `Email: ${payload.email || ""}%0A` +
          `Service: ${payload.service || ""}%0A` +
          `Message: ${payload.message || ""}`;
        const sep = whatsappUrl.includes("?") ? "&" : "?";
        window.open(`${whatsappUrl}${sep}text=${msg}`, "_blank");
      }
    } catch (err) {
      console.error("Lead submit error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-16">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${primary}15` }}
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke={primary}
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h4 className="text-2xl font-black text-gray-900 mb-2">Thank you!</h4>
        <p className="text-gray-600">
          Your enquiry has been received. We&apos;ll get back to you shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 underline font-semibold"
          style={{ color: primary }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        required
        placeholder="Full Name"
        className="w-full px-6 py-5 bg-gray-50 border-1 rounded-2xl focus:bg-white transition-all outline-none"
      />
      <div className="grid md:grid-cols-2 gap-6">
        <input
          type="tel"
          name="phone"
          required
          placeholder="Phone"
          className="w-full px-6 py-5 bg-gray-50 border-1 rounded-2xl focus:bg-white outline-none"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full px-6 py-5 bg-gray-50 border-1 rounded-2xl focus:bg-white outline-none"
        />
      </div>
      <select
        name="service"
        className="w-full px-6 py-5 bg-gray-50 border-2 rounded-2xl focus:bg-white outline-none appearance-none"
      >
        <option value="">Select Service</option>
        {services?.map((s, i) => (
          <option key={i} value={s.title}>
            {s.title}
          </option>
        ))}
        <option value="Other">Other</option>
      </select>
      <textarea
        name="message"
        rows={4}
        placeholder="Your Requirements..."
        className="w-full px-6 py-5 bg-gray-50 border-2 rounded-2xl focus:bg-white outline-none resize-none"
      />

      {status === "error" && error && (
        <p className="text-red-500 text-sm font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full py-6 rounded-2xl text-white font-black text-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: primary }}
      >
        {status === "saving" ? "Submitting..." : "Submit Requirement"}
      </button>
    </form>
  );
}
