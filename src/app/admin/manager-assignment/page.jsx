"use client";

import { useEffect, useState, useMemo } from "react";

// ─── HELPERS ───────────────────────────────────────────
function getInitials(n = "") { return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDT(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── WA TEMPLATES ──────────────────────────────────────
const WA_TEMPLATES = [
  {
    id: "recharge", label: "Recharge Reminder", icon: "💳",
    chip: "bg-purple-100 text-purple-700",
    btn: "bg-purple-600 hover:bg-purple-700",
    build: (u) => `Hi ${u.fullName} 👋\n\nYour *Limbu.ai* account needs a recharge!\n\n💰 Wallet: ₹${u.wallet ?? 0}\n📦 Plan: ${u.subscription?.plan || "Free"}\n\nRecharge now → https://limbu.ai/recharge\n\nTeam Limbu.ai`,
  },
  {
    id: "expiring", label: "Sub Expiring Soon", icon: "⚠️",
    chip: "bg-amber-100 text-amber-700",
    btn: "bg-amber-500 hover:bg-amber-600",
    build: (u) => `Dear ${u.fullName} 👋\n\n⚠️ *Your subscription expires soon!*\n\n📦 Plan: *${u.subscription?.plan || "Free"}*\nStatus: ${u.subscription?.status || "—"}\n\nRenew now → https://limbu.ai/renew\n\nTeam Limbu.ai`,
  },
  {
    id: "expired", label: "Subscription Expired", icon: "🔴",
    chip: "bg-red-100 text-red-700",
    btn: "bg-red-500 hover:bg-red-600",
    build: (u) => `Hi ${u.fullName},\n\n🔴 *Your subscription has expired.*\n\nRestore access now → https://limbu.ai/renew\n\nNeed help? Just reply!\n\nTeam Limbu.ai`,
  },
  {
    id: "welcome", label: "Welcome Onboard", icon: "🎉",
    chip: "bg-emerald-100 text-emerald-700",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    build: (u) => `Welcome to Limbu.ai, ${u.fullName}! 🎉\n\n✅ Account ready\n📦 Plan: ${u.subscription?.plan || "Free"}\n\nExplore → https://limbu.ai\n\nTeam Limbu.ai`,
  },
  {
    id: "report_before", label: "Report — 1 Month Before", icon: "📊",
    chip: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    build: (u) => {
      const next = new Date(); next.setMonth(next.getMonth() + 1);
      return `Hi ${u.fullName} 👋\n\n📊 *Monthly Report — ${new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}*\n\n┌ Plan: ${u.subscription?.plan || "Free"}\n├ Status: ${u.subscription?.status || "—"}\n├ Wallet: ₹${u.wallet ?? 0}\n├ Free Used: ${u.freeUsedCount ?? 0}\n└ Service: ${u.isServiceBooked ? "✅ Booked" : "❌ Not Booked"}\n\n🔔 Renewal coming in *${next.toLocaleString("en-IN", { month: "long" })}*\n\n→ https://limbu.ai/dashboard\n\nTeam Limbu.ai`;
    },
  },
  {
    id: "report_after", label: "Report — 1 Month After", icon: "📈",
    chip: "bg-indigo-100 text-indigo-700",
    btn: "bg-indigo-600 hover:bg-indigo-700",
    build: (u) => {
      const last = new Date(); last.setMonth(last.getMonth() - 1);
      return `Hi ${u.fullName} 👋\n\n📈 *Post-Month Report — ${last.toLocaleString("en-IN", { month: "long", year: "numeric" })}*\n\n┌ Plan: ${u.subscription?.plan || "Free"}\n├ Wallet: ₹${u.wallet ?? 0}\n├ Sessions Used: ${u.freeUsedCount ?? 0}\n└ Business: ${u.isBusinessConnected ? "✅ Connected" : "❌ Not Connected"}\n\n💡 Upgrade → https://limbu.ai/upgrade\n\nTeam Limbu.ai`;
    },
  },
  {
    id: "custom", label: "Custom Message", icon: "✏️",
    chip: "bg-gray-100 text-gray-600",
    btn: "bg-gray-700 hover:bg-gray-800",
    build: () => "",
  },
];

const EMAIL_TEMPLATES = [
  {
    id: "recharge", label: "Recharge Reminder", icon: "💳",
    subject: (u) => `Action Required: Recharge Your Limbu.ai Account`,
    body: (u) => `Hi ${u.fullName},\n\nYour wallet balance is ₹${u.wallet ?? 0}. Please recharge to continue services.\n\nPlan: ${u.subscription?.plan || "Free"}\nStatus: ${u.subscription?.status || "—"}\n\nRecharge: https://limbu.ai/recharge\n\nTeam Limbu.ai`,
  },
  {
    id: "expiring", label: "Subscription Expiring", icon: "⚠️",
    subject: (u) => `Your Limbu.ai Subscription is Expiring Soon`,
    body: (u) => `Dear ${u.fullName},\n\nYour subscription (${u.subscription?.plan || "Free"}) is expiring soon.\n\nRenew: https://limbu.ai/renew\n\nTeam Limbu.ai`,
  },
  {
    id: "report_before", label: "Report — 1 Month Before", icon: "📊",
    subject: (u) => `Monthly Report — ${new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
    body: (u) => {
      const next = new Date(); next.setMonth(next.getMonth() + 1);
      return `Hi ${u.fullName},\n\nMonthly Account Summary:\n\nUser ID        : ${u.userId}\nPlan           : ${u.subscription?.plan || "Free"}\nStatus         : ${u.subscription?.status || "—"}\nWallet         : ₹${u.wallet ?? 0}\nFree Sessions  : ${u.freeUsedCount ?? 0}\nBusiness       : ${u.isBusinessConnected ? "Connected" : "Not Connected"}\nService Booked : ${u.isServiceBooked ? "Yes" : "No"}\n\nRenewal due in ${next.toLocaleString("en-IN", { month: "long" })}.\nRenew: https://limbu.ai/renew\n\nTeam Limbu.ai`;
    },
  },
  {
    id: "report_after", label: "Report — 1 Month After", icon: "📈",
    subject: (u) => { const l = new Date(); l.setMonth(l.getMonth()-1); return `Post-Month Report — ${l.toLocaleString("en-IN", { month: "long", year: "numeric" })}`; },
    body: (u) => { const l = new Date(); l.setMonth(l.getMonth()-1); return `Hi ${u.fullName},\n\nPost-month review for ${l.toLocaleString("en-IN", { month: "long", year: "numeric" })}:\n\nPlan    : ${u.subscription?.plan || "Free"}\nWallet  : ₹${u.wallet ?? 0}\nSessions: ${u.freeUsedCount ?? 0}\nBusiness: ${u.isBusinessConnected ? "Connected" : "Not Connected"}\n\nUpgrade: https://limbu.ai/upgrade\n\nTeam Limbu.ai`; },
  },
];

// ─── WA MODAL ──────────────────────────────────────────
function WaModal({ user, onClose }) {
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const pick = (tpl) => { setSel(tpl.id); setMsg(tpl.build(user)); };
  const send = () => {
    const n = user.phone?.replace(/\D/g, "");
    if (!n) return alert("Phone not available");
    window.open(`https://wa.me/91${n}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const copy = () => { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const active = WA_TEMPLATES.find(t => t.id === sel);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">WhatsApp Templates</p>
              <p className="text-xs text-gray-400">{user.fullName} · +91 {user.phone || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Template list */}
          <div className="lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto p-3 space-y-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Choose Template</p>
            {WA_TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => pick(tpl)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all border ${sel === tpl.id ? `${tpl.btn.split(" ")[0]} text-white border-transparent` : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100"}`}>
                <span className="text-base">{tpl.icon}</span>
                <span className="leading-tight text-xs">{tpl.label}</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
            {!sel ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-300">
                <span className="text-3xl">💬</span>
                <p className="text-sm text-gray-400 text-center">Select a template from the left to preview</p>
              </div>
            ) : (
              <>
                {active && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${active.chip}`}>
                      {active.icon} {active.label}
                    </span>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto bg-[#e5ddd5] rounded-xl p-3 mb-3 min-h-0">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#d9fdd3] rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm">
                      <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={10}
                        className="w-full bg-transparent text-[12.5px] text-gray-800 leading-relaxed resize-none outline-none font-sans min-w-[220px]" />
                      <p className="text-right text-[10px] text-gray-400 mt-1">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ✓✓</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={copy} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${copied ? "bg-gray-800 text-white border-gray-800" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}>
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <button onClick={send} disabled={!msg.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Open WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EMAIL MODAL ────────────────────────────────────────
function EmailModal({ user, onClose }) {
  const [sel, setSel] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const pick = (tpl) => { setSel(tpl.id); setSubject(tpl.subject(user)); setBody(tpl.body(user)); };
  const send = () => window.open(`mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  const copy = () => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Email Templates</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          <div className="lg:w-52 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto p-3 space-y-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Choose Template</p>
            {EMAIL_TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => pick(tpl)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${sel === tpl.id ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-blue-50 hover:border-blue-200"}`}>
                <span>{tpl.icon}</span><span>{tpl.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
            {!sel ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-300">
                <span className="text-3xl">📧</span>
                <p className="text-sm text-gray-400">Select a template to preview</p>
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                </div>
                <div className="flex-1 flex flex-col min-h-0 mb-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Body</label>
                  <textarea value={body} onChange={e => setBody(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-400 resize-none font-mono leading-relaxed min-h-0"/>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={copy} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${copied ? "bg-gray-800 text-white border-gray-800" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}>{copied ? "✓ Copied" : "Copy"}</button>
                  <button onClick={send} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Open Mail Client
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RENEW MODAL ────────────────────────────────────────
function RenewModal({ userId, onClose, onSuccess }) {
  const [plan, setPlan] = useState("Pro");
  const [dur, setDur] = useState("1");
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const go = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/renew-subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, plan, durationMonths: dur, utr, screenshot }) });
      const d = await res.json();
      if (d.success) { onSuccess(); onClose(); } else alert(d.error || "Failed");
    } catch { alert("Error"); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-xl">🔄</div>
            <p className="text-base font-bold text-gray-900">Renew Subscription</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-400">
              {["Free","Basic","Pro","Enterprise"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Duration</label>
            <select value={dur} onChange={e => setDur(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-400">
              <option value="1">1 Month</option><option value="3">3 Months</option><option value="6">6 Months</option><option value="12">12 Months</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">UTR Number</label>
            <input type="text" value={utr} onChange={e => setUtr(e.target.value)} placeholder="Enter UTR (Optional)" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-400" />
          </div>
          <div><label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Payment Screenshot</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl">Cancel</button>
          <button onClick={go} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2">
            {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>...</> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────
export default function AccountManagerLeads() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [selMgr, setSelMgr] = useState({});
  const [remarks, setRemarks] = useState({});
  const [expanded, setExpanded] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [waModal, setWaModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [renewModal, setRenewModal] = useState(null);
  const [filterAssign, setFilterAssign] = useState("all"); // all | assigned | unassigned

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/account-manager-leads?leadStage=Onboard";
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const d = await (await fetch(url)).json();
      if (d.success) setUsers(d.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchManagers = async () => {
    try { const d = await (await fetch("/api/admin/managers")).json(); if (d.success) setManagers(d.data); }
    catch(e) { console.error(e); }
  };

  useEffect(() => { fetchUsers(); fetchManagers(); }, []);

  const assignManager = async (userId) => {
    const mgr = selMgr[userId];
    if (!mgr) return alert("Please select a manager");
    setAssigning(userId);
    try {
      const d = await (await fetch("/api/admin/account-manager-leads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, accountManagerId: mgr, Remarks: remarks[userId] || "" }) })).json();
      if (d.success) { alert("Assigned!"); fetchUsers(); } else alert(d.error);
    } catch { alert("Error"); } finally { setAssigning(null); }
  };

  // ── STATS ──
  const stats = useMemo(() => {
    const total = users.length;
    const assigned = users.filter(u => u.accountManagerName).length;
    const unassigned = total - assigned;
    // per manager counts
    const perMgr = {};
    users.forEach(u => {
      if (u.accountManagerName) {
        perMgr[u.accountManagerName] = (perMgr[u.accountManagerName] || 0) + 1;
      }
    });
    return { total, assigned, unassigned, perMgr };
  }, [users]);

  // ── FILTERED USERS ──
  const filteredUsers = useMemo(() => {
    if (filterAssign === "assigned") return users.filter(u => u.accountManagerName);
    if (filterAssign === "unassigned") return users.filter(u => !u.accountManagerName);
    return users;
  }, [users, filterAssign]);

  const clearDates = () => { setStartDate(""); setEndDate(""); setTimeout(fetchUsers, 0); };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── HEADER ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Manager <span className="text-violet-600">Leads</span></h1>
          <p className="text-gray-400 text-sm mt-1">Onboard stage · Assign managers, track progress & send reports</p>
        </div>

        {/* ── STATS CARDS ── */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Leads", value: stats.total, icon: "👥", color: "bg-violet-50 border-violet-200", val: "text-violet-700", filter: "all" },
              { label: "Assigned", value: stats.assigned, icon: "✅", color: "bg-emerald-50 border-emerald-200", val: "text-emerald-700", filter: "assigned" },
              { label: "Unassigned", value: stats.unassigned, icon: "⚠️", color: "bg-red-50 border-red-200", val: "text-red-600", filter: "unassigned" },
              { label: "Managers", value: Object.keys(stats.perMgr).length, icon: "🧑‍💼", color: "bg-blue-50 border-blue-200", val: "text-blue-700", filter: "all" },
            ].map(s => (
              <button key={s.label} onClick={() => setFilterAssign(s.filter)}
                className={`${s.color} border rounded-2xl p-4 text-left transition-all hover:shadow-md ${filterAssign === s.filter && s.filter !== "all" ? "ring-2 ring-offset-1 ring-violet-400" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{s.icon}</span>
                  {filterAssign === s.filter && s.filter !== "all" && (
                    <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">Filtered</span>
                  )}
                </div>
                <p className={`text-2xl font-extrabold ${s.val}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* ── MANAGER LEADERBOARD ── */}
        {!loading && Object.keys(stats.perMgr).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Manager — Leads Assigned</p>
            <div className="space-y-2.5">
              {Object.entries(stats.perMgr).sort((a,b) => b[1]-a[1]).map(([name, count], i) => {
                const pct = Math.round((count / stats.total) * 100);
                const colors = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-pink-500"];
                const color = colors[i % colors.length];
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-700 truncate">{name}</p>
                        <span className="text-xs font-bold text-gray-500 ml-2 flex-shrink-0">{count} leads</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DATE FILTER + VIEW TABS ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Filter by Date Range</p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-500">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/>
                </div>
                <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-500">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/>
                </div>
                <button onClick={fetchUsers} className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Apply</button>
                {(startDate || endDate) && <button onClick={clearDates} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl">Clear</button>}
              </div>
            </div>
            {/* View filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {[["all","All"],["assigned","Assigned"],["unassigned","Unassigned"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilterAssign(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterAssign === val ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                  {label} {val !== "all" && `(${val === "assigned" ? stats.assigned : stats.unassigned})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-9 h-9 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin"/>
            <p className="text-gray-400 text-sm">Fetching leads...</p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
            <p className="text-sm text-gray-400">No leads found</p>
          </div>
        )}

        {/* ── CARDS ── */}
        {!loading && filteredUsers.length > 0 && (
          <div className="space-y-3">
            {filteredUsers.map(user => {
              const isAssigned = !!user.accountManagerName;
              return (
                <div key={user._id}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-200 border-l-4 ${isAssigned ? "border-l-emerald-400 border border-gray-200 hover:border-emerald-200" : "border-l-red-400 border border-gray-200 hover:border-red-200"}`}>

                  {/* ── CARD HEADER ── */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 flex-wrap justify-between">

                      {/* Left: Avatar + Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                          {getInitials(user.fullName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-gray-900 font-bold text-sm capitalize">{user.fullName}</p>
                            {/* ASSIGNED / UNASSIGNED TAG */}
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Assigned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"/> Unassigned
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">{user.email}</p>
                          <p className="text-gray-300 text-xs font-mono">{user.userId}</p>
                        </div>
                      </div>

                      {/* Right: Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {user.leadStage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-600 border border-violet-200">
                            {user.leadStage}
                          </span>
                        )}
                        {user.source && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            {user.source}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${user.subscription?.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                          {user.subscription?.plan || "Free"} · {user.subscription?.status || "inactive"}
                        </span>
                        {user.isBusinessConnected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-600 border border-teal-200">Biz ✓</span>
                        )}
                        {user.isServiceBooked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-600 border border-sky-200">Svc ✓</span>
                        )}
                      </div>
                    </div>

                    {/* ── MINI STATS ROW ── */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        { label: "📞", value: user.phone || "—" },
                        { label: "💰", value: `₹${user.wallet ?? 0}` },
                        { label: "🆓", value: `${user.freeUsedCount ?? 0} used` },
                        { label: "📅", value: formatDate(user.createdAt) },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs">
                          <span>{item.label}</span>
                          <span className="text-gray-600 font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── ASSIGNED MANAGER ROW ── */}
                    {isAssigned ? (
                      <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(user.accountManagerName)}
                        </div>
                        <span className="text-xs text-gray-500 font-semibold">Manager:</span>
                        <span className="text-sm text-emerald-700 font-bold">{user.accountManagerName}</span>
                        {user.accountManager?.email && <span className="text-gray-400 text-xs ml-auto hidden sm:block">{user.accountManager.email}</span>}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 bg-red-50 border border-dashed border-red-200 rounded-xl px-3 py-2">
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                        <span className="text-xs text-red-500 font-semibold">No manager assigned yet</span>
                      </div>
                    )}
                  </div>

                  {/* ── SUBSCRIPTION ── */}
                  <div className="px-4 sm:px-5 pb-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Subscription</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${user.subscription?.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                          {user.subscription?.status ? "active":"inactive"}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">Expiry Date 20/12/2026 </span>
                      </div>
                      <button onClick={() => setRenewModal(user.userId)} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Renew
                      </button>
                    </div>
                  </div>

                  {/* ── REMARKS ── */}
                  {user.remarksHistory?.length > 0 && (
                    <div className="px-4 sm:px-5 pb-3 border-t border-gray-100 pt-3">
                      <button onClick={() => setExpanded(p => ({ ...p, [user._id]: !p[user._id] }))}
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors font-bold uppercase tracking-widest">
                        <svg className={`w-3 h-3 transition-transform ${expanded[user._id] ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        Remarks ({user.remarksHistory.length})
                      </button>
                      {expanded[user._id] && (
                        <div className="mt-2 border-l-2 border-gray-100 pl-3 ml-1 space-y-1">
                          {user.remarksHistory.map(r => (
                            <div key={r._id} className="flex justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                              <p className="text-gray-600 text-xs leading-relaxed">{r.text}</p>
                              <p className="text-gray-400 text-xs whitespace-nowrap">{formatDT(r.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ACTION BAR ── */}
                  <div className="border-t border-gray-100 bg-gray-50/70 px-4 sm:px-5 py-4">
                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <p className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Send Report / Message</p>
                      <button onClick={() => setWaModal(user)}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp Template
                      </button>
                      <button onClick={() => setEmailModal(user)}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        Email Template
                      </button>
                    </div>

                    {/* Assign Manager */}
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {isAssigned ? "Reassign Manager" : "Assign Manager"}
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select value={selMgr[user.userId] || ""} onChange={e => setSelMgr(p => ({ ...p, [user.userId]: e.target.value }))}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer min-w-[180px]">
                        <option value="">Select Manager</option>
                        {managers.map(m => <option key={m._id} value={m._id}>{m.fullName}</option>)}
                      </select>
                      <input type="text" placeholder="Add remarks..." value={remarks[user.userId] || ""}
                        onChange={e => setRemarks(p => ({ ...p, [user.userId]: e.target.value }))}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder-gray-300 flex-1 min-w-[160px]"/>
                      <button onClick={() => assignManager(user.userId)} disabled={assigning === user.userId}
                        className={`flex items-center gap-2 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap disabled:opacity-40 ${isAssigned ? "bg-orange-500 hover:bg-orange-600" : "bg-violet-600 hover:bg-violet-700"}`}>
                        {assigning === user.userId ? (
                          <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>...</>
                        ) : isAssigned ? "Reassign →" : "Assign →"}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      {waModal && <WaModal user={waModal} onClose={() => setWaModal(null)} />}
      {emailModal && <EmailModal user={emailModal} onClose={() => setEmailModal(null)} />}
      {renewModal && <RenewModal userId={renewModal} onClose={() => setRenewModal(null)} onSuccess={fetchUsers} />}
    </div>
  );
}