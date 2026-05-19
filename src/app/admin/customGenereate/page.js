"use client";

import { useState } from "react";

export default function InvoiceGeneratorPage() {
  
    // customGenereate/page.js
// formData state ko isse replace karo

const [formData, setFormData] = useState({
  invoiceNumber: `INV-${new Date().getFullYear()}-001`,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  gstNumber: "",
  serviceName: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],

  // ===== Plan Details (IMPORTANT) =====
  planName: "",
  planDuration: "",
  startDate: "",
  expiryDate: "",
});

  const [loading, setLoading] = useState(false);

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
  invoiceNumber: `INV-${new Date().getFullYear()}-001`,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  gstNumber: "",
  serviceName: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],

  // Plan Details
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
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 border">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Invoice PDF Generator
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Invoice Number */}
          <div>
            <label className="block mb-2 font-semibold">Invoice Number</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block mb-2 font-semibold">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Customer Name */}
          <div>
            <label className="block mb-2 font-semibold">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer name"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block mb-2 font-semibold">Customer Phone</label>
            <input
              type="text"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              placeholder="Enter mobile number"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Customer Email */}
          <div>
            <label className="block mb-2 font-semibold">Customer Email</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* GST Number */}
          <div>
            <label className="block mb-2 font-semibold">GST Number</label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="Enter GST Number"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-semibold">
              Customer Address
            </label>
            <textarea
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleChange}
              rows="3"
              placeholder="Enter full address"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Service Name */}
          <div>
            <label className="block mb-2 font-semibold">Service Name</label>
            <input
              type="text"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              placeholder="RO Water Purifier Service"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-2 font-semibold">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="1200"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>


<div className="grid md:grid-cols-2 gap-6 mt-6">
  {/* Plan Name */}
  <div>
    <label className="block mb-2 font-semibold">Plan Name</label>
    <input
      type="text"
      name="planName"
      value={formData.planName}
      onChange={handleChange}
      placeholder="Basic Plan"
      className="w-full border rounded-lg px-4 py-3"
    />
  </div>

  {/* Plan Duration */}
  <div>
    <label className="block mb-2 font-semibold">Plan Duration</label>
    <input
      type="text"
      name="planDuration"
      value={formData.planDuration}
      onChange={handleChange}
      placeholder="1 Month"
      className="w-full border rounded-lg px-4 py-3"
    />
  </div>

  {/* Start Date */}
  <div>
    <label className="block mb-2 font-semibold">Start Date</label>
    <input
      type="date"
      name="startDate"
      value={formData.startDate}
      onChange={handleChange}
      className="w-full border rounded-lg px-4 py-3"
    />
  </div>

  {/* Expiry Date */}
  <div>
    <label className="block mb-2 font-semibold">Expiry Date</label>
    <input
      type="date"
      name="expiryDate"
      value={formData.expiryDate}
      onChange={handleChange}
      className="w-full border rounded-lg px-4 py-3"
    />
  </div>
</div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={generateInvoice}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold"
          >
            {loading ? "Generating PDF..." : "Generate Invoice PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}