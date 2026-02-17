

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">

        {/* Close */}
        <button
          onClick={() => setShowServiceModal(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
        >
          <X className="w-6 h-6" />
        </button>

        {/* SUCCESS */}
        {bookingSuccess ? (
          <div className="text-center py-10 px-6 rounded-2xl bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-lg">

            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5 animate-bounce" />

            <h2 className="text-3xl font-extrabold text-slate-800 mb-3">
              Thank You for Your Booking! 🎉
            </h2>

            <p className="text-slate-600 text-base mb-4">
              Your service has been{" "}
              <span className="font-semibold text-green-600">
                successfully booked
              </span>.
            </p>

            <p className="text-slate-500 text-sm">
              Our team will contact you shortly to confirm the details.
            </p>

            <div className="mt-6 inline-block bg-green-100 text-green-700 text-xs font-semibold px-4 py-2 rounded-full">
              Booking Confirmed
            </div>

          </div>
        ) : (
          <>
            {/* Heading */}
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Book {selectedPlan.title}
            </h2>

            <p className="text-slate-600 mb-6">
              Complete the details below to proceed to payment.
            </p>

            {/* Price Breakdown */}
            <div className="bg-slate-50 p-2 rounded-lg mb-4 border border-slate-100">

              <div className="flex justify-between items-center">

                <div className="text-sm text-slate-600">
                  <span className="font-semibold">{selectedPlan.price}</span>
                  <span className="mx-1 text-slate-400">+</span>
                  <span className="font-semibold">
                    {selectedPlan.gstAmount}
                  </span>
                  <span className="ml-1 text-xs text-slate-500">(GST)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-neutral-800">
                    {selectedPlan.totalPrice}
                  </span>
                </div>

              </div>

              <p className="text-[10px] text-slate-400 mt-1">
                {selectedPlan.subtitle}
              </p>

            </div>

            {/* FORM */}
            <form onSubmit={handleServicePayment} className="space-y-3">

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>

                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number
                </label>

                <input
                  type="tel"
                  required
                  value={serviceForm.phone}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>

                <input
                  type="email"
                  required
                  value={serviceForm.email}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your email"
                />
              </div>

              {/* GST */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  GST Number (Optional)
                </label>

                <input
                  type="text"
                  value={serviceForm.gstNumber}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, gstNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter GST number"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-neutral-800 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-[1.02] mt-2 text-sm"
              >
                Pay Now
              </button>

            </form>
          </>
        )}
      </div>
    </div>
  )
}
