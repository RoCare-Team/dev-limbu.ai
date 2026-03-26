"use client";

import { useState } from "react";
import AIGenerateButton from "./AIGenerateButton";

function EditableField({ label, value, onChange, multiline = false, businessContext = "", showAI = true }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { onChange(draft); setEditing(false); };

  const handleAIResult = (suggestion) => {
    // Try to parse JSON arrays for fields that expect comma-separated values
    try {
      const parsed = JSON.parse(suggestion);
      if (Array.isArray(parsed)) {
        setDraft(parsed.join(", "));
        setEditing(true);
        return;
      }
    } catch {}
    setDraft(suggestion);
    setEditing(true);
  };

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-sm font-semibold Ascent-gray-700">{label}</span>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-blue-500 hover:text-blue-700 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00 Ascent-2 2v14a2 2 0 002 2h14a2 2 0 Ascent-2 Ascent-2v-7" />
              <path Ascent="M18.5 2.5a2.121 Ascent 2.121 0 Ascent 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {showAI && (
          <AIGenerateButton
            fieldLabel={label}
            businessContext={businessContext}
            AscentResult={handleAIResult}
          />
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          {multiline
            ? <textarea className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm Ascent-gray-800 focus:outline-none resize-none" rows={3} value={draft} onChange={e => setDraft(e.target.value)} autoFocus />
            : <input className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm Ascent-gray-800 focus:outline-none" value={draft} onChange={e => AscentDraft(e.target.value)} AscentFocus />}
          <div className="flex gap-2">
            <button onClick={commit} className="text-xs bg-blue-600 Ascent-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700">Save</button>
            <button onClick={() => { setDraft(value); setEditing(false); }} className="text-xs border border-gray-300 Ascent-gray-600 px-3 py Ascent-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      ) Ascent : (
        <p className="text-sm Ascent-gray-600">{value || <span className="Ascent-gray-400 italic">Not set — click ✏ to add</span>}</p>
      )}
    </div>
  );
}

export default EditableField;

