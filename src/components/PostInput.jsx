import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  deleteAssetAction,
  saveAssetsToServerAction,
} from "@/app/actions/assetActions";
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
  MicOff,
} from "lucide-react";
import {
  readIncludedMap,
  readExtraNotes,
  readAppendToPrompt,
  writeAppendToPrompt,
  mergeIncludedMapForIds,
  PM_INSTRUCTIONS_UPDATED,
} from "@/lib/postManagementInstructionsStorage";

const PostInput = ({
  prompt,
  setPrompt,
  keywordError,
  onGenerate,
  onManualPost,
  loading,
  assets,
  logo,
  setLogo,
  assetId,
  fetchUserAssets,
  setUserAssets,
  showToast,
  selectedAssets,
  setSelectedAssets,
  setAssetId,
  bussinessTitle,
  availableLocations = [],
}) => {
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
  /** ai = guided flow (keywords required); manual = free-form prompt */
  const [creationMode, setCreationMode] = useState("ai");
  /** Saved instructions from /api/instructions (MongoDB) */
  const [dbInstructions, setDbInstructions] = useState([]);
  /** id -> false means excluded from prompt; undefined/true means included */
  const [includedInstructionMap, setIncludedInstructionMap] = useState({});
  const [instructionExtraNotes, setInstructionExtraNotes] = useState("");
  const [includeInstructionsInPrompt, setIncludeInstructionsInPrompt] = useState(false);
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
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
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
                const prefix =
                  beforeCursor &&
                    !beforeCursor.endsWith(" ") &&
                    !newText.startsWith(" ")
                    ? " "
                    : "";
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
    return [
      ...new Set(
        availableLocations.map((loc) => loc.title || loc.title).filter(Boolean),
      ),
    ];
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

  const loadDbInstructions = useCallback(async () => {
    try {
      const res = await fetch("/api/instructions");
      const data = await res.json();
      if (!data.success) return;
      const list = data.instructions || [];
      setDbInstructions(list);
      const ids = list.map((item) => item._id).filter(Boolean);
      setIncludedInstructionMap(mergeIncludedMapForIds(readIncludedMap(), ids));
    } catch (e) {
      console.error("loadDbInstructions:", e);
    }
  }, []);

  useEffect(() => {
    setIncludeInstructionsInPrompt(readAppendToPrompt());
    setInstructionExtraNotes(readExtraNotes());
    loadDbInstructions();
  }, [loadDbInstructions]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onUpdate = () => {
      setInstructionExtraNotes(readExtraNotes());
      setIncludeInstructionsInPrompt(readAppendToPrompt());
      loadDbInstructions();
    };
    window.addEventListener(PM_INSTRUCTIONS_UPDATED, onUpdate);
    return () => window.removeEventListener(PM_INSTRUCTIONS_UPDATED, onUpdate);
  }, [loadDbInstructions]);

  const compiledInstructionsForPrompt = useMemo(() => {
    const parts = dbInstructions
      .filter((item) => includedInstructionMap[item._id] !== false)
      .map(
        (item) =>
          `${(item.title || "").trim()}\n${(item.description || "").trim()}`.trim(),
      )
      .filter(Boolean);
    const extra = instructionExtraNotes.trim();
    if (extra) parts.push(extra);
    return parts.join("\n\n");
  }, [dbInstructions, includedInstructionMap, instructionExtraNotes]);

  const handleAddKeyword = async (keyword) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword || isSavingKeyword) return;

    if (!selectedKeywords.includes(trimmedKeyword)) {
      setSelectedKeywords((prev) => [...prev, trimmedKeyword]);
    }

    const isAlreadySaved = savedKeywords.some(
      (sk) => sk.keyword.toLowerCase() === trimmedKeyword.toLowerCase(),
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

  const handleDeleteSavedKeyword = async (keywordItem) => {
    if (!keywordItem?._id) return;

    const keywordToDelete = keywordItem.keyword;
    const previousKeywords = savedKeywords;

    setSavedKeywords((prev) =>
      prev.filter((item) => item._id !== keywordItem._id),
    );
    setSelectedKeywords((prev) =>
      prev.filter((keyword) => keyword !== keywordToDelete),
    );

    try {
      const res = await fetch(`/api/keyword-research?id=${keywordItem._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!data.success) {
        setSavedKeywords(previousKeywords);
        showToast(data.error || "Failed to delete keyword.", "error");
        return;
      }

      showToast(`Keyword "${keywordToDelete}" deleted!`, "success");
    } catch (error) {
      setSavedKeywords(previousKeywords);
      showToast("Failed to delete keyword.", "error");
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
    {
      label: "Warm Sunset",
      value: "warm, yellow, orange, red",
      colors: ["#FFC700", "#FF8C00", "#FF4500", "#D2691E"],
    },
    {
      label: "Cool Ocean",
      value: "cool, blue, teal, cyan",
      colors: ["#00BFFF", "#48D1CC", "#20B2AA", "#4682B4"],
    },
    {
      label: "Nature Green",
      value: "fresh, green, lime, mint",
      colors: ["#32CD32", "#98FB98", "#2E8B57", "#ADFF2F"],
    },
    {
      label: "Royal Purple",
      value: "luxe, purple, violet, magenta",
      colors: ["#8A2BE2", "#9932CC", "#DA70D6", "#BA55D3"],
    },
    {
      label: "Monochrome",
      value: "minimal, black, white, gray",
      colors: ["#000000", "#808080", "#C0C0C0", "#FFFFFF"],
    },
    {
      label: "Vibrant Mix",
      value: "vibrant, rainbow, multicolor, bold",
      colors: ["#FF1493", "#00FF00", "#FFD700", "#1E90FF"],
    },
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
      showToast(
        "The selected image is too large. Please upload an image smaller than 1 MB.",
        "error",
      );
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
        Color: "colourPalette",
      };

      const fieldName = fieldMap[asset.name];
      if (!fieldName) {
        console.error("Unknown field:", asset.name);
        return;
      }

      // Optimistic update with Base64
      const newAssetBase64 = { name: asset.name, url: base64Image };
      setSelectedAssets((prev) => [
        ...prev.filter((a) => a.name !== asset.name),
        newAssetBase64,
      ]);

      // Update parent assets to prevent useEffect overwrite
      setUserAssets((prev) =>
        prev.map((a) =>
          a.name === asset.name ? { ...a, url: base64Image } : a,
        ),
      );

      const userId = localStorage.getItem("userId");

      // Strip base64 prefix (data:image/xyz;base64,)
      const base64Data = base64Image.split("base64,")[1] || base64Image;
      const payload = { [fieldName]: base64Data };
      if (!assetId && userId) payload.userId = userId;

      const result = await saveAssetsToServerAction(payload, assetId);
      if (result.success) {
        if (!assetId && result.data?._id) setAssetId?.(result.data._id);
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
      Color: "colourPalette",
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
        if (!assetId && result.data?._id) setAssetId?.(result.data._id);
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
    setUserAssets((prev) =>
      prev.map((a) => (a.name === asset.name ? { ...a, url: "" } : a)),
    );
    setSelectedAssets((prev) => prev.filter((a) => a.name !== asset.name));

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
      const assetsToSelect = assets.filter((asset) => {
        const assetTypesToAutoSelect = [
          "Character",
          "Product",
          "Uniform",
          "Background",
          "Logo",
        ];
        return assetTypesToAutoSelect.includes(asset.name) && asset.url;
      });

      setSelectedAssets((prevSelected) => {
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
    const isSelected = selectedAssets.some((a) => a.url === asset.url);
    let newSelectedAssets;
    if (isSelected) {
      newSelectedAssets = selectedAssets.filter((a) => a.url !== asset.url);
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
    const colorAsset = assets?.find((a) => a.name === "Color");
    if (colorAsset) {
      // Ensure we don't have duplicates if it was somehow in selectedAssets
      assetsToSend = assetsToSend.filter((a) => a.name !== "Color");
      assetsToSend.push({
        ...colorAsset,
        url: colorAsset.url || "none",
      });
    }

    // Handle Size: Include if present
    const sizeAsset = assets?.find((a) => a.name === "Size");
    if (sizeAsset && sizeAsset.url) {
      assetsToSend = assetsToSend.filter((a) => a.name !== "Size");
      assetsToSend.push(sizeAsset);
    }

    onGenerate(assetsToSend, showAssets, businessName, selectedKeywords, {
      mode: creationMode,
      instructions: compiledInstructionsForPrompt,
      includeInstructionsInPrompt,
    });
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
      // Pass the File object directly to onManualPost
      onManualPost({ image: manualImage, description: manualDescription });
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
    <div className="max-w-2xl mx-auto font-inter">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-2 sm:p-3 text-slate-900">
        {/* Tabs */}
        <div className="flex p-1 bg-slate-50 rounded-lg mb-2 border border-slate-100">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "ai"
                ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                : "text-slate-900/50 hover:text-slate-900/80"
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Auto Post
            </div>
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "manual"
                ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                : "text-slate-900/50 hover:text-slate-900/80"
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Manual Post
            </div>
          </button>
        </div>

        {activeTab === "ai" ? (
          <div className="space-y-3">
            {/* Prompt Input */}
            <div className="space-y-1.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-xs font-semibold text-slate-900/90 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EAB308]" />
                  What would you like to create?
                </label>
                <div className="flex p-0.5 bg-slate-100 rounded-lg shrink-0 self-start sm:self-auto border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCreationMode("ai")}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${creationMode === "ai"
                        ? "bg-white shadow-sm text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode("manual")}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${creationMode === "manual"
                        ? "bg-white shadow-sm text-black ring-1 ring-[#EAB308]/40"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Manual
                  </button>
                </div>
              </div>
              <div className="relative group">
                <textarea
                  ref={textareaRef}
                  placeholder={
                    creationMode === "manual"
                      ? "Write any prompt you want — full freedom for your banner or post."
                      : "Describe your post idea..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full p-3 pr-24 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none transition-all min-h-[50px] resize-none placeholder:text-slate-900/30 backdrop-blur-sm"
                  disabled={loading}
                />
                <div className="absolute right-2 top-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleVoiceLanguage}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-900/70 rounded hover:bg-slate-200 transition-colors uppercase border border-slate-100"
                    title="Switch Language (English/Hindi)"
                  >
                    {voiceLang === "en-US" ? "EN" : "HI"}
                  </button>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-1.5 rounded-full transition-all duration-200 ${isListening
                        ? "bg-red-500 text-slate-900 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse scale-105"
                        : "bg-slate-100 text-slate-900/50 hover:bg-slate-200 hover:text-slate-900/80"
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
                      onClick={() =>
                        setPrompt((prev) => `${prev} ${keyword}`.trim())
                      }
                      className="px-2.5 py-1 bg-[#EAB308]/10 text-[#EAB308] text-xs font-medium rounded-full hover:bg-[#EAB308]/20 border border-[#EAB308]/20 transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Business Name & Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-900/90">
                  Business Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={businessName || ""}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      setShowBusinessDropdown(true);
                      if (e.target.value) setBusinessNameError("");
                    }}
                    onFocus={() => setShowBusinessDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowBusinessDropdown(false), 200)
                    }
                    className={`w-full p-2.5 pr-8 bg-slate-50 border ${businessNameError ? "border-red-500" : "border-slate-200"} rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none backdrop-blur-sm transition-all`}
                    placeholder="Enter business name"
                  />
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-900/30 pointer-events-none" />
                </div>
                {businessNameError && (
                  <p className="text-xs text-red-500 mt-1">
                    {businessNameError}
                  </p>
                )}
                {showBusinessDropdown && uniqueBusinessNames.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-[160px] overflow-y-auto backdrop-blur-md">
                    {uniqueBusinessNames
                      .filter((name) =>
                        name
                          .toLowerCase()
                          .includes((businessName || "").toLowerCase()),
                      )
                      .map((name, i) => (
                        <div
                          key={i}
                          role="option"
                          tabIndex={-1}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setBusinessName(name);
                            setShowBusinessDropdown(false);
                            setBusinessNameError("");
                          }}
                          className="px-3 py-2 text-sm text-slate-900/70 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors flex items-center gap-2"
                        >
                          <Building2 className="w-3 h-3 text-[#EAB308]" />
                          {name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-900/90">
                    Keywords
                  </label>
                  <button
                    onClick={() => setShowKeywordModal(true)}
                    className="text-[10px] font-medium text-black hover:bg-[#EAB308]/90 flex items-center gap-1 bg-[#EAB308] px-2 py-0.5 rounded-md transition-colors"
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
                        if (e.key === "Enter" && keywordInput.trim()) {
                          e.preventDefault();
                          handleAddKeyword(keywordInput.trim());
                        }
                      }}
                      onFocus={() => setShowKeywordDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowKeywordDropdown(false), 200)
                      }
                      className={`w-full p-2.5 pr-8 bg-slate-50 border ${keywordError && selectedKeywords.length === 0 && creationMode !== "manual" ? "border-red-500" : "border-slate-200"} rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 focus:border-[#EAB308]/50 outline-none backdrop-blur-sm transition-all`}
                      placeholder={
                        selectedKeywords.length > 0
                          ? "Add more..."
                          : "Enter keywords"
                      }
                    />
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-900/30 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => handleAddKeyword(keywordInput.trim())}
                    disabled={!keywordInput.trim() || isSavingKeyword}
                    className="px-4 h-full bg-[#EAB308] text-black font-bold rounded-lg text-sm hover:bg-[#EAB308]/90 transition-all shadow-[0_0_10px_rgba(253,224,71,0.2)] disabled:bg-slate-100 disabled:text-slate-900/30 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isSavingKeyword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
                {creationMode === "manual" && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Keywords are optional in Manual mode.
                  </p>
                )}
                {keywordError &&
                  selectedKeywords.length === 0 &&
                  creationMode !== "manual" && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {keywordError}
                    </p>
                  )}
                {showKeywordDropdown && filteredKeywords.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-[160px] overflow-y-auto backdrop-blur-md">
                    {filteredKeywords.map((k, i) => (
                      <div
                        key={k._id || i}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!selectedKeywords.includes(k.keyword)) {
                            setSelectedKeywords([
                              ...selectedKeywords,
                              k.keyword,
                            ]);
                          }
                          setKeywordInput("");
                          setShowKeywordDropdown(false);
                        }}
                        className="px-3 py-2 text-sm text-slate-900/70 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Sparkles className="w-3 h-3 text-[#EAB308] flex-shrink-0" />
                          <span className="truncate">{k.keyword}</span>
                        </span>
                        <button
                          type="button"
                          title="Delete keyword"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSavedKeyword(k);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Keywords Tags */}
                {selectedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedKeywords.map((k, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-[#EAB308]/10 text-[#EAB308] text-xs font-medium rounded-md border border-[#EAB308]/20 backdrop-blur-sm"
                      >
                        {k}
                        <button
                          onClick={() =>
                            setSelectedKeywords((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="hover:text-slate-900 transition-colors"
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
                <label className="text-xs font-semibold text-slate-900/90 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#EAB308]" />
                  Add Logo (Optional)
                </label>

                {!logo ? (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-[#EAB308]/50 transition-all backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-slate-900/50" />
                      <span className="text-sm text-slate-900/50 font-medium">
                        Click to upload
                      </span>
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
                  <div className="relative h-24 bg-slate-50 rounded-lg border border-slate-200 p-2 backdrop-blur-sm">
                    <img
                      src={
                        typeof logo === "string"
                          ? getDisplayUrl(logo)
                          : URL.createObjectURL(logo)
                      }
                      alt="Logo Preview"
                      className="w-full h-full object-contain rounded"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-slate-900 rounded-full p-1 hover:bg-red-600 transition-all shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Assets Section - Compact List */}
            {assets && showAssets && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-900/90">
                  Your Brand Assets
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {assets.map((asset, index) => {
                    const isSelected = selectedAssets.some(
                      (a) => a.name === asset.name && a.url === asset.url,
                    );
                    const isImageField =
                      asset.name !== "Size" && asset.name !== "Color";

                    return (
                      <div
                        key={index}
                        className={`border border-slate-200 rounded-lg flex flex-col bg-white relative group/asset ${activeDropdown === asset.name
                            ? "z-50 ring-1 ring-[#EAB308]/30"
                            : "overflow-hidden"
                          }`}
                      >
                        {/* ---------------- Header ---------------- */}
                        <div className="px-2 py-1.5 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-900/70 uppercase tracking-wider truncate">
                            {asset.name}
                          </span>

                          {asset.url && isImageField && (
                            <div
                              onClick={() => handleAssetToggle(asset)}
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition-all ${isSelected
                                  ? "bg-[#EAB308] border-[#EAB308]"
                                  : "border-slate-200 hover:border-[#EAB308]/50"
                                }`}
                            >
                              {isSelected && (
                                <Check className="w-2.5 h-2.5 text-black" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* ---------------- Content ---------------- */}
                        <div className="p-1.5 flex-1 flex items-center justify-center">
                          {updatingAsset === asset.name ? (
                            <div className="flex flex-col items-center justify-center h-16 text-slate-900/50">
                              <Loader2 className="w-5 h-5 animate-spin mb-1 text-[#EAB308]" />
                              <span className="text-[9px] uppercase tracking-tighter">
                                Syncing...
                              </span>
                            </div>
                          ) : isImageField ? (
                            /* ---------- IMAGE ASSET ---------- */
                            <div className="relative w-full h-16 bg-slate-50 rounded-md overflow-hidden border border-slate-100 group">
                              {asset.url ? (
                                <>
                                  <img
                                    src={getDisplayUrl(asset.url)}
                                    alt={asset.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  />

                                  {/* Hover Actions */}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                    <label
                                      title="Replace"
                                      className="p-1.5 bg-[#EAB308] rounded-full cursor-pointer hover:scale-110 text-black shadow-lg transition-transform"
                                    >
                                      <Edit2 className="w-3 h-3" />
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
                                      className="p-1.5 bg-red-500 rounded-full hover:scale-110 text-slate-900 shadow-lg transition-transform"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-100 transition-colors group/upload">
                                  <Upload className="w-5 h-5 text-slate-900/30 mb-0.5 group-hover/upload:text-[#EAB308] transition-colors" />
                                  <span className="text-[8px] text-slate-900/40 font-bold uppercase tracking-widest">
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
                                  className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-900/90 focus:ring-1 focus:ring-[#EAB308]/50 outline-none backdrop-blur-sm"
                                >
                                  {sizeOptions.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                      className="bg-white text-slate-900"
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
                                        activeDropdown === "Color"
                                          ? null
                                          : "Color",
                                      )
                                    }
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[10px] text-left flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-all group backdrop-blur-sm"
                                  >
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      {asset.url &&
                                        asset.url.startsWith("#") && (
                                          <div
                                            className="w-3 h-3 rounded-full border border-slate-200 shadow-sm flex-shrink-0"
                                            style={{
                                              backgroundColor: asset.url,
                                            }}
                                          ></div>
                                        )}
                                      {colorPalettes.find(
                                        (p) => p.value === asset.url,
                                      )?.colors && (
                                          <div className="flex -space-x-1 flex-shrink-0">
                                            {colorPalettes
                                              .find((p) => p.value === asset.url)
                                              .colors.slice(0, 3)
                                              .map((c, i) => (
                                                <div
                                                  key={i}
                                                  className="w-2.5 h-2.5 rounded-full border border-slate-200"
                                                  style={{ backgroundColor: c }}
                                                ></div>
                                              ))}
                                          </div>
                                        )}
                                      {!asset.url && (
                                        <Palette className="w-3 h-3 text-slate-900/30" />
                                      )}

                                      <span className="text-slate-900/80 font-medium truncate">
                                        {asset.url &&
                                          asset.url !== "" &&
                                          asset.url !== "none"
                                          ? colorPalettes.find(
                                            (p) => p.value === asset.url,
                                          )?.label || asset.url
                                          : "Theme"}
                                      </span>
                                    </div>
                                    <ChevronDown
                                      className={`w-3 h-3 text-slate-900/30 transition-transform duration-200 ${activeDropdown === "Color" ? "rotate-180" : ""}`}
                                    />
                                  </button>

                                  {activeDropdown === "Color" && (
                                    <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px] backdrop-blur-xl">
                                      {/* Custom Input Section */}
                                      <div className="p-2.5 bg-slate-50 border-b border-slate-100 space-y-2">
                                        <label className="text-[9px] font-black text-slate-900/40 uppercase tracking-widest block">
                                          Custom Palette
                                        </label>
                                        <div className="flex gap-1.5">
                                          <input
                                            type="text"
                                            placeholder="Describe or hex..."
                                            className="flex-1 px-2 py-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-1 focus:ring-[#EAB308]/50 outline-none transition-all placeholder:text-slate-900/20"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAssetChange(
                                                  asset,
                                                  e.target.value,
                                                );
                                                setActiveDropdown(null);
                                              }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <div
                                            className="relative w-7 h-7 flex-shrink-0 group/picker cursor-pointer"
                                            title="Pick a color"
                                          >
                                            <input
                                              type="color"
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                              onChange={(e) => {
                                                handleAssetChange(
                                                  asset,
                                                  e.target.value,
                                                );
                                              }}
                                            />
                                            <div className="w-full h-full rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm group-hover/picker:border-[#EAB308]/50 transition-colors">
                                              <div
                                                className="w-4 h-4 rounded-full border border-slate-200"
                                                style={{
                                                  background:
                                                    "conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #00FF00 120deg, #0000FF 240deg, #FF0000 360deg)",
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Presets List */}
                                      <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                                        <label className="text-[9px] font-black text-slate-900/40 uppercase tracking-widest px-2 py-1 block">
                                          Cyber Presets
                                        </label>
                                        {colorPalettes.map((palette) => (
                                          <div
                                            key={palette.value}
                                            onClick={() => {
                                              handleAssetChange(
                                                asset,
                                                palette.value,
                                              );
                                              setActiveDropdown(null);
                                            }}
                                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all ${asset.url === palette.value ? "bg-[#EAB308]/10 border border-[#EAB308]/20" : "hover:bg-slate-50 border border-transparent"}`}
                                          >
                                            <span
                                              className={`text-[10px] font-bold ${asset.url === palette.value ? "text-[#EAB308]" : "text-slate-900/70"}`}
                                            >
                                              {palette.label}
                                            </span>
                                            {palette.colors && (
                                              <div className="flex -space-x-1">
                                                {palette.colors?.map(
                                                  (color, i) => (
                                                    <div
                                                      key={i}
                                                      className="w-3 h-3 rounded-full border border-slate-200 shadow-sm"
                                                      style={{
                                                        backgroundColor: color,
                                                      }}
                                                    />
                                                  ),
                                                )}
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
              className="w-full flex items-center justify-center gap-3
bg-[#EAB308]
text-black px-6 py-4 rounded-xl
hover:shadow-[0_0_25px_rgba(253,224,71,0.4)] hover:scale-[1.01]
active:scale-95
transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100
font-black text-sm uppercase tracking-widest font-anton"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Initialize Auto Post
                </>
              )}
            </button>

            {/* Pro Tip */}
            <div className="bg-[#EAB308]/5 border border-[#EAB308]/20 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-[11px] text-[#EAB308]/80 flex items-start gap-3">
                <span className="text-lg leading-none">⚡</span>
                <span>
                  <strong>CORE LOGIC:</strong> Be specific about visual details
                  and brand voice for optimal neural generation.
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900/90">
                Post Image
              </label>
              {!manualImage ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all backdrop-blur-sm group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-slate-900/20 mb-2 group-hover:text-[#EAB308] transition-colors" />
                    <p className="text-sm text-slate-900/50 font-medium group-hover:text-slate-900 transition-colors">
                      Click to upload image
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.ico,.heic,.heif,.avif"
                    className="hidden"
                    onChange={(e) => setManualImage(e.target.files[0])}
                  />
                </label>
              ) : (
                <div className="relative h-48 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden backdrop-blur-sm">
                  <img
                    src={URL.createObjectURL(manualImage)}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setManualImage(null)}
                    className="absolute top-3 right-3 bg-red-500 text-slate-900 p-2 rounded-full shadow-lg hover:bg-red-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900/90">
                Caption / Description
              </label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Write your post caption here..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 outline-none min-h-[140px] resize-none placeholder:text-slate-900/30 backdrop-blur-sm transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleManualSubmit}
              disabled={loading}
              className="w-full py-4 bg-[#EAB308] text-black rounded-xl font-black shadow-[0_0_20px_rgba(253,224,71,0.2)] hover:shadow-[0_0_25px_rgba(253,224,71,0.4)] hover:scale-[1.01] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest font-anton"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Deploy Manual Post"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Keyword Selection Modal */}
      {showKeywordModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-200 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">
                Select Keywords
              </h3>
              <button
                onClick={() => setShowKeywordModal(false)}
                className="text-slate-900/40 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative group">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EAB308]/50 group-focus-within:text-[#EAB308] transition-colors" />
                <input
                  type="text"
                  placeholder="Filter keywords..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#EAB308]/50 outline-none transition-all placeholder:text-slate-900/20"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {savedKeywords.length === 0 && (
                <p className="text-center text-slate-900/30 text-xs py-8 font-medium">
                  No saved keywords detected in the database.
                </p>
              )}
              {savedKeywords
                .filter((k) =>
                  k.keyword.toLowerCase().includes(modalSearch.toLowerCase()),
                )
                .map((k, i) => {
                  const isSelected = selectedKeywords.includes(k.keyword);
                  return (
                    <div
                      key={k._id || i}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedKeywords((prev) =>
                            prev.filter((kw) => kw !== k.keyword),
                          );
                        } else {
                          setSelectedKeywords((prev) => [...prev, k.keyword]);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? "bg-[#EAB308]/10 border-[#EAB308]/30" : "hover:bg-slate-50 border-transparent"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-[#EAB308] border-[#EAB308] shadow-[0_0_10px_rgba(253,224,71,0.5)]" : "border-slate-200 bg-slate-50"}`}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-black" />
                        )}
                      </div>
                      <span
                        className={`text-sm flex-1 min-w-0 truncate ${isSelected ? "text-[#EAB308] font-bold" : "text-slate-900/60"}`}
                      >
                        {k.keyword}
                      </span>
                      <button
                        type="button"
                        title="Delete keyword"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteSavedKeyword(k);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-900/40 uppercase tracking-widest">
                {selectedKeywords.length} selected
              </span>
              <button
                onClick={() => setShowKeywordModal(false)}
                className="px-8 py-2.5 bg-[#EAB308] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(253,224,71,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostInput;
