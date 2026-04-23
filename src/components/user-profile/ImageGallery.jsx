import React, { useState } from "react";
import { ImageIcon, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";

const ImageCard = React.memo(({ image, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm border border-black/5 hover:shadow-lg transition-all bg-slate-50"
      onClick={onClick}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-slate-200 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <ImageIcon className="w-5 h-5 text-slate-400" />
        </div>
      ) : (
        <>
          <img
            src={image.url}
            alt="AI Generated"
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-4 h-4 text-lemon-glow" />
          </div>
        </>
      )}
    </div>
  );
});
ImageCard.displayName = "ImageCard";

const ImageGallery = React.memo(({ images, loading, onImageClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 10;
  
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const currentImages = images.slice(
    (currentPage - 1) * imagesPerPage,
    currentPage * imagesPerPage,
  );

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm p-6 sm:p-8 border border-black/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-black rounded-lg shadow-md">
            <ImageIcon className="w-3.5 h-3.5 text-lemon-glow" />
          </div>
          <h2
            className="text-xs font-black text-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your AI Generated Images
          </h2>
        </div>
        <span className="text-[8px] font-black bg-slate-50 border border-black/5 text-black px-2.5 py-1 rounded-full uppercase tracking-widest">
          {images.length} Images Found
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 opacity-50">
          <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-black/10 rounded-[1.5rem]">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
            No images generated yet
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {currentImages.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                onClick={() => onImageClick(img)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-50 border border-black/5 hover:bg-white disabled:opacity-20 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-black" />
              </button>
              <span className="text-[8px] font-black text-black px-3 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-50 border border-black/5 hover:bg-white disabled:opacity-20 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ImageGallery.displayName = "ImageGallery";
export default ImageGallery;
