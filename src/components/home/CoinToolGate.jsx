"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Coins, KeyRound, Loader2, Mail, MapPin, Phone, UserRound, X } from "lucide-react";
import { sendOtpAction, verifyOtpAction, completeRegistrationAction } from "@/app/actions/authActions";
import { clearImpersonation } from "@/lib/clientSession";
import { useAuthStore } from "@/stores/useAuthStore";
import { isIndianMobile } from "@/lib/walletTopup";

/** Save a login exactly like components/login.jsx does. */
function saveLogin(data, fallbackPhone) {
  clearImpersonation();
  const u = data.user || {};
  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", u.userId);
  if (u.fullName) localStorage.setItem("fullName", u.fullName);
  if (u.email) {
    localStorage.setItem("email", u.email);
    localStorage.setItem("userEmail", u.email);
  }
  localStorage.setItem("mobileNumber", u.phone || fallbackPhone);
  localStorage.setItem("paidPackage", u.paidPackage || "");
  localStorage.setItem("paidService", u.paidService || "");
}

export async function fetchWallet(userId) {
  try {
    const d = await fetch(`/api/users/userbalance?userId=${encodeURIComponent(userId)}`).then((r) => r.json());
    return typeof d?.user?.wallet === "number" ? d.user.wallet : null;
  } catch {
    return null;
  }
}

/**
 * Opening a coin tool (Text to Video, AI Avatar…) when signed out, without
 * leaving the page: mobile number → OTP (→ name/email/city for a new number),
 * then the wallet is checked against the tool's coin cost.
 *  - enough coins → `onEnough()` (open the tool)
 *  - not enough   → `onShort({ wallet, needed })` (open the top-up modal)
 * OTP is what proves the number is yours; without it anyone could open someone
 * else's account just by typing their number.
 */
export default function CoinToolGate({ tool, onClose, onEnough, onShort }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const [step, setStep] = useState("phone"); // phone | otp | details | checking
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [reg, setReg] = useState({ name: "", email: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, onClose]);

  const cost = tool.coinCost || 0;

  // Signed in now: compare the wallet with the tool's cost
  const afterLogin = async (data) => {
    saveLogin(data, phone);
    checkAuth?.();
    setStep("checking");
    const wallet = await fetchWallet(data.user.userId);
    if (wallet !== null && wallet < cost) onShort({ wallet, needed: cost - wallet });
    else onEnough();
  };

  const run = (fn) => async (e) => {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = run(async () => {
    if (!isIndianMobile(phone)) throw new Error("Enter a valid 10-digit mobile number.");
    const { ok, data } = await sendOtpAction(phone);
    if (!ok) throw new Error(data?.error || "Could not send the OTP.");
    setInfo(data.isExistingUser ? "Welcome back! Enter the OTP we sent." : "Enter the OTP we sent to create your account.");
    setStep("otp");
  });

  const verify = run(async () => {
    if (!/^\d{4,6}$/.test(otp)) throw new Error("Enter the OTP you received.");
    const { ok, data } = await verifyOtpAction(phone, otp);
    if (data?.step === "collect_details") return setStep("details");
    if (!ok || !data?.token) throw new Error(data?.error || "Invalid OTP.");
    await afterLogin(data);
  });

  const register = run(async () => {
    if (reg.name.trim().length < 2) throw new Error("Enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email.trim())) throw new Error("Enter a valid email address.");
    if (reg.city.trim().length < 2) throw new Error("Enter your city.");
    const { ok, data } = await completeRegistrationAction(phone, otp, reg.name.trim(), reg.email.trim(), reg.city.trim(), "", "");
    if (!ok || !data?.token) throw new Error(data?.error || "Could not create your account.");
    await afterLogin({ ...data, user: { fullName: reg.name.trim(), email: reg.email.trim(), phone, ...data.user } });
  });

  const input =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-[15px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-amber-400 focus:bg-white";

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Open ${tool.label}`}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <button
          type="button"
          onClick={() => !busy && onClose()}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 hover:text-slate-900"
        >
          <X size={18} />
        </button>

        <div className="pr-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800 ring-1 ring-amber-200">
            <Coins size={12} /> {cost ? `${cost} coins per video` : "Uses coins"}
          </span>
          <h3 className="mt-3 text-xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
            {tool.label}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {step === "phone" && "Enter your mobile number. We'll check your coins and take you straight in."}
            {step === "otp" && (info || "Enter the OTP we sent.")}
            {step === "details" && "New here! Tell us a little about you to create your account."}
            {step === "checking" && "Checking your coins…"}
          </p>
        </div>

        {step === "phone" && (
          <form onSubmit={sendOtp} className="mt-5">
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                aria-label="Mobile number"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={input}
              />
            </div>
            <Submit busy={busy} label="Get OTP" />
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verify} className="mt-5">
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="OTP"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${input} tracking-[0.3em]`}
              />
            </div>
            <Submit busy={busy} label="Verify & continue" />
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="mt-3 w-full text-center text-xs font-bold text-slate-500 hover:text-slate-900"
            >
              Change number ({phone})
            </button>
          </form>
        )}

        {step === "details" && (
          <form onSubmit={register} className="mt-5 space-y-2.5">
            {[
              ["name", "Your name", UserRound, "text"],
              ["email", "Email", Mail, "email"],
              ["city", "City", MapPin, "text"],
            ].map(([key, label, Icon, type]) => (
              <div key={key} className="relative">
                <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={type}
                  aria-label={label}
                  placeholder={label}
                  value={reg[key]}
                  onChange={(e) => setReg({ ...reg, [key]: e.target.value })}
                  className={input}
                />
              </div>
            ))}
            <Submit busy={busy} label="Create account & continue" />
          </form>
        )}

        {step === "checking" && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
            <Loader2 size={18} className="animate-spin" /> Checking your wallet…
          </div>
        )}

        {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}

        {step !== "checking" && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <CheckCircle2 size={12} /> Enough coins: we open the tool. Low on coins: top up right here.
          </p>
        )}
      </div>
    </div>
  );
}

function Submit({ busy, label }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] py-3.5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : null} {label} {!busy && <ArrowRight size={15} />}
    </button>
  );
}
