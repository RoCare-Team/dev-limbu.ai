
"use client"

import { X, Calendar, CheckCircle } from "lucide-react"

export default function BookDemoModal({
  showBookDemoModal,
  setShowBookDemoModal,
  demoDetails,
  setDemoDetails,
  handleBookDemoSubmit,
  handleDemoInputChange,
  isSubmittingDemo,
  demoBooked
}) {

  if (!showBookDemoModal) return null

  const isSunday = demoDetails.selectedDate.getDay() === 0

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">

        {/* Close Button */}
        <button
          onClick={() => setShowBookDemoModal(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
        >
          <X className="w-6 h-6" />
        </button>

        {/* SUCCESS */}
        {demoBooked ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Booked Successfully!
            </h2>
            <p className="text-slate-600">
              We will contact you shortly. The window will close automatically.
            </p>
          </div>
        ) : isSunday ? (
          /* SUNDAY CLOSED */
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Seminars Unavailable
            </h2>
            <p className="text-slate-600">
              We are closed on Sundays. Please book a demo for another day.
            </p>
          </div>
        ) : (
          /* FORM */
       <>
  <h2 className="text-2xl font-bold text-slate-800 mb-4">
    Book Your Free Demo
  </h2>

  <form onSubmit={handleBookDemoSubmit} className="space-y-4">

    {/* Name */}
    <input
      type="text"
      name="name"
      placeholder="Your Name"
      value={demoDetails.name}
      onChange={handleDemoInputChange}
      required
      className="w-full px-4 py-3 
      bg-white
      border border-slate-300 
      text-slate-800
      placeholder:text-slate-400
      rounded-lg focus:ring-2 focus:ring-neutral-500 
      outline-none transition"
    />

    {/* Phone */}
    <input
      type="tel"
      name="contact"
      placeholder="Contact Number"
      value={demoDetails.contact}
      onChange={handleDemoInputChange}
      required
      className="w-full px-4 py-3 
      bg-white
      border border-slate-300 
      text-slate-800
      placeholder:text-slate-400
      rounded-lg focus:ring-2 focus:ring-neutral-500 
      outline-none transition"
    />

    {/* Date */}
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">
        Select Seminar Date (Monday - Saturday):
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
        className="w-full px-4 py-3 
        bg-white
        border border-slate-300 
        text-slate-800
        rounded-lg focus:ring-2 focus:ring-neutral-500 
        outline-none transition"
      />

      <p className="text-sm font-medium text-slate-600 mt-2">
        Time: 4:00 PM
      </p>
    </div>

    {/* Submit */}
    <button
      type="submit"
      disabled={isSubmittingDemo}
      className="w-full px-6 py-3 
      bg-gradient-to-r from-gray-700 to-yellow-500 
      text-white rounded-lg font-bold 
      hover:shadow-lg transition-all 
      disabled:opacity-60"
    >
      {isSubmittingDemo ? "Submitting..." : "Submit Request"}
    </button>

  </form>
</>
        )}

      </div>
    </div>
  )
}
