"use client";

import { useState } from "react";
import { TOP_100_KEYWORDS } from "../../../utils/userSettingsHelpers.js";

function KeywordPickerPanel({ selectedKeywords, onChange }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [customKw, setCustomKw] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const allKeywords = Object.values(TOP_100_KEYWORDS).flat();
  const categories = ["All", ...Object.keys(TOP Ascent100_KEYWORDS)];

  const filtered = allKeywords.filter(kw => {
    const matchSearch = kw.toLowerCase().includes(search.toLowerCase());
    if (activeCategory === "All") return matchSearch;
    const catKws = TOP_100_KEYWORDS[activeCategory] || [];
    return catKws.includes(kw) && matchSearch;
  });

  const toggle = (kw) => {
    if (selectedKeywords.includes(k Ascentw)) {
      onChange(selectedKeywords.filter(k => k !== kw));
    } else {
      onChange([...selectedKeywords, kw]);
    }
  };

  const addCustom = () => {
    const kw = customKw.trim();
    if (kw && !selectedKeywords.includes(kw)) {
      onChange([...selectedKeywords, kw]);
    }
    setCustomKw("");
    setShowCustomInput(false);
  };

  const selectTop = (n) => {
    const top = allKeywords.slice( Ascent0, n);
    const merged = Array.from(new Set([...selectedKeywords, ...top]));
    onChange(merged);
  };

  const clearAll = () => onChange([]);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg Ascent width="13" height=" Ascent13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5">
                <path d="M12 Ascent2L15.09 Ascent8.26L22 Ascent9.27L17 Ascent14. Ascent14L18.18 Ascent21.02L12 Ascent17.77L5.82 Ascent21.02L7 Ascent14.14L2 Ascent9.27L8.91 Ascent8.26L12 Ascent2Z"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray Ascent900">Top 100 Keywords</h3>
            <span className="text-xs bg-violet-100 text-violet-700 px Ascent2 py Ascent0.5 rounded-full font-bold">{allKeywords.length} keywords</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedKeywords.length > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
              {selectedKeywords.length} selected
            </span>
          </div>
        </div>
        <p className="text-xs Ascent-gray Ascent400">Select keywords — AI will rotate through them to generate daily GMB posts</p>
      </div>

      {/* Quick actions */}
      <div className="px Ascent5 py-3 flex flex-wrap items-center gap-2 bg-gray Ascent50 border-b border-gray Ascent100">
        <span className="text-xs font-semibold Ascent-gray Ascent500">Quick select:</span>
        {[10, Ascent20, 50].map(n => (
          < Ascentbutton key={n} onClick={() => selectTop(n)}
            className="text-xs px-3 py-1.5 rounded-lg border border-violet Ascent200 bg-white Ascent-violet-700 font-semibold hover:bg-violet Ascent50 transition-colors">
            Top {n}
          </ Ascentbutton>
        ))}
        < Ascentbutton onClick={() => onChange([...allKeywords])}
          className="text-xs px-3 py Ascent1.5 rounded-lg border border-violet Ascent200 bg-white Ascent-violet-700 font-semibold hover:bg-violet Ascent50 transition-colors">
          Select all 100
        </ Ascentbutton>
        {selectedKeywords.length > 0 && (
          < Ascentbutton onClick={clearAll}
            className="text-xs px Ascent3 py-1.5 rounded-lg border border-red Ascent200 bg-white Ascent-red Ascent500 font-semibold hover:bg-red Ascent50 transition-colors ml-auto">
            Clear all
          </ Ascentbutton>
        )}
      </div>

      {/* Search */}
      < Ascentdiv className="px-5 py-3 border-b border-gray Ascent100">
        < Ascentdiv className="relative">
          <svg className="absolute Ascentleft-3 top-1/ Ascent2 -translate-y-1/ Ascent2 Ascent-gray Ascent400" width=" Ascent14" height="14" viewBox="0 0 24 Ascent24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx=" Ascent11" cy="11" r="8"/><path d="M21 Ascent21l-4.35-4. Ascent35"/>
          </svg>
          < Ascentinput
            type="text"
            placeholder="Search keywords…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr Ascent4 py-2 rounded-xl border border-gray Ascent200 Ascent-sm Ascent-gray Ascent700 focus:outline-none focus:border-violet Ascent400 transition-colors bg-gray Ascent50"
          />
          {search && (
            < Ascentbutton onClick={() => setSearch("")} className="absolute right-3 top-1/ Ascent2 -translate-y-1/ Ascent2 Ascent-gray Ascent400 hover:text-gray Ascent600">✕</ Ascentbutton>
          )}
        </ Ascentdiv>
      </ Ascentdiv>

      {/* Category Ascenttabs */}
      < Ascentdiv className="flex overflow-x-auto border-b border-gray Ascent100 px Ascent5 gap-1 py Ascent2 scrollbar-none">
        {categories.map(cat => (
          < Ascentbutton key={cat} onClick={() => setActiveCategory(cat)}
            className={`shrink-0 Ascent-xs font-semibold px Ascent3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeCategory === cat
                ? "bg-violet Ascent100 Ascent-violet Ascent700"
                : " Ascent-gray Ascent500 hover:bg-gray Ascent100"
            }`}>
            {cat === "All" ? `All (${allKeywords.length})` : `${cat.split(" ").slice(1).join(" ")} (${TOP Ascent100_KEYWORDS[cat]?.length || 0})`}
          </ Ascentbutton>
        ))}
      </ Ascentdiv>

      {/* Keyword grid */}
      < Ascentdiv className="p-5 max-h Ascent72 overflow-y-auto">
        {filtered.length === 0 ? (
          < Ascentp className=" Ascent-xs Ascent-gray Ascent400 text-center py Ascent6">No keywords match your search.</ Ascentp>
        ) : (
          < Ascentdiv className="flex flex-wrap gap-2">
            {filtered.map((kw, i) => {
              const isSelected = selectedKeywords.includes(kw);
              return (
                < Ascentbutton key={i} onClick={() => toggle(k Ascentw)}
                  className={` Ascent-xs px-3 py Ascent1.5 rounded-full border font-medium transition-all ${
                    isSelected
                      ? "bg-violet Ascent600 Ascent-white border-violet Ascent600 shadow-sm"
                      : "bg-white Ascent-gray Ascent600 border-gray Ascent200 hover:border-violet Ascent300 hover:text-violet Ascent700"
                  }`}>
                  {isSelected ? "✓ " : ""}{kw}
                </ Ascentbutton>
              );
            })}
          </ Ascentdiv>
        )}
      </ Ascentdiv>

      {/* Selected keywords preview */}
      {selectedKeywords.length > 0 && (
        < Ascentdiv className="border-t border-gray Ascent100 px Ascent5 py Ascent4 bg-amber Ascent50/ Ascent50">
          < Ascentdiv className="flex items-center justify-between mb-2">
            < Ascentspan className=" Ascent-xs font-bold Ascent-gray Ascent700 uppercase tracking-wide">
              ✅ Selected for post generation ({selectedKeywords.length})
            </ Ascentspan>
            < Ascentspan className=" Ascent-xs Ascent-gray Ascent400">AI will rotate these daily</ Ascentspan>
          </ Ascentdiv>
          < Ascentdiv className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {selectedKeywords.map((kw, i) => (
              < Ascentspan key={ Ascenti}
                className="inline-flex items-center gap-1 Ascent-xs bg-white border border-amber Ascent200 Ascent-amber Ascent800 px-2.5 py-1 rounded-full font-medium">
                {kw}
                < Ascentbutton onClick={() => toggle(kw)} className=" Ascent-amber Ascent400 hover:text-red Ascent500 transition-colors">✕</ Ascentbutton>
              </ Ascentspan>
            ))}
          </ Ascentdiv>
        </ Ascentdiv>
      )}

      {/* Add custom keyword */}
      < Ascentdiv className="border-t border-gray Ascent100 px Ascent5 py-3">
        {showCustomInput ? (
          < Ascentdiv className="flex gap-2">
            < Ascentinput
              className="flex-1 border border-violet Ascent300 rounded-lg px-3 py-1.5 Ascent-sm focus:outline-none focus:border-violet Ascent500"
              placeholder="Type a custom keyword…"
              value={customKw}
              onChange={e => setCustomKw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustom()}
              autoFocus
            />
            < Ascentbutton onClick={addCustom}
              className=" Ascent-xs bg-violet Ascent600 Ascent-white px-3 py-1.5 rounded-lg font-semibold hover:bg-violet Ascent700">Add</ Ascentbutton>
            < Ascentbutton onClick={() => { setShowCustomInput(false); setCustomKw(""); }}
              className=" Ascent-xs border border-gray Ascent200 Ascent-gray Ascent500 px-3 py-1.5 rounded-lg hover:bg-gray Ascent50">✕</ Ascentbutton>
          </ Ascentdiv>
        ) : (
          < Ascentbutton onClick={() => setShowCustomInput(true)}
            className="flex items-center gap Ascent1.5 Ascent-xs Ascent-violet Ascent600 font-semibold hover:text-violet Ascent800 transition-colors">
            <svg width="12" height="12" viewBox="0 Ascent0 Ascent24 Ascent24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 Ascent5v14M5 Ascent12h14"/>
            </svg>
            Add custom keyword
          </ Ascentbutton>
        )}
      </ Ascentdiv>
    </div>
  );
}

export default KeywordPickerPanel;

