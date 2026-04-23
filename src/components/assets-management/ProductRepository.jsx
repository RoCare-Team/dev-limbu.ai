import React from "react";
import { Box, Upload, X } from "lucide-react";

export default function ProductRepository({ productImages, handleImageUpload, removeAsset }) {
  const images = Array.isArray(productImages) ? productImages : [];

  return (
    <div className="mt-16 pt-12 border-t-2 border-black/5">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-lemon-glow rounded-2xl shadow-sm"><Box className="w-5 h-5 text-black" /></div>
        <div>
          <h3 className="text-lg font-black text-black uppercase tracking-tight font-heading">Product Gallery</h3>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Images used in your marketing</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {images.map((img, index) => (
          <div key={index} className="group relative h-32 rounded-2xl overflow-hidden border-2 border-black/5 bg-slate-100 shadow-sm hover:border-lemon-hover transition-all">
            <img src={img} alt="Product" className="w-full h-full object-cover" />
            {index === 0 && <div className="absolute top-3 left-3 bg-black text-lemon-glow text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Primary</div>}
            <button 
              onClick={() => removeAsset("productImage", index)} 
              className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="h-32 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-lemon-hover hover:bg-lemon-glow/5 transition-all group/add">
          <input 
            type="file" 
            multiple 
            onChange={(e) => { 
              for (const file of e.target.files) handleImageUpload("productImage", file); 
            }} 
            className="hidden" 
          />
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2 group-hover/add:bg-lemon-glow transition-colors shadow-sm">
            <Upload className="w-5 h-5 text-slate-400 group-hover/add:text-black" />
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Add Product</span>
        </label>
      </div>
    </div>
  );
}