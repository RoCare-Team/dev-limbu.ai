import React, { useEffect, useState } from 'react';
import { deleteAssetAction, saveAssetsToServerAction } from "@/app/actions/assetActions";
import {
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Upload,
  X,
  ChevronDown,
  Check,
  Trash2,
  Edit2,
  UploadCloud,
  Building2,
  Palette,
  Plus,
  Mic,
  MicOff
} from "lucide-react";

const PostInput = ({ prompt, setPrompt,keywordError, onGenerate, loading, assets, logo, setLogo, assetId, fetchUserAssets, setUserAssets, showToast, selectedAssets, setSelectedAssets, bussinessTitle, availableLocations = [] }) => {
  

  const removeImage = () => setLogo(null);
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);
  const [showAssets, setShowAssets] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [businessNameError, setBusinessNameError] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [savedKeywords, setSavedKeywords] = useState([]);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [manualImage, setManualImage] = useState(null);
  const [manualDescription, setManualDescription] = useState("");
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [isSavingKeyword, setIsSavingKeyword] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const textareaRef = React.useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = voiceLang;

        recognitionInstance.onresult = (event) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            }
          }

          if (finalTranscript) {
            const newText = finalTranscript.trim();
            setPrompt((prev) => {
               const currentValue = prev || "";
               const input = textareaRef.current;
               if (input) {
                 const start = input.selectionStart || currentValue.length;
                 const end = input.selectionEnd || currentValue.length;
                 const beforeCursor = currentValue.substring(0, start);
                 const afterCursor = currentValue.substring(end);
                 const prefix = (beforeCursor && !beforeCursor.endsWith(" ") && !newText.startsWith(" ")) ? " " : "";
                 return `${beforeCursor}${prefix}${newText}${afterCursor}`;
               }
               return currentValue ? `${currentValue} ${newText}` : newText;
            });
          }
        };

        recognitionInstance.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [setPrompt, voiceLang]);

  const toggleListening = () => {
    if (!recognition) {
      showToast("Speech recognition not supported in this browser.", "error");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.lang = voiceLang;
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  const toggleVoiceLanguage = () => {
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    setVoiceLang((prev) => (prev === "en-US" ? "hi-IN" : "en-US"));
  };

  // Extract unique business names for the dropdown
  const uniqueBusinessNames = React.useMemo(() => {
    if (!availableLocations) return [];
    return [...new Set(availableLocations.map(loc => loc.name || loc.title).filter(Boolean))];
  }, [availableLocations]);

  const fetchSavedKeywords = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await fetch(`/api/keyword-research?userId=${userId}`);
      const data = await res.json();
      if (data.success) setSavedKeywords(data.data);
    } catch (error) {
      console.error("Error fetching saved keywords:", error);
    }
  };

  useEffect(() => {
    fetchSavedKeywords();
  }, []);

  const handleAddKeyword = async (keyword) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword || isSavingKeyword) return;

    if (!selectedKeywords.includes(trimmedKeyword)) {
      setSelectedKeywords((prev) => [...prev, trimmedKeyword]);
    }

    const isAlreadySaved = savedKeywords.some(
      (sk) => sk.keyword.toLowerCase() === trimmedKeyword.toLowerCase()
    );

    if (isAlreadySaved) {
      setKeywordInput("");
      return;
    }

    setIsSavingKeyword(true);
    const userId = localStorage.getItem("userId");
    try {
      await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, keyword: trimmedKeyword, volume: 0 }),
      });
      await fetchSavedKeywords();
      showToast(`Keyword "${trimmedKeyword}" saved!`, "success");
      setKeywordInput("");
    } catch (error) {
      showToast("Failed to save keyword.", "error");
    } finally {
      setIsSavingKeyword(false);
    }
  };

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [updatingAsset, setUpdatingAsset] = useState(null);
  const sizeOptions = [
    { label: "1:1", value: "1:1" },
    { label: "2:3", value: "2:3" },
    { label: "3:2", value: "3:2" },
    { label: "3:4 Instagram fb Linkedin", value: "3:4" },
    { label: "4:3", value: "4:3" },
    { label: "4:5", value: "4:5" },
    { label: "5:4", value: "5:4" },
    { label: "9:16 Reels Size", value: "9:16" },
    { label: "16:9 GMB Profile", value: "16:9" },
    { label: "21:9 Banner Size", value: "21:9" },
  ];

  const colorPalettes = [
    { label: "None", value: "none" },
    { label: "Warm Sunset", value: "warm, yellow, orange, red", colors: ["#FFC700", "#FF8C00", "#FF4500", "#D2691E"] },
    { label: "Cool Ocean", value: "cool, blue, teal, cyan", colors: ["#00BFFF", "#48D1CC", "#20B2AA", "#4682B4"] },
    { label: "Nature Green", value: "fresh, green, lime, mint", colors: ["#32CD32", "#98FB98", "#2E8B57", "#ADFF2F"] },
    { label: "Royal Purple", value: "luxe, purple, violet, magenta", colors: ["#8A2BE2", "#9932CC", "#DA70D6", "#BA55D3"] },
    { label: "Monochrome", value: "minimal, black, white, gray", colors: ["#000000", "#808080", "#C0C0C0", "#FFFFFF"] },
    { label: "Vibrant Mix", value: "vibrant, rainbow, multicolor, bold", colors: ["#FF1493", "#00FF00", "#FFD700", "#1E90FF"] }
  ];

  const handleCheckBoxChange = async () => {
    setShowAssets(!showAssets);
  };




  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper to ensure image displays even if stored without prefix
  const getDisplayUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("http")) return url;
    return `data:image/png;base64,${url}`;
  };

  const handleAssetUpload = async (e, asset) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1 MB = 1048576 bytes)
    if (file.size > 1048576) {
      showToast("The selected image is too large. Please upload an image smaller than 1 MB.", "error");
      e.target.value = null;
      return;
    }

    setUpdatingAsset(asset.name);

    try {
      const base64Image = await fileToBase64(file);

      const fieldMap = {
        Character: "characterImage",
        Product: "productImage",
        Uniform: "uniformImage",
        Background: "backgroundImage",
        Logo: "logoImage",
        Size: "size",
        Color: "colourPalette"
      };

      const fieldName = fieldMap[asset.name];
      if (!fieldName) {
        console.error("Unknown field:", asset.name);
        return;
      }

      // Optimistic update with Base64
      const newAssetBase64 = { name: asset.name, url: base64Image };
      setSelectedAssets(prev => [...prev.filter(a => a.name !== asset.name), newAssetBase64]);
      
      // Update parent assets to prevent useEffect overwrite
      setUserAssets(prev => prev.map(a => a.name === asset.name ? { ...a, url: base64Image } : a));

      const userId = localStorage.getItem("userId");
      
      // Strip base64 prefix (data:image/xyz;base64,)
      const base64Data = base64Image.split('base64,')[1] || base64Image;
      const payload = { [fieldName]: base64Data };
      if (!assetId && userId) payload.userId = userId;

      const result = await saveAssetsToServerAction(payload, assetId);
      if (result.success) {
        showToast(`${asset.name} updated successfully!`, "success");
        if (!assetId) await fetchUserAssets();
      } else {
        throw new Error(result.error || `Failed to upload ${asset.name}`);
      }

    } catch (error) {
      console.error("Upload failed:", error);
      showToast(error.message, "error");
    } finally {
      setUpdatingAsset(null);
    }
  };

  const handleAssetChange = async (asset, newValue) => {
    const fieldMap = {
      Size: "size",
      Color: "colourPalette"
    };

    const fieldName = fieldMap[asset.name];
    if (!fieldName) {
      console.error("Unknown asset field:", asset.name);
      return;
    }

    setUpdatingAsset(asset.name);

    try {
      const userId = localStorage.getItem("userId");
      const payload = { [fieldName]: newValue };
      if (!assetId && userId) payload.userId = userId;

      const result = await saveAssetsToServerAction(payload, assetId);
      if (result.success) {
        showToast(`${asset.name} updated successfully!`, "success");
        await fetchUserAssets();
      } else {
        throw new Error(result.error || `Failed to update ${asset.name}`);
      }
    } catch (error) {
      console.error(`Failed to update ${asset.name}:`, error);
      showToast(error.message, "error");
    } finally {
      setUpdatingAsset(null);
    }
  };

  const handleAssetDelete = async (asset) => {
    if (!confirm(`Are you sure you want to remove the ${asset.name}?`)) return;

    const fieldMap = {
      Character: "characterImage",
      Product: "productImage",
      Uniform: "uniformImage",
      Background: "backgroundImage",
      Logo: "logoImage",
    };

    const fieldName = fieldMap[asset.name];
    if (!fieldName) {
      console.error("Unknown asset for deletion:", asset.name);
      showToast("Cannot delete this asset type.", "error");
      return;
    }

    setUpdatingAsset(asset.name);

    // Optimistic update
    setUserAssets(prev => prev.map(a => a.name === asset.name ? { ...a, url: "" } : a));
    setSelectedAssets(prev => prev.filter(a => a.name !== asset.name));

    try {
      const result = await deleteAssetAction(assetId, fieldName);

      if (result.success) {
        showToast(`${asset.name} removed successfully!`, "success");
        fetchUserAssets();
      } else {
        throw new Error(result.error || `Failed to remove ${asset.name}`);
      }
    } catch (error) {
      console.error(`Failed to remove ${asset.name}:`, error);
      showToast(error.message, "error");
    } finally {
      setUpdatingAsset(null);
    }
  };



  useEffect(() => {
    if (assets && assets.length > 0) {
      const assetsToSelect = assets.filter(asset => {
        const assetTypesToAutoSelect = ['Character', 'Product', 'Uniform', 'Background', 'Logo'];
        return assetTypesToAutoSelect.includes(asset.name) && asset.url;
      });

      setSelectedAssets(prevSelected => {
        const newSelections = [...assetsToSelect];
        return newSelections;
      });
    }
  }, [assets]);

  useEffect(() => {
    try {
      const savedKeywords = localStorage.getItem("selectedKeywords");
      if (savedKeywords) {
        setSuggestedKeywords(JSON.parse(savedKeywords));
      }
    } catch (error) {
      console.error("Error parsing keywords from localStorage:", error);
    }
  }, []);





  const handleAssetToggle = (asset) => {
    const isSelected = selectedAssets.some(a => a.url === asset.url);
    let newSelectedAssets;
    if (isSelected) {
      newSelectedAssets = selectedAssets.filter(a => a.url !== asset.url);
    } else {
      newSelectedAssets = [...selectedAssets, asset];
    }
    setSelectedAssets(newSelectedAssets);
  };


  const handleGenerateClick = () => {
    if (!businessName.trim()) {
      setBusinessNameError("Business name is required");
      return;
    }
    setBusinessNameError("");

    // Prepare assets to send
    let assetsToSend = [...selectedAssets];

    // Handle Color: Default to "none" if empty or missing
    const colorAsset = assets?.find(a => a.name === "Color");
    if (colorAsset) {
      // Ensure we don't have duplicates if it was somehow in selectedAssets
      assetsToSend = assetsToSend.filter(a => a.name !== "Color");
      assetsToSend.push({
        ...colorAsset,
        url: colorAsset.url || "none"
      });
    }

    // Handle Size: Include if present
    const sizeAsset = assets?.find(a => a.name === "Size");
    if (sizeAsset && sizeAsset.url) {
      assetsToSend = assetsToSend.filter(a => a.name !== "Size");
      assetsToSend.push(sizeAsset);
    }

    onGenerate(assetsToSend, showAssets, businessName, selectedKeywords);
  };

  const handleManualSubmit = async () => {
    if (!manualImage) {
      showToast("Please upload an image (maximum size 1 MB)", "error");
      return;
    }
    if (!manualDescription.trim()) {
      showToast("Please enter a caption for your post", "error");
      return;
    }

    try {
      const base64 = await fileToBase64(manualImage);
      onGenerate({ image: base64, description: manualDescription }, "manual");
      setManualImage(null);
      setManualDescription("");
    } catch (e) {
      console.error(e);
      showToast("Error processing image", "error");
    }
  };

  const filteredKeywords = savedKeywords
    .filter((k) => k.keyword.toLowerCase().includes(keywordInput.toLowerCase()))
    .filter((k) => !selectedKeywords.includes(k.keyword));

  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 sm:p-3">
        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-2">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "ai" ? "bg-white shadow text-dark" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Auto Post
            </div>
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "manual" ? "bg-white shadow text-blue-600" : "text-dark hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Manual Post
            </div>
          </button>
        </div>

        {activeTab === "ai" ? (
        <div className="space-y-2">
          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-dark flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-dark" />
              What would you like to create?
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder="Describe your post idea..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-2 pr-24 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all min-h-[40px] resize-none placeholder:text-gray-400"
                disabled={loading}
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoiceLanguage}
                  className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors uppercase border border-gray-200"
                  title="Switch Language (English/Hindi)"
                >
                  {voiceLang === "en-US" ? "EN" : "HI"}
                </button>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    isListening 
                      ? "bg-red-500 text-white shadow-md ring-4 ring-red-200 animate-pulse scale-105" 
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
            </div>
            {suggestedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestedKeywords.map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(prev => `${prev} ${keyword}`.trim())}
                    className="px-2.5 py-1 bg-blue-50 text-neutral-600 text-xs font-medium rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Business Name & Keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1 relative">
              <label className="text-xs font-semibold text-dark">Business Name</label>
              <div className="relative">
              <input
                type="text"
                value={businessName || ''}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setShowBusinessDropdown(true);
                  if (e.target.value) setBusinessNameError("");
                }}
                onFocus={() => setShowBusinessDropdown(true)}
                onBlur={() => setTimeout(() => setShowBusinessDropdown(false), 200)}
                className={`w-full p-2 pr-8 border ${businessNameError ? "border-red-500" : "border-gray-300"} rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none`}
                placeholder="Enter business name"
              />
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {businessNameError && <p className="text-xs text-red-500 mt-1">{businessNameError}</p>}
              {showBusinessDropdown && uniqueBusinessNames.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-[160px] overflow-y-auto">
                  {uniqueBusinessNames
                    .filter(name => name.toLowerCase().includes((businessName || '').toLowerCase()))
                    .map((name, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setBusinessName(name);
                          setShowBusinessDropdown(false);
                          setBusinessNameError("");
                        }}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <Building2 className="w-3 h-3 text-dark" />
                        {name}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="space-y-1 relative">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Keywords</label>
                <button
                  onClick={() => setShowKeywordModal(true)}
                  className="text-[10px] font-medium text-dark hover:text-primary flex items-center gap-1 bg-neutral-300 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Select from list
                </button>
              </div>
              
              <div className="relative flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => {
                      setKeywordInput(e.target.value);
                      setShowKeywordDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && keywordInput.trim()) {
                        e.preventDefault();
                        handleAddKeyword(keywordInput.trim());
                      }
                    }}
                    onFocus={() => setShowKeywordDropdown(true)}
                    onBlur={() => setTimeout(() => setShowKeywordDropdown(false), 200)}
                    className={`w-full p-2 pr-8 border ${keywordError && selectedKeywords.length === 0 ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm  focus:ring-primary outline-none`}
                    placeholder={selectedKeywords.length > 0 ? "Add more keywords..." : "Enter & save keywords"}
                  />
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => handleAddKeyword(keywordInput.trim())}
                  disabled={!keywordInput.trim() || isSavingKeyword}
                  className="px-4 h-full  text-dark font-semibold rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSavingKeyword ? <Loader2 className="w-4 h-4 animate-spin" /> : ""}
                  Add 
                </button>
              </div>
              {keywordError && selectedKeywords.length === 0 && (
                <p className="text-red-500 text-xs mt-1 ml-1">{keywordError}</p>
              )}
              {showKeywordDropdown && filteredKeywords.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-[160px] overflow-y-auto">
                  {filteredKeywords
                    .map((k, i) => (
                      <div
                        key={i}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!selectedKeywords.includes(k.keyword)) {
                            setSelectedKeywords([...selectedKeywords, k.keyword]);
                          }
                          setKeywordInput("");
                          setShowKeywordDropdown(false);
                        }}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        {k.keyword}
                      </div>
                    ))}
                </div>
              )}

              {/* Selected Keywords Tags */}
              {selectedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedKeywords.map((k, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                      {k}
                      <button
                        onClick={() => setSelectedKeywords(prev => prev.filter((_, i) => i !== idx))}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo Upload - Compact */}
          {!showAssets && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" />
                Add Logo (Optional)
              </label>

              {!logo ? (
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-dark" />
                    <span className="text-sm text-dark">Click to upload</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.ico,.heic,.heif,.avif"
                    onChange={(e) => setLogo(e.target.files[0])}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              ) : (
                <div className="relative h-24 bg-gray-50 rounded-lg border border-gray-300 p-2">
                  <img
                    src={typeof logo === 'string' ? getDisplayUrl(logo) : URL.createObjectURL(logo)}
                    alt="Logo Preview"
                    className="w-full h-full object-contain rounded"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Assets Section - Compact List */}
       {assets && showAssets && (
  <div className="space-y-1.5">
    <p className="text-xs font-semibold text-gray-700">Your Assets</p>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {assets.map((asset, index) => {
        const isSelected = selectedAssets.some(
          (a) => a.name === asset.name && a.url === asset.url
        );
        const isImageField = asset.name !== "Size" && asset.name !== "Color";

        return (
          <div
            key={index}
            className={`border border-gray-200 rounded-md flex flex-col bg-white relative ${
              activeDropdown === asset.name ? "z-20" : ""
            }`}
          >
            {/* ---------------- Header ---------------- */}
            <div className="px-2 py-1 flex justify-between items-center bg-gray-50 border-b border-gray-100 rounded-t-md">
              <span className="text-[11px] font-semibold text-gray-700 truncate">
                {asset.name}
              </span>

              {asset.url && isImageField && (
                <div
                  onClick={() => handleAssetToggle(asset)}
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {isSelected && (
                    <Check className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
              )}
            </div>

            {/* ---------------- Content ---------------- */}
            <div className="p-1.5 flex-1 flex items-center justify-center">
              {updatingAsset === asset.name ? (
                <div className="flex flex-col items-center justify-center h-16 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mb-1" />
                  <span className="text-[10px]">Updating...</span>
                </div>
              ) : isImageField ? (
                /* ---------- IMAGE ASSET ---------- */
                <div className="relative w-full h-16 bg-gray-100 rounded-md overflow-hidden border border-gray-200 group">
                  {asset.url ? (
                    <>
                      <img
                        src={getDisplayUrl(asset.url)}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label
                          title="Replace"
                          className="p-1 bg-white rounded-full cursor-pointer hover:bg-blue-50 text-blue-600 shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.ico,.heic,.heif,.avif"
                            className="hidden"
                            onChange={(e) =>
                              handleAssetUpload(e, asset)
                            }
                          />
                        </label>

                        <button
                          onClick={() => handleAssetDelete(asset)}
                          title="Remove"
                          className="p-1 bg-white rounded-full hover:bg-red-50 text-red-600 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-200 transition">
                      <Upload className="w-5 h-5 text-gray-400 mb-0.5" />
                      <span className="text-[9px] text-gray-500 font-medium">
                        Upload
                      </span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.ico,.heic,.heif,.avif"
                        className="hidden"
                        onChange={(e) =>
                          handleAssetUpload(e, asset)
                        }
                      />
                    </label>
                  )}
                </div>
              ) : (
                /* ---------- DROPDOWN (SIZE / COLOR) ---------- */
                <div className="w-full">
                  {asset.name === "Size" && (
                    <select
                      value={asset.url}
                      onChange={(e) =>
                        handleAssetChange(asset, e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {sizeOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {asset.name === "Color" && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === "Color" ? null : "Color"
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                           {(asset.url && asset.url.startsWith('#')) && (
                              <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: asset.url }}></div>
                           )}
                           {colorPalettes.find(p => p.value === asset.url)?.colors && (
                              <div className="flex -space-x-1 flex-shrink-0">
                                {colorPalettes.find(p => p.value === asset.url).colors.slice(0,3).map((c, i) => (
                                  <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }}></div>
                                ))}
                              </div>
                           )}
                           {!asset.url && (
                              <Palette className="w-3.5 h-3.5 text-gray-400" />
                           )}
                           
                          <span className="text-gray-700 font-medium truncate">
                            {(asset.url && asset.url !== "" && asset.url !== "none")
                              ? (colorPalettes.find((p) => p.value === asset.url)?.label || asset.url)
                              : "Select Theme"}
                          </span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${activeDropdown === "Color" ? "rotate-180" : ""}`} />
                      </button>

                      {activeDropdown === "Color" && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[240px]">
                          
                          {/* Custom Input Section */}
                          <div className="p-3 bg-gray-50 border-b border-gray-100 space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Custom Theme</label>
                            <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Red & Black Press Enter"
                              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAssetChange(asset, e.target.value);
                                  setActiveDropdown(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="relative w-8 h-8 flex-shrink-0 group/picker cursor-pointer" title="Pick a color">
                                <input 
                                    type="color" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        handleAssetChange(asset, e.target.value);
                                    }}
                                />
                                <div className="w-full h-full rounded-lg border border-gray-300 bg-white flex items-center justify-center shadow-sm group-hover/picker:border-blue-400 transition-colors">
                                    <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #00FF00 120deg, #0000FF 240deg, #FF0000 360deg)' }}></div>
                                </div>
                            </div>
                            </div>
                          </div>

                          {/* Presets List */}
                          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1 block">Presets</label>
                          {colorPalettes.map((palette) => (
                            <div
                              key={palette.value}
                              onClick={() => {
                                handleAssetChange(asset, palette.value);
                                setActiveDropdown(null);
                              }}
                              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${asset.url === palette.value ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50 border border-transparent"}`}
                            >
                              <span className={`text-xs font-medium ${asset.url === palette.value ? "text-blue-700" : "text-gray-700"}`}>
                                {palette.label}
                              </span>
                              {palette.colors && (
                              <div className="flex -space-x-1.5">
                                {palette.colors?.map((color, i) => (
                                  <div
                                    key={i}
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-black/5"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              )}
                            </div>
                          ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}


          {/* Generate Button */}
          <button
            onClick={handleGenerateClick}
            disabled={loading || !prompt.trim()}
           className="w-full flex items-center justify-center gap-2
bg-[#fdd835]
text-dark px-6 py-3 rounded-lg
hover:shadow-lg hover:scale-[1.02]
transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
font-semibold text-sm"

          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Post 
              </>
            )}
          </button>

          {/* Pro Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
            <p className="text-xs text-amber-900 flex items-start gap-2">
              <span className="text-base">💡</span>
              <span><strong>Tip:</strong> Be specific about details for best results!</span>
            </p>
          </div>
        </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Post Image</label>
              {!manualImage ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-dark font-medium">Click to upload image</p>
                  </div>
                  <input type="file" accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.ico,.heic,.heif,.avif" className="hidden" onChange={(e) => setManualImage(e.target.files[0])} />
                </label>
              ) : (
                <div className="relative h-48 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                  <img src={URL.createObjectURL(manualImage)} alt="Preview" className="w-full h-full object-contain" />
                  <button onClick={() => setManualImage(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Caption / Description</label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Write your post caption here..."
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none min-h-[120px] resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleManualSubmit}
              disabled={loading}
              className="w-full py-3 bg-primary  text-dark rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Post"}
            </button>
          </div>
        )}
      </div>

      {/* Keyword Selection Modal */}
      {showKeywordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-dark text-sm">Select Keywords</h3>
              <button onClick={() => setShowKeywordModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search keywords..." 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {savedKeywords.length === 0 && (
                 <p className="text-center text-gray-500 text-xs py-4">No saved keywords found.</p>
               )}
               {savedKeywords
                 .filter(k => k.keyword.toLowerCase().includes(modalSearch.toLowerCase()))
                 .map((k, i) => {
                   const isSelected = selectedKeywords.includes(k.keyword);
                   return (
                     <div 
                       key={i} 
                       onClick={() => {
                         if (isSelected) {
                           setSelectedKeywords(prev => prev.filter(kw => kw !== k.keyword));
                         } else {
                           setSelectedKeywords(prev => [...prev, k.keyword]);
                         }
                       }}
                       className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}
                     >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{k.keyword}</span>
                     </div>
                   );
                 })}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">{selectedKeywords.length} selected</span>
              <button 
                onClick={() => setShowKeywordModal(false)} 
                className="px-6 py-2 bg-primary text-dark text-sm font-semibold rounded-lg hover:bg-yellow-300 transition-all shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostInput;