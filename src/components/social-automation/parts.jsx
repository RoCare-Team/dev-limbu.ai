"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ChevronRight, ExternalLink, Loader2, Lock, Plus, ShieldCheck, Sparkles } from "lucide-react";

export const PLATFORM = {
  facebook: { name: "Facebook", icon: "/social-icon/facebook-icon.png" },
  instagram: { name: "Instagram", icon: "/social-icon/instagram-icon.png" },
};

/** Page frame: breadcrumb, title block, content. */
export function Shell({ icon: Icon, title, subtitle, children, aside }) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <nav className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
        <Link href="/social-media" className="hover:text-slate-900">
          Social Media
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-900">{title}</span>
      </nav>
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#facc15] text-slate-950">
            <Icon size={22} strokeWidth={2.3} />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              {title}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          </div>
        </div>
        {aside}
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

export function Card({ title, text, children, right }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      {(title || right) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-black text-slate-900">{title}</h2>}
            {text && <p className="mt-0.5 text-sm text-slate-500">{text}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/** Facebook / Instagram checkboxes. */
export function PlatformPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(PLATFORM).map(([key, p]) => {
        const on = value?.[key] !== false;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange({ ...value, [key]: !on })}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ring-1 transition ${
              on ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-500 ring-slate-200 hover:ring-slate-400"
            }`}
          >
            <Image src={p.icon} alt="" width={16} height={16} /> {p.name}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${value === o.value ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-800"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const connectUrl = (platform, userId) => `/api/${platform}/login?userId=${encodeURIComponent(userId || "")}&automation=1`;

/**
 * Connection / permission status for a feature: no accounts → connect them;
 * accounts without the permission → "Allow access" (incremental Meta login).
 */
export function AccessPanel({ accounts, feature, userId }) {
  if (!accounts.length) {
    return (
      <div className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-black text-slate-900">Connect Facebook or Instagram first</p>
            <p className="text-sm text-slate-600">This works on the pages and accounts you connect to Limbu AI.</p>
          </div>
        </div>
        <Link href="/social-media" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
          <Plus size={15} /> Connect accounts
        </Link>
      </div>
    );
  }
  return (
    <Card title="Connected accounts" text="Limbu AI needs your permission to do this on each account.">
      <ul className="divide-y divide-slate-100">
        {accounts.map((a) => (
          <li key={`${a.platform}-${a.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
              <Image src={PLATFORM[a.platform].icon} alt="" width={20} height={20} /> {a.name}
            </span>
            {a.allow[feature] ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                <ShieldCheck size={13} /> Ready
              </span>
            ) : (
              <a
                href={connectUrl(a.platform, userId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#facc15] px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"
              >
                <Lock size={13} /> Allow access on {PLATFORM[a.platform].name}
              </a>
            )}
          </li>
        ))}
      </ul>
      {accounts.some((a) => !a.allow[feature]) && (
        <p className="mt-3 text-xs text-slate-500">
          You will be asked to sign in to {accounts.some((a) => a.platform === "facebook") ? "Facebook" : "Instagram"} and approve the new permission. Nothing is posted
          without your settings below.
        </p>
      )}
    </Card>
  );
}

/** Needs a Social plan to switch on. */
export function PlanNotice() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Lock size={20} className="mt-0.5 flex-shrink-0 text-amber-700" />
        <div>
          <p className="font-black text-slate-900">Included in the Social plans</p>
          <p className="text-sm text-slate-600">Set it up now; switch it on with Social Starter, Growth or Pro.</p>
        </div>
      </div>
      <Link href="/#tools-social_media" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
        <Sparkles size={15} /> See Social plans
      </Link>
    </div>
  );
}

/** Try the AI on a sample message. `run(text)` returns the result node. */
export function TryIt({ placeholder, button = "Preview reply", run }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const go = async () => {
    setBusy(true);
    setError("");
    try {
      setResult(await run(text));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none focus:border-amber-400 focus:bg-white"
      />
      <button
        type="button"
        onClick={go}
        disabled={busy || !text.trim()}
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} className="text-[#facc15]" />} {button}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
      {result && <div className="mt-3">{result}</div>}
    </div>
  );
}

const ago = (d) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 3600) return `${Math.round(s / 60) || 1} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/** Latest automation activity. `actions(log)` can render buttons per row. */
export function Activity({ logs, empty, actions }) {
  if (!logs.length) return <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-3">
      {logs.map((l) => (
        <li key={l._id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Image src={PLATFORM[l.platform].icon} alt="" width={14} height={14} /> {l.accountName}
              {l.authorName ? ` · ${l.authorName}` : ""}
            </span>
            <span className="flex items-center gap-2">
              {ago(l.createdAt)}
              {l.permalink && (
                <a href={l.permalink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-800" aria-label="Open post">
                  <ExternalLink size={13} />
                </a>
              )}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-800">“{l.text}”</p>
          {l.reply && <p className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-700 ring-1 ring-slate-200">↳ {l.reply}</p>}
          {l.reason && <p className="mt-1.5 text-xs font-semibold text-rose-600">{l.reason}</p>}
          {actions?.(l)}
        </li>
      ))}
    </ul>
  );
}

export function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
      <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}
