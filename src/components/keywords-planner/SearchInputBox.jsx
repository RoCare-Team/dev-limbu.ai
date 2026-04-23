import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

export default function SearchInputBox({ onSearch, isSearching }) {
  const [input, setInput] = useState("");
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (input) {
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(input);
      }, 500); // 500ms debounce
    } else {
      onSearch(""); // Clear results if empty
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [input, onSearch]);

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border-2 border-black/10 p-6 sm:p-10 transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-slate-50 rounded-lg">
          <Search className="w-4 h-4 text-black" />
        </div>
        <h2 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Search for your Business
        </h2>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-lemon-hover transition-colors w-4 h-4" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type what you do (e.g., Pizza Shop, Plumber)..."
          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-lemon-glow transition-all outline-none"
        />
        {isSearching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <Loader2 className="text-lemon-hover w-4 h-4 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
