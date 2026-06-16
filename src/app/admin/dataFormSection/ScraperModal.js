"use client";
import { useState, useEffect, useRef } from "react";

const GOOGLE_API_KEY = "AIzaSyA5Th1Wf2PiX80m8miVcK1ooHGqs_IoYoA";
const CATEGORY_OPTIONS = [
  "cafe", "restaurant", "hotel", "hospital", "gym", 
  "pharmacy", "school", "bank", "salon", "real estate", "interior designer"
];

export default function ScraperModal({ isOpen, onClose, sheets, currentSheet, onScrapeComplete }) {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Sheet States
  const [selectedSheet, setSelectedSheet] = useState(currentSheet);
  const [isNewSheet, setIsNewSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");

  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Jab currentSheet change ho (parent se), toh local state update karein
  useEffect(() => {
    setSelectedSheet(currentSheet);
  }, [currentSheet]);

  if (!isOpen) return null;

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleScrape = async () => {
    const finalCategory = customCategory.trim() || category;
    const finalSheet = isNewSheet ? newSheetName.trim() : selectedSheet;

    if (!city || !finalCategory) return alert("Please enter City and Category");
    if (isNewSheet && !newSheetName) return alert("Please enter a name for the new sheet");
    if (!isNewSheet && !selectedSheet) return alert("Please select a target sheet");

    setLoading(true);
    addLog(`🚀 Starting scrape for ${finalCategory} in ${city}...`, "info");
    addLog(`Target Sheet: ${finalSheet}`, "info");

    try {
      const res = await fetch("/api/admin/gmb-scraper/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          category: finalCategory,
          limit,
          sheet: finalSheet, // Nayi sheet ka naam yahan jayega
          googleApiKey: GOOGLE_API_KEY,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addLog(`✅ Success! Saved: ${data.saved}, Skipped: ${data.duplicates}`, "success");
        onScrapeComplete(); 
      } else {
        addLog(`❌ Error: ${data.error}`, "error");
      }
    } catch (err) {
      addLog(`❌ Network Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Scrape GMB Data</h2>
            <p className="text-xs text-gray-500">Extract business details directly to Google Sheets</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-3xl transition">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input 
                value={city} 
                onChange={e => setCity(e.target.value)} 
                className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder="e.g. Mumbai, Gwalior" 
              />
            </div>

            {/* Limit Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max Results (Limit)</label>
              <input 
                type="number" 
                value={limit} 
                onChange={e => setLimit(e.target.value)} 
                className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
              />
            </div>
          </div>

          {/* Category Dropdown & Custom Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select 
                value={category} 
                onChange={e => {setCategory(e.target.value); setCustomCategory("")}} 
                className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
              >
                <option value="">-- Select Category --</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Category</label>
              <input 
                value={customCategory} 
                onChange={e => {setCustomCategory(e.target.value); setCategory("")}} 
                className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder="e.g. Wedding Planner" 
              />
            </div>
          </div>

          {/* Sheet Selection Area */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-blue-800">Target Google Sheet Tab</label>
              <button 
                onClick={() => setIsNewSheet(!isNewSheet)}
                className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                {isNewSheet ? "Select Existing Sheet" : "+ Create New Sheet"}
              </button>
            </div>

            {isNewSheet ? (
              <div className="animate-in fade-in duration-300">
                <input 
                  value={newSheetName} 
                  onChange={e => setNewSheetName(e.target.value)} 
                  className="w-full border border-blue-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Enter new sheet name (e.g. Leads_May_2024)" 
                  autoFocus
                />
                <p className="text-[10px] text-blue-600 mt-1 ml-1 font-medium">* System will create a new tab in your Google Sheet.</p>
              </div>
            ) : (
              <select 
                value={selectedSheet} 
                onChange={e => setSelectedSheet(e.target.value)} 
                className="w-full border border-blue-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
              >
                {sheets.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          {/* Start Button */}
          <button 
            onClick={handleScrape} 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scraping Data...
              </span>
            ) : "🚀 Start Scrape & Save"}
          </button>

          {/* Terminal Style Logs */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-inner">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-gray-400 font-mono ml-2 uppercase tracking-widest">Process Console</span>
            </div>
            <div className="p-4 font-mono text-[11px] h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
              {logs.length === 0 && <p className="text-gray-600 italic">Logs will appear here once the process starts...</p>}
              {logs.map((l, i) => (
                <div key={i} className="mb-1 flex gap-2 animate-in slide-in-from-left-2 duration-300">
                  <span className="text-gray-500 shrink-0">[{l.time}]</span>
                  <span className={l.type === "success" ? "text-green-400" : l.type === "error" ? "text-red-400" : "text-blue-300"}>
                    {l.msg}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}