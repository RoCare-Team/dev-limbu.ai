import React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

export default function AssetCard({ 
  fieldKey, 
  label, 
  icon, 
  assetValue, 
  previewUrl, 
  urlInputValue,
  handleImageUpload, 
  handleUrlInputChange, 
  commitUrlInput, 
  removeAsset 
}) {

  console.log("Asset Card console: ",{fieldKey, 
  label, 
  icon, 
  assetValue, 
  previewUrl, 
  urlInputValue,
  handleImageUpload, 
  handleUrlInputChange, 
  commitUrlInput, 
  removeAsset })
  return (
    <div className="group relative border-2 border-black/10 rounded-[2rem] p-8 hover:border-lemon-hover hover:bg-white transition-all bg-slate-50/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-[12px] font-black text-black uppercase tracking-[0.15em]">{label}</h3>
        </div>
        {assetValue && (
          <button onClick={() => removeAsset(fieldKey)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all border border-black/5 bg-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative h-48 rounded-[1.5rem] overflow-hidden border-2 border-black/5 bg-white mb-8 shadow-inner group-hover:border-lemon-glow/30 transition-all">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">Upload Image</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="cursor-pointer w-full">
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageUpload(fieldKey, e.target.files[0])} 
            className="hidden" 
          />
          <div className="w-full px-5 py-4 bg-black text-lemon-glow rounded-2xl text-[11px] font-black uppercase tracking-widest text-center hover:bg-lemon-hover hover:text-black hover:scale-[1.01] transition-all flex items-center justify-center gap-3 shadow-xl">
            <Upload className="w-4 h-4" /> Browse File
          </div>
        </label>
        <input
          type="text"
          value={urlInputValue ?? ""}
          onChange={(e) => handleUrlInputChange(fieldKey, e.target.value)}
          onBlur={(e) => commitUrlInput(fieldKey, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commitUrlInput(fieldKey, e.currentTarget.value); }}
          placeholder="Or paste URL + Enter"
          className="w-full px-5 py-3.5 bg-white border-2 border-black/5 rounded-2xl text-[11px] font-bold text-black placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-lemon-glow/10 focus:border-lemon-hover transition-all"
        />
      </div>
    </div>
  );
}