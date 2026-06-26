import React, { useState } from "react";
import { ExternalLink, Plus, X, CheckCircle } from "lucide-react";
import Image from "next/image";
import CircularProgress from "@mui/material/CircularProgress";

const WhatsappColumn = React.memo(
  ({
    accountStatus = { checked: false, exists: false },
    checking = false,
    signupWhatsapp,
    openWhatsappDashboard,
    loading = false,
    userName = "",
    userEmail = "",
  }) => {
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      workspaceName: "",
    });

    const exists = accountStatus?.exists;

    const openSignup = () => {
      setForm({
        name: userName || "",
        email: userEmail || "",
        password: "",
        workspaceName: userName ? `${userName} Business` : "",
      });
      setShowSignupModal(true);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const result = await signupWhatsapp?.({
        name: form.name,
        email: form.email,
        password: form.password,
        workspaceName: form.workspaceName,
      });
      if (result?.success) {
        setShowSignupModal(false);
      }
    };

    return (
      <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden w-full h-[calc(100vh-220px)] min-h-[500px]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b-2 border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3">
              <Image
                src="/social-icon/whatsaap-icon.png"
                alt="WhatsApp"
                width={32}
                height={32}
                className="object-contain"
              />

              <h2
                className="font-bold text-lg text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                WhatsApp Automation
              </h2>

              {exists && (
                <span className="ml-2 text-[10px] bg-black text-green-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Connected
                </span>
              )}
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {!checking && exists && (
                <button
                  onClick={() => openWhatsappDashboard?.(userEmail)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-green-600 transition-all shadow-sm disabled:opacity-60"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open WhatsApp Dashboard
                </button>
              )}

              {!checking && !exists && (
                <button
                  onClick={openSignup}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-green-600 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Connect WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 custom-scroll flex-1 bg-slate-50/50">
          {checking ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <CircularProgress size={48} thickness={4} sx={{ color: "#22c55e" }} />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-6">
                Checking WhatsApp account...
              </p>
            </div>
          ) : exists ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              {/* Success badge */}
              <div className="relative mb-6">
                <Image
                  src="/social-icon/whatsaap-icon.png"
                  alt="WhatsApp"
                  width={80}
                  height={80}
                  className="object-contain"
                />
                <CheckCircle className="absolute -bottom-1 -right-1 w-7 h-7 text-green-500 bg-white rounded-full" />
              </div>

              <h3 className="text-black font-black uppercase tracking-tight mb-2 text-lg">
                You already have a WhatsApp account
              </h3>

              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
                Your WhatsApp Business account is connected. Open the WhatsApp
                dashboard to manage messages, broadcasts, and automations.
              </p>

              <button
                onClick={() => openWhatsappDashboard?.(userEmail)}
                disabled={loading}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              >
                <ExternalLink className="w-4 h-4" />
                {loading ? "Opening..." : "Open WhatsApp Dashboard"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              {/* Logo */}
              <Image
                src="/social-icon/whatsaap-icon.png"
                alt="WhatsApp"
                width={80}
                height={80}
                className="object-contain mb-6"
              />

              {/* Title */}
              <h3 className="text-black font-black uppercase tracking-tight mb-2 text-lg">
                Connect to WhatsApp
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
                Connect your WhatsApp Business account to automate messages,
                broadcasts, replies, and customer engagement directly from your
                dashboard.
              </p>

              {/* Connect button */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={openSignup}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm transition-all hover:scale-105"
                >
                  Connect WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Signup Modal */}
        {showSignupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b-2 border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <Image
                    src="/social-icon/whatsaap-icon.png"
                    alt="WhatsApp"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                  <h3 className="font-bold text-base text-black uppercase tracking-tight">
                    Connect WhatsApp
                  </h3>
                </div>
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:border-green-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:border-green-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Enter a password"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:border-green-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={form.workspaceName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, workspaceName: e.target.value }))
                    }
                    placeholder="My Business"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:border-green-400 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Connecting..." : "Sign Up & Continue"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  },
);

WhatsappColumn.displayName = "WhatsappColumn";

export default WhatsappColumn;
