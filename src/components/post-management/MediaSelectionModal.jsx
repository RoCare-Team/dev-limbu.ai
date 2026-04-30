"use client";

import React from "react";
import { X, Image as ImageIcon, Video, CheckCircle2 } from "lucide-react";

const MediaSelectionModal = ({ isOpen, onClose, onSelect, imageUrl, videoUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Choose Media</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500 text-center mb-2">
            This post has both an image and a video. Which one would you like to post?
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Image Option */}
            <button
              onClick={() => onSelect("image")}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-black/5 hover:border-[#EAB308] hover:bg-[#EAB308]/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-[#EAB308] group-hover:bg-white transition-colors shadow-sm">
                <ImageIcon size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-black">Post Image</span>
            </button>

            {/* Video Option */}
            <button
              onClick={() => onSelect("video")}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-black/5 hover:border-[#EAB308] hover:bg-[#EAB308]/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-[#EAB308] group-hover:bg-white transition-colors shadow-sm">
                <Video size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-black">Post Video</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 flex justify-center">
            <button 
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
            >
                Back to Post
            </button>
        </div>
      </div>
    </div>
  );
};

export default MediaSelectionModal;
