"use client";

import { useState } from "react";
import { X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore"; // Adjust path to your store file

export default function BookDemoModal() {
  // --- Zustand Store ---
  const { isModalOpen, setModalOpen } = useAuthStore();

  // --- Internal Form State ---
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    selectedDate: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState("");

  // Only render if store says it's open
  if (!isModalOpen) return null;

  // --- Logic ---
  const selectedDateObj = new Date(formData.selectedDate);
  const isSunday = selectedDateObj.getDay() === 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleBookDemoSubmit = async (e) => {
    e.preventDefault();

    if (isSunday) {
      setError("We are closed on Sundays. Please pick another date.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/bookDemo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.contact,
          seminarTime: "4:00 PM IST",
          selectedDate: formData.selectedDate,
          status: "Not Attended",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsBooked(true);
      } else {
        setError(result.message || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close and reset internal state
  const closeModal = () => {
    setModalOpen(false); // Close via Zustand
    // Reset internal local state after animation
    setTimeout(() => {
      setIsBooked(false);
      setError("");
      setFormData({
        name: "",
        contact: "",
        selectedDate: new Date().toISOString().split("T")[0],
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CONTENT */}
        {isBooked ? (
          <div className="text-center py-8">
            <CheckCircle className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Booked Successfully!
            </h2>
            <p className="text-slate-500">We will contact you shortly.</p>
            <button
              onClick={closeModal}
              className="mt-6 text-yellow-600 text-sm font-bold uppercase tracking-widest hover:text-yellow-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
              Book Your Free Demo
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleBookDemoSubmit} className="space-y-5">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition placeholder:text-slate-400"
              />

              <input
                type="tel"
                name="contact"
                placeholder="Contact Number"
                value={formData.contact}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition placeholder:text-slate-400"
              />

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Seminar Date (Mon - Sat)
                </label>
                <input
                  type="date"
                  name="selectedDate"
                  value={formData.selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 outline-none transition ${isSunday ? "border-red-400 focus:ring-red-400" : "focus:border-yellow-400 focus:ring-yellow-400"}`}
                />

                {isSunday ? (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Seminars are closed on
                    Sundays
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Time: 4:00 PM IST</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSunday}
                className="w-full px-6 py-4 bg-yellow-400 text-slate-900 rounded-xl font-bold uppercase tracking-[0.1em] hover:bg-yellow-500 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
