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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div
        className="relative rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 text-white/50 hover:text-[#FDE047] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* CONTENT */}
        {isBooked ? (
          <div className="text-center py-8">
            <CheckCircle className="w-20 h-20 text-[#FDE047] mx-auto mb-6 animate-bounce" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Booked Successfully!
            </h2>
            <p className="text-white/60">We will contact you shortly.</p>
            <button
              onClick={closeModal}
              className="mt-6 text-[#FDE047] text-sm font-bold uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
              Book Your Free Demo
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-sm">
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FDE047] outline-none transition placeholder:text-white/30"
              />

              <input
                type="tel"
                name="contact"
                placeholder="Contact Number"
                value={formData.contact}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FDE047] outline-none transition placeholder:text-white/30"
              />

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Seminar Date (Mon - Sat)
                </label>
                <input
                  type="date"
                  name="selectedDate"
                  value={formData.selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 outline-none transition ${isSunday ? "border-red-500" : "focus:ring-[#FDE047]"}`}
                />

                {isSunday ? (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Seminars are closed on Sundays
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-[#FDE047] text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Time: 4:00 PM IST</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSunday}
                className="w-full px-6 py-4 bg-[#FDE047] text-black rounded-xl font-bold uppercase tracking-[0.1em] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(253,224,71,0.2)]"
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