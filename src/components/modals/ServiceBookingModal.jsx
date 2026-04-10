

"use client"

import { X, CheckCircle } from "lucide-react"

export default function ServiceBookingModal({
  showServiceModal,
  setShowServiceModal,
  selectedPlan,
  bookingSuccess,
  serviceForm,
  setServiceForm,
  handleServicePayment
}) {

  if (!showServiceModal || !selectedPlan) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">

      <div className="relative bg-white border border-black/5 rounded-lg sm:rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Subtle background grid ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />

        {/* Ambient Glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-40 h-40 z-0 opacity-10"
          style={{
            background: "radial-gradient(circle at top right, var(--lemon-glow) 0%, transparent 70%)",
          }}
        />

        {/* Close Button (Fixed) */}
        <button
          onClick={() => setShowServiceModal(false)}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 bg-white rounded-xl text-slate-400 hover:text-black hover:bg-slate-50 transition-all z-20 shadow-sm border border-black/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto custom-scroll relative z-10 flex-1 w-full p-6 sm:p-10">
          
          {/* SUCCESS STATE */}
          {bookingSuccess ? (
            <div className="text-center py-10 px-6 rounded-3xl bg-green-50/50 border border-green-500/20 shadow-inner flex flex-col items-center justify-center h-full min-h-[350px]">

              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6 shadow-sm animate-bounce">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-xl font-black text-black mb-2 uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                Booking Confirmed
              </h2>

              <p className="text-slate-500 text-[11px] mb-4 font-bold leading-relaxed">
                Your service has been <span className="text-green-600">successfully processed</span>.
              </p>

              <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black">
                Our team will contact you shortly.
              </p>

              <div className="mt-8 inline-block bg-green-500/10 border border-green-500/20 text-green-700 text-[9px] uppercase tracking-widest font-black px-5 py-2 rounded-xl">
                Payment Verified
              </div>

            </div>
          ) : (
            <div>
              {/* Heading */}
              <div className="mb-6 sm:mb-8 text-center pt-6 sm:pt-0">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-black/5 bg-slate-50 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                  <span className="text-[8px] font-black tracking-widest uppercase text-slate-500">Secure Checkout</span>
                </div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  Book <span className="text-lemon-hover block mt-1">{selectedPlan.title}</span>
                </h2>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-black/5 mb-6 sm:mb-8 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Base Price</span>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold">
                      <span>{selectedPlan.price.toLocaleString()}</span>
                      <span className="mx-1.5 text-slate-300">+</span>
                      <span className="text-lemon-hover">{selectedPlan.gstAmount.toLocaleString()}</span>
                      <span className="ml-1 text-[7px] sm:text-[8px] uppercase tracking-widest">(GST)</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Total Due
                    </span>
                    <span className="text-lg sm:text-xl font-black text-black tracking-tighter" style={{ fontFamily: "var(--font-heading)" }}>
                      {selectedPlan.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5">
                  <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold leading-relaxed italic">
                    {selectedPlan.subtitle}
                  </p>
                </div>
              </div>

              {/* FORM */}
              <form onSubmit={handleServicePayment} className="space-y-3 sm:space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 sm:mb-1.5 uppercase tracking-widest pl-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs font-bold bg-white text-black border border-black/10 rounded-xl focus:ring-2 focus:ring-lemon-glow focus:border-lemon-hover outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 sm:mb-1.5 uppercase tracking-widest pl-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={serviceForm.phone}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs font-bold bg-white text-black border border-black/10 rounded-xl focus:ring-2 focus:ring-lemon-glow focus:border-lemon-hover outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 sm:mb-1.5 uppercase tracking-widest pl-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={serviceForm.email}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs font-bold bg-white text-black border border-black/10 rounded-xl focus:ring-2 focus:ring-lemon-glow focus:border-lemon-hover outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="Enter your email"
                  />
                </div>

                {/* GST */}
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 sm:mb-1.5 uppercase tracking-widest pl-1">
                    GST Number <span className="text-slate-300 normal-case">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={serviceForm.gstNumber}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, gstNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs font-bold bg-white text-black border border-black/10 rounded-xl focus:ring-2 focus:ring-lemon-glow focus:border-lemon-hover outline-none transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="Enter GST number"
                  />
                </div>

                {/* Submit */}
                <div className="pt-3 sm:pt-4">
                  <button
                    type="submit"
                    className="btn-lemon w-full py-3.5 sm:py-4 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-all"
                  >
                    Process Payment ↗
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
