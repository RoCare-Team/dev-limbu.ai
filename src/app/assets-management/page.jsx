"use client";
import { useState, useEffect, useCallback } from "react";
import { loadAssetsFromServerAction, saveAssetsToServerAction } from "@/app/actions/assetActions";
import { Upload, Image, Palette, X, Check, Download, Copy, Loader, Server, AlertCircle } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import SupportModal from "@/components/SupportModal";

export default function AssetsManager() {
  const [assets, setAssets] = useState({
    colourPalette: "",
    size: "1080x1350",
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
  { label: "21:9", value: "21:9" },
  { label: "Custom", value: "custom" }
];


  const colorPalettes = [
    { label: "Warm Sunset", value: "warm, yellow, orange, red", colors: ["#FFC700", "#FF8C00", "#FF4500", "#D2691E"] },
    { label: "Cool Ocean", value: "cool, blue, teal, cyan", colors: ["#00BFFF", "#48D1CC", "#20B2AA", "#4682B4"] },
    { label: "Nature Green", value: "fresh, green, lime, mint", colors: ["#32CD32", "#98FB98", "#2E8B57", "#ADFF2F"] },
    { label: "Royal Purple", value: "luxe, purple, violet, magenta", colors: ["#8A2BE2", "#9932CC", "#DA70D6", "#BA55D3"] },
    { label: "Monochrome", value: "minimal, black, white, gray", colors: ["#000000", "#808080", "#C0C0C0", "#FFFFFF"] },
    { label: "Vibrant Mix", value: "vibrant, rainbow, multicolor, bold", colors: ["#FF1493", "#00FF00", "#FFD700", "#1E90FF"] }
  ];

  // Initialize userId from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      loadAssetsFromServer(storedUserId);
    } else {
      // Generate a new userId if none exists
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
        
        // Convert productImage to array if it's a string
        const productImageArray = latestAssets.productImage 
          ? (Array.isArray(latestAssets.productImage) 
              ? latestAssets.productImage 
              : [latestAssets.productImage])
          : [];

        const loadedAssets = {
          colourPalette: latestAssets.colourPalette || "",
          size: latestAssets.size || "1080x1350",
          characterImage: latestAssets.characterImage || "",
          uniformImage: latestAssets.uniformImage || "",
          productImage: productImageArray,
          backgroundImage: latestAssets.backgroundImage || "",
          logoImage: latestAssets.logoImage || ""
        };

        setAssets(loadedAssets);
        
        // Set previews for all loaded images
        const newPreviews = {
          characterImage: latestAssets.characterImage,
          uniformImage: latestAssets.uniformImage,
          backgroundImage: latestAssets.backgroundImage,
          logoImage: latestAssets.logoImage,
          productImage: productImageArray
        };
        
        setPreviews(newPreviews);
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
      // Backend expects productImage as a single string (first image) or empty
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
      setError('Failed to save assets. Please try again.');
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
    // Add a confirmation dialog to prevent accidental deletion
    if (!confirm(`Are you sure you want to remove this ${key === 'productImage' ? 'product image' : 'asset'}?`)) {
      return;
    }

    let updatedAssets;
    if (key === 'productImage' && index >= 0) {
      const newProductImages = assets.productImage.filter((_, i) => i !== index);
      updatedAssets = { ...assets, productImage: newProductImages };
      setPreviews(prev => ({ ...prev, productImage: newProductImages }));
    } else {
      updatedAssets = { ...assets, [key]: "" }; // Set the specific field to empty
      setPreviews(prev => {
        const newPreviews = { ...prev };
        newPreviews[key] = ""; // Clear the preview as well
        return newPreviews;
      });
    }
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets); // Save the changes to the server
  };

  const handleColorPaletteChange = async (value) => {
    const updatedAssets = {
      ...assets,
      colourPalette: value
    };
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets);
  };

  const handleSizeChange = async (value) => {
    const updatedAssets = {
      ...assets,
      size: value
    };
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets);
  };

  const generatePayload = () => {
    return JSON.stringify(assets, null, 2);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(generatePayload());
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const downloadPayload = () => {
    const blob = new Blob([generatePayload()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-assets-payload.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const imageFields = [
    { key: "characterImage", label: "Character Image", icon: "👤" },
    { key: "uniformImage", label: "Uniform Image", icon: "👕" },
    { key: "backgroundImage", label: "Background Image", icon: "🖼️" },
    { key: "logoImage", label: "Logo Image", icon: "🏷️" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-2 py-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Assets Manager
              </h1>
              <p className="text-gray-600">
                Upload and manage all your design assets in one place. Changes are saved automatically.
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {isSaving && <Loader className="w-5 h-5 animate-spin text-purple-600" />}
              {isSaved && (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <Check className="w-5 h-5" /> Saved!
                </span>
              )}
              {error && (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-5 h-5" /> {error}
                </span>
              )}
              <button
                onClick={() => saveAssetsToServer(assets)}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Server className="w-4 h-4" />
                Save Manually
              </button>
              <button
                onClick={copyPayload}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-all flex items-center gap-2"
              >
                {copiedPayload ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPayload ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={downloadPayload}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Color Palette */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Color Palette</h2>
              </div>
              
              <div className="space-y-3">
                {/* Color Picker */}
                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pick Colors
                  </label>
                  <input
                    type="color"
                    onChange={(e) => handleColorPaletteChange(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {assets.colourPalette || 'No color selected'}
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">or choose preset</span>
                  </div>
                </div>

                {colorPalettes.map((palette) => (
                  <button
                    key={palette.value}
                    onClick={() => handleColorPaletteChange(palette.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      assets.colourPalette === palette.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{palette.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{palette.value}</p>
                        <div className="flex gap-1 mt-2">
                          {palette.colors.map(color => (
                            <div key={color} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: color }}></div>
                          ))}
                        </div>
                      </div>
                      {assets.colourPalette === palette.value && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </button>
                ))}
                
                <input
                  type="text"
                  value={assets.colourPalette}
                  onChange={(e) => handleColorPaletteChange(e.target.value)}
                  placeholder="Or type custom palette..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Size Selector */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Canvas Size</h2>
              
              <div className="space-y-2">
                {sizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSizeChange(option.value)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      assets.size === option.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-700">{option.label}</span>
                        <span className="text-xs text-gray-500 ml-2">{option.value}</span>
                      </div>
                      {assets.size === option.value && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </button>
                ))}
                
                <input
                  type="text"
                  value={assets.size}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  placeholder="Custom size (e.g., 1920x1080)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Image Upload Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Image Assets</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {imageFields.map((field) => (
                  <div key={field.key} className="border-2 border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{field.icon}</span>
                        <h3 className="font-semibold text-gray-800">{field.label}</h3>
                      </div>
                      {assets[field.key] && (
                        <button
                          onClick={() => removeAsset(field.key)}
                          className="p-1 hover:bg-red-100 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>

                    {/* Preview */}
                    {previews[field.key] ? (
                      <div className="mb-3 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                        <img
                          src={previews[field.key]}
                          alt={field.label}
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 h-40 flex items-center justify-center">
                        <div className="text-center">
                          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No image</p>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <label className="block mb-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(field.key, e.target.files[0])}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                      </div>
                    </label>

                    {/* URL Input */}
                    <input
                      type="text"
                      value={assets[field.key]}
                      onChange={(e) => handleUrlInput(field.key, e.target.value)}
                      placeholder="Or paste URL..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-400 focus:outline-none transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Product Images Section */}
              <div className="mt-8 border-t-2 border-dashed border-gray-200 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📦</span>
                  <h3 className="text-xl font-bold text-gray-800">Product Images</h3>
                  <span className="text-sm text-gray-500">(First image will be saved to database)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(assets.productImage) && assets.productImage.map((img, index) => (
                    <div key={index} className="relative group border-2 border-gray-200 rounded-lg p-2">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                      <button
                        onClick={() => removeAsset('productImage', index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-md opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Upload new product image card */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col justify-center items-center text-center h-full min-h-[140px]">
                     <label className="block mb-2 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          for (const file of e.target.files) {
                            handleImageUpload('productImage', file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Product(s)
                      </div>
                    </label>
                    <div className="relative w-full my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' && e.target.value) { 
                          handleUrlInput('productImage', e.target.value); 
                          e.target.value = ''; 
                        } 
                      }}
                      placeholder="Paste URL and press Enter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-purple-600" />
                  Asset Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Color Palette</p>
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {assets.colourPalette || 'Not set'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Canvas Size</p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {assets.size}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Images Uploaded</p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {
                        (Object.values(assets).filter(v => typeof v === 'string' && (v.includes('http') || v.includes('data:image'))).length) +
                        (Array.isArray(assets.productImage) ? assets.productImage.length : 0)
                      } total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SupportModal showToast={showToast} />
      
      {/* Floating WhatsApp Button */}
<a
  href="https://wa.me/919289344726"
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-5 right-5 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
  aria-label="Chat on WhatsApp"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className="w-9 h-9 fill-white"
  >
    <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z"/>
  </svg>
</a>
    </div>
  );
}