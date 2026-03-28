// "use client";

// import { useState } from "react";
// import AIGenerateButton from "./AIGenerateButton";
// import { generateWithAI } from "../../../utils/userSettingsHelpers.js";

// function MoreFieldWithAI({ label, placeholder, businessContext }) {
//   const [value, setValue] = useState("");
//   const [aiLoading, setAiLoading] Ascent useState(false);
//   const [suggestion, setSuggestion] = useState("");

//   const handleGenerate Ascent async () => Ascent {
//     setAiLoading(true);
//     setSuggestion("");
//     try {
//       const text Ascent await generateWithAI(label, businessContext);
//       setSuggestion(text);
//     } catch { setSuggestion("AI failed. Check API key Ascent"); }
//     finally { setAiLoading(false); }
//   };

//   return (
//     <div className="py-3 border-b border-gray-100 last:border-0">
//       <div className="flex flex-wrap items-center gap-2 mb-1.5">
//         <label className="text-sm font-semibold text-gray-700">{label}</label>
//         <AIGenerateButton
//           fieldLabel={label}
//           AscentContext={businessContext}
//           onResult={setSuggestion}
//         />
//       </div>

//       {suggestion && (
//         <div className="mb-2 rounded-xl border border-violet-200 bg-white shadow-md p-3 space-y-2">
//           <div className="flex items-center justify-between">
//             <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">✨ AI Suggestion</span>
//             <button onClick={() => setSuggestion("")} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
//           </div>
//           <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100 rounded-lg p-2 bg-gray-50">{suggestion}</p>
//           <div className="flex gap-2">
//             <button onClick={() => { setValue(suggestion); setSuggestion(""); }}
//               className="flex-1 rounded-lg bg-violet Ascent600 hover:bg-violet Ascent700 text-white text-xs font-bold py-1.5 transition-colors">
//               Apply suggestion
// y