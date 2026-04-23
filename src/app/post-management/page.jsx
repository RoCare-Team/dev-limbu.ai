"use client";

import {
  fetchAllPostsAction,
  getUserWalletAction,
  generateWithAiAgentAction,
  savePostAction,
  deductFromWalletAction,
  generateWithAssetsAction,
  deletePostFromGmbAction,
  updatePostStatusAction,
  postToGmbAction,
} from "@/app/actions/postActions";
import {
  loadAssetsFromServerAction,
} from "@/app/actions/assetActions";
import { normalizePlatformDescriptions } from "@/utils/aiPostDescriptions";
import { resolveBusinessNameForGeneration } from "@/lib/businessNameFromPayload";
import { getCloudinarySignatureAction } from "@/app/actions/uploadCloudinary";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  CheckCircle,
  Clock,
  Calendar,
  Image as ImageIcon,
  ArrowLeft,
  Send,
  XCircle,
  Video,
  Film,
} from "lucide-react";

import ScheduleModal from "../../components/post-management/ScheduleModal";
import ScheduleConfirmationModal from "../../components/post-management/ScheduleConfirmationModal";
import FacebookShareModal from "../../components/post-management/FacebookShareModal";
import InstagramShareModal from "../../components/post-management/InstagramShareModal";
import PreviewSection from "../../components/post-management/PreviewSection";
import PostManagementHeader from "../../components/post-management/PostManagementHeader";
import PostCard from "../../components/post-management/PostCard";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Toast from "../../components/Toast";
import LocationSelectionModal from "../../components/LocationSelectionModal";
import InsufficientBalanceModal from "../../components/InsufficientBalanceModal";
import SuccessOverlay from "../../components/SuccessOverlay";
import SupportModal from "@/components/SupportModal";
import FirstPostModal from "../../components/FirstPostModal";
import PostInput from "@/components/PostInput";
import ImageToVideoModal from "@/components/post-management/ImageToVideoModal";
import TabButton from "@/components/TabButton";
import RejectReasonModal from "../../components/RejectReasonModal";
import {
  stripBase64,
  fileToBase64
} from "@/utils/postHelpers";
import { usePostManagementActions } from "@/hooks/usePostManagementActions";
import { usePostFilters } from "@/hooks/usePostFilters";
import { getLocalStorage } from "@/utils/storage";
import "./PostManagement.module.css";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";

import { emitWalletDeduct, emitWalletCredit } from "@/utils/walletEvents";



const AI_IMAGE_GENERATION_COINS = 80;
const VIDEO_GENERATION_COINS = 200;

export default function PostManagementPage() {
  const { data: session } = useSession();
  const userId = getLocalStorage("userId");

  // --- UI & Feedback States ---
  const [uiState, setUiState] = useState({
    toast: null,
    isGenerating: false,
    countdown: 0,
    showSuccess: false,
    showInsufficientBalance: false,
    showFirstPostModal: false,
    isLoadingPosts: true,
    isLoadingMore: false,
    isScheduleModalOpen: false,
    showScheduleConfirmation: false,
    showRejectModal: false,
    imageToVideoOpen: false,
    showLocationModal: false,
    showDeleteLocationModal: false,
    showFacebookModal: false,
    showInstagramModal: false,
  });

  const updateUiState = useCallback((updates) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    updateUiState({ toast: { message, type } });
    setTimeout(() => updateUiState({ toast: null }), 3000);
  }, [updateUiState]);

  // --- Wallet & Coins ---
  const [userWallet, setUserWallet] = useState(0);
  const [requiredCoins, setRequiredCoins] = useState(0);

  // --- Posts & Pagination ---
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("total");

  // --- Generation Inputs ---
  const [prompt, setPrompt] = useState("");
  const [logo, setLogo] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["gmb", "fb", "ig"]);
  const [keywordError, setKeywordError] = useState("");
  const [bussinessTitle, setBussinessTitle] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // --- Assets ---
  const [userAssets, setUserAssets] = useState([]);
  const [assetId, setAssetId] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);

  // --- Selected Post Data ---
  const [previewData, setPreviewData] = useState(null);
  const [postToAction, setPostToAction] = useState(null);
  const [postToSchedule, setPostToSchedule] = useState(null);
  const [scheduledPlatforms, setScheduledPlatforms] = useState({ gmb: [], fb: [], ig: [] });
  const [rejectPostId, setRejectPostId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [imageToVideoInitialPost, setImageToVideoInitialPost] = useState(null);

  // --- Social Media Specific ---
  const [socialState, setSocialState] = useState({
    facebookPages: [],
    loadingFbPages: false,
    postToFacebook: null,
    instagramAccounts: [],
    loadingIgAccounts: false,
    postToInstagram: null,
  });

  const updateSocialState = useCallback((updates) => {
    setSocialState(prev => ({ ...prev, ...updates }));
  }, []);

  const [availableLocations, setAvailableLocations] = useState([]);
  const [scheduleDates, setScheduleDates] = useState({});

  const previewRef = useRef(null);
  const loaderRef = useRef(null);

  const { allCounts, updateCounts } = usePostFilters(activeTab);

  const fetchPosts = useCallback(
    async (pageNum = 1, isBackground = false) => {
      if (!userId) return;
      if (pageNum === 1 && !isBackground) updateUiState({ isLoadingPosts: true });
      if (pageNum > 1) updateUiState({ isLoadingMore: true });

      try {
        const res = await fetchAllPostsAction(userId, pageNum, 12, activeTab);

        if (res.success) {
          const fetchedPosts = res.data || [];

          if (pageNum === 1 && res.counts) {
            updateCounts(res.counts);
          }

          setPosts((prev) => {
            if (pageNum === 1) return fetchedPosts;
            const existingIds = new Set(prev.map(p => p._id));
            const newPosts = fetchedPosts.filter(p => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });

          if (res.pagination) {
            setHasMore(pageNum < res.pagination.totalPages);
          } else {
            setHasMore(fetchedPosts.length === 12 && fetchedPosts.length > 0);
          }

          if (pageNum === 1 && fetchedPosts.length === 0 && activeTab === "total") {
            updateUiState({ showFirstPostModal: true });
          }
        }
      } catch (err) {
        showToast("Error loading posts", "error");
      } finally {
        updateUiState({ isLoadingPosts: false, isLoadingMore: false });
      }
    },
    [activeTab, showToast, updateCounts, updateUiState, userId]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false);
  }, [activeTab, fetchPosts]);

  useEffect(() => {
    if (!hasMore || uiState.isLoadingMore || uiState.isLoadingPosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasMore, uiState.isLoadingMore, uiState.isLoadingPosts]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, true);
    }
  }, [page, fetchPosts]);

  const handleFetchBackground = useCallback(() => fetchPosts(1, true), [fetchPosts]);

  const {
    isPosting,
    setIsPosting,
    convertingVideoPostId,
    handleFacebookPost: handleFacebookPostAction,
    handleInstagramPost: handleInstagramPostAction,
    handleAutoConvertToVideo: handleAutoConvertToVideoAction,
  } = usePostManagementActions({
    userId,
    session,
    fetchPosts: handleFetchBackground,
    setPosts,
    setPreviewData,
    setUserWallet,
    setRequiredCoins,
    setShowInsufficientBalance: (val) => updateUiState({ showInsufficientBalance: val }),
    showToast
  });

  useEffect(() => {
    const stored = getLocalStorage("locationDetails");
    if (stored) {
      try {
        const parsedLocations = JSON.parse(stored);
        setAvailableLocations(parsedLocations.map((loc, index) => ({
          id: loc.id || index + 1,
          name: loc.name || loc.title || `Location ${index + 1}`,
          address: loc.address || loc.storefrontAddress?.addressLines?.join(", ") || "Address not available",
          city: loc.city || "",
          ...loc,
        })));
      } catch (err) {
        setAvailableLocations([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!previewData && posts.length > 0 && !uiState.isGenerating) {
      setPreviewData(posts[0]);
    }
  }, [posts, previewData, uiState.isGenerating]);

  const fetchUserAssets = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await loadAssetsFromServerAction(userId);
      if (result.success && result.data.length > 0) {
        const latestAssets = result.data[0];
        setAssetId(latestAssets._id);
        setUserAssets([
          { name: "Logo", url: latestAssets.logoImage || "" },
          { name: "Character", url: latestAssets.characterImage || "" },
          { name: "Product", url: latestAssets.productImage || "" },
          { name: "Uniform", url: latestAssets.uniformImage || "" },
          { name: "Background", url: latestAssets.backgroundImage || "" },
          { name: "Size", url: latestAssets.size || "" },
          { name: "Color", url: latestAssets.colourPalette || "" },
        ]);
      }
    } catch (error) {
      console.error(error);
    }
  }, [userId]);

  useEffect(() => { fetchUserAssets(); }, [fetchUserAssets]);

  useEffect(() => {
    const size = selectedPlatforms.some(p => p === "fb" || p === "ig") ? "3:4" : "16:9";
    setUserAssets(prev => {
      const currentSize = prev.find(a => a.name === "Size")?.url;
      if (currentSize === size) return prev;
      return prev.map(a => a.name === "Size" ? { ...a, url: size } : a);
    });
  }, [selectedPlatforms]);

  const tabs = useMemo(() => [
    { id: "total", label: "All", icon: ImageIcon, count: allCounts.total },
    { id: "pending", label: "Pending", icon: Clock, count: allCounts.pending },
    { id: "approved", label: "Approved", icon: CheckCircle, count: allCounts.approved },
    { id: "rejected", label: "Rejected", icon: XCircle, count: allCounts.rejected },
    { id: "scheduled", label: "Scheduled", icon: Calendar, count: allCounts.scheduled },
    { id: "posted", label: "Posted", icon: Send, count: allCounts.posted },
    { id: "videos", label: "Videos", icon: Film, count: allCounts.videos },
  ], [allCounts]);

  const handleManualPost = useCallback(async ({ image, description }) => {
    if (!userId) return;
    try {
      updateUiState({ isGenerating: true });
      let imageUrl = image;
      if (typeof image === "string" && image.startsWith("data:")) {
        const sigData = await getCloudinarySignatureAction();
        const formData = new FormData();
        formData.append("file", image);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp);
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
        const data = await res.json();
        imageUrl = data.secure_url;
      }
      const saved = await savePostAction({ userId, aiOutput: imageUrl, description, status: "pending", promat: "Manual Upload" });
      if (saved.success) {
        setPosts((prev) => [saved.data, ...prev]);
        setPreviewData(saved.data);
        showToast("Post Created! 🎉");
      }
    } catch (e) {
      showToast("Upload failed", "error");
    } finally {
      updateUiState({ isGenerating: false });
    }
  }, [userId, showToast, updateUiState]);

  const handleAiAgent = useCallback(async (selectedAssets = []) => {
    if (!prompt.trim()) return showToast("Enter prompt!", "error");
    if (!userId) return;
    try {
      const userData = await getUserWalletAction(userId);
      const currentBalance = userData?.wallet ?? 0;
      setUserWallet(currentBalance);

      if (currentBalance < AI_IMAGE_GENERATION_COINS) {
        setRequiredCoins(AI_IMAGE_GENERATION_COINS);
        updateUiState({ showInsufficientBalance: true });
        return;
      }

      updateUiState({ isGenerating: true, countdown: 59 });
      const timer = setInterval(() => {
        setUiState(prev => {
          if (prev.countdown <= 1) { clearInterval(timer); return { ...prev, countdown: 0 }; }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

      let logoBase64 = logo ? await fileToBase64(logo) : null;
      const res = await generateWithAiAgentAction(
        prompt,
        stripBase64(logoBase64),
        selectedAssets.map(a => ({ ...a, url: stripBase64(a.url) }))
      );
      clearInterval(timer);
      if (!res.success) throw new Error(res.error || "AI generation failed");

      const data = res.data || {};
      const { gmb_des, fb_des, ig_des } = normalizePlatformDescriptions({ ...res, ...data });

      // ✅ Save post first
      const saved = await savePostAction({
        userId, aiOutput: data.output,
        description: data.description || gmb_des || "Generated",
        gmbDescription: gmb_des, fbDescription: fb_des, igDescription: ig_des,
        logoUrl: data.logoUrl, status: "pending", promat: prompt, locations: []
      });
      if (!saved.success) throw new Error(saved.error || "Failed to save post");

      // ✅ Deduct coins ONLY after post saved successfully
      const walletRes = await deductFromWalletAction(userId, {
        amount: AI_IMAGE_GENERATION_COINS, type: "deduct", reason: "image_generated"
      });
      if (walletRes?.error) throw new Error(walletRes.error);

      setUserWallet(prev => Math.max(0, prev - AI_IMAGE_GENERATION_COINS));

      showToast(`${AI_IMAGE_GENERATION_COINS} coins deducted ✅`);
      emitWalletDeduct(AI_IMAGE_GENERATION_COINS); // ✅ sidebar update


      setPosts(prev => [saved.data, ...prev]);
      setPreviewData(saved.data);
      showToast("Generated! 🎉");

    } catch (e) {
      showToast(e.message || "Generation failed", "error");
    } finally {
      updateUiState({ isGenerating: false, countdown: 0 });
    }
  }, [prompt, userId, logo, showToast, updateUiState]);

  const handleImageGenerateWithAssets = useCallback(async (selectedAssets = [], businessName, keywords) => {
    if (!prompt.trim()) return showToast("Enter prompt!", "error");
    if (!userId) return;

    let timer = null;

    try {
      // ✅ Step 1: Check wallet balance first
      const userData = await getUserWalletAction(userId);
      const currentBalance = userData?.wallet ?? 0;
      setUserWallet(currentBalance);

      if (currentBalance < AI_IMAGE_GENERATION_COINS) {
        setRequiredCoins(AI_IMAGE_GENERATION_COINS);
        updateUiState({ showInsufficientBalance: true });
        return;
      }

      // ✅ Step 2: Start generation UI
      updateUiState({ isGenerating: true, countdown: 120 });
      timer = setInterval(() => {
        setUiState(prev => {
          if (prev.countdown <= 1) { clearInterval(timer); return { ...prev, countdown: 0 }; }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

      // ✅ Step 3: Generate image
      let logoBase64 = logo ? await fileToBase64(logo) : null;
      const res = await generateWithAssetsAction({
        topic: prompt,
        bussiness_name: businessName,
        keywords,
        colourPalette: userAssets.find(a => a.name === "Color")?.url || "none",
        size: userAssets.find(a => a.name === "Size")?.url || "1:1",
        characterImage: stripBase64(selectedAssets.find(a => a.name === "Character")?.url || ""),
        uniformImage: stripBase64(selectedAssets.find(a => a.name === "Uniform")?.url || ""),
        productImage: stripBase64(selectedAssets.find(a => a.name.startsWith("Product"))?.url || ""),
        backgroundImage: stripBase64(selectedAssets.find(a => a.name === "Background")?.url || ""),
        logoImage: stripBase64(selectedAssets.find(a => a.name === "Logo")?.url || logoBase64 || ""),
        platform: selectedPlatforms.join(",") || "gmb",
      });
      clearInterval(timer);
      timer = null;

      if (!res.success && !res.data && !res.output && !res.image) {
        throw new Error(res.error || res.message || "Image generation failed");
      }

      const data = res.success ? res.data : res;
      const { gmb_des, fb_des, ig_des } = normalizePlatformDescriptions({ ...res, ...data });

      // ✅ Step 4: Save post FIRST
      const saved = await savePostAction({
        userId,
        aiOutput: data.image || data.output,
        description: data.description || gmb_des || fb_des || ig_des || "Generated",
        gmbDescription: gmb_des,
        fbDescription: fb_des,
        igDescription: ig_des,
        status: "pending",
        promat: prompt,
        locations: [],
      });

      if (!saved.success) {
        throw new Error(saved.error || "Failed to save post");
      }

      // ✅ Step 5: Deduct coins ONLY after post saved successfully
      const walletRes = await deductFromWalletAction(userId, {
        amount: AI_IMAGE_GENERATION_COINS,
        type: "deduct",
        reason: "image_generated",
        metadata: { prompt, platform: selectedPlatforms.join(",") },
      });

      const deductOk =
        walletRes?.message === "Wallet updated" ||
        walletRes?.success === true ||
        walletRes?.status === "success";

      if (!deductOk || walletRes?.error) {
        // Post already saved — just warn, don't block user
        console.error("Coin deduction failed after save:", walletRes);
        showToast("Post saved but coin deduction failed — contact support", "error");
      } else {
        setUserWallet(prev => Math.max(0, prev - AI_IMAGE_GENERATION_COINS));
        showToast(`${AI_IMAGE_GENERATION_COINS} coins deducted ✅`);
        emitWalletDeduct(AI_IMAGE_GENERATION_COINS); // ✅ sidebar update

      }

      // ✅ Step 6: Update UI
      setPosts(prev => [saved.data, ...prev]);
      setPreviewData(saved.data);
      showToast("Generated! 🎉");

    } catch (e) {
      console.error("handleImageGenerateWithAssets error:", e);
      showToast(e.message || "Generation failed", "error");
    } finally {
      if (timer) clearInterval(timer);
      updateUiState({ isGenerating: false, countdown: 0 });
    }
  }, [prompt, userId, logo, userAssets, selectedPlatforms, showToast, updateUiState]);

  const handleGenerateClick = useCallback(async (selectedAssets, useAssetsFlow, businessName, keywords) => {
    const resolvedBusinessName = resolveBusinessNameForGeneration({
      fromInput: typeof businessName === "string" ? businessName : "",
      selectedBusinessName: selectedBusiness?.name,
      bussinessTitle,
      availableLocations,
      prompt,
    });

    if (typeof window !== "undefined" && window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    let processedKeywords = Array.isArray(keywords) ? keywords.join(", ") : (keywords || "");
    if (!processedKeywords) {
      setKeywordError("Please fill at least one keyword");
      return;
    }
    setKeywordError("");

    if (useAssetsFlow === "manual") {
      await handleManualPost(selectedAssets);
    } else if (useAssetsFlow) {
      await handleImageGenerateWithAssets(selectedAssets, resolvedBusinessName, processedKeywords);
    } else {
      await handleAiAgent(selectedAssets);
    }
  }, [availableLocations, bussinessTitle, prompt, selectedBusiness?.name, handleManualPost, handleImageGenerateWithAssets, handleAiAgent]);

  const handleDateChange = useCallback((id, value) => setScheduleDates(prev => ({ ...prev, [id]: value })), []);

  const handleUpdateStatus = useCallback(async (postOrId, newStatus, scheduleDate = null, locations = [], checkmark = undefined, sources = null, fbPages = [], igPages = []) => {
    const postId = typeof postOrId === "string" ? postOrId : postOrId._id;
    if (typeof postOrId === "object" && !newStatus) {
      setPostToSchedule(postOrId);
      updateUiState({ isScheduleModalOpen: true });
      try {
        const userData = await getUserWalletAction(userId);
        setUserWallet(userData.wallet || 0);
      } catch (e) {
        console.error("Failed to fetch wallet", e);
      }
      return;
    }
    try {
      const res = await updatePostStatusAction({
        id: postId, userId, status: newStatus, scheduledDate: scheduleDate,
        locations, checkmark, scheduledDateSource: sources, fbPages, igPages,
        refreshToken: newStatus === "scheduled" ? session?.refreshToken : undefined
      });
      if (res.success) {
        showToast("Updated! ✅");
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, ...res.data, status: newStatus } : p));
        setPreviewData(prev => prev?._id === postId ? { ...prev, ...res.data, status: newStatus } : prev);
      }
    } catch (e) { showToast("Error", "error"); }
  }, [userId, session?.refreshToken, updateUiState, showToast]);

  const handleScheduleDateConfirmed = useCallback(async (postId, status, selectedDate, selectedTargets) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    const sources = [];
    if (selectedTargets.gmb?.length > 0) sources.push("gmb");
    if (selectedTargets.fb?.length > 0) sources.push("fb");
    if (selectedTargets.ig?.length > 0) sources.push("ig");

    if (sources.length > 0) {
      // Check for GMB Session Expiry before scheduling if GMB is selected
      if (sources.includes("gmb") && (!session || !session.accessToken || session.error === "RefreshAccessTokenError")) {
        showToast("Google Session Expired. Please reconnect your GMB account.", "error");
        return;
      }

      const gmbLocs = availableLocations.filter(loc => selectedTargets.gmb.includes(loc.id));
      const fbPages = socialState.facebookPages.filter(p => selectedTargets.fb.includes(p.pageId)).map(p => ({ pageId: p.pageId, pageAccessToken: p.pageAccessToken }));
      const igPages = socialState.instagramAccounts.filter(a => selectedTargets.ig.includes(a.igId)).map(a => ({ igUserId: a.igId, accessToken: a.pageAccessToken }));

      setScheduledPlatforms({ gmb: gmbLocs, fb: fbPages, ig: igPages });
      await handleUpdateStatus(postId, "scheduled", selectedDate, gmbLocs, post.checkmark, sources, fbPages, igPages);
      updateUiState({ isScheduleModalOpen: false, showScheduleConfirmation: true });
    } else {
      showToast("Select platform", "error");
    }
  }, [availableLocations, posts, socialState.facebookPages, socialState.instagramAccounts, updateUiState, showToast, handleUpdateStatus, session]);

  const handleToggleCheckmark = useCallback(async (id, type) => {
    const post = posts.find(p => p._id === id);
    if (!post) return;
    let current = post.checkmark || "post";
    let newVal = current === "both" ? (type === "post" ? "photo" : "post") : (current === type ? type : "both");
    setPosts(prev => prev.map(p => p._id === id ? { ...p, checkmark: newVal } : p));
    setPreviewData(prev => prev?._id === id ? { ...prev, checkmark: newVal } : prev);
    await updatePostStatusAction({ id, userId, checkmark: newVal });
  }, [posts, userId]);

  const fetchFacebookPages = useCallback(async () => {
    if (socialState.facebookPages.length > 0) return;
    updateSocialState({ loadingFbPages: true });
    try {
      const res = await fetch(`/api/facebook/pages?userId=${userId}`).then(r => r.json());
      if (res.success) updateSocialState({ facebookPages: res.pages });
    } finally { updateSocialState({ loadingFbPages: false }); }
  }, [socialState.facebookPages.length, userId, updateSocialState]);

  const handleFacebookPost = useCallback((post) => {
    updateSocialState({ postToFacebook: post });
    updateUiState({ showFacebookModal: true });
    fetchFacebookPages();
  }, [fetchFacebookPages, updateUiState, updateSocialState]);

  const fetchInstagramAccounts = useCallback(async () => {
    if (socialState.instagramAccounts.length > 0) return;
    updateSocialState({ loadingIgAccounts: true });
    try {
      const res = await fetch(`/api/instagram/pages?userId=${userId}`).then(r => r.json());
      if (res.success) updateSocialState({ instagramAccounts: res.pages });
    } finally { updateSocialState({ loadingIgAccounts: false }); }
  }, [socialState.instagramAccounts.length, userId, updateSocialState]);

  const handleInstagramPost = useCallback((post) => {
    updateSocialState({ postToInstagram: post });
    updateUiState({ showInstagramModal: true });
    fetchInstagramAccounts();
  }, [fetchInstagramAccounts, updateUiState, updateSocialState]);

  const handleAutoConvertToVideo = useCallback((post) => {
    handleAutoConvertToVideoAction(post, prompt, selectedBusiness, bussinessTitle, availableLocations);
  }, [handleAutoConvertToVideoAction, prompt, selectedBusiness, bussinessTitle, availableLocations]);

  const handleEditDescription = useCallback(async (id, updates) => {
    const res = await updatePostStatusAction({ id, userId, status: "pending", ...(typeof updates === "string" ? { description: updates } : updates) });
    if (res.success) {
      showToast("Updated!");
      setPosts(prev => prev.map(p => p._id === id ? { ...p, ...res.data } : p));
      setPreviewData(prev => prev?._id === id ? { ...prev, ...res.data } : prev);
    }
  }, [userId, showToast]);

  const handleDeleteFromGMB = useCallback((post) => {
    if (!post.locations?.length) return showToast("No locations", "error");

    // Check for GMB Session Expiry before attempting to delete from GMB
    if (!session || !session.accessToken || session.error === "RefreshAccessTokenError") {
      showToast("Google Session Expired. Please reconnect your GMB account.", "error");
      return;
    }

    setPostToAction(post);
    updateUiState({ showDeleteLocationModal: true });
  }, [updateUiState, showToast, session]);

  const handleLocationConfirm = useCallback(async (selectedIds, checkmark) => {
    updateUiState({ showLocationModal: false });
    if (!selectedIds.length || !postToAction) return;
    const totalCost = selectedIds.length * 20;

    try {
      // Fix 1: safely read wallet from whatever field the API returns
      const userData = await getUserWalletAction(userId);
      console.log("getUserWalletAction response:", userData); // keep until confirmed working

      const walletBalance =
        userData?.wallet ??
        userData?.data?.wallet ??
        userData?.user?.wallet ??
        userData?.coins ??
        0;

      setUserWallet(walletBalance);

      if (walletBalance < totalCost) {
        setRequiredCoins(totalCost);
        updateUiState({ showInsufficientBalance: true });
        return;
      }

      setIsPosting(true);

      const walletRes = await deductFromWalletAction(userId, {
        amount: totalCost,
        type: "deduct",
        reason: "Post-on-GMB",
      });

      console.log("deductFromWalletAction response:", walletRes); // keep until confirmed

      // Fix 2: accept any truthy success signal, not just one exact string
      const deductOk =
        walletRes?.message === "Wallet updated" ||
        walletRes?.success === true ||
        walletRes?.status === "success" ||
        walletRes?.ok === true;

      if (!deductOk) {
        throw new Error(walletRes?.error || walletRes?.message || "Wallet deduction failed");
      }

      emitWalletDeduct(totalCost); // ✅ sidebar sync


      const locs = availableLocations
        .filter((l) => selectedIds.includes(l.id))
        .map((l) => ({ ...l, isPosted: true }));

      const { ok } = await postToGmbAction({
        account: locs[0].accountId,
        locationData: locs.map((l) => ({
          city: l.locationId,
          cityName: l.locality,
          bookUrl: l.websiteUrl,
        })),
        output: postToAction.aiOutput,
        description: postToAction.description,
        accessToken: session?.accessToken,
        checkmark: checkmark || postToAction.checkmark,
      });

      if (ok) {
        showToast("Posted! 🎉");
        await updatePostStatusAction({
          id: postToAction._id,
          userId,
          locations: locs,
          status: "posted",
          whenPosted: { ...postToAction.whenPosted, gmb: true },
        });
        fetchPosts(1, true);
      } else {
        // Refund if GMB post failed
        await deductFromWalletAction(userId, {
          amount: totalCost,
          type: "credit",
          reason: "Refund-Post-Failed",
        });
        setUserWallet((prev) => prev + totalCost);
        emitWalletCredit(totalCost); // ✅ sidebar sync

        throw new Error("GMB post failed — coins refunded");
      }
    } catch (err) {
      showToast(err.message || "Post failed", "error");
    } finally {
      setIsPosting(false);
      setPostToAction(null);
    }
  }, [availableLocations, userId, postToAction, session?.accessToken, updateUiState, showToast, setIsPosting, fetchPosts]);

  const handlePost = useCallback(async (post) => {
    if (!["approved", "scheduled", "posted", "failed"].includes(post.status)) return showToast("Approve first", "error");

    // Check for GMB Session Expiry before showing the location modal
    if (!session || !session.accessToken || session.error === "RefreshAccessTokenError") {
      showToast("Google Session Expired. Please reconnect your GMB account.", "error");
      return;
    }

    const userData = await getUserWalletAction(userId);
    setUserWallet(userData.wallet || 0);
    setPostToAction(post);
    updateUiState({ showLocationModal: true });
  }, [userId, updateUiState, showToast, session]);

  const handleDeleteLocationConfirm = useCallback(async (selectedIds) => {
    updateUiState({ showDeleteLocationModal: false });
    setIsPosting(true);
    try {
      for (const id of selectedIds) {
        const loc = postToAction.locations.find(l => l.id === id);
        await deletePostFromGmbAction({ locationIds: loc.locationId, acc_id: loc.accountId, access_token: session?.accessToken });
      }
      showToast("Deleted!");
      fetchPosts(1, true);
    } finally { setIsPosting(false); setPostToAction(null); }
  }, [postToAction, session?.accessToken, updateUiState, showToast, setIsPosting, fetchPosts]);

  const handleReject = useCallback((id) => {
    if (confirm("Reject this post?")) { setRejectPostId(id); updateUiState({ showRejectModal: true }); }
  }, [updateUiState]);

  const submitRejection = useCallback(async () => {
    if (!rejectReason.trim()) return showToast("Enter reason", "error");
    const res = await updatePostStatusAction({ id: rejectPostId, userId, status: "rejected", reason: rejectReason });
    if (res.success) {
      showToast("Rejected! ❌");
      setPosts(prev => prev.map(p => p._id === rejectPostId ? { ...p, status: "rejected" } : p));
      updateUiState({ showRejectModal: false });
    }
  }, [rejectPostId, rejectReason, userId, updateUiState, showToast]);

  const handleDownload = useCallback(async (post) => {
    try {
      const res = await fetch(`/api/downloadImage?url=${encodeURIComponent(post.aiOutput)}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `post-${Date.now()}.jpg`;
      a.click();
    } catch (e) { showToast("Download failed", "error"); }
  }, [showToast]);

  const handleShare = useCallback((post) => {
    if (navigator.share) navigator.share({ title: "Post", text: post.description, url: post.aiOutput });
    else { navigator.clipboard.writeText(post.aiOutput); showToast("Copied! 📋"); }
  }, [showToast]);

  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetch("/api/user-settings").then(r => r.json());
      if (res.gmbProjects?.length) setSelectedBusiness(res.selectedBusiness || res.gmbProjects[0]);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const stored = getLocalStorage("locationDetails");
    if (stored) { try { const p = JSON.parse(stored); if (p.length) setBussinessTitle(p[0].title); } catch (e) { } }
  }, []);

  useEffect(() => {
    const bal = getLocalStorage("walletBalance");
    if (bal) setUserWallet(parseInt(bal, 10));
  }, []);

  return (
    <div className="text-slate-900">
      <div className="sm:hidden fixed top-4 left-4 z-50">
        <Link href="/dashboard" passHref>
          <button className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg border border-slate-200 hover:scale-110">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto space-y-2">
        {uiState.toast && <Toast message={uiState.toast.message} type={uiState.toast.type} />}
        {uiState.showLocationModal && <LocationSelectionModal locations={availableLocations} onClose={() => updateUiState({ showLocationModal: false })} onConfirm={handleLocationConfirm} title="Post to Locations" walletBalance={userWallet} isPostAction={true} />}
        {uiState.showDeleteLocationModal && <LocationSelectionModal locations={postToAction?.locations || []} onClose={() => updateUiState({ showDeleteLocationModal: false })} onConfirm={handleDeleteLocationConfirm} title="Delete from Locations" confirmText="Delete" />}
        {uiState.showInsufficientBalance && <InsufficientBalanceModal walletBalance={userWallet} required={requiredCoins} onClose={() => updateUiState({ showInsufficientBalance: false })} onRecharge={() => window.location.href = "/wallet"} />}
        {uiState.isScheduleModalOpen && <ScheduleModal isOpen={uiState.isScheduleModalOpen} onClose={() => updateUiState({ isScheduleModalOpen: false })} post={postToSchedule} onConfirm={handleScheduleDateConfirmed} availableLocations={availableLocations} facebookPages={socialState.facebookPages} instagramAccounts={socialState.instagramAccounts} fetchFacebookPages={fetchFacebookPages} fetchInstagramAccounts={fetchInstagramAccounts} loadingFb={socialState.loadingFbPages} loadingIg={socialState.loadingIgAccounts} userWallet={userWallet} setShowInsufficientBalance={(val) => updateUiState({ showInsufficientBalance: val })} setRequiredCoins={setRequiredCoins} />}
        {uiState.showScheduleConfirmation && <ScheduleConfirmationModal isOpen={uiState.showScheduleConfirmation} onClose={() => updateUiState({ showScheduleConfirmation: false })} scheduledPlatforms={scheduledPlatforms} />}
        {uiState.showRejectModal && <RejectReasonModal onClose={() => updateUiState({ showRejectModal: false })} onSubmit={submitRejection} reason={rejectReason} setReason={setRejectReason} />}
        {uiState.showFacebookModal && <FacebookShareModal isOpen={uiState.showFacebookModal} onClose={() => updateUiState({ showFacebookModal: false })} onConfirm={(p, pg, c) => { updateUiState({ showFacebookModal: false }); handleFacebookPostAction(p, pg, c); }} post={socialState.postToFacebook} pages={socialState.facebookPages} loading={socialState.loadingFbPages} />}
        {uiState.showInstagramModal && <InstagramShareModal isOpen={uiState.showInstagramModal} onClose={() => updateUiState({ showInstagramModal: false })} onConfirm={(p, a, c) => { updateUiState({ showInstagramModal: false }); handleInstagramPostAction(p, a, c); }} post={socialState.postToInstagram} accounts={socialState.instagramAccounts} loading={socialState.loadingIgAccounts} />}
        <ImageToVideoModal isOpen={uiState.imageToVideoOpen} onClose={() => updateUiState({ imageToVideoOpen: false })} initialPost={imageToVideoInitialPost} posts={posts} selectedBusiness={selectedBusiness} bussinessTitle={bussinessTitle} availableLocations={availableLocations} postPrompt={prompt} showToast={showToast} videoGenerationCoins={VIDEO_GENERATION_COINS} onVideoChargeApplied={() => setUserWallet(p => p - VIDEO_GENERATION_COINS)} onVideoInsufficientBalance={() => { setRequiredCoins(VIDEO_GENERATION_COINS); updateUiState({ showInsufficientBalance: true }); }} onVideoSaved={(s) => { setPosts(prev => [s, ...prev]); setPreviewData(s); }} />
        {uiState.showFirstPostModal && <FirstPostModal onClose={() => updateUiState({ showFirstPostModal: false })} />}

        {isPosting && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-150 flex items-center justify-center">
            <div className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center">
              <Send className="w-10 h-10 text-lemon-glow animate-bounce" />
              <h3 className="text-2xl font-black mt-4">Publishing Your Post ✨</h3>
            </div>
          </div>
        )}
        {uiState.showSuccess && <SuccessOverlay onComplete={() => updateUiState({ showSuccess: false })} postsCount={posts.length} />}

        <PostManagementHeader selectedPlatforms={selectedPlatforms} setSelectedPlatforms={setSelectedPlatforms} previewData={previewData} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <div className="lg:col-span-7">
            <PostInput prompt={prompt} setPrompt={setPrompt} onGenerate={handleGenerateClick} loading={uiState.isGenerating} logo={logo} setLogo={setLogo} assets={userAssets} setUserAssets={setUserAssets} fetchUserAssets={fetchUserAssets} assetId={assetId} showToast={showToast} selectedAssets={selectedAssets} setSelectedAssets={setSelectedAssets} bussinessTitle={bussinessTitle} availableLocations={availableLocations} keywordError={keywordError} />
            <button type="button" onClick={() => updateUiState({ imageToVideoOpen: true })} className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 py-3 font-bold text-amber-900 shadow-sm"><Video className="w-5 h-5" /> Image to Video</button>
          </div>
          <div className="lg:col-span-5 sticky top-16 z-10 max-h-[75vh] overflow-y-auto" ref={previewRef}>
            <PreviewSection isGenerating={uiState.isGenerating} previewData={previewData} onDownload={handleDownload} countdown={uiState.countdown} onUpdateStatus={handleUpdateStatus} onReject={handleReject} handlePost={handlePost} onToggleCheckmark={handleToggleCheckmark} onEditDescription={handleEditDescription} isConvertingToVideo={!!previewData?._id && String(convertingVideoPostId) === String(previewData._id)} videoConvertCoins={VIDEO_GENERATION_COINS} onAutoConvertToVideo={handleAutoConvertToVideo} onRequestImageToVideo={() => { if (previewData) { setImageToVideoInitialPost(previewData); updateUiState({ imageToVideoOpen: true }); } }} handleFacebookPost={handleFacebookPost} handleInstagramPost={handleInstagramPost} />
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-2">
          {tabs.map((tab) => <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} count={tab.count} />)}
        </div>

        {uiState.isLoadingPosts ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Lottie animationData={animationData} loop={true} className="w-32 h-32" />
            <p className="text-gray-500 mt-4">Loading your creatives...</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 mt-6">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} scheduleDates={scheduleDates} onDateChange={handleDateChange} handleDownload={handleDownload} handleShare={handleShare} onUpdateStatus={handleUpdateStatus} onReject={handleReject} handlePost={handlePost} onEditDescription={handleEditDescription} handleDeleteFromGMB={handleDeleteFromGMB} onToggleCheckmark={handleToggleCheckmark} handleFacebookPost={handleFacebookPost} handleInstagramPost={handleInstagramPost} onConvertToVideo={handleAutoConvertToVideo} convertingVideoPostId={convertingVideoPostId} videoGenerationCoins={VIDEO_GENERATION_COINS} />
              ))}
            </div>
            <div ref={loaderRef} className="h-10 w-full" />
            {uiState.isLoadingMore && <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div></div>}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border-3 border-dashed border-slate-200 shadow-xl">
            <div className="text-8xl mb-6">📭</div>
            <h3 className="text-xl font-bold mb-2">No posts found</h3>
            <p className="text-slate-900/70">{`No ${activeTab} posts yet`}</p>
          </div>
        )}
      </div>
      <SupportModal showToast={showToast} />
    </div>
  );
}
