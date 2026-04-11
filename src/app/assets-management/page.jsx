"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadAssetsFromServerAction,
  saveAssetsToServerAction,
} from "@/app/actions/assetActions";
import {
  Upload,
  Image as ImageIcon,
  Palette,
  X,
  Check,
  Copy,
  Loader,
  Server,
  ArrowLeft,
  Sparkles,
  Box,
  Maximize,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import SupportModal from "@/components/SupportModal";

// ─── Toast dedup helper ───────────────────────────────────────────────────────
const activeToastIds = new Set();
function showToast(message, type = "info") {
  const id = `toast-${message}`;
  if (activeToastIds.has(id)) return;
  activeToastIds.add(id);

  const opts = { id, duration: 3000 };
  if (type === "error") toast.error(message, opts);
  else if (type === "success") toast.success(message, opts);
  else toast(message, opts);

  setTimeout(() => activeToastIds.delete(id), 3200);
}

export default function AssetsManager() {
  const [assets, setAssets] = useState({
    colourPalette: "",
    size: "3:4",
    characterImage: "",
    uniformImage: "",
    productImage: [],
    backgroundImage: "",
    logoImage: "",
  });

  const [previews, setPreviews] = useState({});
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState(null);
  const [assetId, setAssetId] = useState(null);
  const [error, setError] = useState(null);

  const [urlInputs, setUrlInputs] = useState({
    characterImage: "",
    uniformImage: "",
    backgroundImage: "",
    logoImage: "",
  });

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
    { label: "Custom", value: "custom" },
  ];

  const colorPalettes = [
    { label: "Warm Sunset", value: "warm, yellow, orange, red", colors: ["#FFC700", "#FF8C00", "#FF4500", "#D2691E"] },
    { label: "Cool Ocean", value: "cool, blue, teal, cyan", colors: ["#00BFFF", "#48D1CC", "#20B2AA", "#4682B4"] },
    { label: "Nature Green", value: "fresh, green, lime, mint", colors: ["#32CD32", "#98FB98", "#2E8B57", "#ADFF2F"] },
    { label: "Monochrome", value: "minimal, black, white, gray", colors: ["#000000", "#808080", "#C0C0C0", "#FFFFFF"] },
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

  const loadAssetsFromServer = async (currentUserId) => {
    try {
      const result = await loadAssetsFromServerAction(currentUserId);
      if (result.success && result.data.length > 0) {
        const latestAssets = result.data[0];
        setAssetId(latestAssets._id);
        const productImageArray = latestAssets.productImage
          ? Array.isArray(latestAssets.productImage) ? latestAssets.productImage : [latestAssets.productImage]
          : [];
        const loadedAssets = {
          colourPalette: latestAssets.colourPalette || "",
          size: latestAssets.size || "3:4",
          characterImage: latestAssets.characterImage || "",
          uniformImage: latestAssets.uniformImage || "",
          productImage: productImageArray,
          backgroundImage: latestAssets.backgroundImage || "",
          logoImage: latestAssets.logoImage || "",
        };
        setAssets(loadedAssets);
        setUrlInputs({
          characterImage: latestAssets.characterImage?.startsWith("http") ? latestAssets.characterImage : "",
          uniformImage: latestAssets.uniformImage?.startsWith("http") ? latestAssets.uniformImage : "",
          backgroundImage: latestAssets.backgroundImage?.startsWith("http") ? latestAssets.backgroundImage : "",
          logoImage: latestAssets.logoImage?.startsWith("http") ? latestAssets.logoImage : "",
        });
        setPreviews({
          characterImage: latestAssets.characterImage,
          uniformImage: latestAssets.uniformImage,
          backgroundImage: latestAssets.backgroundImage,
          logoImage: latestAssets.logoImage,
          productImage: productImageArray,
        });
      }
    } catch (error) {
      console.error("Error loading assets:", error);
      setError("Failed to load saved assets");
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
          ? updatedAssets.productImage[0] : "",
        backgroundImage: updatedAssets.backgroundImage,
        logoImage: updatedAssets.logoImage,
      };
      const result = await saveAssetsToServerAction(backendPayload, assetId);
      if (result.success) {
        if (!assetId && result.data._id) setAssetId(result.data._id);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        throw new Error(result.error || "Failed to save assets");
      }
    } catch (error) {
      console.error("Error saving assets:", error);
      setError("Failed to save assets");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [userId, assetId]);

  const handleImageUpload = (key, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const MAX_MB = 1;
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(`Image must be under ${MAX_MB}MB. Please choose a smaller file.`, "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      let updatedAssets;
      if (key === "productImage") {
        updatedAssets = { ...assets, productImage: [...assets.productImage, base64String] };
        setPreviews((prev) => ({ ...prev, productImage: [...(prev.productImage || []), base64String] }));
      } else {
        updatedAssets = { ...assets, [key]: base64String };
        setPreviews((prev) => ({ ...prev, [key]: base64String }));
      }
      setAssets(updatedAssets);
      await saveAssetsToServer(updatedAssets);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInputChange = (key, value) => {
    setUrlInputs((prev) => ({ ...prev, [key]: value }));
  };

  const commitUrlInput = (key, value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const updatedAssets = { ...assets, [key]: trimmed };
    setPreviews((prev) => ({ ...prev, [key]: trimmed }));
    setAssets(updatedAssets);
    saveAssetsToServer(updatedAssets);
  };

  const removeAsset = async (key, index = -1) => {
    if (!confirm(`Are you sure you want to remove this asset?`)) return;
    let updatedAssets;
    if (key === "productImage" && index >= 0) {
      const newProductImages = assets.productImage.filter((_, i) => i !== index);
      updatedAssets = { ...assets, productImage: newProductImages };
      setPreviews((prev) => ({ ...prev, productImage: newProductImages }));
    } else {
      updatedAssets = { ...assets, [key]: "" };
      setPreviews((prev) => ({ ...prev, [key]: "" }));
      setUrlInputs((prev) => ({ ...prev, [key]: "" }));
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
    showToast("Design payload copied", "success");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const imageFields = [
    { key: "characterImage", label: "Character", icon: "👤" },
    { key: "uniformImage", label: "Uniform", icon: "👕" },
    { key: "backgroundImage", label: "Background", icon: "🖼️" },
    { key: "logoImage", label: "Brand Logo", icon: "🏷️" },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden m-0 p-0" style={{ backgroundColor: "var(--background)" }}>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} containerStyle={{ top: 72 }} />

      {/* Subtle background grid */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(15,23,42,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,0.2) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10" style={{ background: "radial-gradient(ellipse at top right,rgba(250,204,21,0.3) 0%,transparent 65%)" }} />

      {/* Page Header */}
      <div className="relative z-30 bg-white/80 backdrop-blur-md border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2.5 rounded-2xl border border-black/10 hover:bg-slate-50 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5 text-black" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight leading-none mb-1 font-heading">
                  Asset <span className="text-lemon-hover">Management</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Creative Resource Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSaving && <Loader className="w-4 h-4 animate-spin text-lemon-hover" />}
              {isSaved && <span className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1"><Check className="w-3 h-3" /> Synchronized</span>}
              <button onClick={copyPayload} className="btn-ghost px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 border border-black/10">
                {copiedPayload ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Payload
              </button>
              <button onClick={() => saveAssetsToServer(assets)} className="btn-lemon px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg">
                <Server className="w-4 h-4" /> Force Sync
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-10">

          {/* Configuration Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-black text-white p-8 rounded-[2.5rem] border border-lemon-glow/20 shadow-2xl flex items-start gap-5">
              <div className="p-3 bg-lemon-glow rounded-2xl shrink-0"><Sparkles className="w-5 h-5 text-black fill-black" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-lemon-glow mb-1.5">Visual Identity</p>
                <p className="text-xs font-semibold text-slate-300 leading-relaxed font-inter">These assets define your brand's core visual DNA. Limbu AI uses these primitives to synthesize high-conversion materials.</p>
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-white rounded-[2.5rem] border-2 border-black/10 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-black/5"><Palette className="w-5 h-5 text-black" /></div>
                <h2 className="text-sm font-black text-black uppercase tracking-tight font-heading">Color Palette</h2>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-black/5 shadow-inner">
                  <input type="color" onChange={(e) => handleColorPaletteChange(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm bg-transparent" />
                  <div>
                    <p className="text-[11px] font-black text-black uppercase tracking-tight">Custom Picker</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{assets.colourPalette || 'Not selected'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {colorPalettes.map((palette) => (
                    <button key={palette.value} onClick={() => handleColorPaletteChange(palette.value)} className={`group w-full p-4 rounded-2xl border-2 transition-all text-left ${assets.colourPalette === palette.value ? 'border-lemon-hover bg-lemon-glow/5 shadow-md' : 'border-black/5 hover:border-black/10 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black text-black uppercase tracking-tight">{palette.label}</p>
                          <div className="flex gap-1.5 mt-2">
                            {palette.colors.map(color => <div key={color} className="w-3.5 h-3.5 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: color }} />)}
                          </div>
                        </div>
                        {assets.colourPalette === palette.value && <Check className="w-4 h-4 text-lemon-hover" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas Dimensions */}
            <div className="bg-white rounded-[2.5rem] border-2 border-black/10 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-black/5"><Maximize className="w-5 h-5 text-black" /></div>
                <h2 className="text-sm font-black text-black uppercase tracking-tight font-heading">Dimensions</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {sizeOptions.map((option) => (
                  <button key={option.value} onClick={() => handleSizeChange(option.value)} className={`p-3.5 rounded-2xl border-2 text-center transition-all ${assets.size === option.value ? 'border-black bg-black text-lemon-glow shadow-lg' : 'border-black/5 hover:border-black/10 text-slate-500 font-bold uppercase text-[10px]'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Assets Column */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[3rem] border-2 border-black/10 p-8 sm:p-12 shadow-sm">
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-10 font-heading">Visual <span className="text-lemon-hover">Primitives</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {imageFields.map((field) => (
                  <div key={field.key} className="group relative border-2 border-black/10 rounded-[2rem] p-8 hover:border-lemon-hover hover:bg-white transition-all bg-slate-50/50 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{field.icon}</span>
                        <h3 className="text-[12px] font-black text-black uppercase tracking-[0.15em]">{field.label}</h3>
                      </div>
                      {assets[field.key] && (
                        <button onClick={() => removeAsset(field.key)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all border border-black/5 bg-white"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                    <div className="relative h-48 rounded-[1.5rem] overflow-hidden border-2 border-black/5 bg-white mb-8 shadow-inner group-hover:border-lemon-glow/30 transition-all">
                      {previews[field.key] ? (
                        <img src={previews[field.key]} alt={field.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                          <p className="text-[11px] font-black uppercase tracking-[0.2em]">Awaiting Asset</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="cursor-pointer w-full">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(field.key, e.target.files[0])} className="hidden" />
                        <div className="w-full px-5 py-4 bg-black text-lemon-glow rounded-2xl text-[11px] font-black uppercase tracking-widest text-center hover:bg-lemon-hover hover:text-black hover:scale-[1.01] transition-all flex items-center justify-center gap-3 shadow-xl">
                          <Upload className="w-4 h-4" /> Upload File
                        </div>
                      </label>
                      <input
                        type="text"
                        value={urlInputs[field.key] ?? ""}
                        onChange={(e) => handleUrlInputChange(field.key, e.target.value)}
                        onBlur={(e) => commitUrlInput(field.key, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitUrlInput(field.key, e.currentTarget.value); }}
                        placeholder="Or paste URL + Enter"
                        className="w-full px-5 py-3.5 bg-white border-2 border-black/5 rounded-2xl text-[11px] font-bold text-black placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-lemon-glow/10 focus:border-lemon-hover transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Gallery */}
              <div className="mt-16 pt-12 border-t-2 border-black/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-lemon-glow rounded-2xl shadow-sm"><Box className="w-5 h-5 text-black" /></div>
                  <div>
                    <h3 className="text-lg font-black text-black uppercase tracking-tight font-heading">Product Repository</h3>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Primary asset saved to production feed</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {Array.isArray(assets.productImage) && assets.productImage.map((img, index) => (
                    <div key={index} className="group relative h-32 rounded-2xl overflow-hidden border-2 border-black/5 bg-slate-100 shadow-sm hover:border-lemon-hover transition-all">
                      <img src={img} alt="Product" className="w-full h-full object-cover" />
                      {index === 0 && <div className="absolute top-3 left-3 bg-black text-lemon-glow text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Primary</div>}
                      <button onClick={() => removeAsset("productImage", index)} className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <label className="h-32 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-lemon-hover hover:bg-lemon-glow/5 transition-all group/add">
                    <input type="file" multiple onChange={(e) => { for (const file of e.target.files) handleImageUpload("productImage", file); }} className="hidden" />
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2 group-hover/add:bg-lemon-glow transition-colors shadow-sm"><Upload className="w-5 h-5 text-slate-400 group-hover/add:text-black" /></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Add Product</span>
                  </label>
                </div>
              </div>

              {/* Status Summary */}
              <div className="mt-16 grid grid-cols-3 gap-5">
                {[
                  { label: "Color Status", value: assets.colourPalette || "Offline" },
                  { label: "Canvas Ratio", value: assets.size },
                  { label: "Asset Density", value: `${Object.values(assets).filter(v => typeof v === "string" && (v.includes("http") || v.includes("data:image"))).length + (Array.isArray(assets.productImage) ? assets.productImage.length : 0)} Units` }
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-[1.5rem] border-2 border-black/5 shadow-inner">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">{stat.label}</p>
                    <p className="text-sm font-black text-black truncate font-inter uppercase tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SupportModal showToast={showToast} />
    </div>
  );
}
