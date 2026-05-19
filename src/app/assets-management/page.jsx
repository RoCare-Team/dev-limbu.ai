"use client";

import { Toaster } from "react-hot-toast";
import {
  User,
  Shirt,
  Image as ImageIcon,
  Tags,
  Loader2,
  AlertCircle,
} from "lucide-react";
// import SupportModal from "@/components/SupportModal";
import { useAssetsManager, showToast } from "@/hooks/useAssetsManager";

// Sub-components
import DesignHeader from "@/components/assets-management/DesignHeader";
import DesignIdentityPanel from "@/components/assets-management/DesignIdentityPanel";
import DimensionSelector from "@/components/assets-management/DimensionSelector";
import AssetCard from "@/components/assets-management/AssetCard";
import ProductRepository from "@/components/assets-management/ProductRepository";
import WhatsAppButton from "@/components/WhatsAppButton";

const IMAGE_FIELDS = [
  {
    key: "characterImage",
    label: "Character",
    icon: <User className="w-6 h-6 text-black" />,
  },
  {
    key: "uniformImage",
    label: "Uniform",
    icon: <Shirt className="w-6 h-6 text-black" />,
  },
  {
    key: "backgroundImage",
    label: "Background",
    icon: <ImageIcon className="w-6 h-6 text-black" />,
  },
  {
    key: "logoImage",
    label: "Brand Logo",
    icon: <Tags className="w-6 h-6 text-black" />,
  },
];

export default function AssetsManager() {
  const {
    assets,
    previews,
    urlInputs,
    isSaving,
    isSaved,
    isLoading,
    error,
    handleColorPaletteChange,
    handleSizeChange,
    handleImageUpload,
    handleUrlInputChange,
    commitUrlInput,
    removeAsset,
    copyPayload,
    forceSync,
  } = useAssetsManager();

  console.log("console in assest manager: ", { assets, previews, urlInputs });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="text-center relative z-10">
          <Loader2 className="w-10 h-10 text-lemon-hover animate-spin mx-auto mb-6" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px]">
            Loading Brand Assets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden m-0 p-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3000 }}
        containerStyle={{ top: 72 }}
      />

      {/* Subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,0.2) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at top right,rgba(250,204,21,0.3) 0%,transparent 65%)",
        }}
      />

      <DesignHeader
        isSaving={isSaving}
        isSaved={isSaved}
        copyPayload={copyPayload}
        forceSync={forceSync}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold uppercase tracking-wide">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-4 space-y-8">
            <DesignIdentityPanel
              selectedPalette={assets.colourPalette}
              handleColorPaletteChange={handleColorPaletteChange}
            />
            <DimensionSelector
              selectedSize={assets.size}
              handleSizeChange={handleSizeChange}
            />
          </div>

          {/* Right Column: Visual Assets */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[3rem] border-2 border-black/10 p-8 sm:p-12 shadow-sm">
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-10 font-heading">
                Brand <span className="text-lemon-hover">Images</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {IMAGE_FIELDS.map((field) => (
                  <AssetCard
                    key={field.key}
                    fieldKey={field.key}
                    label={field.label}
                    icon={field.icon}
                    assetValue={assets[field.key]}
                    previewUrl={previews[field.key]}
                    urlInputValue={urlInputs[field.key]}
                    handleImageUpload={handleImageUpload}
                    handleUrlInputChange={handleUrlInputChange}
                    commitUrlInput={commitUrlInput}
                    removeAsset={removeAsset}
                  />
                ))}
              </div>

              <ProductRepository
                productImages={assets.productImage}
                handleImageUpload={handleImageUpload}
                removeAsset={removeAsset}
              />

              {/* Status Summary */}
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    label: "Theme Color",
                    value: assets.colourPalette || "Not Set",
                  },
                  { label: "Selected Size", value: assets.size },
                  {
                    label: "Total Assets",
                    value: `${Object.values(assets).filter((v) => typeof v === "string" && (v.includes("http") || v.includes("data:image"))).length + (Array.isArray(assets.productImage) ? assets.productImage.length : 0)} Units`,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-6 bg-slate-50 rounded-[1.5rem] border-2 border-black/5 shadow-inner"
                  >
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                      {stat.label}
                    </p>
                    <p className="text-sm font-black text-black truncate font-inter uppercase tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <SupportModal showToast={showToast} /> */}
      <WhatsAppButton />
    </div>
  );
}
