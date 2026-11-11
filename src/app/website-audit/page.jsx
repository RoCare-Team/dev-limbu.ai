"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import AuditForm from "@/components/website-audit/AuditForm";
import AuditProgress from "@/components/website-audit/AuditProgress";
import ScoreSummary from "@/components/website-audit/ScoreSummary";
import CategoryCards from "@/components/website-audit/CategoryCards";
import CheckList from "@/components/website-audit/CheckList";
import { whatsappHref } from "@/lib/seoTools";

const RECENT_KEY = "websiteAuditRecent";

function loadRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(host, prev) {
  const next = [host, ...prev.filter((h) => h !== host)].slice(0, 5);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  return next;
}

export default function WebsiteAuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [category, setCategory] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => setRecent(loadRecent()), []);

  const runAudit = async (target) => {
    const value = (target ?? url).trim();
    if (!value || loading) return;
    setUrl(value);
    setLoading(true);
    setError("");
    setReport(null);
    setCategory(null);
    try {
      const res = await fetch("/api/website-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error || "The audit failed. Please try again.");
      setReport(json.report);
      setRecent((prev) => saveRecent(new URL(json.report.finalUrl).hostname, prev));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const failed = report?.summary.fail || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8 print:p-0">
      {/* Print only the report: drop the dashboard chrome and its scroll containers */}
      <style>{`@media print {
        aside, header { display: none !important; }
        .h-screen, .h-full, main { height: auto !important; overflow: visible !important; }
      }`}</style>

      <AuditForm
        url={url}
        setUrl={setUrl}
        loading={loading}
        onSubmit={(e) => {
          e.preventDefault();
          runAudit();
        }}
        recent={recent}
        onPickRecent={runAudit}
        error={error}
      />

      {loading && <AuditProgress url={url} />}

      {report && !loading && (
        <>
          <ScoreSummary report={report} onRerun={() => runAudit(report.finalUrl)} loading={loading} />
          <CategoryCards categories={report.categories} active={category} onSelect={setCategory} />
          <CheckList checks={report.checks} category={category} onClearCategory={() => setCategory(null)} />

          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center print:hidden">
            <div>
              <p className="text-base font-black text-slate-900">
                {failed ? `${failed} issue${failed > 1 ? "s" : ""} need fixing` : "Want to rank even higher?"}
              </p>
              <p className="text-sm text-slate-500">Our SEO team can fix everything in this report for you.</p>
            </div>
            <a
              href={whatsappHref(`Hi Limbu AI, I ran a website audit for ${report.finalUrl} (score ${report.score}/100). Please help me fix the issues.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white hover:bg-emerald-600"
            >
              <MessageCircle size={16} /> Get it fixed
            </a>
          </div>
        </>
      )}
    </div>
  );
}
