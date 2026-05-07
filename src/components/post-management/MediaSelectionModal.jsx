"use client";

import React from "react";
import { X, Image as ImageIcon, Video, ArrowLeft } from "lucide-react";

const MediaSelectionModal = ({ isOpen, onClose, onSelect, imageUrl, videoUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 animate-scaleIn">
        <div className="p-5 border-b border-black/5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Choose media to post
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              This post has both image and video. Select one for this platform.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            aria-label="Close media selection"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image Option */}
            <button
              onClick={() => onSelect("image")}
              className="group overflow-hidden rounded-2xl border-2 border-slate-100 bg-white text-left transition-all hover:border-[#EAB308] hover:bg-[#EAB308]/5 hover:shadow-lg hover:shadow-[#EAB308]/10 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/30"
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {imageUrl ? (
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={34} />
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                  Image
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <ImageIcon size={18} className="text-[#EAB308]" />
                  <span className="text-sm font-black uppercase tracking-widest">
                    Post Image
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
                  Best for normal photo posts and quick sharing.
                </p>
              </div>
            </button>

            {/* Video Option */}
            <button
              onClick={() => onSelect("video")}
              className="group overflow-hidden rounded-2xl border-2 border-slate-100 bg-white text-left transition-all hover:border-[#EAB308] hover:bg-[#EAB308]/5 hover:shadow-lg hover:shadow-[#EAB308]/10 focus:outline-none focus:ring-2 focus:ring-[#EAB308]/30"
            >
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/40">
                    <Video size={34} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                  Video
                </div>
                <div className="absolute right-3 bottom-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center text-slate-900 shadow-sm">
                  <Video size={17} />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <Video size={18} className="text-[#EAB308]" />
                  <span className="text-sm font-black uppercase tracking-widest">
                    Post Video
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
                  Best when motion matters or video is required.
                </p>
              </div>
            </button>
          </div>
        </div>
        
        <div className="px-5 py-4 bg-slate-50 border-t border-black/5 flex justify-center">
          <button 
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaSelectionModal;
