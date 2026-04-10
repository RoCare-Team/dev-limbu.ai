"use client";

import { X, Calendar, CheckCircle, Clock } from "lucide-react";

export default function BookDemoModal({
  showBookDemoModal,
  setShowBookDemoModal,
  demoDetails,
  setDemoDetails,
  handleBookDemoSubmit,
  handleDemoInputChange,
  isSubmittingDemo,
  demoBooked,
}) {
  if (!showBookDemoModal) return null;

  const isSunday = demoDetails.selectedDate.getDay() === 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div
        className="relative rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowBookDemoModal(false)}
          className="absolute top-6 right-6 text-white/50 hover:text-[#FDE047] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* CONTENT */}
        {demoBooked ? (
          <div className="text-center py-8">
            <CheckCircle className="w-20 h-20 text-[#FDE047] mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Booked Successfully!
            </h2>
            <p className="text-white/60">We will contact you shortly.</p>
          </div>
        ) : isSunday ? (
          <div className="text-center py-8">
            <Calendar className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Seminars Unavailable
            </h2>
            <p className="text-white/60">
              We are closed on Sundays. Please select another day.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
              Book Your Free Demo
            </h2>

            <form onSubmit={handleBookDemoSubmit} className="space-y-5">
              {/* Inputs */}
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={demoDetails.name}
                onChange={handleDemoInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FDE047] outline-none transition placeholder:text-white/30"
              />

              <input
                type="tel"
                name="contact"
                placeholder="Contact Number"
                value={demoDetails.contact}
                onChange={handleDemoInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FDE047] outline-none transition placeholder:text-white/30"
              />

              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Seminar Date (Mon - Sat)
                </label>
                <input
                  type="date"
                  name="selectedDate"
                  value={demoDetails.selectedDate.toISOString().split("T")[0]}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setDemoDetails((prev) => ({
                      ...prev,
                      selectedDate: new Date(e.target.value),
                    }))
                  }
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FDE047] outline-none transition"
                />
                <div className="flex items-center gap-2 text-[#FDE047] text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Time: 4:00 PM IST</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmittingDemo}
                className="w-full px-6 py-4 bg-[#FDE047] text-black rounded-xl font-bold uppercase tracking-[0.1em] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(253,224,71,0.2)]"
              >
                {isSubmittingDemo ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
