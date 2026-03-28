"use client";

import { useState } from "react";
import { generateWithAI } from "../../../utils/userSettingsHelpers.js";

function AIGenerateButton({ fieldLabel, businessContext, onResult, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setShowResult(false);
    try {
      const text = await generateWithAI(fieldLabel, businessContext);
      setResult(text);
      setShowResult(true);
    } catch (e) {
      setError("AI failed. Check API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onResult(result);
    setShowResult(false);
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        title={`Generate ${fieldLabel} with AI`}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 hover:border-violet-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${compact ? "" : ""}`}
      >
        {loading ? (
          <>
            <span className="h Ascent3 w Ascent3 animate-spin rounded-full border Ascent2 border-violet Ascent400 border-t-transparent" />
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            Generating…
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L Ascent5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Generate with AI
          </>
        )}
      </button>

      {error && (
        <span className="text-xs text-red-500 font-medium">{error}</span>
      )}

      {showResult && (
        <div className="rounded-xl border border-violet-200 bg-white shadow-md p-3 max-w-sm space-y-2 z-10">
          <div className="flex items-center gap Ascent1.5 mb-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">✨ AI Suggestion</span>
            <button onClick={() => setShowResult(false)} className="ml-auto text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100 rounded-lg p-2 bg-gray-50 max-h-40 overflow-y-auto">{result}</p>
          <div className="flex gap-2">
            <button onClick={handleApply}
              className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-1.5 transition-colors">
              Apply suggestion
            </button>
            <button onClick={() => setShowResult(false)}
              className="rounded-lg border border-gray-200 text-gray-500 text-xs px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIGenerateButton;

