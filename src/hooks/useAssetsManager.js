import { useState, useEffect, useCallback } from "react";
import {
  loadAssetsFromServerAction,
  saveAssetsToServerAction,
} from "@/app/actions/assetActions";
import { toast } from "react-hot-toast";

// Toast deduplication helper
const activeToastIds = new Set();
export function showToast(message, type = "info") {
  const id = `toast-${message}`;
  if (activeToastIds.has(id)) return;
  activeToastIds.add(id);

  const opts = { id, duration: 3000 };
  if (type === "error") toast.error(message, opts);
  else if (type === "success") toast.success(message, opts);
  else toast(message, opts);

  setTimeout(() => activeToastIds.delete(id), 3200);
}

export function useAssetsManager() {
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
  const [urlInputs, setUrlInputs] = useState({
    characterImage: "",
    uniformImage: "",
    backgroundImage: "",
    logoImage: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [assetId, setAssetId] = useState(null);
  const [error, setError] = useState(null);

  // Initialize UserId
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
        loadAssetsFromServer(storedUserId);
      } else {
        const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("userId", newUserId);
        setUserId(newUserId);
        setIsLoading(false);
      }
    }
  }, []);

  // Load from server
  const loadAssetsFromServer = async (currentUserId) => {
    try {
      const result = await loadAssetsFromServerAction(currentUserId);
      if (result.success && result.data.length > 0) {
        const latestAssets = result.data[0];
        setAssetId(latestAssets._id);
        
        const productImageArray = latestAssets.productImage
          ? Array.isArray(latestAssets.productImage) 
            ? latestAssets.productImage 
            : [latestAssets.productImage]
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
      setError("Failed to load saved brand assets");
    } finally {
      setIsLoading(false);
    }
  };

  // Save to server
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
        throw new Error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving assets:", error);
      setError("Failed to save changes");
      showToast("Failed to save changes", "error");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [userId, assetId]);

  // Handlers
  const handleColorPaletteChange = useCallback(async (value) => {
    const updatedAssets = { ...assets, colourPalette: value };
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets);
  }, [assets, saveAssetsToServer]);

  const handleSizeChange = useCallback(async (value) => {
    const updatedAssets = { ...assets, size: value };
    setAssets(updatedAssets);
    await saveAssetsToServer(updatedAssets);
  }, [assets, saveAssetsToServer]);

  const handleImageUpload = useCallback((key, file) => {
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
  }, [assets, saveAssetsToServer]);

  const handleUrlInputChange = useCallback((key, value) => {
    setUrlInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const commitUrlInput = useCallback((key, value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const updatedAssets = { ...assets, [key]: trimmed };
    setPreviews((prev) => ({ ...prev, [key]: trimmed }));
    setAssets(updatedAssets);
    saveAssetsToServer(updatedAssets);
  }, [assets, saveAssetsToServer]);

  const removeAsset = useCallback(async (key, index = -1) => {
    if (!confirm(`Are you sure you want to remove this image?`)) return;
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
  }, [assets, saveAssetsToServer]);

  const copyPayload = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(assets, null, 2));
    showToast("Design details copied successfully", "success");
  }, [assets]);

  return {
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
    forceSync: () => saveAssetsToServer(assets)
  };
}