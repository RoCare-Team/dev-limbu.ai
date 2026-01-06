"use client";

import { HiPhone, HiMail, HiLocationMarker, HiClock, HiArrowLeft, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import { useState } from "react";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    consent: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/contact-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          consent: false
        });
        
        setTimeout(() => {
          setSubmitStatus(null);
        }, 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-12">
      <div className="bg-white shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-10 w-full max-w-5xl border border-gray-100">

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-4 sm:mb-6 font-medium transition-colors text-sm"
        >
          <HiArrowLeft className="text-lg" />
          Back
        </button>

        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Get In Touch
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto px-2">
            Have questions or need support? We're here to help you succeed.
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className="mb-4 sm:mb-8 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 sm:gap-3">
            <HiCheckCircle className="text-green-600 text-xl sm:text-2xl flex-shrink-0" />
            <div>
              <p className="text-green-800 font-semibold text-sm sm:text-base">Message sent successfully!</p>
              <p className="text-green-600 text-xs sm:text-sm">We'll get back to you shortly.</p>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-4 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 sm:gap-3">
            <HiExclamationCircle className="text-red-600 text-xl sm:text-2xl flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold text-sm sm:text-base">Something went wrong</p>
              <p className="text-red-600 text-xs sm:text-sm">Please try again later or contact us directly.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10">

          <div className="order-2 lg:order-1">
            <div className="space-y-4 sm:space-y-5 bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Send a Message</h2>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  placeholder="John Doe"
                  onChange={handleChange}
                  className="w-full p-3 sm:p-4 text-sm sm:text-base rounded-lg sm:rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  placeholder="john@example.com"
                  onChange={handleChange}
                  className="w-full p-3 sm:p-4 text-sm sm:text-base rounded-lg sm:rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  placeholder="+91 9876543210"
                  onChange={handleChange}
                  className="w-full p-3 sm:p-4 text-sm sm:text-base rounded-lg sm:rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Your Message
                </label>
                <textarea
                  name="message"
                  rows="4"
                  value={formData.message}
                  placeholder="Tell us how we can help you..."
                  onChange={handleChange}
                  className="w-full p-3 sm:p-4 text-sm sm:text-base rounded-lg sm:rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="consent"
                  id="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 flex-shrink-0"
                />
                <label htmlFor="consent" className="text-xs text-gray-600 leading-snug">
                  By continuing, you agree to Limbu Ai and authorize our representatives to contact you via Call, Email, SMS, RCS, or WhatsApp regarding your service requests and related updates.
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.consent}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5 order-1 lg:order-2">

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-blue-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white group-hover:scale-110 transition-transform">
                  <HiPhone className="text-lg sm:text-2xl" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-800">Phone</h2>
                  <p className="text-gray-700 font-medium text-xs sm:text-base">+91 9289344726</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all border border-purple-100 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-purple-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white group-hover:scale-110 transition-transform">
                  <HiMail className="text-lg sm:text-2xl" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-800">Email</h2>
                  <p className="text-gray-700 font-medium text-xs sm:text-base">info@limbu.ai</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all border border-green-100 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-green-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white group-hover:scale-110 transition-transform">
                  <HiLocationMarker className="text-lg sm:text-2xl" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-800">Address</h2>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    Unit No. 831, 8th Floor, JMD Megapolis,<br />
                    Sector 48, Gurugram, Haryana 122018
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all border border-orange-100 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-orange-600 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white group-hover:scale-110 transition-transform">
                  <HiClock className="text-lg sm:text-2xl" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-800">Business Hours</h2>
                  <p className="text-gray-700 text-xs sm:text-sm">Mon – Sat: 9:00 AM – 7:00 PM</p>
                  <p className="text-gray-700 text-xs sm:text-sm">Sunday: Closed</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-base">Prefer to email us directly?</p>
          <a
            href="mailto:info@limbu.ai"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <HiMail className="text-lg sm:text-xl" />
            Send us an Email
          </a>
        </div>

      </div>
    </div>
  );
}