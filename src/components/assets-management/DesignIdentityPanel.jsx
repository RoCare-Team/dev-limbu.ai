import React from "react";
import { Palette, Check, Sparkles } from "lucide-react";

export default function DesignIdentityPanel({ selectedPalette, handleColorPaletteChange }) {
  const colorPalettes = [
    { label: "Warm Sunset", value: "warm, yellow, orange, red", colors: ["#FFC700", "#FF8C00", "#FF4500", "#D2691E"] },
    { label: "Cool Ocean", value: "cool, blue, teal, cyan", colors: ["#00BFFF", "#48D1CC", "#20B2AA", "#4682B4"] },
    { label: "Nature Green", value: "fresh, green, lime, mint", colors: ["#32CD32", "#98FB98", "#2E8B57", "#ADFF2F"] },
    { label: "Monochrome", value: "minimal, black, white, gray", colors: ["#000000", "#808080", "#C0C0C0", "#FFFFFF"] },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-black text-white p-8 rounded-[2.5rem] border border-lemon-glow/20 shadow-2xl flex items-start gap-5">
        <div className="p-3 bg-lemon-glow rounded-2xl shrink-0"><Sparkles className="w-5 h-5 text-black fill-black" /></div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-lemon-glow mb-1.5">Brand Style</p>
          <p className="text-xs font-semibold text-slate-300 leading-relaxed font-inter">These settings define how your brand looks. We use these colors and images to generate beautiful marketing materials.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border-2 border-black/10 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-black/5"><Palette className="w-5 h-5 text-black" /></div>
          <h2 className="text-sm font-black text-black uppercase tracking-tight font-heading">Color Theme</h2>
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-black/5 shadow-inner">
            <input 
              type="color" 
              onChange={(e) => handleColorPaletteChange(e.target.value)} 
              className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm bg-transparent" 
            />
            <div>
              <p className="text-[11px] font-black text-black uppercase tracking-tight">Pick Any Color</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{selectedPalette || 'Not selected'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {colorPalettes.map((palette) => (
              <button 
                key={palette.value} 
                onClick={() => handleColorPaletteChange(palette.value)} 
                className={`group w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedPalette === palette.value ? 'border-lemon-hover bg-lemon-glow/5 shadow-md' : 'border-black/5 hover:border-black/10 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-black uppercase tracking-tight">{palette.label}</p>
                    <div className="flex gap-1.5 mt-2">
                      {palette.colors.map(color => <div key={color} className="w-3.5 h-3.5 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: color }} />)}
                    </div>
                  </div>
                  {selectedPalette === palette.value && <Check className="w-4 h-4 text-lemon-hover" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}