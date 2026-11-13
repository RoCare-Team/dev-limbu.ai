"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, EyeOff, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import { useAutomation } from "@/components/social-automation/useAutomation";
import { AccessPanel, Activity, Card, Loading, PlanNotice, PlatformPicker, Segmented, Shell, Toggle, TryIt } from "@/components/social-automation/parts";

const ACTIONS = [
  { value: "hide", label: "Hide (recommended)" },
  { value: "delete", label: "Delete" },
];

/** Delete Negative Comments: hide or delete abusive / spam comments automatically. */
export default function NegativeCommentsPage() {
  const a = useAutomation("moderation");
  const [form, setForm] = useState(null);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", error: false });
  const [restoring, setRestoring] = useState("");

  useEffect(() => {
    if (a.settings) setForm({ enabled: false, action: "hide", useAi: true, blockedWords: [], platforms: { facebook: true, instagram: true }, ...a.settings.moderation });
  }, [a.settings]);

  if (a.loading || !form) return a.error ? <p className="p-6 text-sm font-semibold text-rose-600">{a.error}</p> : <Loading />;

  const flash = (text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg({ text: "", error: false }), 3500);
  };

  const save = async (next) => {
    const prev = form;
    setForm(next);
    setBusy(true);
    try {
      await a.save("moderation", next);
      flash("Saved.");
    } catch (err) {
      setForm(prev);
      flash(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  const addWord = () => {
    const w = word.trim().toLowerCase();
    if (!w || form.blockedWords.includes(w)) return setWord("");
    setWord("");
    save({ ...form, blockedWords: [...form.blockedWords, w] });
  };

  const unhide = async (log) => {
    setRestoring(log._id);
    try {
      const d = await fetch("/api/social/automation/unhide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: a.userId, logId: log._id }),
      }).then((r) => r.json());
      if (!d.success) throw new Error(d.error);
      flash("Comment is visible again.");
      a.reload();
    } catch (err) {
      flash(err.message || "Could not unhide.", true);
    } finally {
      setRestoring("");
    }
  };

  const ready = a.accounts.some((acc) => acc.allow.moderation);

  return (
    <Shell
      icon={ShieldAlert}
      title="Delete Negative Comments"
      subtitle="Abusive, hateful and spam comments are hidden or deleted automatically. Genuine complaints are left for you."
      aside={
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">{form.enabled ? "On" : "Off"}</p>
            <p className="text-xs text-slate-500">{form.enabled ? (ready ? "Protecting your posts" : "Waiting for access") : "Not checking"}</p>
          </div>
          <Toggle label="Negative comment protection on or off" checked={form.enabled} disabled={busy} onChange={(v) => save({ ...form, enabled: v })} />
        </div>
      }
    >
      {msg.text && <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${msg.error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{msg.text}</p>}
      {a.socialPlan === false && <PlanNotice />}
      <AccessPanel accounts={a.accounts} feature="moderation" userId={a.userId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Protection settings">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Protect</p>
          <PlatformPicker value={form.platforms} onChange={(platforms) => save({ ...form, platforms })} />
          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">When a comment is negative</p>
          <Segmented options={ACTIONS} value={form.action} onChange={(action) => save({ ...form, action })} />
          <p className="mt-2 text-xs text-slate-500">
            {form.action === "hide"
              ? "Hidden comments stay visible to the person who wrote them and their friends, so there is no argument. You can unhide them below."
              : "Deleted comments are gone for good and cannot be restored."}
          </p>
          <label className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <span>
              <span className="block text-sm font-bold text-slate-800">AI detection</span>
              <span className="block text-xs text-slate-500">Understands abuse and spam in English, Hindi and Hinglish.</span>
            </span>
            <Toggle label="AI detection" checked={form.useAi} disabled={busy} onChange={(useAi) => save({ ...form, useAi })} />
          </label>
        </Card>

        <Card title="Blocked words" text="Always hidden, on top of common abusive words and spam links.">
          <div className="flex gap-2">
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWord())}
              placeholder="Add a word, e.g. a competitor's name"
              aria-label="Blocked word"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white"
            />
            <button type="button" onClick={addWord} disabled={busy} className="rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.blockedWords.length === 0 && <p className="text-sm text-slate-400">No custom words yet.</p>}
            {form.blockedWords.map((w) => (
              <span key={w} className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                {w}
                <button
                  type="button"
                  aria-label={`Remove ${w}`}
                  onClick={() => save({ ...form, blockedWords: form.blockedWords.filter((x) => x !== w) })}
                  className="text-rose-400 hover:text-rose-700"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Test a comment" text="Check what would be hidden. Nothing is changed on your posts.">
        <TryIt
          button="Check comment"
          placeholder="e.g. Fraud company, sab paise kha jaate ho"
          run={async (text) => {
            const d = await a.preview({ kind: "moderation", text, blockedWords: form.blockedWords, useAi: form.useAi });
            return d.negative ? (
              <p className="flex items-start gap-2 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
                {form.action === "delete" ? <Trash2 size={16} className="mt-0.5" /> : <EyeOff size={16} className="mt-0.5" />}
                Would be {form.action === "delete" ? "deleted" : "hidden"}. {d.reason}
              </p>
            ) : (
              <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                <CheckCircle2 size={16} className="mt-0.5" /> Looks fine, it stays on your post.
              </p>
            );
          }}
        />
      </Card>

      <Card title="Hidden and deleted comments" text="Checked every 10 minutes.">
        <Activity
          logs={a.logs}
          empty="Nothing hidden yet. Negative comments will show here."
          actions={(l) =>
            l.kind === "hidden" && !l.restored ? (
              <button
                type="button"
                onClick={() => unhide(l)}
                disabled={restoring === l._id}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400"
              >
                {restoring === l._id && <Loader2 size={12} className="animate-spin" />} Unhide
              </button>
            ) : (
              <p className="mt-2 text-xs font-bold text-slate-400">{l.kind === "deleted" ? "Deleted" : l.restored ? "Unhidden by you" : ""}</p>
            )
          }
        />
      </Card>
    </Shell>
  );
}
