"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";
import { useLeadModalStore } from "@/stores/useLeadModalStore";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#eab308] focus:bg-white focus:ring-4 focus:ring-[#facc15]/20";

const EMPTY = { name: "", phone: "", email: "", requirement: "" };

/**
 * Enquiry form for services sold by quote (Custom CRM, Custom App). Saves the
 * lead through /api/contact-form (Contact Leads in admin + a confirmation email).
 * Mounted once on the page; opened with useLeadModalStore().open(service, topic).
 */
export default function LeadFormModal() {
  const { service, topic, close } = useLeadModalStore();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  useEffect(() => {
    if (!service) return;
    setForm({ ...EMPTY, requirement: topic ? `I'm interested in: ${topic}` : "" });
    setStatus("idle");
    setError("");
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [service, topic, close]);

  if (!service || typeof document === "undefined") return null;

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[A-Za-z\s]{2,40}$/.test(form.name.trim())) return setError("Enter your name (letters only).");
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return setError("Enter a valid 10-digit mobile number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Enter a valid email address.");
    if (form.requirement.trim().length < 5) return setError("Tell us a little about what you need.");
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          message: `[${service}] ${form.requirement.trim()}`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Could not send your enquiry.");
      setStatus("sent");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${service} enquiry`}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <X size={18} />
        </button>

        {status === "sent" ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 size={34} />
            </span>
            <h2 className="mt-5 text-2xl font-black text-slate-900">Thanks, {form.name.split(" ")[0]}!</h2>
            <p className="mt-2 text-sm text-slate-500">
              We got your {service} enquiry. Our team will call you on {form.phone} with a free quote. A confirmation email is on its way.
            </p>
            <button type="button" onClick={close} className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="text-xs font-black uppercase tracking-widest text-[#ca8a04]">Free quote</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Get your {service}</h2>
            <p className="mt-1 text-sm text-slate-500">Share a few details and our team will call you with a plan and price.</p>

            <div className="mt-5 space-y-2.5">
              <input className={INPUT} placeholder="Your name *" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
              <input className={INPUT} placeholder="Mobile number *" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
              <input className={INPUT} placeholder="Email *" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              <textarea
                className={`${INPUT} min-h-[96px] resize-y`}
                placeholder={`What do you need in your ${service}? *`}
                value={form.requirement}
                onChange={(e) => set("requirement", e.target.value.slice(0, 1000))}
              />
            </div>

            {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">{error}</p>}

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_6px_16px_rgba(234,179,8,0.35)] transition hover:bg-[#eab308] disabled:opacity-60"
            >
              {status === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {status === "sending" ? "Sending…" : "Get a Free Quote"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
