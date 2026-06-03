"use client";
import { useState, useEffect } from "react";

import { uploadToS3Action } from "@/app/actions/uploadS3Actions";

// Service Plans
const servicePlans = [
  {
    title: "GMB Assistance & Update Plan",
    price: 2500,
    features: [
      "Google Business Profile Functionality check",
      "Website URL update",
      "Mobile number update",
      "Basic profile verification check",
      "Minor corrections",
      "1 month support",
    ],
  },
  {
    title: "GMB Creation & Management Plan",
    price: 3000,
    features: [
      "Profile creation from scratch",
      "Address setup & verification",
      "Category selection",
      "Product listing",
      "Service listing",
      "1 month support",
    ],
  },
];

// SEO Plans

const seoPlans = [
  {
    title: "Basic SEO",
    price: 5999,
    features: [
      "Keyword Research",
      "Meta Tags Optimization",
      "Basic Technical SEO",
      "Monthly Report",
    ],
  },
  {
    title: "Standard SEO",
    price: 9999,
    features: [
      "Technical SEO Audit",
      "Backlink Building",
      "Competitor Analysis",
      "Bi-Weekly Reports",
    ],
  },
  {
    title: "Advanced SEO",
    price: 15999,
    features: [
      "Advanced 45-Page SEO",
      "Complete SEO Strategy",
      "High Quality Backlinks",
      "Technical Optimization",
      "Local SEO",
      "Weekly Performance Report",
    ],
  },
];

// Web Development
const webPlans = [
  {
    title: "Starter Website",
    price: 9999,
    features: [
      "Responsive Website Design",
      "Basic SEO Setup",
      "Contact Form Integration",
      "Social Media Integration",
      "1 Month Free Support",
    ],
  },
  {
    title: "Business Website",
    price: 25000,
    features: [
      "Custom UI/UX Design",
      "Advanced SEO Optimization",
      "Admin Panel Access",
      "Google Analytics Integration",
      "3 Months Free Support",
    ],
  },
  {
    title: "Enterprise Website",
    price: 48000,
    features: [
      "Fully Custom Design",
      "E-commerce Integration",
      "Payment Gateway Setup",
      "Advanced Security",
      "6 Months Free Support",
    ],
  },
];

// Account Setup

const accountPlans = [
  {
    title: "Google Ads Account Setup",
    price: 2500,
    features: [
      "New Google Ads account creation",
      "Billing & payment configuration",
      "Search campaign keyword research",
      "High-intent keyword selection",
      "Negative keyword setup",
      "Competitor keyword analysis",
      "Campaign structure planning",
      "Google Business Profile linking",
      "Google Analytics 4 (GA4) setup",
      "Google Tag Manager setup",
      "Conversion tracking setup",
      "Website conversion tracking",
      "Event tracking configuration",
      "Call tracking setup",
    ],
  },
  {
    title: "Meta Ads Account Setup",
    price: 3500,
    features: [
      "Business Manager setup & verification",
      "Ad account creation & configuration",
      "Audience research & competitor analysis",
      "Interest-based targeting research",
      "Custom audience creation",
      "Lookalike audience setup",
      "Pixel setup & tracking configuration",
      "Conversion API integration",
      "Ad creative strategy & direction",
      "High-converting ad copywriting",
      "Hook-based creatives",
      "A/B testing variations",
      "CTA optimization setup",
    ],
  },
];

export default function AdminServicepaneModal({ service, onClose }) {
  const [selectedService, setSelectedService] = useState("");
  const [servicePlan, setServicePlan] = useState(null);
  const [serviceAmount, setServiceAmount] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceNote, setServiceNote] = useState("");
  const [updatingService, setUpdatingService] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);

  const [gstNumber, setGstNumber] = useState("");

  const [activeCategory, setActiveCategory] = useState("service");

  const [bookingLoading, setBookingLoading] = useState(false);

  // ✅ Auto fill amount when plan selected
  useEffect(() => {
    if (servicePlan) {
      setServiceAmount(servicePlan.price);
    }
  }, [servicePlan]);

  useEffect(() => {
    if (serviceDate) {
      const date = new Date(serviceDate);

      // ✅ 1 month add
      date.setMonth(date.getMonth() + 1);

      const formattedDate = date.toISOString().split("T")[0];
      setExpiryDate(formattedDate);
    }
  }, [serviceDate]);

  // ✅ Submit function (inside component)
  const handleServiceSubmit = async () => {
    try {
      setUpdatingService(true);

      const res = await fetch("/api/service/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: service?.userId,
          service: selectedService,
          planName: servicePlan?.title,
          amount: serviceAmount,
          date: serviceDate,
          note: serviceNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Service added successfully");
        onClose(); // ✅ close modal
      }
    } catch (err) {
      console.log(err);
    } finally {
      setUpdatingService(false);
    }
  };

  const handleConfirmService = async () => {
    if (!selectedPlan) {
      alert("Please select a plan");
      return;
    }

    const planDuration =
      activeCategory === "service" || activeCategory === "seo"
        ? "monthly"
        : "one-time";

    // ✅ screenshotUrl ko sabse pehle declare karo
    let screenshotUrl = "";

    try {
      setBookingLoading(true);
      // ✅ Agar screenshot selected hai to pehle S3 par upload karo
      if (paymentScreenshot) {
        const formData = new FormData();
        formData.append("file", paymentScreenshot);

        const uploadResult = await uploadToS3Action(formData);

        if (uploadResult.success) {
          screenshotUrl = uploadResult.url;
        } else {
          alert(uploadResult.error || "Screenshot upload failed");
          return;
        }
      }

      // ✅ Optional payload (ab screenshotUrl defined hai)
      const payload = {
        userId: service?.userId || service?._id,
        type: "service",
        paidService: selectedPlan.title,
        amount: selectedPlan.price,
        isServiceBooked: true,
        planDuration: planDuration,
        packageStartDate: serviceDate,
        packageExpiryDate: expiryDate,
        paymentScreenshot: screenshotUrl,
        screenshot: screenshotUrl,
        notes: serviceNote,
        remarks: serviceNote,
        gstNumber: gstNumber,
      };

      // ✅ Revenue API call

      const res = await fetch("/api/franchise-revenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "service",
          leadId: service?.userId || service?._id,
          userId: service?.userId || service?._id,
          leadName:
            service?.name ||
            service?.fullName ||
            service?.leadName ||
            "Customer",

          email: localStorage.getItem("email"),

          paidService: selectedPlan.title,
          plan: selectedPlan.title,
          amount: selectedPlan.price,
          planDuration: planDuration,

          packageStartDate: serviceDate,
          packageExpiryDate: expiryDate,

          // ✅ S3 URL
          paymentScreenshot: screenshotUrl,
          screenshot: screenshotUrl,

          notes: serviceNote,
          remarks: serviceNote,
          gstNumber: gstNumber,
          isServiceBooked: true,
          planApprovalStatus: "pending",
        }),
      });

      const data = await res.json();
      console.log("🔥 RESPONSE:", data);

      if (!res.ok || !data.success) {
        alert(data.message || "Error booking service");
        return;
      }

      // ✅ WhatsApp template
      const whatsappRes = await fetch("/api/admin/service-booking-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: data?.revenue?._id || data?._id,
        }),
      });

      const whatsappData = await whatsappRes.json();
      console.log("📲 WhatsApp Response:", whatsappData);

      if (whatsappData.success) {
        alert("Service booked successfully and WhatsApp message sent ✅");
      } else {
        alert("Service booked successfully, but WhatsApp message failed ❌");
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert("Error booking service");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentScreenshot(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ❌ agar service nahi hai to modal hi nahi dikhega
  if (!service) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4 py-10">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[85vh]">
        {/* scrollable content */}
        <div className="overflow-y-auto max-h-[85vh]">
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <h3 className="text-2xl  text-gray-800">Service Plan</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* USER INFO */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl">
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-normal text-gray-800 text-lg">
                {service?.email}
              </p>
            </div>

            {/* SERVICE PLANS */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("service");
                    setSelectedPlan(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    activeCategory === "service"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  Service Plans
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("seo");
                    setSelectedPlan(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    activeCategory === "seo"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  SEO Plans
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("web");
                    setSelectedPlan(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    activeCategory === "web"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  Web Development
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("account");
                    setSelectedPlan(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    activeCategory === "account"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  Account Setup
                </button>
              </div>
              <label className="text-sm font-semibold text-blue-500">
                Select Plan
              </label>

              <div className="grid gap-4 mt-3">
                {(activeCategory === "service"
                  ? servicePlans
                  : activeCategory === "seo"
                    ? seoPlans
                    : activeCategory === "web"
                      ? webPlans
                      : accountPlans
                ).map((plan) => (
                  <div
                    key={plan.title}
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPlan?.title === plan.title
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {/* LEFT SIDE */}
                    <div className="flex items-center gap-3">
                      {/* RADIO ICON */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan?.title === plan.title
                            ? "border-indigo-600"
                            : "border-gray-400"
                        }`}
                      >
                        {selectedPlan?.title === plan.title && (
                          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                        )}
                      </div>

                      {/* PLAN TEXT */}
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {plan.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ₹{plan.price}
                          {(activeCategory === "service" ||
                            activeCategory === "seo") &&
                            " / month"}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT SIDE (OPTIONAL ICON) */}
                    <div className="text-gray-400">🛡️</div>
                  </div>
                ))}
              </div>
            </div>

            {/* DATE ROW */}

            {(activeCategory === "service" || activeCategory === "seo") && (
              <div className="grid grid-cols-2 gap-4">
                {/* Service Date */}
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Service Date
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full mt-2 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    readOnly
                    className="w-full mt-2 p-3 border rounded-xl bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Upload Screenshot
              </label>

              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-indigo-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  id="uploadScreenshot"
                />

                <label
                  htmlFor="uploadScreenshot"
                  className="cursor-pointer block"
                >
                  <p className="text-sm text-gray-500">
                    Click to upload screenshot
                  </p>
                </label>

                {/* PREVIEW */}
                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    className="mt-3 rounded-lg max-h-40 mx-auto shadow"
                  />
                )}
              </div>
            </div>

            {/* NOTES */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Notes
              </label>
              <textarea
                value={serviceNote}
                onChange={(e) => setServiceNote(e.target.value)}
                className="w-full mt-2 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Write issue..."
              />
            </div>

            {/* gst number  */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                GST Number
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="Enter GST Number"
                className="w-full mt-2 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex gap-3 p-5 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmService}
              disabled={!selectedPlan || bookingLoading}
              className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                selectedPlan && !bookingLoading
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {bookingLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Sending Template...
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
