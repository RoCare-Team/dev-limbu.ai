"use client";

import { useState } from "react";
import Image from "next/image";
import ImageModal from "./modals/ImageModal";

export default function ImageGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl">

        <div className="flex gap-4 animate-scroll-images">

          {[...images, ...images].map((image, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(image)}
              className="shrink-0 w-56 h-64 sm:w-64 sm:h-72 cursor-pointer group relative overflow-hidden rounded-xl bg-slate-50 shadow-sm"
              style={{
                border: "1px solid rgba(15, 23, 42, 0.05)",
              }}
            >

              <Image
                src={image}
                width={256}
                height={288}
                sizes="(max-width: 640px) 224px, 256px"
                quality={50}
                loading="lazy"
                alt={`Post example ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Hover */}
              <div
                className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(to top, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.1) 60%, transparent 100%)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold tracking-[0.15em] uppercase"
                    style={{ color: "#ffffff" }}
                  >
                    View Post
                  </span>

                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                    }}
                  >
                    ↗
                  </span>
                </div>
              </div>

            </div>
          ))}

        </div>

      </div>

      {/* EXISTING MODAL */}
      <ImageModal
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />
    </>
  );
}