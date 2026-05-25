"use client";

import React, { useState, useEffect } from "react";
import {
  sendOtpAction,
  verifyOtpAction,
  completeRegistrationAction,
} from "@/app/actions/authActions";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Phone,
  Mail,
  User,
  Lock,
  Tag,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building2,
  TrendingUp,
  ShieldCheck,
  Cpu
} from "lucide-react";
import Image from "next/image";

/* ─── Validators ─── */
const validatePhone = (v) => /^[6-9]\d{9}$/.test(v.trim());
const validateOtp = (v) => /^\d{4}$/.test(v.trim());
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const validateName = (v) => v.trim().length >= 2 && v.trim().length <= 30;

/* ─── Input field ─── */
function Field({ icon: Icon, error, className = "", ...props }) {
  return (
    <div className="mb-4">
      <div className="relative">
        <Icon
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200"
          style={{ color: error ? "#ef4444" : "rgba(15, 23, 42, 0.4)" }}
        />
        <input
          {...props}
          className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold outline-none transition-all duration-200 placeholder:text-slate-300 placeholder:font-medium bg-slate-50 border ${error ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100" : "border-slate-200 focus:border-[#EAB308] focus:ring-4 focus:ring-[#EAB308]/20"} text-slate-900 ${className}`}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] font-bold text-red-500 tracking-tight flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Step dot ─── */
function Dot({ active, done, num }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all duration-500"
      style={{
        background: active ? "#EAB308" : done ? "rgba(234, 179, 8, 0.15)" : "#f8fafc",
        color: active ? "#ffffff" : done ? "#EAB308" : "#94a3b8",
        border: active ? "none" : done ? "1px solid rgba(234, 179, 8, 0.3)" : "1px solid #e2e8f0",
        boxShadow: active ? "0 0 20px rgba(234, 179, 8, 0.4)" : "none",
        transform: active ? "scale(1.1)" : "scale(1)",
      }}
    >
      {done && !active ? <CheckCircle className="w-4 h-4" /> : num}
    </div>
  );
}

/* ─── CTA Button ─── */
function PrimaryBtn({ loading, label, loadingLabel, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-2xl text-xs font-black tracking-[0.15em] uppercase cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
      style={{
        background: "#EAB308",
        color: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.4)",
      }}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referCode, setReferCode] = useState("");
  const [step, setStep] = useState("phone");
  const [isExisting, setIsExisting] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (localStorage.getItem("token")) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    const ref = searchParams.get("refer");
    if (ref) setReferCode(ref);
  }, [searchParams]);

  const msg = (text, type = "info") => {
    setMessage(text);
    setMsgType(type);
  };
  const hk = (e, fn) => {
    if (e.key === "Enter" && !loading) fn();
  };

  const checkPhone = () => {
    if (!validatePhone(phone)) {
      setErrors({ phone: "Enter a valid 10-digit mobile number" });
      return false;
    }
    setErrors({});
    return true;
  };
  const checkOtp = () => {
    if (!validateOtp(otp)) {
      setErrors({ otp: "Enter a valid 4–6 digit OTP" });
      return false;
    }
    setErrors({});
    return true;
  };
  const checkDetails = () => {
    const e = {};
    if (!validateName(name)) e.name = "Name must be 2–30 characters";
    if (!validateEmail(email)) e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendOtp = async () => {
    if (!checkPhone()) return;
    setLoading(true);
    msg("Sending OTP…");
    try {
      const { ok, data } = await sendOtpAction(phone);
      if (ok) {
        msg(data.message || "OTP sent ✓", "success");
        setIsExisting(data.isExistingUser || false);
        setTimeout(() => {
          setStep("otp");
          setMessage("");
        }, 600);
      } else msg(data.error || "Failed to send OTP", "error");
    } catch (e) {
      msg(e.message || "Unexpected error", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!checkOtp()) return;
    setLoading(true);
    msg("Verifying…");
    try {
      const { ok, data } = await verifyOtpAction(phone, otp);
      if (data.step === "collect_details") {
        msg("OTP verified!", "success");
        setTimeout(() => {
          setStep("details");
          setMessage("");
        }, 600);
      } else if (ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.userId);
        localStorage.setItem("fullName", data.user.fullName);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("mobileNumber", data.user.phone);

        localStorage.removeItem("paidPackage")
localStorage.removeItem("paidService")



localStorage.setItem("paidPackage", data.user.paidPackage || "")
localStorage.setItem("paidService", data.user.paidService || "")
        msg("Login successful! Redirecting…", "success");
        setTimeout(() => router.push("/dashboard"), 800);
      } else msg(data.error || "Invalid OTP", "error");
    } catch (e) {
      msg(e.message || "Unexpected error", "error");
    } finally {
      setLoading(false);
    }
  };

  const completeReg = async () => {
    if (!checkDetails()) return;
    setLoading(true);
    msg("Completing registration…");
    try {
      const { ok, data } = await completeRegistrationAction(
        phone,
        otp,
        name,
        email,
        referCode,
      );
      if (ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.userId);
        msg("Registration complete!", "success");
        setTimeout(() => router.push("/dashboard"), 800);
      } else msg(data.error || "Registration failed", "error");
    } catch (e) {
      msg(e.message || "Unexpected error", "error");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = step === "phone" ? 0 : step === "otp" ? 1 : 2;
  const totalSteps = isExisting ? 2 : 3;
  const labels = isExisting ? ["Phone", "OTP"] : ["Phone", "OTP", "Details"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.3) 0%, transparent 60%)",
        }}
      />

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed top-5 left-5 sm:top-8 sm:left-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-[0.15em] uppercase cursor-pointer transition-all duration-300 hover:scale-105 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>

      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row gap-6 md:gap-8 items-stretch justify-center">
        
        {/* ── INFO CARD (Left Side on Desktop) ── */}
        <div className="hidden md:flex flex-col flex-1 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle background grid */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />

          {/* Decorative Corner Glow */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#EAB308]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-12">
              <Image src="/images/bg-logo.png" alt="Limbu AI" width={56} height={56} className="mb-6 drop-shadow-sm" />
              <h2 className="text-3xl font-black uppercase tracking-tight leading-[1.1] mb-4 text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                Automate Your <br/><span className="text-[#EAB308]">Local Growth</span>
              </h2>
              <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-sm">
                Join 500+ businesses using AI to dominate Google search rankings and automate their social media presence.
              </p>
            </div>

            <div className="space-y-6 mt-auto">
              {[
                { icon: Cpu, title: "AI-Powered Posts", desc: "Daily optimized content creation" },
                { icon: TrendingUp, title: "Rank Higher", desc: "Dominate the 'Near Me' Map Pack" },
                { icon: ShieldCheck, title: "Secure Access", desc: "Official API integration" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#EAB308] shrink-0 group-hover:bg-[#EAB308] group-hover:text-white transition-all duration-300 shadow-sm">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{feature.title}</h4>
                    <p className="text-[11px] font-bold text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── LOGIN FORM CARD (Right Side) ── */}
        <div className="w-full md:w-[420px] shrink-0 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col relative overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-slate-50 relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#EAB308] to-transparent opacity-50" />
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 bg-slate-50 border border-slate-100">
              <Lock className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-600">
                Secure Access
              </span>
            </div>

            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
              {step === "phone" ? "Welcome Back" : step === "otp" ? "Verify OTP" : "Complete Profile"}
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-2">
              {step === "phone" ? "Enter your mobile number to continue" : step === "otp" ? "We sent a code to your phone" : "Just a few more details"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-center gap-3">
              {[...Array(totalSteps)].map((_, i) => (
                <React.Fragment key={i}>
                  <Dot num={i + 1} active={stepIdx === i} done={stepIdx > i} />
                  {i < totalSteps - 1 && (
                    <div className="w-12 h-0.5 rounded-full transition-all duration-500 bg-slate-100 overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 bg-[#EAB308] transition-all duration-500" style={{ width: stepIdx > i ? "100%" : "0%" }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-3 px-4">
              {labels.map((l, i) => (
                <span key={l} className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${stepIdx >= i ? "text-slate-900" : "text-slate-300"}`}>
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 pt-6 pb-10 flex-1 flex flex-col">
            <div className="flex-1 space-y-2">
              {/* PHONE */}
              {step === "phone" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-[10px] font-black tracking-[0.15em] uppercase mb-2 text-slate-500 ml-1">
                    Mobile Number
                  </label>
                  <Field
                    icon={Phone}
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (errors.phone) setErrors({});
                    }}
                    onKeyPress={(e) => hk(e, sendOtp)}
                    error={errors.phone}
                  />
                </div>
              )}

              {/* OTP */}
              {step === "otp" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-2 ml-1 mr-1">
                    <label className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-500">
                      Enter OTP
                    </label>
                    <span className="text-[10px] font-bold text-[#EAB308]">
                      +91 {phone}
                    </span>
                  </div>
                  <Field
                    icon={Lock}
                    type="text"
                    inputMode="numeric"
                    placeholder="• • • •"
                    value={otp}
                    maxLength={4}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 4));
                      if (errors.otp) setErrors({});
                    }}
                    onKeyPress={(e) => hk(e, verifyOtp)}
                    error={errors.otp}
                    className="text-center text-xl tracking-[0.5em] font-black"
                  />
                </div>
              )}

              {/* DETAILS */}
              {step === "details" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.15em] uppercase mb-2 text-slate-500 ml-1">
                      Full Name
                    </label>
                    <Field
                      icon={User}
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      maxLength={30}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                      }}
                      error={errors.name}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.15em] uppercase mb-2 text-slate-500 ml-1">
                      Email Address
                    </label>
                    <Field
                      icon={Mail}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                      }}
                      onKeyPress={(e) => hk(e, completeReg)}
                      error={errors.email}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.15em] uppercase mb-2 text-slate-500 ml-1">
                      Refer Code <span className="text-slate-300 normal-case tracking-normal font-medium">(Optional)</span>
                    </label>
                    <Field
                      icon={Tag}
                      type="text"
                      placeholder="Enter refer code"
                      value={referCode}
                      onChange={(e) => setReferCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Message Banner */}
              {message && (
                <div
                  className="flex items-start gap-3 p-3 rounded-xl mt-4 animate-in fade-in zoom-in-95 duration-300"
                  style={{
                    background: msgType === "success" ? "rgba(34, 197, 94, 0.1)" : msgType === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(234, 179, 8, 0.1)",
                    border: `1px solid ${msgType === "success" ? "rgba(34, 197, 94, 0.2)" : msgType === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(234, 179, 8, 0.2)"}`,
                  }}
                >
                  {msgType === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: msgType === "error" ? "#ef4444" : "#eab308" }} />
                  )}
                  <p className="text-xs font-bold leading-relaxed" style={{ color: msgType === "success" ? "#166534" : msgType === "error" ? "#991b1b" : "#854d0e" }}>
                    {message}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              {step === "phone" && (
                <PrimaryBtn loading={loading} label="Continue" loadingLabel="Sending OTP..." onClick={sendOtp} />
              )}
              
              {step === "otp" && (
                <>
                  <PrimaryBtn loading={loading} label="Verify OTP" loadingLabel="Verifying..." onClick={verifyOtp} />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setStep("phone"); setErrors({}); setMessage(""); }}
                      disabled={loading}
                      className="flex-1 py-3 rounded-2xl text-[10px] font-black tracking-[0.1em] uppercase cursor-pointer transition-all duration-200 hover:bg-slate-100 bg-slate-50 text-slate-600 border border-slate-200"
                    >
                      ← Change No.
                    </button>
                    <button
                      onClick={sendOtp}
                      disabled={loading}
                      className="flex-1 py-3 rounded-2xl text-[10px] font-black tracking-[0.1em] uppercase cursor-pointer transition-all duration-200 hover:bg-yellow-50 bg-yellow-50/50 text-yellow-700 border border-yellow-200"
                    >
                      Resend OTP
                    </button>
                  </div>
                </>
              )}

              {step === "details" && (
                <PrimaryBtn loading={loading} label="Create Account" loadingLabel="Creating..." onClick={completeReg} />
              )}

              {/* Terms */}
              <p className="text-[10px] font-medium leading-relaxed text-center text-slate-400 mt-6 px-4">
                By continuing, you agree to our Terms of Service. We may contact you via Call, SMS, or WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
