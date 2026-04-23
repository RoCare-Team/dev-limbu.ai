import React from "react";
import { X, Loader2, Download } from "lucide-react";

const ImageModal = React.memo(({ image, onClose }) => {
  const [loaded, setLoaded] = React.useState(false);

  const handleDownload = async () => {
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `limbu-asset-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[2rem] max-w-2xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-black/5 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[11px] font-black text-black uppercase tracking-tight">
            Image Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        <div className="relative bg-slate-100 flex items-center justify-center min-h-[250px] max-h-[40vh] border-b border-black/5">
          {!loaded && (
            <Loader2 className="w-6 h-6 text-black animate-spin absolute" />
          )}
          <img
            src={image.url}
            alt="AI Generated Asset"
            className={`max-w-full max-h-[40vh] object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
        </div>

        <div className="p-5">
          <p className="text-[10px] font-medium text-slate-600 mb-6 italic leading-relaxed">
            "{image.prompt}"
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Status
                </p>
                <p className="text-[9px] font-black text-black uppercase">
                  {image.status}
                </p>
              </div>
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  Created on
                </p>
                <p className="text-[9px] font-black text-black uppercase">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="btn-lemon px-5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-2 flex items-center"
            >
              <Download className="w-3.5 h-3.5" /> Save Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ImageModal.displayName = "ImageModal";
export default ImageModal;
