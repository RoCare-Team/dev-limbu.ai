"use client";
import { useState, useEffect } from "react";
import { X, Crown, Zap, Shield, Upload } from "lucide-react";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";

const uploadToS3 = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const result = await uploadToS3Action(formData);
  if (result.success) return result.url;
  throw new Error(result.error || "Upload failed");
};

export default function FienchiesePlanUpgradeModel({
  selectedUser,
  onClose,
  fetchUsers,
}) {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planExpiryDate, setPlanExpiryDate] = useState("");
  const [planScreenshot, setPlanScreenshot] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [planRemarks, setplanRemarks] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [updating, setUpdating] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState(null);

  // ✅ Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/home-data?type=subscriptionPlans");
        const data = await res.json();
        setSubscriptionPlans(data);
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    };
    fetchPlans();
  }, []);

  // ✅ Auto set first cycle
  useEffect(() => {
    if (subscriptionPlans?.billingCycles?.length > 0) {
      setSelectedCycle(subscriptionPlans.billingCycles[0].cycle);
    }
  }, [subscriptionPlans]);

  // ✅ Auto expiry date
  useEffect(() => {
    if (!planStartDate || !selectedCycle) return;
    const date = new Date(planStartDate);
    if (selectedCycle === "monthly") date.setMonth(date.getMonth() + 1);
    else if (selectedCycle === "quarterly") date.setMonth(date.getMonth() + 3);
    else if (selectedCycle === "half-yearly") date.setMonth(date.getMonth() + 6);
    else if (selectedCycle === "yearly") date.setFullYear(date.getFullYear() + 1);
    setPlanExpiryDate(date.toISOString().split("T")[0]);
  }, [planStartDate, selectedCycle]);

  const showToast = (msg, type) =>
    alert(`${type === "error" ? "❌" : "✅"} ${msg}`);

  const confirmPlanChange = async () => {
    if (!selectedUser || !selectedPlan) return;

    if (planAmount && parseFloat(planAmount) > 0 && !planScreenshot) {
      showToast("Payment screenshot is required when amount is entered.", "error");
      return;
    }

    setUpdating(selectedUser.userId);

    try {
      let screenshotUrl = null;

      const franchiseUserRaw = localStorage.getItem("franchise_user");
      const franchiseUser = franchiseUserRaw ? JSON.parse(franchiseUserRaw) : null;
      const franchiseId = franchiseUser?.franchiseCode || "";
      const franchiseName = franchiseUser?.franchiseName || "";

      if (planAmount && parseFloat(planAmount) > 0) {
        screenshotUrl = await uploadToS3(planScreenshot);

        const revenueRes = await fetch("/api/franchise-revenue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: selectedUser.userId,
            leadName: selectedUser.fullName,
            amount: parseFloat(planAmount),
            paymentScreenshot: screenshotUrl,
            userEmail: selectedUser.email || "",
            phone: selectedUser.phone || "",
            plan: selectedPlan,
            packageStartDate: planStartDate,
            packageExpiryDate: planExpiryDate,
            notes: `Plan upgrade to ${selectedPlan}`,
            planRemarks,
            utrNumber,
            gstNumber,
            type: "plan",
            status:"user_onboard",
            franchiseId,
            franchiseName,
            bookingSource: "manual-upload",
          }),
        });

        const revenueData = await revenueRes.json();
        if (!revenueData.success) {
          throw new Error(revenueData.message || "Failed to record revenue.");
        }
      } else if (planScreenshot) {
        screenshotUrl = await uploadToS3(planScreenshot);
      }

      // ✅ Update user
      const userUpdateRes = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.userId,
          isServiceBooked: true,
          paidPackage: selectedPlan,
          planDuration: selectedCycle,
          packageStartDate: planStartDate,
          packageExpiryDate: planExpiryDate,
          ...(screenshotUrl && { paymentScreenshot: screenshotUrl }),
          ...(utrNumber && { utrNumber }),
          ...(gstNumber && { gstNumber }),
        }),
      });

      const userUpdateData = await userUpdateRes.json();

      if (userUpdateData.success) {
        // ✅ WhatsApp
        try {
          await fetch("/api/admin/package-booking-template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: selectedUser.phone || "",
              firstName: selectedUser.fullName || "Customer",
              planName: selectedPlan || "Package",
              amount: planAmount || "0",
              startDate: planStartDate || "-",
              expiryDate: planExpiryDate || "-",
            }),
          });
        } catch (whatsappErr) {
          console.error("WhatsApp failed:", whatsappErr);
        }

        showToast("User plan updated successfully!", "success");
        fetchUsers?.();
        onClose();
        setPlanScreenshot(null);
        setPlanAmount("");
      } else {
        throw new Error(userUpdateData.error || "Failed to update plan");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  if (!selectedUser) return null;

  const currentPlans = subscriptionPlans?.billingCycles?.find(
    (c) => c.cycle === selectedCycle
  )?.plans || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upgrade Plan</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* USER INFO */}
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">User</p>
          <p className="font-semibold text-gray-800">{selectedUser.email}</p>
        </div>

        {/* BILLING CYCLE TABS */}
        {subscriptionPlans ? (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            {subscriptionPlans.billingCycles.map((cycle) => (
              <button
                key={cycle.cycle}
                onClick={() => setSelectedCycle(cycle.cycle)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCycle === cycle.cycle
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cycle.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 mb-4">Loading plans...</div>
        )}

        {/* PLAN LIST */}
        <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-1">
          {currentPlans.map((plan) => {
            const planName = plan.title;
            return (
              <label
                key={planName}
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedPlan === planName
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="radio"
                    name="plan"
                    value={planName}
                    checked={selectedPlan === planName}
                    onChange={(e) => {
                      setSelectedPlan(e.target.value);
                      // ✅ amount auto fill
                      if (plan.totalAmount) {
                        setPlanAmount(String(plan.totalAmount));
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {planName.includes("Premium") && <Crown size={18} className="text-purple-600" />}
                      {planName.includes("Professional") && <Zap size={18} className="text-blue-600" />}
                      {planName.includes("Basic") && <Shield size={18} className="text-gray-600" />}
                      <span className="font-semibold text-gray-800">{planName}</span>
                    </div>
                    {plan.totalAmount && (
                      <div className="text-xs text-gray-500 mt-1 ml-7">
                        ₹{plan.totalAmount} / {plan.duration}
                      </div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* AMOUNT + DATES */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Amount (₹) <span className="text-gray-400">(for new revenue)</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 5000"
              value={planAmount}
              onChange={(e) => setPlanAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={planStartDate}
              onChange={(e) => setPlanStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Expiry Date</label>
            <input
              type="date"
              value={planExpiryDate}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* SCREENSHOT + UTR + REMARK + GST */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Payment Screenshot <span className="text-gray-400">(if amount entered)</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { const file = e.target.files[0]; if (file) setPlanScreenshot(file); }}
              className="hidden"
              id="plan-screenshot-upload"
            />
            <label htmlFor="plan-screenshot-upload" className="flex flex-col items-center cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {planScreenshot ? planScreenshot.name : "Click to upload payment screenshot"}
              </span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">UTR Number</label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="Enter UTR / Transaction ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Remark</label>
            <textarea
              value={planRemarks}
              onChange={(e) => setplanRemarks(e.target.value)}
              placeholder="Enter remark..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="Enter GST Number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={confirmPlanChange}
            disabled={updating === selectedUser.userId}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50"
          >
            {updating === selectedUser.userId ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}