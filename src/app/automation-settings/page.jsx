"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "@/hooks/useAppSession";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function toInputDate(d) {
  if (!d) return "";
  try { return new Date(d).toISOString().slice(0, 10); }
  catch { return ""; }
}

function calculateSchedule({ startDate, frequency, postsLimit, expiryDate }) {
  if (!startDate || !postsLimit) return [];
  const dates = [];
  let cur = new Date(startDate);
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const step = { daily: 1, alternate: 2, weekly: 7, monthly: 30 }[frequency] ?? 1;
  while (dates.length < postsLimit) {
    if (expiry && cur > expiry) break;
    dates.push(new Date(cur));
    cur = new Date(cur);
    cur.setDate(cur.getDate() + step);
  }
  return dates;
}

// ─── UI Components ────────────────────────────────────────────────────────────

function StatusPill({ label, variant }) {
  const t = {
    active:  { bg: "#dcfce7", color: "#15803d", dot: "#16a34a" },
    expired: { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
    popular: { bg: "#fef9c3", color: "#854d0e", dot: "#ca8a04" },
    gray:    { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
  }[variant] || { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: t.bg, color: t.color, padding: "3px 10px",
      borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function Card({ children, style = {}, highlighted = false }) {
  return (
    <div style={{
      background: "#fff",
      border: highlighted ? "2px solid #FDD835" : "1px solid #e5e7eb",
      borderRadius: 14, padding: "20px 22px",
      boxShadow: highlighted ? "0 4px 20px rgba(253,216,53,.15)" : "0 1px 4px rgba(0,0,0,.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange} role="switch" aria-checked={checked}
      style={{
        width: 50, height: 28, borderRadius: 14, border: "none",
        background: checked ? "#FDD835" : "#d1d5db",
        position: "relative", cursor: "pointer",
        transition: "background .2s", flexShrink: 0, outline: "none",
        boxShadow: checked ? "0 0 0 3px rgba(253,216,53,.3)" : "none",
      }}>
      <span style={{
        position: "absolute", top: 4, left: checked ? 26 : 4,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        transition: "left .2s cubic-bezier(.4,0,.2,1)", display: "block",
      }} />
    </button>
  );
}

function StatBox({ value, label, color = "#111" }) {
  return (
    <div style={{
      flex: 1, background: "#f9fafb", border: "1px solid #f3f4f6",
      borderRadius: 10, padding: "12px 10px", textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutomationSettingsPage() {
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  // Raw data from APIs
  const [userData, setUserData] = useState(null);   // /api/auth/signup?userId=
  const [subPlans, setSubPlans] = useState(null);   // limbu.ai subscriptionPlans

  // Automation form state
  const [form, setForm] = useState({
    automationEnabled: false,
    frequency: "daily",
    keywords:  [],
    startDate: "",
    platforms: ["gmb"],
  });

  const [availableKeywords, setAvailableKeywords] = useState([]);

  // ── Data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        // Get userId from localStorage — set during login flow
        const userId = typeof window !== "undefined"
          ? localStorage.getItem("userId")
          : null;

        if (!userId) {
          setError("User ID not found. Please log in again.");
          setLoading(false);
          return;
        }

        // Parallel fetch — use Promise.allSettled so one failure doesn't block others
        const [userR, plansR, settingsR, kwR] = await Promise.allSettled([
          // 1. Fetch user by userId (has paidPackage, planDuration, packageStartDate, packageExpiryDate)
          fetch(`/api/auth/signup?userId=${encodeURIComponent(userId)}`),

          // 2. Subscription plans from limbu.ai
          fetch("https://www.limbu.ai/api/home-data?type=subscriptionPlans"),

          // 3. Saved automation settings
          fetch("/api/user-settings"),

          // 4. Keyword list
          fetch(`/api/keyword-research?userId=${encodeURIComponent(userId)}`),
        ]);

        // 1. User data
        if (userR.status === "fulfilled" && userR.value.ok) {
          const u = await userR.value.json();
          setUserData(u);
          // Pre-fill form from user's saved automation settings
          const as = u.automationSettings;
          if (as) {
            setForm(prev => ({
              ...prev,
              automationEnabled: as.automationEnabled ?? false,
              frequency:  as.frequency  || "daily",
              keywords:   as.keywords   || [],
              startDate:  as.startDate  ? toInputDate(as.startDate) : "",
              platforms:  as.platforms?.length ? as.platforms : ["gmb"],
            }));
          }
        } else {
          console.warn("User fetch error:", userR.reason || userR.value?.status);
          setError("Could not load user data. Check your connection.");
        }

        // 2. Subscription plans
        if (plansR.status === "fulfilled" && plansR.value.ok) {
          setSubPlans(await plansR.value.json());
        }

        // 3. Automation settings (override user data if available)
        if (settingsR.status === "fulfilled" && settingsR.value.ok) {
          const s = await settingsR.value.json();
          if (s.automationSettings) {
            const as = s.automationSettings;
            setForm(prev => ({
              ...prev,
              automationEnabled: as.automationEnabled ?? prev.automationEnabled,
              frequency:  as.frequency  || prev.frequency,
              keywords:   as.keywords   || prev.keywords,
              startDate:  as.startDate  ? toInputDate(as.startDate) : prev.startDate,
              platforms:  as.platforms?.length ? as.platforms : prev.platforms,
            }));
          }
        }

        // 4. Keywords
        if (kwR.status === "fulfilled" && kwR.value.ok) {
          const kd = await kwR.value.json();
          if (kd?.data) setAvailableKeywords(kd.data.map(k => k.keyword));
        }

      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);  // Run once on mount — no session dependency

  // ── Plan matching ───────────────────────────────────────────────────────────
  //
  // From user response (image 2):
  //   userData.paidPackage  = "Basic Plan"     ← match plans[].title
  //   userData.planDuration = "quarterly"      ← match billingCycles[].cycle
  //
  // From plans response (image 1):
  //   billingCycles[cycle="quarterly"].plans[title="Basic Plan"]
  //   → posts: 45, citations: 15, totalAmount: 7965, save: 750
  //
  const planDetail = useMemo(() => {
    if (!subPlans?.billingCycles || !userData?.paidPackage || !userData?.planDuration) return null;
    const cycle = subPlans.billingCycles.find(c => c.cycle === userData.planDuration);
    if (!cycle) return null;
    return cycle.plans.find(p => p.title === userData.paidPackage) ?? null;
  }, [subPlans, userData]);

  // All plan numbers come from matched planDetail
  const totalPosts = planDetail?.posts    ?? 0;
  const citations  = planDetail?.citations ?? 0;
  const postsUsed  = Number(userData?.postsUsed) || 0;
  const postsLeft  = Math.max(0, totalPosts - postsUsed);
  const usagePct   = totalPosts > 0 ? (postsUsed / totalPosts) * 100 : 0;

  // Dates — always from packageStartDate / packageExpiryDate in user response
  const pkgStart  = userData?.packageStartDate  ?? null;
  const pkgExpiry = userData?.packageExpiryDate ?? null;

  const isPlanActive = useMemo(() => {
    if (!pkgExpiry) return false;
    return new Date(pkgExpiry) > new Date();
  }, [pkgExpiry]);

  const hasPaidPlan = !!(userData?.paidPackage && pkgExpiry);

  // Minimum keywords required so every post in the plan uses a unique keyword.
  // For daily frequency, each posting day consumes one keyword slot.
  // Rule: need at least min(postsLeft, 45) keywords when daily + plan ≥ 45 posts.
  const minKeywordsNeeded = useMemo(() => {
    if (!form.automationEnabled) return 0;
    if (form.frequency === "daily")     return Math.min(postsLeft || totalPosts, totalPosts) || 1;
    if (form.frequency === "alternate") return Math.min(postsLeft || totalPosts, totalPosts) || 1;
    if (form.frequency === "weekly")    return Math.min(postsLeft || totalPosts, totalPosts) || 1;
    if (form.frequency === "monthly")   return Math.min(postsLeft || totalPosts, totalPosts) || 1;
    return 1;
  }, [form.automationEnabled, form.frequency, totalPosts, postsLeft]);

  const keywordShortfall = Math.max(0, minKeywordsNeeded - form.keywords.length);
  const keywordStatus =
    !form.automationEnabled
      ? "neutral"
      : form.keywords.length === 0
      ? "error"
      : keywordShortfall > 0
      ? "warn"
      : "ok";

  // Schedule preview
  const schedulePreview = useMemo(() => {
    if (!form.automationEnabled || !postsLeft || !form.startDate) return [];
    return calculateSchedule({
      startDate:  form.startDate,
      frequency:  form.frequency,
      postsLimit: postsLeft,
      expiryDate: pkgExpiry,
    }).slice(0, 6);
  }, [form.automationEnabled, form.startDate, form.frequency, postsLeft, pkgExpiry]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleKw = kw => setForm(p => ({
    ...p,
    keywords: p.keywords.includes(kw)
      ? p.keywords.filter(k => k !== kw)
      : [...p.keywords, kw],
  }));

  const togglePlatform = pid => setForm(p => ({
    ...p,
    platforms: p.platforms.includes(pid)
      ? p.platforms.filter(x => x !== pid)
      : [...p.platforms, pid],
  }));

  const selectAllKeywords = () =>
    setForm(p => ({ ...p, keywords: [...availableKeywords] }));

  const clearKeywords = () =>
    setForm(p => ({ ...p, keywords: [] }));

  const handleSave = async () => {
    if (form.automationEnabled && !form.startDate) {
      setError("Please select a start date.");
      return;
    }
    if (form.automationEnabled && keywordShortfall > 0) {
      setError(
        `Please select at least ${minKeywordsNeeded} keywords. ` +
        `You have ${form.keywords.length} selected — add ${keywordShortfall} more.`
      );
      return;
    }
    if (form.automationEnabled && form.platforms.length === 0) {
      setError("Please select at least one platform.");
      return;
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      const userId = typeof window !== "undefined"
        ? window.localStorage.getItem("userId")
        : null;

      const res = await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automationEnabled: form.automationEnabled,
          frequency:  form.frequency,
          keywords:   form.keywords,
          startDate:  form.startDate,
          platforms:  form.platforms,
          userId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");
      if (data.plan) setUserData(prev => ({ ...prev, ...data.plan }));
      if (data.automationSettings) {
        setForm(prev => ({
          ...prev,
          ...data.automationSettings,
          startDate: data.automationSettings.startDate
            ? toInputDate(data.automationSettings.startDate)
            : prev.startDate,
        }));
      }
      setSuccess("Automation settings saved successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const on = form.automationEnabled;

  // ── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f5f4; }

    .pg {
      min-height: 100vh; background: #f5f5f4;
      padding: 32px 16px 80px;
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #111; font-size: 14px; line-height: 1.5;
    }
    .inner { max-width: 980px; margin: 0 auto; }

    .pg-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 16px;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .pg-title { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -.3px; }
    .pg-sub   { font-size: 13px; color: #6b7280; margin-top: 4px; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px;
      border: 1px solid #e5e7eb; background: #fff;
      color: #374151; font-size: 13px; font-weight: 600;
      text-decoration: none; white-space: nowrap; font-family: inherit;
      transition: border-color .15s, background .15s;
    }
    .back-btn:hover { border-color: #d1d5db; background: #f9fafb; }

    .alert { border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 12px; font-weight: 500; }
    .a-warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    .a-err  { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .a-ok   { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .grid-l { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
    @media (max-width: 720px) { .grid-2, .grid-l { grid-template-columns: 1fr; } }

    .divider { height: 1px; background: #f3f4f6; margin: 16px 0; }

    .fields-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 500px) { .fields-2 { grid-template-columns: 1fr; } }

    .field-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; display: block; }

    .styled-select, .styled-date {
      width: 100%; padding: 9px 12px;
      border: 1px solid #e5e7eb; border-radius: 8px;
      background: #fff; color: #111; font-size: 14px;
      outline: none; font-family: inherit; transition: border-color .15s;
    }
    .styled-select:focus, .styled-date:focus {
      border-color: #FDD835;
      box-shadow: 0 0 0 3px rgba(253,216,53,.15);
    }

    .kw-pool {
      display: flex; flex-wrap: wrap; gap: 7px;
      max-height: 165px; overflow-y: auto;
      padding: 12px; background: #f9fafb;
      border: 1px solid #e5e7eb; border-radius: 10px; margin-top: 6px;
    }
    .kw-chip {
      padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;
      cursor: pointer; border: 1px solid #e5e7eb; background: #fff; color: #374151;
      transition: all .12s; font-family: inherit;
    }
    .kw-chip:hover:not(.locked) { border-color: #FDD835; background: #fffde7; color: #111; }
    .kw-chip.sel    { background: #FDD835; border-color: #f0c000; color: #111; font-weight: 600; }
    .kw-chip.locked { opacity: .45; cursor: not-allowed; }

    .plat-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
    .plat-btn {
      padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
      border: 1px solid #e5e7eb; background: #fff; color: #374151;
      cursor: pointer; transition: all .12s; font-family: inherit;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .plat-btn:hover { border-color: #FDD835; background: #fffde7; }
    .plat-btn.sel   { background: #FDD835; border-color: #f0c000; color: #111; }

    .toggle-body {
      overflow: hidden;
      transition: max-height .4s cubic-bezier(.4,0,.2,1), opacity .3s ease;
    }
    .toggle-body.open { max-height: 900px; opacity: 1; }
    .toggle-body.shut { max-height: 0; opacity: 0; pointer-events: none; }
    .toggle-inner { border-top: 1px solid #f3f4f6; padding: 18px 22px 22px; }

    .sched-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 9px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px;
    }
    .sched-row:last-child { border-bottom: none; }

    .sum-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .sum-item { background: #f9fafb; border-radius: 8px; padding: 10px 12px; }
    .sum-lbl  { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: .6px; font-weight: 600; }
    .sum-val  { font-size: 14px; font-weight: 700; color: #111; margin-top: 2px; }

    .save-btn {
      width: 100%; padding: 12px; border-radius: 10px; border: none;
      background: #111; color: #fff; font-size: 14px; font-weight: 700;
      cursor: pointer; transition: background .15s; font-family: inherit;
    }
    .save-btn:hover:not(:disabled) { background: #333; }
    .save-btn:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }

    .upgrade-link {
      display: block; text-align: center; padding: 10px; border-radius: 8px;
      border: 1px solid #e5e7eb; background: #f9fafb; color: #374151;
      font-size: 13px; font-weight: 600; text-decoration: none;
      transition: all .15s; font-family: inherit;
    }
    .upgrade-link:hover { border-color: #FDD835; background: #fffde7; color: #111; }

    .info-box {
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 12px 14px; font-size: 13px; color: #78350f; line-height: 1.6; margin-top: 14px;
    }

    .loading { display: flex; align-items: center; justify-content: center; padding: 80px 0; gap: 10px; color: #9ca3af; font-size: 14px; }
    .dot { width: 8px; height: 8px; background: #FDD835; border-radius: 50%; animation: pulse 1s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }

    select option { background: #fff; color: #111; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="pg">
        <div className="inner">

          {/* Header */}
          <div className="pg-header">
            <div>
              <div className="pg-title">Automation Settings</div>
              <div className="pg-sub">
                Configure AI-powered posting for your Google My Business account
              </div>
            </div>
            <Link href="/dashboard" className="back-btn">← Back to Dashboard</Link>
          </div>

          {error   && <div className="alert a-err">{error}</div>}
          {success && <div className="alert a-ok">{success}</div>}

          {loading ? (
            <div className="loading"><span className="dot" /> Loading settings…</div>
          ) : (
            <>
              {/* ── Row 1: Plan + Automation Toggle ── */}
              <div className="grid-2" style={{ alignItems: "start" }}>

                {/* Plan Card */}
                <Card>
                  {/* No paid plan banner */}
                  {!hasPaidPlan && (
                    <div style={{
                      background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10,
                      padding: "10px 14px", fontSize: 13, color: "#854d0e", marginBottom: 14,
                    }}>
                      No paid plan found. Purchase a plan to enable automation.
                    </div>
                  )}

                  {/* Plan name + status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>
                        Current Plan
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: "#111" }}>
                        {userData?.paidPackage || "No plan assigned"}
                      </div>
                      {planDetail && (
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
                          ₹{planDetail.totalAmount} / {planDetail.duration}
                          {planDetail.save > 0 && (
                            <span style={{
                              marginLeft: 8, background: "#dcfce7", color: "#15803d",
                              padding: "1px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                            }}>
                              Save ₹{planDetail.save}
                            </span>
                          )}
                        </div>
                      )}
                      {userData?.planDuration && !planDetail && (
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, textTransform: "capitalize" }}>
                          {userData.planDuration} billing
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                      {hasPaidPlan
                        ? <StatusPill label={isPlanActive ? "Active" : "Expired"} variant={isPlanActive ? "active" : "expired"} />
                        : <StatusPill label="No Plan" variant="gray" />
                      }
                      {planDetail?.popular && <StatusPill label="Popular" variant="popular" />}
                    </div>
                  </div>

                  {/* packageStartDate & packageExpiryDate — the source of truth */}
                  <div style={{
                    display: "flex", background: "#f9fafb",
                    border: "1px solid #f3f4f6", borderRadius: 10,
                    overflow: "hidden", marginBottom: 14,
                  }}>
                    <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid #f3f4f6" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5 }}>
                        Start Date
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginTop: 3 }}>
                        {fmtDate(pkgStart)}
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5 }}>
                        Expiry Date
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700, marginTop: 3,
                        color: !pkgExpiry ? "#9ca3af" : isPlanActive ? "#111" : "#dc2626",
                      }}>
                        {fmtDate(pkgExpiry)}
                      </div>
                    </div>
                  </div>

                  {/* Post allocation — numbers from planDetail (paidPackage × planDuration match) */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                      Post Allocation
                      {planDetail && (
                        <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12, marginLeft: 6 }}>
                          · {userData.paidPackage} ({userData.planDuration})
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <StatBox value={totalPosts} label="Total"     color="#111"    />
                      <StatBox value={postsUsed}  label="Used"      color="#f59e0b" />
                      <StatBox value={postsLeft}  label="Remaining" color="#16a34a" />
                    </div>

                    {citations > 0 && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                        Citations included: <strong style={{ color: "#374151" }}>{citations}</strong>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", marginBottom: 5, fontWeight: 500 }}>
                      <span>Usage</span>
                      <span style={{ color: "#374151", fontWeight: 600 }}>{postsUsed} / {totalPosts} posts</span>
                    </div>
                    <div style={{ height: 7, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, usagePct)}%`, height: "100%",
                        background: "linear-gradient(90deg, #FDD835, #f59e0b)",
                        borderRadius: 4, transition: "width .4s ease",
                      }} />
                    </div>
                  </div>

                  {/* Features from matched plan */}
                  {planDetail?.features?.length > 0 && (
                    <>
                      <div className="divider" />
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Included Features</div>
                      {planDetail.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 5 }}>
                          <span style={{
                            width: 17, height: 17, borderRadius: "50%", background: "#dcfce7",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, color: "#15803d", flexShrink: 0, fontWeight: 700,
                          }}>✓</span>
                          {f}
                        </div>
                      ))}
                    </>
                  )}

                  <div className="divider" />

                  {/* GMB connection status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 13 }}>
                    <span>
                      GMB:{" "}
                      <strong style={{ color: userData?.isBusinessConnected ? "#15803d" : "#dc2626" }}>
                        {userData?.isBusinessConnected ? "Connected" : "Not connected"}
                      </strong>
                    </span>
                    <Link href="/dashboard" style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, textDecoration: "none" }}>
                      Manage →
                    </Link>
                  </div>
                  <Link href="/subscription" className="upgrade-link">Upgrade Plan</Link>
                </Card>

                {/* Automation Toggle Card */}
                <Card highlighted={on}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>
                        Automation
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: "#111" }}>
                        {on ? "Enabled" : "Disabled"}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, lineHeight: 1.55 }}>
                        {on
                          ? "Posts will publish automatically on each scheduled day."
                          : "Toggle on to set up your posting schedule and keywords."}
                      </div>
                    </div>
                    <ToggleSwitch checked={on} onChange={() => setField("automationEnabled", !on)} />
                  </div>

                  {/* Collapsed until toggle ON */}
                  <div className={`toggle-body ${on ? "open" : "shut"}`}>
                    <div className="toggle-inner">

                      <div className="fields-2" style={{ marginBottom: 16 }}>
                        <div>
                          <label className="field-label">Posting Frequency</label>
                          <select
                            className="styled-select"
                            value={form.frequency}
                            onChange={e => setField("frequency", e.target.value)}
                          >
                            <option value="daily">Daily (every day)</option>
                            <option value="alternate">Alternate days</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div>
                          <label className="field-label">Start Date</label>
                          <input
                            type="date"
                            className="styled-date"
                            value={form.startDate}
                            min={pkgStart  ? toInputDate(pkgStart)  : undefined}
                            max={pkgExpiry ? toInputDate(pkgExpiry) : undefined}
                            onChange={e => setField("startDate", e.target.value)}
                          />
                          {pkgStart && pkgExpiry && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                              Within plan: {fmtDate(pkgStart)} – {fmtDate(pkgExpiry)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <label className="field-label">Post to Platforms</label>
                        <div className="plat-row">
                          {[
                            { id: "gmb", label: "Google Business" },
                            { id: "fb",  label: "Facebook" },
                            { id: "ig",  label: "Instagram" },
                          ].map(({ id, label }) => (
                            <button key={id} type="button"
                              onClick={() => togglePlatform(id)}
                              className={`plat-btn${form.platforms.includes(id) ? " sel" : ""}`}
                            >
                              {form.platforms.includes(id) && <span style={{ fontSize: 11 }}>✓</span>}
                              {label}
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                          Ensure each selected platform is connected in your dashboard.
                        </div>
                      </div>

                      <div className="info-box">
                        <strong>How it works:</strong> On each posting day, the system picks one keyword,
                        generates an AI post (text + image), and publishes it to connected platforms — automatically,
                        until your <strong>{postsLeft} remaining posts</strong> are used
                        {pkgExpiry && <> or plan expires on <strong>{fmtDate(pkgExpiry)}</strong></>}.
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ── Row 2: Keywords + Schedule & Save ── */}
              <div className="grid-l" style={{ alignItems: "start" }}>

                {/* Keywords */}
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Keywords for Automation</div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
                        AI rotates through selected keywords — one unique keyword per post.
                      </div>
                    </div>
                    <Link href="/keyword-planner"
                      style={{ fontSize: 13, color: "#374151", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
                      + Add keywords
                    </Link>
                  </div>

                  {/* Keyword requirement banner */}
                  {on && minKeywordsNeeded > 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: keywordStatus === "ok" ? "#f0fdf4" : keywordStatus === "warn" ? "#fffbeb" : "#fef2f2",
                      border: `1px solid ${keywordStatus === "ok" ? "#bbf7d0" : keywordStatus === "warn" ? "#fde68a" : "#fecaca"}`,
                      borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 13,
                    }}>
                      <span style={{ color: keywordStatus === "ok" ? "#166534" : keywordStatus === "warn" ? "#92400e" : "#991b1b", fontWeight: 600 }}>
                        {keywordStatus === "ok"
                          ? `✓ ${form.keywords.length} keywords selected — good to go!`
                          : keywordStatus === "warn"
                          ? `⚠ Need ${minKeywordsNeeded} keywords minimum — add ${keywordShortfall} more.`
                          : `✕ No keywords selected. Add at least ${minKeywordsNeeded}.`}
                      </span>
                      {minKeywordsNeeded > 0 && (
                        <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8, whiteSpace: "nowrap" }}>
                          Min: {minKeywordsNeeded}
                        </span>
                      )}
                    </div>
                  )}

                  {availableKeywords.length === 0 ? (
                    <div style={{
                      border: "1px dashed #e5e7eb", borderRadius: 10, padding: "20px",
                      textAlign: "center", color: "#9ca3af", fontSize: 13,
                    }}>
                      No keywords found. Add them from the <strong>Keyword Planner</strong> page.
                    </div>
                  ) : (
                    <>
                      {/* Select all / clear row */}
                      {on && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <button type="button" onClick={selectAllKeywords}
                            style={{
                              fontSize: 12, fontWeight: 600, padding: "4px 12px",
                              borderRadius: 6, border: "1px solid #e5e7eb",
                              background: "#f9fafb", color: "#374151", cursor: "pointer",
                              fontFamily: "inherit",
                            }}>
                            Select All ({availableKeywords.length})
                          </button>
                          <button type="button" onClick={clearKeywords}
                            style={{
                              fontSize: 12, fontWeight: 600, padding: "4px 12px",
                              borderRadius: 6, border: "1px solid #e5e7eb",
                              background: "#f9fafb", color: "#9ca3af", cursor: "pointer",
                              fontFamily: "inherit",
                            }}>
                            Clear
                          </button>
                        </div>
                      )}
                      <div className="kw-pool">
                        {availableKeywords.map(kw => {
                          const sel = form.keywords.includes(kw);
                          return (
                            <button key={kw} type="button"
                              onClick={() => on && toggleKw(kw)}
                              className={`kw-chip${sel ? " sel" : ""}${!on ? " locked" : ""}`}
                            >
                              {kw}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 12 }}>
                    <span style={{
                      fontWeight: 700,
                      color: keywordStatus === "ok" ? "#16a34a" : keywordStatus === "warn" ? "#d97706" : keywordStatus === "error" ? "#dc2626" : "#374151",
                    }}>
                      Selected: {form.keywords.length}
                      {on && minKeywordsNeeded > 0 && ` / ${minKeywordsNeeded} needed`}
                    </span>
                    <span style={{ color: "#9ca3af" }}>Rotates in order per post</span>
                  </div>

                  {!on && availableKeywords.length > 0 && (
                    <div style={{
                      fontSize: 12, color: "#92400e", background: "#fffbeb",
                      border: "1px solid #fde68a", padding: "8px 12px",
                      borderRadius: 8, marginTop: 10,
                    }}>
                      Enable automation above to select keywords.
                    </div>
                  )}
                </Card>

                {/* Schedule preview + Save */}
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Upcoming Schedule</div>
                    <StatusPill
                      label={schedulePreview.length > 0 ? `${schedulePreview.length} dates` : "No schedule"}
                      variant={schedulePreview.length > 0 ? "active" : "gray"}
                    />
                  </div>

                  {schedulePreview.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#9ca3af", paddingBottom: 14 }}>
                      {on ? "Set a valid start date to preview schedule." : "Enable automation to preview your schedule."}
                    </div>
                  ) : (
                    <div style={{ marginBottom: 16 }}>
                      {schedulePreview.map((d, i) => (
                        <div key={i} className="sched-row">
                          <span style={{ fontWeight: 600, color: "#111" }}>
                            {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <span style={{ color: "#9ca3af", fontSize: 12 }}>Post #{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="divider" />

                  <div className="sum-grid">
                    <div className="sum-item">
                      <div className="sum-lbl">Status</div>
                      <div className="sum-val" style={{ color: on ? "#ca8a04" : "#9ca3af" }}>
                        {on ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                    <div className="sum-item">
                      <div className="sum-lbl">Frequency</div>
                      <div className="sum-val" style={{ textTransform: "capitalize" }}>{form.frequency}</div>
                    </div>
                    <div className="sum-item">
                      <div className="sum-lbl">Posts Left</div>
                      <div className="sum-val" style={{ color: postsLeft > 0 ? "#16a34a" : "#dc2626" }}>
                        {postsLeft}
                      </div>
                    </div>
                    <div className="sum-item">
                      <div className="sum-lbl">Keywords</div>
                      <div className="sum-val" style={{
                        color: keywordStatus === "ok" ? "#16a34a"
                          : keywordStatus === "warn" ? "#d97706"
                          : keywordStatus === "error" ? "#dc2626"
                          : "#111",
                      }}>
                        {form.keywords.length}
                        {on && minKeywordsNeeded > 0 && `/${minKeywordsNeeded}`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button" onClick={handleSave}
                    disabled={saving || (on && keywordShortfall > 0)}
                    className="save-btn"
                  >
                    {saving
                      ? "Saving…"
                      : on && keywordShortfall > 0
                      ? `Add ${keywordShortfall} more keyword${keywordShortfall > 1 ? "s" : ""}`
                      : "Save Automation Settings"}
                  </button>
                  {on && keywordShortfall > 0 && (
                    <div style={{ fontSize: 12, color: "#d97706", textAlign: "center", marginTop: 8 }}>
                      Select {minKeywordsNeeded} keywords to unlock saving
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}