"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAutomation } from "./useAutomation";
import { AccessPanel, Activity, Card, Loading, PlanNotice, PlatformPicker, Segmented, Shell, Toggle, TryIt } from "./parts";

const TONES = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "short", label: "Short & sweet" },
];

/**
 * Comment Auto Reply and DM Auto Reply share this screen.
 * `section` = "commentReply" | "dmReply"; `permission` = "comments" | "dms".
 */
export default function ReplyFeature({ section, permission, kind, icon, title, subtitle, howItWorks, samplePlaceholder, emptyActivity }) {
  const a = useAutomation(section);
  const [form, setForm] = useState(null);
  const [business, setBusiness] = useState({ businessName: "", businessInfo: "" });
  const [saving, setSaving] = useState("");
  const [msg, setMsg] = useState({ text: "", error: false });

  useEffect(() => {
    if (!a.settings) return;
    setForm({ enabled: false, tone: "friendly", platforms: { facebook: true, instagram: true }, ...a.settings[section] });
    setBusiness({ businessName: a.settings.businessName || "", businessInfo: a.settings.businessInfo || "" });
  }, [a.settings, section]);

  if (a.loading || !form) return a.error ? <p className="p-6 text-sm font-semibold text-rose-600">{a.error}</p> : <Loading />;

  const flash = (text, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg({ text: "", error: false }), 3500);
  };

  const saveFeature = async (next) => {
    setForm(next);
    setSaving("feature");
    try {
      await a.save(section, next);
      flash(next.enabled ? "Saved. Auto replies are on." : "Saved.");
    } catch (err) {
      setForm(form); // undo
      flash(err.message, true);
    } finally {
      setSaving("");
    }
  };

  const saveBusiness = async () => {
    setSaving("business");
    try {
      await a.save("business", business);
      flash("Business details saved.");
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving("");
    }
  };

  const ready = a.accounts.some((acc) => acc.allow[permission]);

  return (
    <Shell
      icon={icon}
      title={title}
      subtitle={subtitle}
      aside={
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">{form.enabled ? "On" : "Off"}</p>
            <p className="text-xs text-slate-500">{form.enabled ? (ready ? "Replying automatically" : "Waiting for access") : "Not replying"}</p>
          </div>
          <Toggle label={`${title} on or off`} checked={form.enabled} disabled={!!saving} onChange={(v) => saveFeature({ ...form, enabled: v })} />
        </div>
      }
    >
      {msg.text && (
        <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${msg.error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{msg.text}</p>
      )}
      {a.socialPlan === false && <PlanNotice />}
      <AccessPanel accounts={a.accounts} feature={permission} userId={a.userId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Reply settings" text="How and where Limbu AI replies.">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Reply on</p>
          <PlatformPicker value={form.platforms} onChange={(platforms) => saveFeature({ ...form, platforms })} />
          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Tone</p>
          <Segmented options={TONES} value={form.tone} onChange={(tone) => saveFeature({ ...form, tone })} />
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            {howItWorks.map((h) => (
              <li key={h} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" /> {h}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="What should replies say?" text="Used for comment and DM replies. The AI never makes up prices or offers.">
          <input
            value={business.businessName}
            onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
            placeholder="Business name"
            aria-label="Business name"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white"
          />
          <textarea
            rows={5}
            value={business.businessInfo}
            onChange={(e) => setBusiness({ ...business, businessInfo: e.target.value })}
            placeholder={"Services, timings, address, phone, current offers…\ne.g. Open 10am–9pm, Sector 29 Gurgaon. Call 98xxxxxx. 20% off on facials this month."}
            aria-label="Business details"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none focus:border-amber-400 focus:bg-white"
          />
          <button
            type="button"
            onClick={saveBusiness}
            disabled={saving === "business"}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#facc15] px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {saving === "business" && <Loader2 size={15} className="animate-spin" />} Save details
          </button>
        </Card>
      </div>

      <Card title="Try it" text="See the reply the AI would send. Nothing is posted.">
        <TryIt
          placeholder={samplePlaceholder}
          run={async (text) => {
            const d = await a.preview({ kind, text, tone: form.tone });
            return <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">↳ {d.reply}</p>;
          }}
        />
      </Card>

      <Card title="Recent replies" text="Checked every 10 minutes.">
        <Activity logs={a.logs} empty={emptyActivity} />
      </Card>
    </Shell>
  );
}
