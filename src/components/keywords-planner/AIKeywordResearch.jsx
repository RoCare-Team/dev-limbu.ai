"use client";
import React from "react";
import { Sparkles, Loader2, Plus, Check, RefreshCw, Wand2 } from "lucide-react";

const TYPE_COLORS = {
  primary: "bg-blue-50 text-blue-600 border-blue-100",
  "long-tail": "bg-purple-50 text-purple-600 border-purple-100",
  local: "bg-teal-50 text-teal-600 border-teal-100",
  commercial: "bg-amber-50 text-amber-600 border-amber-100",
  gbp: "bg-green-50 text-green-600 border-green-100",
};

const TYPE_LABELS = {
  primary: "Primary",
  "long-tail": "Long-tail",
  local: "Local",
  commercial: "Commercial",
  gbp: "GBP",
};

export default function AIKeywordResearch({
  businessName,
  setBusinessName,
  isGenerating,
  aiKeywords,
  aiSummary,
  inferredCategory,
  generateError,
  generateKeywords,
  addAiKeyword,
  addAllAiKeywords,
  isSavingAll,
  savedKeywordsSet,
  isSaving,
}) {
  const unsavedCount = aiKeywords.filter((k) => !savedKeywordsSet.has(k.keyword)).length;

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border-2 border-black/10 p-6 sm:p-8 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-lemon-glow/20 to-lemon-glow/5 rounded-xl border border-lemon-glow/30">
            <Sparkles className="w-5 h-5 text-lemon-hover" />
          </div>
          <div>
            <h2
              className="text-sm font-bold text-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              AI Keyword Research
            </h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Powered by OpenAI
            </p>
          </div>
        </div>
        {aiKeywords.length > 0 && (
          <span className="text-[9px] font-black bg-black text-lemon-glow px-3 py-1.5 rounded-full uppercase tracking-widest self-start">
            {aiKeywords.length} Keywords Generated
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 group">
          <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-lemon-hover transition-colors w-4 h-4" />
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isGenerating && generateKeywords()}
            placeholder="Enter business name (e.g., RO Care, Pizza Hut, AC Repair)..."
            disabled={isGenerating}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-lemon-glow transition-all outline-none disabled:opacity-50"
          />
        </div>
        <button
          onClick={generateKeywords}
          disabled={isGenerating || !businessName.trim()}
          className="btn-lemon px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Keywords
            </>
          )}
        </button>
      </div>

      {generateError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold text-red-600">{generateError}</p>
          <button
            onClick={generateKeywords}
            className="text-[8px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {aiSummary && (
        <div className="mb-6 p-4 bg-slate-50 border border-black/5 rounded-2xl">
          {inferredCategory && (
            <p className="text-[8px] font-black text-lemon-hover uppercase tracking-widest mb-2">
              Detected: {inferredCategory}
            </p>
          )}
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-16 opacity-50">
          <Loader2 className="w-10 h-10 animate-spin text-lemon-hover mb-4" />
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
            AI is analyzing your business & generating keywords...
          </p>
        </div>
      ) : aiKeywords.length > 0 ? (
        <div>
          {unsavedCount > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={addAllAiKeywords}
                disabled={isSavingAll}
                className="text-[8px] font-black uppercase tracking-widest text-lemon-hover hover:text-black transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-lemon-glow/30 bg-lemon-glow/10"
              >
                {isSavingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Add All ({unsavedCount})
              </button>
            </div>
          )}

          <div className="hidden sm:grid grid-cols-12 px-4 py-2.5 border-b border-black/5 mb-1">
            <div className="col-span-4">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Keyword</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Type</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Volume</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Difficulty</span>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Add</span>
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto custom-scroll space-y-1.5">
            {aiKeywords.map((kw, idx) => {
              const isAdded = savedKeywordsSet.has(kw.keyword);
              return (
                <div
                  key={`${kw.keyword}-${idx}`}
                  className={`grid grid-cols-12 items-center p-3 sm:px-4 rounded-xl border transition-all ${
                    isAdded
                      ? "bg-slate-50 border-black/5"
                      : "bg-white border-black/5 hover:border-lemon-hover hover:shadow-sm"
                  }`}
                >
                  <div className="col-span-12 sm:col-span-4 mb-1 sm:mb-0">
                    <span
                      className={`font-bold text-xs truncate block ${
                        isAdded ? "text-slate-300 line-through" : "text-black"
                      }`}
                    >
                      {kw.keyword}
                    </span>
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex justify-start sm:justify-center">
                    <span
                      className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                        TYPE_COLORS[kw.type] || TYPE_COLORS.primary
                      }`}
                    >
                      {TYPE_LABELS[kw.type] || kw.type}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-center">
                    <span className="text-[10px] font-black text-black">
                      {kw.volume ? kw.volume.toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 flex justify-center">
                    {kw.competition && (
                      <span
                        className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                          kw.competition === "LOW"
                            ? "bg-green-50 text-green-600 border-green-100"
                            : kw.competition === "MEDIUM"
                              ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                              : "bg-red-50 text-red-600 border-red-100"
                        }`}
                      >
                        {kw.competition}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-right mt-2 sm:mt-0">
                    {isAdded ? (
                      <div className="flex items-center justify-end text-green-500 gap-1">
                        <Check className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Saved</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => addAiKeyword(kw)}
                        disabled={isSaving === kw.keyword}
                        className="btn-lemon w-full sm:w-auto px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                      >
                        {isSaving === kw.keyword ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !generateError && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-black/5">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
              Enter your business name and let AI generate 20–25 targeted SEO keywords instantly.
            </p>
          </div>
        )
      )}
    </div>
  );
}
