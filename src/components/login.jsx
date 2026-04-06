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
} from "lucide-react";

/* ─── Validators ─── */
const validatePhone = (v) => /^[6-9]\d{9}$/.test(v.trim());
const validateOtp = (v) => /^\d{4,6}$/.test(v.trim());
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const validateName = (v) => v.trim().length >= 2 && v.trim().length <= 30;

/* ─── Input field ─── */
function Field({ icon: Icon, error, className = "", ...props }) {
  return (
    <div>
      <div className="relative">
        <Icon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: error ? "#f87171" : "rgba(253,224,71,0.4)" }}
        />
        <input
          {...props}
          className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 placeholder:text-[rgba(226,232,240,0.2)] ${className}`}
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? "rgba(248,113,113,0.45)" : "rgba(255,255,255,0.08)"}`,
            color: "var(--pure-white)",
            caretColor: "#FDE047",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = error
              ? "1px solid rgba(248,113,113,0.7)"
              : "1px solid rgba(253,224,71,0.4)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(253,224,71,0.05)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = error
              ? "1px solid rgba(248,113,113,0.45)"
              : "1px solid rgba(255,255,255,0.08)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
      {error && (
        <p
          className="mt-1 text-[11px] font-medium"
          style={{ color: "#f87171" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Step dot ─── */
function Dot({ active, done, num }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
      style={{
        background: active
          ? "#FDE047"
          : done
            ? "rgba(253,224,71,0.1)"
            : "rgba(255,255,255,0.04)",
        color: active ? "#000" : done ? "#FDE047" : "rgba(255,255,255,0.2)",
        border: active
          ? "none"
          : done
            ? "1px solid rgba(253,224,71,0.25)"
            : "1px solid rgba(255,255,255,0.07)",
        boxShadow: active ? "0 0 14px rgba(253,224,71,0.35)" : "none",
      }}
    >
      {done && !active ? <CheckCircle className="w-3.5 h-3.5" /> : num}
    </div>
  );
}

/* ─── CTA Button ─── */
function PrimaryBtn({ loading, label, loadingLabel, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3 rounded-xl text-sm font-bold tracking-[0.08em] uppercase cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
      style={{
        background: "#FDE047",
        color: "#000",
        boxShadow: "0 0 18px rgba(253,224,71,0.22)",
      }}
    >
      {loading ? loadingLabel : label}
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
  }, []);

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
        localStorage.setItem("mobileNumber", data.user.phone);
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--cyber-black)" }}
    >
      {/* Subtle top glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(253,224,71,0.07) 0%, transparent 100%)",
        }}
      />

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed top-5 left-5 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-[0.08em] uppercase cursor-pointer transition-all duration-200 hover:opacity-75"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(226,232,240,0.4)",
        }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "rgba(10,10,10,0.97)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Yellow top bar */}
        <div
          className="h-0.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, #FDE047 0%, rgba(253,224,71,0.15) 100%)",
          }}
        />

        {/* Header */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
            style={{
              background: "rgba(253,224,71,0.06)",
              border: "1px solid rgba(253,224,71,0.15)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#FDE047" }}
            />
            <span
              className="text-[9px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "#FDE047" }}
            >
              Secure Login
            </span>
          </div>

          <h1
            className="font-normal uppercase leading-none tracking-tight"
            style={{
              fontFamily: "Anton, Impact, sans-serif",
              color: "var(--pure-white)",
              fontSize: "clamp(1.5rem, 5vw, 1.9rem)",
            }}
          >
            Welcome{" "}
            <span
              style={{
                WebkitTextStroke: "1.5px #FDE047",
                color: "transparent",
              }}
            >
              Back
            </span>
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(226,232,240,0.3)" }}
          >
            Sign in to access your dashboard
          </p>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 pb-1">
          <div className="flex items-center gap-2">
            {[...Array(totalSteps)].map((_, i) => (
              <React.Fragment key={i}>
                <Dot num={i + 1} active={stepIdx === i} done={stepIdx > i} />
                {i < totalSteps - 1 && (
                  <div
                    className="flex-1 h-px transition-all duration-500"
                    style={{
                      background:
                        stepIdx > i
                          ? "rgba(253,224,71,0.3)"
                          : "rgba(255,255,255,0.05)",
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {labels.map((l) => (
              <span
                key={l}
                className="text-[9px]"
                style={{ color: "rgba(226,232,240,0.2)" }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-4 pb-6 space-y-4">
          {/* PHONE */}
          {step === "phone" && (
            <>
              <div>
                <label
                  className="block text-[10px] font-semibold tracking-[0.1em] uppercase mb-1.5"
                  style={{ color: "rgba(226,232,240,0.4)" }}
                >
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
              <PrimaryBtn
                loading={loading}
                label="Send OTP ↗"
                loadingLabel="Sending…"
                onClick={sendOtp}
              />
            </>
          )}

          {/* OTP */}
          {step === "otp" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-[10px] font-semibold tracking-[0.1em] uppercase"
                    style={{ color: "rgba(226,232,240,0.4)" }}
                  >
                    Enter OTP
                  </label>
                  <span
                    className="text-[9px]"
                    style={{ color: "rgba(226,232,240,0.25)" }}
                  >
                    Sent to +91 {phone}
                  </span>
                </div>
                <Field
                  icon={Lock}
                  type="text"
                  inputMode="numeric"
                  placeholder="• • • •"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    if (errors.otp) setErrors({});
                  }}
                  onKeyPress={(e) => hk(e, verifyOtp)}
                  error={errors.otp}
                  className="text-center text-lg tracking-[0.4em]"
                />
              </div>
              <PrimaryBtn
                loading={loading}
                label="Verify OTP ↗"
                loadingLabel="Verifying…"
                onClick={verifyOtp}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep("phone");
                    setErrors({});
                    setMessage("");
                  }}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold tracking-[0.06em] uppercase cursor-pointer transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(226,232,240,0.4)",
                  }}
                >
                  ← Change
                </button>
                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold tracking-[0.06em] uppercase cursor-pointer transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: "rgba(253,224,71,0.05)",
                    border: "1px solid rgba(253,224,71,0.12)",
                    color: "rgba(253,224,71,0.6)",
                  }}
                >
                  Resend
                </button>
              </div>
            </>
          )}

          {/* DETAILS */}
          {step === "details" && (
            <>
              <div>
                <label
                  className="block text-[10px] font-semibold tracking-[0.1em] uppercase mb-1.5"
                  style={{ color: "rgba(226,232,240,0.4)" }}
                >
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
                <label
                  className="block text-[10px] font-semibold tracking-[0.1em] uppercase mb-1.5"
                  style={{ color: "rgba(226,232,240,0.4)" }}
                >
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
                <label
                  className="block text-[10px] font-semibold tracking-[0.1em] uppercase mb-1.5"
                  style={{ color: "rgba(226,232,240,0.4)" }}
                >
                  Refer Code{" "}
                  <span style={{ color: "rgba(226,232,240,0.2)" }}>
                    (Optional)
                  </span>
                </label>
                <Field
                  icon={Tag}
                  type="text"
                  placeholder="Enter refer code"
                  value={referCode}
                  onChange={(e) => setReferCode(e.target.value)}
                />
              </div>
              <PrimaryBtn
                loading={loading}
                label="Complete Registration ↗"
                loadingLabel="Processing…"
                onClick={completeReg}
              />
            </>
          )}

          {/* Message */}
          {message && (
            <div
              className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{
                background:
                  msgType === "success"
                    ? "rgba(74,222,128,0.06)"
                    : msgType === "error"
                      ? "rgba(248,113,113,0.06)"
                      : "rgba(253,224,71,0.05)",
                border: `1px solid ${msgType === "success" ? "rgba(74,222,128,0.18)" : msgType === "error" ? "rgba(248,113,113,0.18)" : "rgba(253,224,71,0.15)"}`,
              }}
            >
              {msgType === "success" ? (
                <CheckCircle
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  style={{ color: "#4ade80" }}
                />
              ) : (
                <AlertCircle
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  style={{ color: msgType === "error" ? "#f87171" : "#FDE047" }}
                />
              )}
              <p
                className="text-[11px] font-medium leading-relaxed"
                style={{
                  color:
                    msgType === "success"
                      ? "#4ade80"
                      : msgType === "error"
                        ? "#f87171"
                        : "rgba(253,224,71,0.85)",
                }}
              >
                {message}
              </p>
            </div>
          )}

          {/* Terms */}
          <p
            className="text-[9px] leading-relaxed text-center"
            style={{ color: "rgba(226,232,240,0.18)" }}
          >
            By continuing you agree to our terms. We may contact you via Call,
            SMS or WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
