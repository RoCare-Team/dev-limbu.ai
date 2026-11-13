"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Coins, Loader2, Phone, ShieldCheck, UserRound, Wallet, X } from "lucide-react";
import ToolGrid from "./ToolGrid";
import { ToolCard } from "./ToolCard";
import CoinToolGate, { fetchWallet } from "./CoinToolGate";
import { actionHref } from "@/lib/homeSections/links";
import { TOPUP_MIN, TOPUP_PRESETS, cleanPhone, isIndianMobile, topupPricing, validTopupAmount } from "@/lib/walletTopup";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Signed-in user from localStorage (same keys login.jsx writes), or null. */
function readSession() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return null;
    return {
      userId,
      phone: cleanPhone(localStorage.getItem("mobileNumber")),
      name: localStorage.getItem("fullName") || "",
    };
  } catch {
    return null;
  }
}

/**
 * The "Create AI Video" home section: its tool cards, plus a banner that opens
 * the coin top-up modal. Clicking a card never leaves for /login:
 *  - signed in: enough coins -> the tool; too few -> top-up modal, then the tool
 *  - signed out: CoinToolGate (number + OTP, in a modal), then the same check
 * The banner's top-up needs no login at all. No login: the account
 * is found by mobile number (/api/wallet/lookup) and paid for with Razorpay
 * (/api/wallet/order + /api/wallet/verify). A signed-in user gets their number
 * filled in and their balance shown. A new number asks for name + email and
 * gets an account.
 */
export default function WalletTopup({ items = [] }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [balance, setBalance] = useState(null);
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState({ state: "idle" }); // idle | checking | found | new | error
  const [details, setDetails] = useState({ name: "", email: "" });
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { coins, wallet }
  const lookupId = useRef(0);
  const router = useRouter();
  const [gate, setGate] = useState(null); // tool waiting for number + OTP (signed out)
  const [intent, setIntent] = useState(null); // { href, label, wallet, cost } when topping up to open a tool

  // Signed in: fill the number and show the balance
  useEffect(() => {
    const s = readSession();
    if (!s) return;
    setSession(s);
    if (s.phone) setPhone(s.phone);
    fetch(`/api/users/userbalance?userId=${encodeURIComponent(s.userId)}`)
      .then((r) => r.json())
      .then((d) => typeof d?.user?.wallet === "number" && setBalance(d.user.wallet))
      .catch(() => {});
  }, []);

  // Look the number up as soon as it has 10 digits
  useEffect(() => {
    setError("");
    if (!isIndianMobile(phone)) {
      setLookup({ state: phone.length === 10 ? "error" : "idle", message: phone.length === 10 ? "Enter a valid Indian mobile number." : "" });
      return;
    }
    const id = ++lookupId.current;
    setLookup({ state: "checking" });
    fetch("/api/wallet/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (id !== lookupId.current) return;
        if (!d.success) return setLookup({ state: "error", message: d.error });
        setLookup(d.found ? { state: "found", name: d.name } : { state: "new" });
      })
      .catch(() => id === lookupId.current && setLookup({ state: "error", message: "Could not check this number. Try again." }));
  }, [phone]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !paying && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, paying]);

  const isMe = !!session && session.phone === phone;
  const chosen = custom ? validTopupAmount(Number(custom)) : amount;
  const price = chosen ? topupPricing(chosen) : null;
  const ready = (lookup.state === "found" || lookup.state === "new") && !!price && !paying;

  const pay = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setError("");
    setPaying(true);
    try {
      if (!(await loadRazorpay())) throw new Error("Could not load the payment window. Check your connection.");
      const orderRes = await fetch("/api/wallet/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount: chosen, ...(lookup.state === "new" ? details : {}) }),
      });
      const order = await orderRes.json();
      if (!order.success) throw new Error(order.error || "Could not start the payment.");

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: "Limbu AI Wallet",
          description: `${chosen} coins`,
          prefill: { contact: phone, ...(isMe && session.name ? { name: session.name } : {}), ...(details.email ? { email: details.email } : {}) },
          theme: { color: "#facc15" },
          modal: { ondismiss: () => resolve(null) },
          handler: async (payment) => {
            try {
              const v = await fetch("/api/wallet/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment }),
              }).then((r) => r.json());
              if (!v.success) return reject(new Error(v.error || "Payment could not be confirmed."));
              setDone({ coins: v.coinsAdded, wallet: v.wallet });
              if (isMe) setBalance(v.wallet);
              resolve(v);
            } catch {
              reject(new Error("Payment could not be confirmed. Contact support if money was deducted."));
            }
          },
        });
        rzp.on("payment.failed", () => reject(new Error("Payment failed. No money was taken, please try again.")));
        rzp.open();
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  // Top-up modal; from a tool: the shortfall preselected and "Continue" afterwards
  const openTopup = (next = null) => {
    setIntent(next);
    setDone(null);
    setError("");
    if (next) {
      const need = Math.max(TOPUP_MIN, next.cost - next.wallet);
      const preset = TOPUP_PRESETS.find((p) => p >= need);
      if (preset) {
        setAmount(preset);
        setCustom("");
      } else setCustom(String(need));
    }
    setOpen(true);
  };

  // Card click: enough coins -> the tool, too few -> top up, signed out -> number + OTP first
  const openTool = async (item) => {
    const href = actionHref(item.action);
    const cost = item.coinCost || 0;
    const s = readSession();
    if (!s) return setGate(item);
    const wallet = await fetchWallet(s.userId);
    if (wallet === null || wallet >= cost) return router.push(href);
    setBalance(wallet);
    openTopup({ href, label: item.label, wallet, cost });
  };

  return (
    <>
      <ToolGrid className="mt-6 sm:mt-8 lg:mt-10">
        {items.map((item) => (
          <ToolCard key={item.key} item={item} onCardClick={() => openTool(item)} />
        ))}
      </ToolGrid>

      {/* Banner in the section */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_60%)] p-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:mt-10">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15] text-slate-950">
            <Wallet size={20} strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-sm font-black text-slate-900 sm:text-[15px]">Top up coins for AI videos</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">
              {isMe && balance !== null
                ? `Your balance: ${balance.toLocaleString("en-IN")} coins · add more in a minute`
                : "No login needed: just your mobile number. 1 coin = ₹1."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openTopup()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-slate-700 sm:w-auto"
        >
          <Coins size={16} className="text-[#facc15]" /> Top up coins <ArrowRight size={15} />
        </button>
      </div>

      {open && (
      <div
        className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={() => !paying && setOpen(false)}
      >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Top up coins"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_55%)] shadow-2xl sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={() => !paying && setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow ring-1 ring-slate-200 transition hover:text-slate-900"
        >
          <X size={18} />
        </button>
      <div className="grid grid-cols-1 gap-4 p-4 pt-5 sm:gap-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-8">
        {/* Pitch */}
        <div className="pr-10 md:pr-0">
          <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-[#facc15] text-slate-950 md:flex">
            <Wallet size={20} strokeWidth={2.4} />
          </span>
          <h3 className="text-lg md:mt-3 font-black text-slate-900 sm:text-xl" style={{ fontFamily: "var(--font-heading)" }}>
            {intent ? `Add coins for ${intent.label}` : "Top up coins for AI videos"}
          </h3>
          {intent ? (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
              You have {intent.wallet.toLocaleString("en-IN")} coins. {intent.label} needs {intent.cost.toLocaleString("en-IN")}, so add at least{" "}
              {(intent.cost - intent.wallet).toLocaleString("en-IN")} more.
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-slate-600">
              No login needed. Enter your mobile number, pick an amount and pay. Coins land in your Limbu AI wallet instantly.
            </p>
          )}
          <ul className="mt-3 hidden space-y-1.5 text-[13px] font-semibold text-slate-700 md:block">
            <li className="flex items-center gap-2"><Coins size={15} className="text-amber-600" /> 1 coin = ₹1, coins never expire</li>
            <li className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-600" /> Secure payment via Razorpay</li>
          </ul>
          {isMe && balance !== null && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-800 ring-1 ring-amber-200">
              <Coins size={14} className="text-amber-600" /> Your balance: {balance.toLocaleString("en-IN")} coins
            </p>
          )}
        </div>

        {/* Form */}
        {done ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center ring-1 ring-emerald-200">
            <CheckCircle2 size={40} className="text-emerald-500" />
            <p className="mt-3 text-lg font-black text-slate-900">{done.coins.toLocaleString("en-IN")} coins added</p>
            <p className="mt-1 text-sm text-slate-600">
              {typeof done.wallet === "number" ? `Wallet balance: ${done.wallet.toLocaleString("en-IN")} coins. ` : ""}
              {intent ? "" : session ? "" : `Log in with ${phone} to create your video.`}
            </p>
            {intent && (
              <button
                type="button"
                onClick={() => router.push(intent.href)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#facc15] px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
              >
                Continue to {intent.label} <ArrowRight size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDone(null)}
              className="mt-4 text-sm font-bold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Top up again
            </button>
          </div>
        ) : (
          <form onSubmit={pay} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
            <label htmlFor="topup-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mobile number
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-amber-400 focus-within:bg-white">
              <Phone size={16} className="shrink-0 text-slate-400" />
              <span className="text-sm font-semibold text-slate-500">+91</span>
              <input
                id="topup-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => {
                  setDone(null);
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                }}
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
              />
              {lookup.state === "checking" && <Loader2 size={16} className="animate-spin text-slate-400" />}
              {lookup.state === "found" && <CheckCircle2 size={18} className="text-emerald-500" />}
            </div>

            {/* What we found for this number */}
            <div className="mt-2 min-h-[20px] text-[13px] font-semibold" aria-live="polite">
              {lookup.state === "found" && (
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <UserRound size={14} /> {isMe && session.name ? session.name : lookup.name} · account found
                </span>
              )}
              {lookup.state === "new" && <span className="text-slate-600">New here? Add your name and email and we will create your account.</span>}
              {lookup.state === "error" && <span className="text-rose-600">{lookup.message}</span>}
            </div>

            {lookup.state === "new" && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  aria-label="Your name"
                  placeholder="Your name"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white"
                />
                <input
                  aria-label="Email"
                  type="email"
                  placeholder="Email"
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>
            )}

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {TOPUP_PRESETS.map((p) => {
                const active = !custom && amount === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setAmount(p);
                      setCustom("");
                    }}
                    className={`rounded-xl px-2 py-2.5 text-sm font-black transition-all ${
                      active ? "bg-slate-900 text-white shadow-md" : "bg-slate-50 text-slate-800 ring-1 ring-slate-200 hover:ring-slate-400"
                    }`}
                  >
                    {inr(p)}
                  </button>
                );
              })}
              <input
                aria-label="Other amount"
                inputMode="numeric"
                placeholder="Other"
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`col-span-1 rounded-xl px-2 py-2.5 text-center text-sm font-black outline-none sm:col-span-5 sm:text-left sm:px-3 ${
                  custom ? "bg-white ring-2 ring-slate-900" : "bg-slate-50 ring-1 ring-slate-200"
                }`}
              />
            </div>
            {custom && !chosen && <p className="mt-1.5 text-xs font-semibold text-rose-600">Minimum {inr(TOPUP_MIN)}, maximum ₹1,00,000.</p>}

            {price && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-sm">
                <span className="font-semibold text-slate-700">
                  <b className="text-slate-900">{price.amount.toLocaleString("en-IN")} coins</b> · {inr(price.amount)} + {inr(price.gst)} GST
                </span>
                <span className="font-black text-slate-900">{inr(price.total)}</span>
              </div>
            )}

            {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={!ready}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] py-3.5 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
              {price ? `Pay ${inr(price.total)} & add coins` : "Choose an amount"}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <ShieldCheck size={12} /> Secure payment via Razorpay · coins never expire
            </p>
          </form>
        )}
      </div>
      </div>
      </div>
      )}

      {/* Signed out + clicked a tool: number + OTP, then the coin check */}
      {gate && (
        <CoinToolGate
          tool={gate}
          onClose={() => setGate(null)}
          onEnough={() => router.push(actionHref(gate.action))}
          onShort={({ wallet }) => {
            const s = readSession();
            setSession(s);
            if (s?.phone) setPhone(s.phone);
            setBalance(wallet);
            const item = gate;
            setGate(null);
            openTopup({ href: actionHref(item.action), label: item.label, wallet, cost: item.coinCost || 0 });
          }}
        />
      )}
    </>
  );
}
