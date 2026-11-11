"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  "Opening the website",
  "Reading SEO tags and content",
  "Checking links, robots.txt and sitemap",
  "Testing SSL and security headers",
  "Checking mobile and local SEO",
  "Running Google speed test",
];

/** Step list that advances on a timer while the audit request is running. */
export default function AuditProgress({ url }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-bold text-slate-900">
        Auditing <span className="text-[#ca8a04]">{url}</span>
      </p>
      <p className="text-xs text-slate-500">This usually takes 20–60 seconds.</p>
      <ul className="mt-5 space-y-3">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-3 text-sm font-semibold ${i > step ? "text-slate-300" : "text-slate-700"}`}>
            {i < step ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : i === step ? (
              <Loader2 size={18} className="animate-spin text-[#eab308]" />
            ) : (
              <span className="h-[18px] w-[18px] rounded-full border-2 border-slate-200" />
            )}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
