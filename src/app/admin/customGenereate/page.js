"use client";

import { useState, useEffect } from "react";

export default function InvoiceGeneratorPage() {
  
    // customGenereate/page.js
// formData state ko isse replace karo

// Invoice Number ko auto-increment karne ke liye


const getNextInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const storageKey = `invoice-sequence-${year}`;

  const lastSequence = Number(localStorage.getItem(storageKey) || "0");
  const nextSequence = lastSequence + 1;

  localStorage.setItem(storageKey, String(nextSequence));

  const padded = String(nextSequence).padStart(3, "0");

  return `LIM/${year}/${padded}`;
};

// formData state ko isse replace karo
// :contentReference[oaicite:0]{index=0}

const [formData, setFormData] = useState({
  invoiceNumber: "",

  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  gstNumber: "",
  serviceName: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],

  planName: "",
  planDuration: "",
  startDate: "",
  expiryDate: "",
});

  const [loading, setLoading] = useState(false);

  useEffect(() => {
  setFormData((prev) => ({
    ...prev,
    invoiceNumber: getNextInvoiceNumber(),
  }));
}, []);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate PDF
 // generateInvoice function ko is final debug version se replace karo

const generateInvoice = async () => {
  try {
    setLoading(true);

    const payload = {
      invoiceNumber: formData.invoiceNumber,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      gstNumber: formData.gstNumber,
      serviceName: formData.serviceName,
      amount: Number(formData.amount),
      date: formData.date,

       planName: formData.planName,
  planDuration: formData.planDuration,
  startDate: formData.startDate,
  expiryDate: formData.expiryDate,
    };

    console.log("Sending Payload:", payload);

    const res = await fetch("/api/admin/invoice-generator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Agar API fail ho gayi
    if (!res.ok) {
      let errorMessage = "Invoice generate failed";

      try {
        const errorData = await res.json();
        console.error("API Error JSON:", errorData);

        errorMessage =
          errorData.message ||
          errorData.error ||
          JSON.stringify(errorData);
      } catch {
        const errorText = await res.text();
        console.error("API Error Text:", errorText);
        errorMessage = errorText;
      }

      alert("Invoice generate failed:\n" + errorMessage);
      return;
    }

    // Content type check
    const contentType = res.headers.get("content-type");
    console.log("Content-Type:", contentType);

    if (!contentType?.includes("application/pdf")) {
      const responseText = await res.text();
      console.error("Expected PDF but received:", responseText);
      alert("PDF receive nahi hui. Console check karo.");
      return;
    }
    
// PDF Download
const blob = await res.blob();
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = `${formData.invoiceNumber}.pdf`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

// Memory free
URL.revokeObjectURL(url);

// =========================
// Form Reset After Download
// =========================
setFormData({
  invoiceNumber: getNextInvoiceNumber(),

  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  gstNumber: "",
  serviceName: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],

  planName: "",
  planDuration: "",
  startDate: "",
  expiryDate: "",
});
  } catch (error) {
    console.error("Frontend Error:", error);
    alert("Something went wrong:\n" + error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
  <div className="relative bg-white rounded-[32px] border border-slate-200 shadow-[0_20px_80px_rgba(15,23,42,0.08)] overflow-hidden">
    
    {/* Decorative Elements */}
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600"></div>
    <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-50 rounded-full blur-3xl"></div>
    <div className="absolute -bottom-24 -right-24 w-40 h-40 bg-indigo-50 rounded-full blur-3xl"></div>

    <div className="relative z-10 p-8 md:p-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-15 h-15 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-200 mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
            />
          </svg>
        </div>

        <h2 className=" md:text-4xl font-extrabold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
          Invoice PDF Generator
        </h2>

        <p className="text-slate-500 text-lg">
          Create beautiful and professional invoices instantly
        </p>
      </div>

      {/* Form Fields */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Invoice Number */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Invoice Number
          </label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* Customer Name */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Customer Name
          </label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Enter customer name"
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Customer Phone
          </label>
          <input
            type="text"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            placeholder="Enter mobile number"
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* Customer Email */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Customer Email
          </label>
          <input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            placeholder="Enter email"
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* GST Number */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            GST Number
          </label>
          <input
            type="text"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleChange}
            placeholder="Enter GST Number"
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Customer Address
          </label>
          <textarea
            name="customerAddress"
            value={formData.customerAddress}
            onChange={handleChange}
            rows="3"
            placeholder="Enter full address"
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20 resize-none"
          />
        </div>

        {/* Service Name */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Service Name
          </label>
          <input
            type="text"
            name="serviceName"
            value={formData.serviceName}
            onChange={handleChange}
            placeholder="RO Water Purifier Service"
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Amount (₹)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="1200"
            className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
          />
        </div>

        {/* Membership Section */}
        <div className="md:col-span-2 mt-4">
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Membership Plan Details
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Plan Name */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Plan Name
                </label>
                <input
                  type="text"
                  name="planName"
                  value={formData.planName}
                  onChange={handleChange}
                  placeholder="Basic Plan"
                  className="w-full border border-slate-200 bg-white rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
                />
              </div>

              {/* Plan Duration */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Plan Duration
                </label>
                <input
                  type="text"
                  name="planDuration"
                  value={formData.planDuration}
                  onChange={handleChange}
                  placeholder="1 Month"
                  className="w-full border border-slate-200 bg-white rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"

                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full border border-slate-200 bg-white rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full border border-slate-200 bg-white rounded-2xl px-5 py-3.5 outline-none transition-all duration-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={generateInvoice}
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:shadow-2xl hover:shadow-cyan-200 hover:-translate-y-1 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:bg-gray-400 disabled:shadow-none disabled:transform-none"
        >
          {loading ? "Generating PDF..." : "Generate Invoice PDF"}
        </button>
      </div>
    </div>
  </div>
</div>
  );
}