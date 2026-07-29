"use client";

import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  MessageSquare,
  Lightbulb,
  ShieldQuestion,
  ArrowRight,
  Copy,
  Zap,
  CircleAlert,
} from "lucide-react";

const TEMP_STYLES = {
  Hot: "bg-red-100 text-red-700 border-red-200",
  Warm: "bg-amber-100 text-amber-700 border-amber-200",
  Cold: "bg-sky-100 text-sky-700 border-sky-200",
};

const PRIORITY_STYLES = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-gray-50 text-gray-600 border-gray-200",
};

const scoreColor = (n) =>
  n == null ? "bg-gray-300" : n >= 70 ? "bg-emerald-500" : n >= 40 ? "bg-amber-500" : "bg-red-500";

function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
        <span>{label}</span>
        <span className="font-bold text-gray-800">{value ?? "—"}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(value)}`}
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function ListCard({ icon: Icon, title, items, tone }) {
  if (!items?.length) return null;
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        <Icon size={13} /> {title}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs leading-relaxed flex gap-1.5">
            <span className="opacity-60">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Renders a saved AI sales analysis for a business. */
export default function BusinessAiAnalysisPanel({
  analysis,
  analysedAt,
  businessName,
  showToast,
}) {
  if (!analysis) return null;

  const copy = (text, label) => {
    navigator.clipboard?.writeText(text);
    showToast?.(`${label} copied`, "success");
  };

  return (
    <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/50 overflow-hidden">
      {/* Header — headline score + temperature */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <div>
            <p className="text-sm font-bold">
              {businessName || "AI Sales Analysis"}
            </p>
            {businessName && (
              <p className="text-[10px] opacity-80">AI Sales Analysis</p>
            )}
            {analysedAt && (
              <p className="text-[10px] opacity-80">
                {new Date(analysedAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analysis.leadTemperature && (
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                TEMP_STYLES[analysis.leadTemperature] || TEMP_STYLES.Cold
              }`}
            >
              {analysis.leadTemperature} Lead
            </span>
          )}
          {analysis.overallScore != null && (
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-black">
              {analysis.overallScore}/100
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        {analysis.summary && (
          <p className="rounded-xl bg-white p-3 text-xs leading-relaxed text-gray-700 border border-violet-100">
            {analysis.summary}
          </p>
        )}

        {/* ── Problem → Limbu solution (agent ka main section) ───────── */}
        {analysis.problemSolutions?.length > 0 && (
          <div className="rounded-xl border-2 border-violet-300 bg-white p-3">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-violet-800">
              <Zap size={14} /> Problem → Limbu AI Solution
            </p>
            <div className="mt-2 space-y-2.5">
              {analysis.problemSolutions.map((ps, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Problem side */}
                  <div className="bg-red-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex items-start gap-1.5 text-xs font-bold text-red-800">
                        <CircleAlert size={13} className="mt-0.5 shrink-0" />
                        {ps.problem}
                      </p>
                      {ps.priority && (
                        <span
                          className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                            PRIORITY_STYLES[ps.priority] || PRIORITY_STYLES.Low
                          }`}
                        >
                          {ps.priority}
                        </span>
                      )}
                    </div>
                    {ps.evidence && (
                      <p className="mt-1 text-[11px] text-red-700">
                        <span className="font-semibold">Proof: </span>
                        {ps.evidence}
                      </p>
                    )}
                    {ps.impact && (
                      <p className="mt-0.5 text-[11px] text-red-600">
                        <span className="font-semibold">Nuksaan: </span>
                        {ps.impact}
                      </p>
                    )}
                  </div>

                  {/* Solution side */}
                  <div className="bg-emerald-50 px-3 py-2 border-t border-emerald-100">
                    {ps.limbuFeatures?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ps.limbuFeatures.map((f, j) => (
                          <span
                            key={j}
                            className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                    {ps.howLimbuFixes && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-800">
                        {ps.howLimbuFixes}
                      </p>
                    )}
                    {ps.salesPitchLine && (
                      <div className="mt-1.5 flex items-start justify-between gap-2 rounded-lg bg-white p-2 border border-emerald-200">
                        <p className="text-[11px] italic leading-relaxed text-gray-800">
                          “{ps.salesPitchLine}”
                        </p>
                        <button
                          type="button"
                          onClick={() => copy(ps.salesPitchLine, "Pitch line")}
                          className="shrink-0 text-emerald-600 hover:text-emerald-800"
                          title="Copy pitch line"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {analysis.businessCategory && (
            <span className="rounded-lg bg-white border border-gray-200 px-2 py-1 font-medium text-gray-700">
              {analysis.businessCategory}
            </span>
          )}
          {analysis.businessSize && (
            <span className="rounded-lg bg-white border border-gray-200 px-2 py-1 font-medium text-gray-700">
              Size: {analysis.businessSize}
            </span>
          )}
          {analysis.estimatedMonthlyBudget && (
            <span className="rounded-lg bg-white border border-gray-200 px-2 py-1 font-medium text-gray-700">
              Budget: {analysis.estimatedMonthlyBudget}
            </span>
          )}
          {analysis.conversionLikelihood != null && (
            <span className="rounded-lg bg-white border border-gray-200 px-2 py-1 font-medium text-gray-700">
              Conversion: {analysis.conversionLikelihood}%
            </span>
          )}
        </div>

        {/* Score bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-white p-3 border border-violet-100">
          <ScoreBar label="Online Presence" value={analysis.scores?.onlinePresence} />
          <ScoreBar label="Reputation" value={analysis.scores?.reputation} />
          <ScoreBar
            label="Profile Completeness"
            value={analysis.scores?.profileCompleteness}
          />
          <ScoreBar label="Content Quality" value={analysis.scores?.contentQuality} />
          <ScoreBar label="Competitiveness" value={analysis.scores?.competitiveness} />
        </div>

        {/* Strengths / weaknesses / opportunities / pain points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ListCard
            icon={TrendingUp}
            title="Strengths"
            items={analysis.strengths}
            tone="border-emerald-200 bg-emerald-50 text-emerald-800"
          />
          <ListCard
            icon={AlertTriangle}
            title="Weaknesses"
            items={analysis.weaknesses}
            tone="border-red-200 bg-red-50 text-red-800"
          />
          <ListCard
            icon={Target}
            title="Opportunities"
            items={analysis.opportunities}
            tone="border-blue-200 bg-blue-50 text-blue-800"
          />
          <ListCard
            icon={AlertTriangle}
            title="Pain Points"
            items={analysis.painPoints}
            tone="border-orange-200 bg-orange-50 text-orange-800"
          />
        </div>

        {/* Recommended services — har card: issue → Limbu ka solution */}
        {analysis.recommendedServices?.length > 0 && (
          <div className="rounded-xl bg-white p-3 border border-violet-100">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-700">
              <Lightbulb size={13} /> Recommended Services
            </p>
            {businessName && (
              <p className="mt-0.5 text-[11px] text-gray-500">
                <span className="font-bold text-gray-800">{businessName}</span> ke
                liye — issue aur Limbu AI ka solution
              </p>
            )}
            <div className="mt-2 space-y-2">
              {analysis.recommendedServices.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Issue */}
                  <div className="flex items-start justify-between gap-2 bg-red-50 px-3 py-2">
                    <p className="flex items-start gap-1.5 text-[11px] font-bold text-red-800">
                      <CircleAlert size={12} className="mt-0.5 shrink-0" />
                      <span>
                        <span className="uppercase tracking-wide opacity-70">
                          Issue:{" "}
                        </span>
                        {s.problem || "Profile improvement zaroori hai"}
                      </span>
                    </p>
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                        PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.Low
                      }`}
                    >
                      {s.priority || "—"}
                    </span>
                  </div>

                  {/* Limbu solution */}
                  <div className="bg-emerald-50 px-3 py-2 border-t border-emerald-100">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                      <ArrowRight size={12} className="shrink-0" />
                      <span className="uppercase tracking-wide opacity-70">
                        Limbu AI:
                      </span>
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {s.service}
                      </span>
                    </p>
                    {s.reason && (
                      <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                        {s.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Talking points */}
        <ListCard
          icon={MessageSquare}
          title="Talking Points"
          items={analysis.talkingPoints}
          tone="border-violet-200 bg-white text-gray-800"
        />

        {/* Objection handling */}
        {analysis.objectionHandling?.length > 0 && (
          <div className="rounded-xl bg-white p-3 border border-violet-100">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-700">
              <ShieldQuestion size={13} /> Objection Handling
            </p>
            <div className="mt-2 space-y-2">
              {analysis.objectionHandling.map((o, i) => (
                <div key={i} className="rounded-lg bg-gray-50 p-2">
                  <p className="text-[11px] font-bold text-gray-800">“{o.objection}”</p>
                  <p className="mt-0.5 text-[11px] text-gray-600 leading-relaxed">
                    {o.response}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ready-to-use outreach */}
        {(analysis.pitchAngle ||
          analysis.suggestedOpeningLine ||
          analysis.suggestedWhatsAppMessage ||
          analysis.nextBestAction) && (
          <div className="space-y-2 rounded-xl bg-white p-3 border border-violet-100">
            {analysis.pitchAngle && (
              <p className="text-xs text-gray-700">
                <span className="font-bold">Pitch angle: </span>
                {analysis.pitchAngle}
              </p>
            )}
            {analysis.suggestedOpeningLine && (
              <div className="rounded-lg bg-indigo-50 p-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    <span className="font-bold">Opening line: </span>
                    {analysis.suggestedOpeningLine}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      copy(analysis.suggestedOpeningLine, "Opening line")
                    }
                    className="shrink-0 text-indigo-600 hover:text-indigo-800"
                    title="Copy"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            )}
            {analysis.suggestedWhatsAppMessage && (
              <div className="rounded-lg bg-green-50 p-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-green-900 leading-relaxed whitespace-pre-wrap">
                    <span className="font-bold">WhatsApp: </span>
                    {analysis.suggestedWhatsAppMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      copy(analysis.suggestedWhatsAppMessage, "WhatsApp message")
                    }
                    className="shrink-0 text-green-600 hover:text-green-800"
                    title="Copy"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            )}
            {analysis.nextBestAction && (
              <p className="flex items-start gap-1.5 text-xs font-semibold text-violet-800">
                <ArrowRight size={13} className="mt-0.5 shrink-0" />
                {analysis.nextBestAction}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
