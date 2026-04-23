import React, { useState, useEffect } from "react";
import { Maximize, Check } from "lucide-react";

export default function DimensionSelector({ selectedSize, handleSizeChange }) {
  const sizeOptions = [
    { label: "1:1 (Square)", value: "1:1" },
    { label: "2:3", value: "2:3" },
    { label: "3:2", value: "3:2" },
    { label: "3:4 (Portrait)", value: "3:4" },
    { label: "4:3", value: "4:3" },
    { label: "4:5", value: "4:5" },
    { label: "5:4", value: "5:4" },
    { label: "9:16 (Story)", value: "9:16" },
    { label: "16:9 (Landscape)", value: "16:9" },
    { label: "Custom Ratio", value: "custom" },
  ];

  // Track custom input locally
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Sync state if selectedSize is a custom value (e.g. "8:10" which is not in standard list)
  useEffect(() => {
    if (!selectedSize) return;
    
    const isStandard = sizeOptions.some(opt => opt.value === selectedSize && opt.value !== "custom");
    
    if (!isStandard) {
      setIsCustomMode(true);
      const parts = selectedSize.split(":");
      if (parts.length === 2) {
        setCustomW(parts[0]);
        setCustomH(parts[1]);
      }
    } else {
      setIsCustomMode(false);
    }
  }, [selectedSize]);

  const onSelectStandard = (value) => {
    if (value === "custom") {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      handleSizeChange(value);
    }
  };

  const applyCustomSize = () => {
    if (customW && customH) {
      handleSizeChange(`${customW}:${customH}`);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-black/10 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-black/5">
          <Maximize className="w-5 h-5 text-black" />
        </div>
        <h2 className="text-sm font-black text-black uppercase tracking-tight font-heading">Image Size (Ratio)</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {sizeOptions.map((option) => {
          // Highlight standard options OR custom button
          const isActive = option.value === "custom" 
            ? isCustomMode 
            : (!isCustomMode && selectedSize === option.value);

          return (
            <button 
              key={option.value} 
              onClick={() => onSelectStandard(option.value)} 
              className={`p-3.5 rounded-2xl border-2 text-center transition-all text-[10px] font-bold uppercase ${
                isActive 
                ? 'border-lemon-hover bg-lemon-glow/10 text-black shadow-sm' 
                : 'border-black/5 hover:border-black/10 text-slate-500'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {isCustomMode && (
        <div className="p-4 bg-slate-50 border-2 border-black/5 rounded-2xl animate-fadeIn">
          <p className="text-[10px] font-black text-black uppercase tracking-widest mb-3">Set Custom Ratio</p>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Width"
              value={customW}
              onChange={(e) => setCustomW(e.target.value)}
              className="w-full px-3 py-2 border border-black/10 rounded-xl text-xs font-bold text-center outline-none focus:border-lemon-hover"
            />
            <span className="font-black text-slate-400">:</span>
            <input 
              type="number" 
              placeholder="Height"
              value={customH}
              onChange={(e) => setCustomH(e.target.value)}
              className="w-full px-3 py-2 border border-black/10 rounded-xl text-xs font-bold text-center outline-none focus:border-lemon-hover"
            />
            <button 
              onClick={applyCustomSize}
              disabled={!customW || !customH}
              className="p-2 bg-lemon-glow text-black rounded-xl hover:bg-lemon-hover transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}