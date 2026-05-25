"use client";
import { useState } from "react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    razorpayKeyId: "rzp_test_1234567890abcdef",
    supportNumber: "+91 9876543210",
    supportEmail: "support@example.com",
    companyName: "My Company",
    companyAddress: "GMD megapolis",
    websiteUrl: "https://www.mannubhai.com",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Mock save
    setMessage("Settings saved");
    setTimeout(() => setMessage(""), 3000);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6">
  <div className="max-w-3xl mx-auto">
    
    {/* Header */}
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-extrabold text-gray-800">
        Admin Settings
      </h1>
      <p className="text-gray-500 mt-2">
        Manage your platform configuration & company details
      </p>
    </div>

    {/* Main Card */}
    <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 space-y-8">

      {/* Payment Gateway */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white text-xl shadow-md">
            💳
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Payment Gateway
            </h2>
            <p className="text-sm text-gray-500">
              Configure your Razorpay credentials
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Razorpay Key ID
          </label>
          <input
            name="razorpayKeyId"
            value={settings.razorpayKeyId}
            onChange={handleChange}
            placeholder="Enter Razorpay Key ID"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-300"
          />
        </div>
      </div>

      {/* Support Info */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-green-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-600 text-white text-xl shadow-md">
            📞
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Support Information
            </h2>
            <p className="text-sm text-gray-500">
              Customer support contact details
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Support Number
            </label>
            <input
              name="supportNumber"
              value={settings.supportNumber}
              onChange={handleChange}
              placeholder="Enter Support Number"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Support Email
            </label>
            <input
              name="supportEmail"
              value={settings.supportEmail}
              onChange={handleChange}
              placeholder="Enter Support Email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-600 text-white text-xl shadow-md">
            🏢
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Company Information
            </h2>
            <p className="text-sm text-gray-500">
              Basic company & website details
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name
            </label>
            <input
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
              placeholder="Enter Company Name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Address
            </label>
            <input
              name="companyAddress"
              value={settings.companyAddress}
              onChange={handleChange}
              placeholder="Enter Company Address"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Website URL
            </label>
            <input
              name="websiteUrl"
              value={settings.websiteUrl}
              onChange={handleChange}
              placeholder="Enter Website URL"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300"
        >
          Save Settings
        </button>
      </div>

      {/* Success Message */}
      {message && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl font-medium">
          {message}
        </div>
      )}
    </div>
  </div>
 </div>
  );
}
