import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const STATUS = {
  fail: { Icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100", label: "Failed" },
  warn: { Icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100", label: "Warnings" },
  pass: { Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", label: "Passed" },
};

export const SEVERITY = {
  critical: { label: "Critical", cls: "bg-rose-100 text-rose-700" },
  high: { label: "High", cls: "bg-orange-100 text-orange-700" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-700" },
  low: { label: "Low", cls: "bg-slate-100 text-slate-600" },
};

const STATUS_ORDER = { fail: 0, warn: 1, pass: 2 };
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/** Failed first, then warnings, each by severity. */
export const byPriority = (a, b) =>
  STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];

export const scoreColor = (s) => (s >= 80 ? "#16a34a" : s >= 50 ? "#eab308" : "#e11d48");
export const scoreLabel = (s) => (s >= 80 ? "Good" : s >= 50 ? "Needs work" : "Poor");
