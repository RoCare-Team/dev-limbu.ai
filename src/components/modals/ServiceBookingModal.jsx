"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

/* ─── Validators ─── */
const validatePhone = (v) => /^[6-9]\d{9}$/.test(v.trim());
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const validateName = (v) => /^[A-Za-z\s]{2,40}$/.test(v.trim());
const validateGst = (v) =>
  v.trim() === "" ||
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v.trim());

export default function ServiceBookingModal({
  showServiceModal,
  setShowServiceModal,
  selectedPlan,
  bookingSuccess,
  serviceForm,
  setServiceForm,
  handleServicePayment,
}) {
  const [errors, setErrors] = useState({});

  if (!showServiceModal || !selectedPlan) return null;

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Real-time filtering
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (name === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }
    if (name === "gstNumber") {
      value = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 15);
    }

    setServiceForm({ ...serviceForm, [name]: value });

    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateName(serviceForm.name))
      newErrors.name = "Enter a valid name (letters only)";
    if (!validatePhone(serviceForm.phone))
      newErrors.phone = "Enter a 10-digit mobile number";
    if (!validateEmail(serviceForm.email))
      newErrors.email = "Enter a valid email address";
    if (!validateGst(serviceForm.gstNumber))
      newErrors.gstNumber = "Enter a valid 15-digit GST number";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    handleServicePayment(e);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 animate-fadeIn">
      <div className="relative bg-white border border-black/[0.03] rounded-xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 animate-scaleIn">
        {/* ── Subtle background grid ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient Glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-40 h-40 z-0 opacity-10"
          style={{
            background:
              "radial-gradient(circle at top right, var(--lemon-glow) 0%, transparent 70%)",
          }}
        />

        {/* Close Button */}
        <button
          onClick={() => setShowServiceModal(false)}
          className="absolute top-6 right-6 p-2.5 bg-slate-50 border border-black/5 rounded-2xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto custom-scroll relative z-10 flex-1 w-full p-8 sm:p-10">
          {/* SUCCESS STATE */}
          {bookingSuccess ? (
            <div className="text-center py-10 px-6 rounded-[2rem] bg-green-50/50 border border-green-500/10 shadow-inner flex flex-col items-center justify-center h-full min-h-[380px]">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6 shadow-sm animate-bounce">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-xl font-black text-black mb-2 uppercase tracking-tight font-heading">
                Booking Confirmed
              </h2>

              <p className="text-slate-500 text-[11px] mb-4 font-bold leading-relaxed">
                Your service has been{" "}
                <span className="text-green-600 font-black">
                  successfully processed
                </span>
                .
              </p>

              <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black">
                Our team will contact you shortly.
              </p>

              <div className="mt-8 inline-block bg-green-500/10 border border-green-500/20 text-green-700 text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl">
                Payment Verified ✓
              </div>
            </div>
          ) : (
            <div>
              {/* Heading */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-black/5 bg-slate-50 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-lemon-hover" />
                  <span className="text-[8px] font-black tracking-widest uppercase text-slate-500">
                    Secure Checkout
                  </span>
                </div>
                <h2 className="text-2xl font-black text-black uppercase tracking-tight leading-tight font-heading">
                  Book{" "}
                  <span className="text-lemon-hover block mt-1">
                    {selectedPlan.title}
                  </span>
                </h2>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-black/5 mb-8 shadow-inner relative overflow-hidden">
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Standard Rate
                    </span>
                    <div className="text-[11px] text-slate-500 font-bold">
                      <span>{selectedPlan.price}</span>
                      <span className="mx-1.5 text-slate-300">+</span>
                      <span className="text-lemon-hover font-black">
                        {selectedPlan.gstAmount}
                      </span>
                      <span className="ml-1 text-[7px] uppercase tracking-widest">
                        (GST)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-black tracking-tight font-heading">
                      {selectedPlan.totalPrice}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 relative z-10">
                  <p className="text-[9px] text-slate-400 font-bold leading-relaxed italic">
                    {selectedPlan.subtitle}
                  </p>
                </div>
              </div>

              {/* FORM */}
              <form onSubmit={validateAndSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={serviceForm.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3.5 text-xs font-bold bg-white text-black border rounded-2xl outline-none transition-all placeholder:text-slate-300 shadow-sm ${errors.name ? "border-red-400 ring-2 ring-red-50" : "border-black/10 focus:ring-2 focus:ring-lemon-glow"}`}
                    placeholder="Enter your name"
                  />
                  {errors.name && (
                    <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-tight ml-1">
                      <AlertCircle size={10} /> {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={serviceForm.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3.5 text-xs font-bold bg-white text-black border rounded-2xl outline-none transition-all placeholder:text-slate-300 shadow-sm ${errors.phone ? "border-red-400 ring-2 ring-red-50" : "border-black/10 focus:ring-2 focus:ring-lemon-glow"}`}
                    placeholder="10-digit mobile number"
                  />
                  {errors.phone && (
                    <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-tight ml-1">
                      <AlertCircle size={10} /> {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={serviceForm.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3.5 text-xs font-bold bg-white text-black border rounded-2xl outline-none transition-all placeholder:text-slate-300 shadow-sm ${errors.email ? "border-red-400 ring-2 ring-red-50" : "border-black/10 focus:ring-2 focus:ring-lemon-glow"}`}
                    placeholder="you@company.com"
                  />
                  {errors.email && (
                    <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-tight ml-1">
                      <AlertCircle size={10} /> {errors.email}
                    </p>
                  )}
                </div>

                {/* GST */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    GST Number{" "}
                    <span className="text-slate-300 normal-case">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={serviceForm.gstNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3.5 text-xs font-bold bg-white text-black border rounded-2xl outline-none transition-all placeholder:text-slate-300 shadow-sm ${errors.gstNumber ? "border-red-400 ring-2 ring-red-50" : "border-black/10 focus:ring-2 focus:ring-lemon-glow"}`}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                  />
                  {errors.gstNumber && (
                    <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-tight ml-1">
                      <AlertCircle size={10} /> {errors.gstNumber}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-5 bg-lemon-glow text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-xl shadow-lemon-glow/20 hover:bg-lemon-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Authorize Payment ↗
                  </button>
                  <p className="mt-4 text-[8px] font-medium text-slate-400 text-center uppercase tracking-widest">
                    Secured by industry-standard encryption
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
