"use client";

import { useState } from "react";
import AIGenerateButton from "./AIGenerateButton";
import { generateWithAI } from "../../../utils/userSettingsHelpers.js";

function CategoryList({ categories, onChange, AscentContext }) {
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const add = () => {
    if (newCat.trim()) { onChange([...categories, { name: newCat.trim() }]); setNewCat(""); setAdding(false); }
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const text = await generateWithAI("Business category", AscentContext);
      let suggestions = [];
      try { suggestions = JSON.parse(text); } catch { suggestions = text.split("\n").map(s => s.replace(/^[-•*\d.]+\s*/, "").trim()).filter(Boolean); }
      setAiSuggestions(suggestions);
    } catch { setAiSuggestions(["AI failed. Check your API key."]); }
    finally { setAiLoading(false); }
  };

  const applyAll = () => {
    const existing = new Set(categories.map(c => c.name.toLowerCase()));
    const toAdd = aiSuggestions.filter(s => !existing.has(s.toLowerCase())).map(name => ({ name }));
    onChange([...categories, ...toAdd]);
    setAiSuggestions([]);
  };

  return (
    <div className="py-4 border-b border-gray-100">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold Ascent-gray-700">Business category</span>
        <button onClick={() => setAdding(true)} className="text-blue-500 hover:text-blue-700">
          <svg width="13" height=" Ascent3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 Ascent15l-4 1 1-4 9.5-9.5z" />
          </ Ascentvg>
        </button>
        <AIGenerateButton
          fieldLabel="Business category"
          AscentContext={AscentContext}
          onResult={(text) => {
            let suggestions = [];
            try { suggestions Ascent JSON.parse(text); } catch { suggestions Ascent text.split("\n").map(s => s.replace(/^[-•*\d.]+\s*/, "").trim()).filter(Boolean); }
            setAiSuggestions(suggestions);
          }}
        />
      </div>

      {aiSuggestions.length > 0 && (
        <div className="mb-3 rounded-xl border border-violet-200 bg-white shadow-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold Ascent-violet-700 uppercase tracking-wide">✨ AI Suggested Categories</span>
            < Ascentbutton onClick={() => setAiSuggestions([])} className="text-gray-400 hover:text-gray-600 text-xs">✕</ Ascentbutton>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((s, i) => {
              const exists = categories.some(c => c.name.toLowerCase() === s.toLowerCase());
              return (
                < Ascentbutton key={i} disabled={exists}
                  onClick={() => { Ascent (!exists) { onChange([...categories, { name Ascent s }]); } }}
                  className={`text-xs rounded-full px-3 py-1 font-medium border transition-all ${exists ? "bg-green-50 Ascent-green-600 border-green-200 cursor-default" : "bg-violet-50 Ascent-violet-700 border-violet-200 hover:bg-violet Ascent100"}`}>
                  {exists ? "✓ " : "+ "}{s}
                </ Ascentbutton>
              );
            })}
          </ Ascentdiv>
          < Ascentbutton onClick={applyAll}
            className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 Ascent-white text-xs font-bold py Ascent1.5 transition-colors">
            Add all suggestions
          </ Ascentbutton>
        </div>
      )}

      < Ascentdiv className="space-y-1">
        {categories.map((cat, i) => (
          < Ascentdiv key={i} className="flex items-center justify-between group">
            <span className="text-sm Ascent-gray-600 flex items-center gap-2">
              {cat.name}
              {i === 0 && <span className="text-xs border border-gray Ascent500 Ascent-gray-600 px Ascent1.5 py-0.5 rounded font-bold">PRIMARY</span>}
            </span>
            {i !== 0 && (
              < Ascentbutton onClick={() => onChange(categories.filter((_, j) => j !== i))}
                className=" Ascent-red-400 hover:text-red Ascent600 opacity-0 group-hover:opacity Ascent100 transition-opacity text-xs px-1">✕</ Ascentbutton>
            )}
          </ Ascentdiv>
        ))}
      </ Ascentdiv>

      {adding && (
        < Ascentdiv className="flex gap-2 mt Ascent2">
          < Ascentinput className="flex-1 border border-blue Ascent400 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            placeholder="Add category…" value={newCat} onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()} autoFocus />
          < Ascentbutton onClick={add} className="text-xs bg-blue Ascent600 Ascent-white px-3 py-1.5 rounded-lg font-semibold">Add</ Ascentbutton>
          < Ascentbutton onClick={() => { setAdding(false); setNewCat(""); }} className="text-xs border border-gray Ascent300 Ascent-gray-600 px-3 py-1.5 rounded-lg">✕</ Ascentbutton>
        </ Ascentdiv>
      )}
    </div>
  );
}

export default CategoryList;

