  "use client";
  import { useState, useEffect } from "react";

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
  console.log("🔥 STEP 1:", selectedPlan);

  if (!selectedPlan) {
    alert("Please select a plan");
    return;
  }

  // handleConfirmService() ke andar payload ko EXACTLY is tarah replace karo

const payload = {
  userId: service?.userId || service?._id,
  type: "service",
  paidService: selectedPlan.title,
  amount: selectedPlan.price,
  isServiceBooked: true,
  planDuration: "monthly",
  packageStartDate: serviceDate,
  packageExpiryDate: expiryDate,

  // ✅ YE DONO FIELDS SAVE KARO
  paymentScreenshot: preview,
  screenshot: preview,

  // ✅ YE DONO FIELDS BHI SAVE KARO
  notes: serviceNote,
  remarks: serviceNote,
};

  console.log("🔥 FINAL PAYLOAD:", payload);

  try {
    // 1. Save booking
    const res = await fetch(`/api/franchise-revenue`, {
  method: "POST",  // ✅ Naya revenue record create karega
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
  planDuration: "monthly",

  // ✅ DATE STRING KO LOCAL FORMAT ME SAVE KARO
  // input type="date" already returns YYYY-MM-DD (e.g. 2026-08-05)
  // isko directly save karo, new Date() use mat karo
  packageStartDate: serviceDate,
  packageExpiryDate: expiryDate,

  paymentScreenshot: preview,
  notes: serviceNote,
  remarks: serviceNote,
  isServiceBooked: true,
  planApprovalStatus: "pending",
})

});

const data = await res.json();
console.log("🔥 RESPONSE:", data);

if (!res.ok || !data.success) {
  alert(data.message || "Error booking service");
  return;
}

   

    // 2. Send WhatsApp template automatically
    const whatsappRes = await fetch(
  "/api/admin/service-booking-template",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone:
        service?.customer_no_with_prefix ||
        service?.phone ||
        service?.mobileNumber ||
        service?.mobile,
      firstName:
        service?.name ||
        service?.fullName ||
        "Customer",
    }),
  }
);

    const whatsappData = await whatsappRes.json();
    console.log("📲 WhatsApp Response:", whatsappData);

    // 3. Success message
    if (whatsappData.success) {
      alert("Service booked successfully and WhatsApp message sent ✅");
    } else {
      alert(
        "Service booked successfully, but WhatsApp message failed ❌"
      );
    }

    // 4. Close modal
    onClose();
  } catch (err) {
    console.error(err);
    alert("Error booking service");
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
              <label className="text-sm font-semibold text-blue-500">
                Select Plan
              </label>

              <div className="grid gap-4 mt-3">
                {servicePlans.map((plan) => (
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
                          ₹{plan.price} / month
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
              <label className="text-sm font-semibold text-gray-700">Notes</label>
              <textarea
                value={serviceNote}
                onChange={(e) => setServiceNote(e.target.value)}
                className="w-full mt-2 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Write issue..."
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
              disabled={!selectedPlan}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                selectedPlan
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Confirm Booking
            </button>
          </div>


              </div>

            
        </div>
      </div>
    );
  }
