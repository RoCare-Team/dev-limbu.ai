"use client";
import React, { useState, useEffect } from "react";
import { sendOtpAction, verifyOtpAction, completeRegistrationAction } from "@/app/actions/authActions";
import { useRouter, useSearchParams } from "next/navigation";
import { Moon, Sun, Phone, Mail, User, Lock, CheckCircle, AlertCircle, MapPin, Star, TrendingUp, BarChart3, Users, Globe, Tag } from "lucide-react";
// import { theme } from "../app/styles/theme/theme";


export default function LoginPage() {
  /* ─────────────── 100 % SAME STATE & LOGIC ─────────────── */
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referCode, setReferCode] = useState("");
  const [step, setStep] = useState("phone");
  const [isExisting, setIsExisting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
const router = useRouter();
const searchParams = useSearchParams();

useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.replace("/login");
  }
}, []);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setIsDark(theme === "dark");
    
    // Auto-fill refer code from URL parameter
    const referParam = searchParams.get("refer");
    if (referParam) {
      setReferCode(referParam);
    }
  }, [searchParams]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
  };


  const sendToWhastappMessage = async (destination, templateParams) => {
    try {
      const response = await fetch("/api/whatsapp-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          templateParams,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("WhatsApp message sent:", data);
      }
    } catch (error) {
      
    }
  }

  const sendOtp = async () => {
    if (!phone || phone.length < 10) {
      showMessage("Please enter a valid phone number", "error");
      return;
    }
    setIsLoading(true);
    showMessage("Sending OTP...", "info");
    try {
      const { ok, data } = await sendOtpAction(phone);
      if (ok) {
        showMessage(data.message || "OTP sent successfully ✓", "success");
        setIsExisting(data.isExistingUser || false);
        setTimeout(() => setStep("otp"), 500);
      } else {
        showMessage(data.error || "Failed to send OTP", "error");
      }
    } catch (error) {
      showMessage(error.message || "An unexpected error occurred.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      showMessage("Please enter a valid OTP", "error");
      return;
    }
    setIsLoading(true);
    showMessage("Verifying OTP...", "info");
    try {
      const { ok, data } = await verifyOtpAction(phone, otp);
      if (data.step === "collect_details") {
        showMessage("OTP verified! Please complete your profile.", "success");
        setTimeout(() => setStep("details"), 500);
      } else if (ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.userId);
        localStorage.setItem("fullName", data.user.fullName);
        localStorage.setItem("mobileNumber", data.user.phone);
        showMessage("Login successful! Redirecting...", "success");
        setTimeout(() => router.push("/dashboard"), 800);
      } else {
        showMessage(data.error || "Invalid OTP", "error");
      }
    } catch (error) {
      showMessage(error.message || "An unexpected error occurred.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async () => {
    if (!name || !email) {
      showMessage("Please fill in all fields", "error");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showMessage("Please enter a valid email", "error");
      return;
    }
    setIsLoading(true);
    showMessage("Completing registration...", "info");
    try {
      const { ok, data } = await completeRegistrationAction(phone, otp, name, email, referCode);
      if (ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.userId);
        showMessage("Registration complete! Redirecting...", "success");

        const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
        await sendToWhastappMessage(formattedPhone, [name, "https://limbu.ai"]);

        if (data.token) {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } else {
        showMessage(data.error || "Registration failed", "error");
      }
    } catch (error) {
      showMessage(error.message || "An unexpected error occurred.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter" && !isLoading) {
      action();
    }
  };

  /* ----------------------------------------------------------
     NEW LAYOUT WRAPPER – login first on mobile, side-by-side lg
  -----------------------------------------------------------*/
  return (
    <>
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-gradient-to-br from-indigo-50 via-white to-purple-50"}`}>
        {/* —— SAME TOP BAR & THEME TOGGLE —— */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition text-gray-700 font-medium m-4 fixed top-0 left-0 z-50"
        >
          ← Back
        </button>

        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {!isDark && (
            <>
              <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </>
          )}
          {isDark && (
            <>
              <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
              <div className="absolute top-40 right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className={`fixed top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
            isDark ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-white text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* --------------  NEW FLEX ORDER  -------------- */}
<div className="relative min-h-screen flex items-center justify-center p-4 mt-20">
          <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-stretch">
            {/* 1. LOGIN CARD – elevated tray */}
            <div
              className={`flex-1 rounded-3xl shadow-2xl overflow-hidden
                ${isDark
                  ? "bg-slate-800/60 backdrop-blur-xl border border-slate-700"
                  : "bg-white/90 backdrop-blur-xl border border-white/30"}
                /* -----  subtle tray shadow  ----- */
                ring-1 ${isDark ? "ring-slate-700/50" : "ring-slate-200/50"}
                `}
            >
              {/* SAME HEADER / FORM / FOOTER */}
              <div className={`p-8 ${isDark ? "bg-white" : "bg-white"}`}>
                <h2 className="text-3xl font-bold text-black">Welcome Back</h2>
                <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
              </div>

              <div className="p-8">
                {/* step indicator */}
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                        step === "phone"
                          ? isDark
                            ? "  text-white shadow-lg shadow-blue-500/50"
                            : "bg-yellow-400 text-black shadow-lg shadow-black/40"
                          : isDark
                          ? "bg-slate-700 text-slate-400"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      1
                    </div>
                    <div
                      className={`w-12 h-1 rounded-full transition-all duration-300 ${
                        step !== "phone" ? (isDark ? "bg-white" : "bg-neutral-800") : isDark ? "bg-white" : "bg-neutral-800"
                      }`}
                    ></div>
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                        step === "otp"
                          ? isDark
                            ? "bg-white text-yellow-300 shadow-lg shadow-blue-500/50"
                            : "bg-neutral-600 text-white shadow-lg shadow-indigo-500/50"
                          : step === "details"
                          ? isDark
                            ? "bg-white text-yellow-300"
                            : "bg-neutral-600 text-white"
                          : isDark
                          ? "bg-slate-700 text-slate-400"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      2
                    </div>
                    {!isExisting && (
                      <>
                        <div
                          className={`w-12 h-1 rounded-full transition-all duration-300 ${
                            step === "details" ? (isDark ? "bg-neutral-900" : "bg-indigo-600") : isDark ? "bg-slate-700" : "bg-slate-200"
                          }`}
                        ></div>
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                            step === "details"
                              ? isDark
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                                : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                              : isDark
                              ? "bg-slate-700 text-slate-400"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          3
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ------------  PHONE STEP  ------------ */}
                {step === "phone" && (
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-neutral-600"}`}>Mobile Number</label>
                      <div className="relative">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-yellow-500" : "text-gray-500"}`} />
                        <input
                          type="tel"
                          placeholder="Enter your mobile number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, sendOtp)}
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 font-medium ${
                            isDark
                              ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-yellow-400 focus:bg-slate-800"
                              : "bg-white/50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-yellow-400 focus:bg-white"
                          } focus:outline-none focus:ring-4 ${isDark ? "focus:ring-blue-500/20" : "focus:ring-yellow-400/20"}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={sendOtp}
                      disabled={isLoading}
                      className={`w-full py-4 rounded-xl font-bold text-black transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDark
                          ? "bg-white text-black hover:bg-gray-100"
                          : "bg-yellow-400 text-black hover:bg-yellow-300"
                      }`}
                    >
                      {isLoading ? "Sending..." : "Send OTP"}
                    </button>
                  </div>
                )}

                {/* ------------  OTP STEP  ------------ */}
                {step === "otp" && (
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}>Enter OTP</label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                        <input
                          type="text"
                          placeholder="0000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, verifyOtp)}
                          maxLength={6}
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 text-center text-2xl tracking-[0.5em] font-bold ${
                            isDark
                              ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                              : "bg-white/50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-yellow-400 focus:bg-white"
                          } focus:outline-none focus:ring-4 ${isDark ? "focus:ring-blue-500/20" : "focus:ring-indigo-500/20"}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={verifyOtp}
                      disabled={isLoading}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDark
                          ? "bg-white hover:from-blue-500 hover:to-purple-500"
                          : "bg-yellow-400 text-black hover:bg-yellow-400"
                      }`}
                    >
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </button>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => setStep("phone")}
                        disabled={isLoading}
                        className={`w-full py-3 text-sm font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDark ? "text-white hover:text-yellow-300 hover:bg-slate-700/50" : "text-neutral-700 hover:text-neytral-800 hover:bg-gray-200"
                        }`}
                      >
                        ← Change Phone Number
                      </button>
                      <button
                        onClick={sendOtp}
                        disabled={isLoading}
                        className={`w-full py-3 text-sm font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDark ? "text-slate-300 hover:text-white hover:bg-slate-700/50" : "text-slate-600 hover:text-slate-900 hover:bg-gray-200"
                        }`}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------  DETAILS STEP  ------------ */}
                {step === "details" && (
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}>Full Name</label>
                      <div className="relative">
                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 font-medium ${
                            isDark
                              ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                              : "bg-white/50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white"
                          } focus:outline-none focus:ring-4 ${isDark ? "focus:ring-blue-500/20" : "focus:ring-indigo-500/20"}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}>Email Address</label>
                      <div className="relative">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, completeRegistration)}
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 font-medium ${
                            isDark
                              ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                              : "bg-white/50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white"
                          } focus:outline-none focus:ring-4 ${isDark ? "focus:ring-blue-500/20" : "focus:ring-indigo-500/20"}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}>Refer Code (Optional)</label>
                      <div className="relative">
                        <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                        <input
                          type="text"
                          placeholder="Enter refer code"
                          value={referCode}
                          onChange={(e) => setReferCode(e.target.value)}
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 font-medium ${
                            isDark
                              ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800"
                              : "bg-white/50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white"
                          } focus:outline-none focus:ring-4 ${isDark ? "focus:ring-blue-500/20" : "focus:ring-indigo-500/20"}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={completeRegistration}
                      disabled={isLoading}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDark
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                      }`}
                    >
                      {isLoading ? "Processing..." : "Complete Registration"}
                    </button>
                  </div>
                )}

                {/* ------------  MESSAGE  ------------ */}
                {message && (
                  <div
                    className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                      messageType === "success"
                        ? isDark
                          ? "bg-green-500/20 border border-green-500/30"
                          : "bg-green-50 border border-green-200"
                        : messageType === "error"
                        ? isDark
                          ? "bg-red-500/20 border border-red-500/30"
                          : "bg-red-50 border border-red-200"
                        : isDark
                        ? "bg-neutral-800/40 border-neutral-700"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    {messageType === "success" ? (
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-green-400" : "text-green-600"}`} />
                    ) : messageType === "error" ? (
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
                    ) : (
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                    )}
                    <p
                      className={`text-sm font-medium ${
                        messageType === "success"
                          ? isDark
                            ? "text-green-300"
                            : "text-green-800"
                          : messageType === "error"
                          ? isDark
                            ? "text-red-300"
                            : "text-red-800"
                          : isDark
                          ? "text-blue-300"
                          : "text-blue-800"
                      }`}
                    >
                      {message}
                    </p>
                  </div>
                )}

                <div className={`mt-8 pt-6 border-t text-center text-sm ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-600"}`}>
                  By continuing, you agree to Limbu Ai and authorize our representatives to contact you via Call, Email, SMS, RCS, or WhatsApp regarding your service requests and related updates.
                </div>
              </div>
            </div>

            {/* 2. MARKETING CONTENT – order-last on mobile */}
            <div
              className={`flex-1 rounded-3xl p-8 lg:p-12 shadow-2xl
                ${isDark ? "bg-slate-800/50 backdrop-blur-xl border border-slate-700" : "bg-white/80 backdrop-blur-xl border border-white/20"}
                /* -----  subtle tray shadow  ----- */
                ring-1 ${isDark ? "ring-slate-700/50" : "ring-slate-200/50"}
                `}
            >
              <div className="space-y-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${isDark ? "bg-lightPrimary text-dark" : "bg-dark text-lightPrimary"}`}>
                  <Globe className="w-4 h-4" />
                  GMB & Social Media management
                </div>

                <h1 className={`text-4xl lg:text-5xl font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Your Business,
                  <br />
                  <span className={`${isDark ? "text-yellow-600" : "bg-lightPrimary bg-clip-text text-transparent"}`}>Amplified Online</span>
                </h1>

                <p className={`text-lg ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Take control of your Google My Business presence with our powerful automation platform. Manage reviews, posts, and analytics all in one place.
                </p>

                <div className="grid gap-4 mt-8">
                  <div className={`flex items-start gap-4 p-4 rounded-xl ${isDark ? "bg-slate-700/30" : "bg-indigo-50/50"}`}>
                    <div className={`p-2 rounded-lg ${isDark ? "bg-blue-500/20" : "bg-indigo-100"}`}>
                      <BarChart3 className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-indigo-600"}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Real-Time Analytics</h3>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Track performance metrics and customer engagement instantly</p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-4 p-4 rounded-xl ${isDark ? "bg-slate-700/30" : "bg-purple-50/50"}`}>
                    <div className={`p-2 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                      <Star className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Review Management</h3>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Respond to reviews automatically and maintain your reputation</p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-4 p-4 rounded-xl ${isDark ? "bg-slate-700/30" : "bg-pink-50/50"}`}>
                    <div className={`p-2 rounded-lg ${isDark ? "bg-pink-500/20" : "bg-pink-100"}`}>
                      <MapPin className={`w-5 h-5 ${isDark ? "text-pink-400" : "text-pink-600"}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Multi-Location Support</h3>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Manage multiple business locations from a single dashboard</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${isDark ? "text-white" : "text-yellow-500"}`}>
                    <Star className="w-5 h-5 fill-current" />
                    4.9/5
                  </div>
                  <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-neutral-800"}`}>Avg Rating</p>
                </div>
                <div className="text-center">
                  <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${isDark ? "text-white" : "text-yellow-500"}`}>
                    <Users className="w-5 h-5" />
                    1k+
                  </div>
                  <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Businesses</p>
                </div>
                <div className="text-center">
                  <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${isDark ? "text-white" : "text-yellow-500"}`}>
                    <TrendingUp className="w-5 h-5" />
                    45%
                  </div>
                  <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Growth Avg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
}