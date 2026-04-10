"use client";
import { useState, useEffect, useCallback } from "react";
import { loadAssetsFromServerAction, saveAssetsToServerAction } from "@/app/actions/assetActions";
import { Upload, Image as ImageIcon, Palette, X, Check, Download, Copy, Loader, Server, AlertCircle, ArrowLeft, Sparkles, Box, Maximize, ArrowRight } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import SupportModal from "@/components/SupportModal";

export default function AssetsManager() {
  const [assets, setAssets] = useState({
    colourPalette: "",
    size: "3:4",
    characterImage: "",
    uniformImage: "",
    productImage: [],
    backgroundImage: "",
    logoImage: ""
  });

  const [previews, setPreviews] = useState({});
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState(null);
  const [assetId, setAssetId] = useState(null);
  const [error, setError] = useState(null);

  const sizeOptions = [
    { label: "1:1", value: "1:1" },
    { label: "2:3", value: "2:3" },
    { label: "3:2", value: "3:2" },
    { label: "3:4", value: "3:4" },
    { label: "4:3", value: "4:3" },
    { label: "4:5", value: "4:5" },
    { label: "5:4", value: "5:4" },
    { label: "9:16", value: "9:16" },
    { label: "16:9", value: "16:9" },
    { label: "Custom", value: "custom" }
  ];

  const colorPalettes = [
    { label: "Warm Sunset", value: "warm, yellow, orange, red", colors: ["#FFC700", "#FF8C00", "#FF4500", "#D2691E"] },
    { label: "Cool Ocean", value: "cool, blue, teal, cyan", colors: ["#00BFFF", "#48D1CC", "#20B2AA", "#4682B4"] },
    { label: "Nature Green", value: "fresh, green, lime, mint", colors: ["#32CD32", "#98FB98", "#2E8B57", "#ADFF2F"] },
    { label: "Monochrome", value: "minimal, black, white, gray", colors: ["#000000", "#808080", "#C0C0C0", "#FFFFFF"] }
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      loadAssetsFromServer(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }, []);

  const showToast = (message, type) => {
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  const loadAssetsFromServer = async (currentUserId) => {
    try {
      const result = await loadAssetsFromServerAction(currentUserId);

      if (result.success && result.data.length > 0) {
        const latestAssets = result.data[0];
        setAssetId(latestAssets._id);

        const productImageArray = latestAssets.productImage 
          ? (Array.isArray(latestAssets.productImage) 
              ? latestAssets.productImage 
              : [latestAssets.productImage])
          : [];

        const loadedAssets = {
          colourPalette: latestAssets.colourPalette || "",
          size: latestAssets.size || "3:4",
          characterImage: latestAssets.characterImage || "",
          uniformImage: latestAssets.uniformImage || "",
          productImage: productImageArray,
          backgroundImage: latestAssets.backgroundImage || "",
          logoImage: latestAssets.logoImage || ""
        };

        setAssets(loadedAssets);
        setPreviews({
          characterImage: latestAssets.characterImage,
          uniformImage: latestAssets.uniformImage,
          backgroundImage: latestAssets.backgroundImage,
          logoImage: latestAssets.logoImage,
          productImage: productImageArray
        });
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      setError('Failed to load saved assets');
    }
  };

  const saveAssetsToServer = useCallback(async (updatedAssets) => {
    if (!userId) return;

    setIsSaving(true);
    setIsSaved(false);
    setError(null);

    try {
      const backendPayload = {
        userId,
        colourPalette: updatedAssets.colourPalette,
        size: updatedAssets.size,
        characterImage: updatedAssets.characterImage,
        uniformImage: updatedAssets.uniformImage,
        productImage: Array.isArray(updatedAssets.productImage) && updatedAssets.productImage.length > 0
          ? updatedAssets.productImage[0]
          : "",
        backgroundImage: updatedAssets.backgroundImage,
        logoImage: updatedAssets.logoImage
      };

      const result = await saveAssetsToServerAction(backendPayload, assetId);

      if (result.success) {
        if (!assetId && result.data._id) {
          setAssetId(result.data._id);
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        throw new Error(result.error || 'Failed to save assets');
      }
    } catch (error) {
      console.error('Error saving assets:', error);
      setError('Failed to save assets');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [userId, assetId]);

  const handleImageUpload = (key, file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        let updatedAssets;

        if (key === 'productImage') {
          updatedAssets = {
            ...assets,
            productImage: [...assets.productImage, base64String]
          };
          setPreviews(prev => ({ 
            ...prev, 
            productImage: [...(prev.productImage || []), base64String] 
          }));
        } else {
          updatedAssets = { ...assets, [key]: base64String };
          setPreviews(prev => ({ ...prev, [key]: base64String }));
        }

        setAssets(updatedAssets);
        await saveAssetsToServer(updatedAssets);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlInput = (key, url, index = -1) => {
    if (!url || !url.trim()) return;

    let updatedAssets;
    if (key === 'productImage') {
      const newProductImages = [...assets.productImage];
      if (index >= 0) {
        newProductImages[index] = url;
      } else {
        newProductImages.push(url);
      }
      updatedAssets = { ...assets, productImage: newProductImages };
      setPreviews(prev => ({ ...prev, productImage: newProductImages }));
    } else {
      updatedAssets = { ...assets, [key]: url };
      setPreviews(prev => ({ ...prev, [key]: url }));
    }
    setAssets(updatedAssets);
    saveAssetsToServer(updatedAssets);
  };

  const removeAsset = async (key, index = -1) => {
    if (!confirm(`Are you sure you want to remove this asset?`)) return;

    let updatedAssets;
    if (key === 'productImage' && index >= 0) {
      const newProductImages = assets.productImage.filter((_, i) => i !== index);
      updatedAssets = { ...assets, productImage: newProductImages };
      setPreviews(prev => ({ ...prev, productImage: newProductImages }));
    } else {
      updatedAssets = { ...assets, [key]: "" };
      setPreviews(prev => ({ ...prev, [key]: "" }));
    }
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets);
  };

  const handleColorPaletteChange = async (value) => {
    const updatedAssets = { ...assets, colourPalette: value };
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets);
  };

  const handleSizeChange = async (value) => {
    const updatedAssets = { ...assets, size: value };
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets);
  };

  const generatePayload = () => JSON.stringify(assets, null, 2);

  const copyPayload = () => {
    navigator.clipboard.writeText(generatePayload());
    setCopiedPayload(true);
    toast.success("Design payload copied");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const imageFields = [
    { key: "characterImage", label: "Character", icon: "👤" },
    { key: "uniformImage", label: "Uniform", icon: "👕" },
    { key: "backgroundImage", label: "Background", icon: "🖼️" },
    { key: "logoImage", label: "Brand Logo", icon: "🏷️" }
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-center" />

      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glows ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />

      {/* Page Header - Non-sticky */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-xl border border-black/5 hover:bg-slate-50 transition-all">
                <ArrowLeft className="w-4 h-4 text-black" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Asset <span className="text-lemon-hover">Management</span>
                </h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Creative Resource Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSaving && <Loader className="w-3.5 h-3.5 animate-spin text-lemon-hover" />}
              {isSaved && <span className="text-[8px] font-black uppercase text-green-500 tracking-widest flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Synchronized</span>}

              <button onClick={copyPayload} className="btn-ghost px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-2">
                {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Payload
              </button>

              <button onClick={() => saveAssetsToServer(assets)} className="btn-lemon px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest gap-2">
                <Server className="w-3 h-3" /> Force Sync
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* Configuration Column */}
          <div className="lg:col-span-4 space-y-8">

            {/* Design Language Notice */}
            <div className="bg-black text-white p-6 rounded-[2rem] border border-lemon-glow/20 shadow-xl flex items-start gap-4">
              <div className="p-2.5 bg-lemon-glow rounded-xl shrink-0">
                <Sparkles className="w-4 h-4 text-black fill-black" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-lemon-glow mb-1">Visual Identity</p>
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                  These assets define your brand's core visual DNA. Limbu AI uses these primitives to synthesize high-conversion marketing materials.
                </p>
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-white rounded-[2rem] border border-black/5 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Palette className="w-4 h-4 text-black" />
                </div>
                <h2 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Color Palette</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-black/5">
                  <input
                    type="color"
                    onChange={(e) => handleColorPaletteChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                  <div>
                    <p className="text-[10px] font-black text-black uppercase tracking-tight">Custom Picker</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{assets.colourPalette || 'Not selected'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {colorPalettes.map((palette) => (
                    <button
                      key={palette.value}
                      onClick={() => handleColorPaletteChange(palette.value)}
                      className={`group w-full p-3 rounded-xl border transition-all text-left ${
                        assets.colourPalette === palette.value
                          ? 'border-lemon-hover bg-lemon-glow/5 shadow-sm'
                          : 'border-black/5 hover:border-black/10 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-black uppercase tracking-tight">{palette.label}</p>
                          <div className="flex gap-1 mt-1.5">
                            {palette.colors.map(color => (
                              <div key={color} className="w-3 h-3 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: color }}></div>
                            ))}
                          </div>
                        </div>
                        {assets.colourPalette === palette.value && <Check className="w-3 h-3 text-lemon-hover" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas Dimensions */}
            <div className="bg-white rounded-[2rem] border border-black/5 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Maximize className="w-4 h-4 text-black" />
                </div>
                <h2 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Dimensions</h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {sizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSizeChange(option.value)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      assets.size === option.value
                        ? 'border-black bg-black text-lemon-glow'
                        : 'border-black/5 hover:border-black/10 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tighter">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Assets Column */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-black/5 p-8 sm:p-10 shadow-sm">
              <h2 className="text-xl font-black text-black uppercase tracking-tight mb-8" style={{ fontFamily: "var(--font-heading)" }}>Visual <span className="text-lemon-hover">Primitives</span></h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {imageFields.map((field) => (
                  <div key={field.key} className="group relative border border-black/5 rounded-2xl p-5 hover:border-lemon-hover/50 transition-all bg-slate-50/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{field.icon}</span>
                        <h3 className="text-[10px] font-black text-black uppercase tracking-widest">{field.label}</h3>
                      </div>
                      {assets[field.key] && (
                        <button
                          onClick={() => removeAsset(field.key)}
                          className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="relative h-40 rounded-xl overflow-hidden border border-black/5 bg-white mb-4 shadow-inner">
                      {previews[field.key] ? (
                        <img src={previews[field.key]} alt={field.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                          <p className="text-[8px] font-black uppercase tracking-widest">Awaiting Asset</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(field.key, e.target.files[0])} className="hidden" />
                        <div className="w-full px-4 py-3 bg-black text-lemon-glow rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-lemon-hover hover:text-black hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-xl">
                          <Upload className="w-4 h-4" /> Upload
                        </div>
                      </label>
                      <input
                        type="text"
                        value={assets[field.key]}
                        onChange={(e) => handleUrlInput(field.key, e.target.value)}
                        placeholder="Paste URL..."
                        className="flex-[1.5] px-4 py-3 bg-white border border-black/5 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Gallery Section */}
              <div className="mt-12 pt-10 border-t border-black/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-lemon-glow rounded-lg">
                    <Box className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Product Repository</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Primary asset saved to production feed</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Array.isArray(assets.productImage) && assets.productImage.map((img, index) => (
                    <div key={index} className="group relative h-28 rounded-2xl overflow-hidden border border-black/5 bg-slate-50">
                      <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-black text-lemon-glow text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Primary</div>
                      )}
                      <button
                        onClick={() => removeAsset('productImage', index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  <label className="h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-lemon-hover hover:bg-lemon-glow/5 transition-all">
                    <input type="file" multiple onChange={(e) => { for (const file of e.target.files) handleImageUpload('productImage', file); }} className="hidden" />
                    <Upload className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Add Product</span>
                  </label>
                </div>
              </div>

              {/* Status Summary */}
              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Color Status</p>
                  <p className="text-xs font-bold text-black truncate">{assets.colourPalette || 'Offline'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Canvas Ratio</p>
                  <p className="text-xs font-bold text-black">{assets.size}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Density</p>
                  <p className="text-xs font-bold text-black">
                    {Object.values(assets).filter(v => typeof v === 'string' && (v.includes('http') || v.includes('data:image'))).length + (Array.isArray(assets.productImage) ? assets.productImage.length : 0)} Units
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SupportModal showToast={showToast} />
    </div>
  );
}