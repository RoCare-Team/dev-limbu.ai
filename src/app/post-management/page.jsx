"use client";

import { signIn } from "next-auth/react";

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
import { loadAssetsFromServerAction } from "@/app/actions/assetActions";
import { normalizePlatformDescriptions } from "@/utils/aiPostDescriptions";
import { resolveBusinessNameForGeneration } from "@/lib/businessNameFromPayload";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
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
import { stripBase64, fileToBase64 } from "@/utils/postHelpers";
import { usePostManagementActions } from "@/hooks/usePostManagementActions";
import { usePostFilters } from "@/hooks/usePostFilters";
import { getLocalStorage } from "@/utils/storage";
import "./PostManagement.module.css";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";

import { emitWalletDeduct, emitWalletCredit } from "@/utils/walletEvents";
import WhatsAppButton from "@/components/WhatsAppButton";

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
    setUiState((prev) => ({ ...prev, ...updates }));
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      updateUiState({ toast: { message, type } });
      setTimeout(() => updateUiState({ toast: null }), 3000);
    },
    [updateUiState],
  );

  // --- Wallet & Coins ---
  const [userWallet, setUserWallet] = useState(0);
  const [requiredCoins, setRequiredCoins] = useState(0);

  // --- Posts & Pagination ---
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("total");

  // buiness not connected 
  const [showGmbExpiredModal, setShowGmbExpiredModal] = useState(false);

  // --- Generation Inputs ---
  const [prompt, setPrompt] = useState("");
  const [logo, setLogo] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "gmb",
    "fb",
    "ig",
  ]);
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
  const [scheduledPlatforms, setScheduledPlatforms] = useState({
    gmb: [],
    fb: [],
    ig: [],
  });
  const [rejectPostId, setRejectPostId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [imageToVideoInitialPost, setImageToVideoInitialPost] = useState(null);
  const [selectedMediaForAction, setSelectedMediaForAction] = useState(null);

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
    setSocialState((prev) => ({ ...prev, ...updates }));
  }, []);

  const [availableLocations, setAvailableLocations] = useState([]);
  const [scheduleDates, setScheduleDates] = useState({});

  const previewRef = useRef(null);
  const loaderRef = useRef(null);

  const { allCounts, updateCounts } = usePostFilters(activeTab);

  // modal posting
  const [msgIndex, setMsgIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

  const fetchPosts = useCallback(
    async (pageNum = 1, isBackground = false) => {
      if (!userId) return;
      if (pageNum === 1 && !isBackground)
        updateUiState({ isLoadingPosts: true });
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
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = fetchedPosts.filter(
              (p) => !existingIds.has(p._id),
            );
            return [...prev, ...newPosts];
          });

          if (res.pagination) {
            setHasMore(pageNum < res.pagination.totalPages);
          } else {
            setHasMore(fetchedPosts.length === 12 && fetchedPosts.length > 0);
          }

          if (
            pageNum === 1 &&
            fetchedPosts.length === 0 &&
            activeTab === "total"
          ) {
            updateUiState({ showFirstPostModal: true });
          }
        }
      } catch (err) {
        showToast("Error loading posts", "error");
      } finally {
        updateUiState({ isLoadingPosts: false, isLoadingMore: false });
      }
    },
    [activeTab, showToast, updateCounts, updateUiState, userId],
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
      { threshold: 0.1, rootMargin: "200px" },
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

  const handleFetchBackground = useCallback(
    () => fetchPosts(1, true),
    [fetchPosts],
  );

  // gmb post success modal & dynamic platform tracking
  const [dots, setDots] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [postingPlatform, setPostingPlatform] = useState("Google Business");

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
    setShowInsufficientBalance: (val) =>
      updateUiState({ showInsufficientBalance: val }),
    showToast,
    setIsSuccess,
    setPostingPlatform,
  });

  useEffect(() => {
    if (!isPosting) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isPosting]);

  useEffect(() => {
    const stored = getLocalStorage("locationDetails");
    if (stored) {
      try {
        const parsedLocations = JSON.parse(stored);
        setAvailableLocations(
          parsedLocations.map((loc, index) => ({
            id: loc.id || index + 1,
            name: loc.name || loc.title || `Location ${index + 1}`,
            address:
              loc.address ||
              loc.storefrontAddress?.addressLines?.join(", ") ||
              "Address not available",
            city: loc.city || "",
            ...loc,
          })),
        );
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

  useEffect(() => {
    fetchUserAssets();
  }, [fetchUserAssets]);

  useEffect(() => {
    const size = selectedPlatforms.some((p) => p === "fb" || p === "ig")
      ? "3:4"
      : "16:9";
    setUserAssets((prev) => {
      const currentSize = prev.find((a) => a.name === "Size")?.url;
      if (currentSize === size) return prev;
      return prev.map((a) => (a.name === "Size" ? { ...a, url: size } : a));
    });
  }, [selectedPlatforms]);

  const tabs = useMemo(
    () => [
      { id: "total", label: "All", icon: ImageIcon, count: allCounts.total },
      {
        id: "pending",
        label: "Pending",
        icon: Clock,
        count: allCounts.pending,
      },
      {
        id: "approved",
        label: "Approved",
        icon: CheckCircle,
        count: allCounts.approved,
      },
      {
        id: "rejected",
        label: "Rejected",
        icon: XCircle,
        count: allCounts.rejected,
      },
      {
        id: "scheduled",
        label: "Scheduled",
        icon: Calendar,
        count: allCounts.scheduled,
      },
      { id: "posted", label: "Posted", icon: Send, count: allCounts.posted },
      { id: "videos", label: "Videos", icon: Film, count: allCounts.videos },
    ],
    [allCounts],
  );

  const handleManualPost = useCallback(
    async ({ image, description }) => {
      if (!userId) return;
      try {
        updateUiState({ isGenerating: true });

        // Upload File to S3
        if (!(image instanceof File)) throw new Error("Invalid image file");
        const formData = new FormData();
        formData.append("file", image);
        const s3Result = await uploadToS3Action(formData);
        if (!s3Result.success)
          throw new Error(s3Result.error || "S3 upload failed");

        const saved = await savePostAction({
          userId,
          aiOutput: s3Result.url,
          description,
          status: "pending",
          promat: "Manual Upload",
        });
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
    },
    [userId, showToast, updateUiState],
  );

  const handleAiAgent = useCallback(async (selectedAssets = [], meta = {}) => {
    if (!prompt.trim()) return showToast("Enter prompt!", "error");
    if (!userId) return;
    const mode = meta.mode === "manual" ? "manual" : "ai";
    const instructions =
      typeof meta.instructions === "string" ? meta.instructions : "";
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
        selectedAssets.map(a => ({ ...a, url: stripBase64(a.url) })),
        { mode, instructions },
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

  const handleImageGenerateWithAssets = useCallback(
    async (selectedAssets = [], businessName, keywords, meta = {}) => {
      if (!prompt.trim()) return showToast("Enter prompt!", "error");
      if (!userId) return;

      const mode = meta.mode === "manual" ? "manual" : "ai";
      const instructions =
        typeof meta.instructions === "string" ? meta.instructions : "";

      let timer = null;

      try {
        const userData = await getUserWalletAction(userId);
        const currentBalance = userData?.wallet ?? 0;
        setUserWallet(currentBalance);

        if (currentBalance < AI_IMAGE_GENERATION_COINS) {
          setRequiredCoins(AI_IMAGE_GENERATION_COINS);
          updateUiState({ showInsufficientBalance: true });
          return;
        }

        updateUiState({ isGenerating: true, countdown: 120 });
        timer = setInterval(() => {
          setUiState((prev) => {
            if (prev.countdown <= 1) {
              clearInterval(timer);
              return { ...prev, countdown: 0 };
            }
            return { ...prev, countdown: prev.countdown - 1 };
          });
        }, 1000);

        let logoBase64 = logo ? await fileToBase64(logo) : null;
        const res = await generateWithAssetsAction({
          topic: prompt,
          bussiness_name: businessName,
          keywords,
          colourPalette:
            userAssets.find((a) => a.name === "Color")?.url || "none",
          size: userAssets.find((a) => a.name === "Size")?.url || "1:1",
          characterImage: stripBase64(
            selectedAssets.find((a) => a.name === "Character")?.url || "",
          ),
          uniformImage: stripBase64(
            selectedAssets.find((a) => a.name === "Uniform")?.url || "",
          ),
          productImage: stripBase64(
            selectedAssets.find((a) => a.name.startsWith("Product"))?.url || "",
          ),
          backgroundImage: stripBase64(
            selectedAssets.find((a) => a.name === "Background")?.url || "",
          ),
          logoImage: stripBase64(
            selectedAssets.find((a) => a.name === "Logo")?.url ||
            logoBase64 ||
            "",
          ),
          platform: selectedPlatforms.join(",") || "gmb",
          mode,
          instructions,
        });
        clearInterval(timer);
        timer = null;

        if (!res.success && !res.data && !res.output && !res.image) {
          throw new Error(
            res.error || res.message || "Image generation failed",
          );
        }

        const data = res.success ? res.data : res;
        const { gmb_des, fb_des, ig_des } = normalizePlatformDescriptions({
          ...res,
          ...data,
        });

        const saved = await savePostAction({
          userId,
          aiOutput: data.image || data.output,
          description:
            data.description || gmb_des || fb_des || ig_des || "Generated",
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
          console.error("Coin deduction failed after save:", walletRes);
          showToast(
            "Post saved but coin deduction failed — contact support",
            "error",
          );
        } else {
          setUserWallet((prev) =>
            Math.max(0, prev - AI_IMAGE_GENERATION_COINS),
          );
          showToast(`${AI_IMAGE_GENERATION_COINS} coins deducted ✅`);
          emitWalletDeduct(AI_IMAGE_GENERATION_COINS);
        }

        setPosts((prev) => [saved.data, ...prev]);
        setPreviewData(saved.data);
        showToast("Generated! 🎉");
      } catch (e) {
        console.error("handleImageGenerateWithAssets error:", e);
        showToast(e.message || "Generation failed", "error");
      } finally {
        if (timer) clearInterval(timer);
        updateUiState({ isGenerating: false, countdown: 0 });
      }
    },
    [
      prompt,
      userId,
      logo,
      userAssets,
      selectedPlatforms,
      showToast,
      updateUiState,
    ],
  );

  const handleGenerateClick = useCallback(async (
    selectedAssets,
    useAssetsFlow,
    businessName,
    keywords,
    options = {},
  ) => {
    const {
      mode: modeFromUi = "ai",
      instructions = "",
      includeInstructionsInPrompt = false,
    } = options;

    /** Sent to APIs as exactly `"ai"` or `"manual"` */
    const generationMode = modeFromUi === "manual" ? "manual" : "ai";
    const instructionsForApi =
      includeInstructionsInPrompt && typeof instructions === "string"
        ? instructions
        : "";

    const generationMeta = {
      mode: generationMode,
      instructions: instructionsForApi,
    };

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
    if (generationMode !== "manual" && !processedKeywords.trim()) {
      setKeywordError("Please fill at least one keyword");
      return;
    }
    setKeywordError("");

    if (useAssetsFlow === "manual") {
      await handleManualPost(selectedAssets);
    } else if (useAssetsFlow) {
      await handleImageGenerateWithAssets(
        selectedAssets,
        resolvedBusinessName,
        processedKeywords,
        generationMeta,
      );
    } else {
      await handleAiAgent(selectedAssets, generationMeta);
    }
  }, [availableLocations, bussinessTitle, prompt, selectedBusiness?.name, handleManualPost, handleImageGenerateWithAssets, handleAiAgent]);

  const handleDateChange = useCallback((id, value) => setScheduleDates(prev => ({ ...prev, [id]: value })), []);

  const handleUpdateStatus = useCallback(
    async (
      postOrId,
      newStatus,
      scheduleDate = null,
      locations = [],
      checkmark = undefined,
      sources = null,
      fbPages = [],
      igPages = [],
      approvedMediaType = undefined,
    ) => {
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
          id: postId,
          userId,
          status: newStatus,
          ...(approvedMediaType ? { approvedMediaType } : {}),
          scheduledDate: scheduleDate,
          locations,
          checkmark,
          scheduledDateSource: sources,
          fbPages,
          igPages,
          refreshToken:
            newStatus === "scheduled" ? session?.refreshToken : undefined,
        });
        if (res.success) {
          showToast("Updated! ✅");
          setPosts((prev) =>
            prev.map((p) =>
              p._id === postId ? { ...p, ...res.data, status: newStatus } : p,
            ),
          );
          setPreviewData((prev) =>
            prev?._id === postId
              ? { ...prev, ...res.data, status: newStatus }
              : prev,
          );
        }
      } catch (e) {
        showToast("Error", "error");
      }
    },
    [userId, session?.refreshToken, updateUiState, showToast],
  );

  const handleScheduleDateConfirmed = useCallback(
    async (postId, status, selectedDate, selectedTargets) => {
      const post = posts.find((p) => p._id === postId);
      if (!post) return;
      const sources = [];
      if (selectedTargets.gmb?.length > 0) sources.push("gmb");
      if (selectedTargets.fb?.length > 0) sources.push("fb");
      if (selectedTargets.ig?.length > 0) sources.push("ig");

      if (sources.length > 0) {
        // Check for GMB Session Expiry before scheduling if GMB is selected
        if (
  sources.includes("gmb") &&
  (!session ||
    !session.accessToken ||
    session.error === "RefreshAccessTokenError")
) {
  handleGmbSessionExpired();
  return;
}

        const gmbLocs = availableLocations.filter((loc) =>
          selectedTargets.gmb.includes(loc.id),
        );
        const fbPages = socialState.facebookPages
          .filter((p) => selectedTargets.fb.includes(p.pageId))
          .map((p) => ({
            pageId: p.pageId,
            pageAccessToken: p.pageAccessToken,
            pageName: p.pageName,
          }));
        const igPages = socialState.instagramAccounts
          .filter((a) => selectedTargets.ig.includes(a.igId))
          .map((a) => ({
            igUserId: a.igId,
            accessToken: a.pageAccessToken,
            igUsername: a.igUsername,
          }));

        setScheduledPlatforms({ gmb: gmbLocs, fb: fbPages, ig: igPages });
        await handleUpdateStatus(
          postId,
          "scheduled",
          selectedDate,
          gmbLocs,
          post.checkmark,
          sources,
          fbPages,
          igPages,
        );
        updateUiState({
          isScheduleModalOpen: false,
          showScheduleConfirmation: true,
        });
      } else {
        showToast("Select platform", "error");
      }
    },
    [
      availableLocations,
      posts,
      socialState.facebookPages,
      socialState.instagramAccounts,
      updateUiState,
      showToast,
      handleUpdateStatus,
      session,
    ],
  );

  const handleToggleCheckmark = useCallback(
    async (id, type) => {
      const post = posts.find((p) => p._id === id);
      if (!post) return;
      let current = post.checkmark || "post";
      let newVal =
        current === "both"
          ? type === "post"
            ? "photo"
            : "post"
          : current === type
            ? type
            : "both";
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, checkmark: newVal } : p)),
      );
      setPreviewData((prev) =>
        prev?._id === id ? { ...prev, checkmark: newVal } : prev,
      );
      await updatePostStatusAction({ id, userId, checkmark: newVal });
    },
    [posts, userId],
  );

  const fetchFacebookPages = useCallback(async () => {
    if (socialState.facebookPages.length > 0) return;
    updateSocialState({ loadingFbPages: true });
    try {
      const res = await fetch(`/api/facebook/pages?userId=${userId}`).then(
        (r) => r.json(),
      );
      if (res.success) updateSocialState({ facebookPages: res.pages });
    } finally {
      updateSocialState({ loadingFbPages: false });
    }
  }, [socialState.facebookPages.length, userId, updateSocialState]);

  const handleFacebookPost = useCallback(
    (post, media = null) => {
      setSelectedMediaForAction(media);
      updateSocialState({ postToFacebook: post });
      updateUiState({ showFacebookModal: true });
      fetchFacebookPages();
    },
    [fetchFacebookPages, updateUiState, updateSocialState],
  );

  const fetchInstagramAccounts = useCallback(async () => {
    if (socialState.instagramAccounts.length > 0) return;
    updateSocialState({ loadingIgAccounts: true });
    try {
      const res = await fetch(`/api/instagram/pages?userId=${userId}`).then(
        (r) => r.json(),
      );
      if (res.success) updateSocialState({ instagramAccounts: res.pages });
    } finally {
      updateSocialState({ loadingIgAccounts: false });
    }
  }, [socialState.instagramAccounts.length, userId, updateSocialState]);

  const handleInstagramPost = useCallback(
    (post, media = null) => {
      setSelectedMediaForAction(media);
      updateSocialState({ postToInstagram: post });
      updateUiState({ showInstagramModal: true });
      fetchInstagramAccounts();
    },
    [fetchInstagramAccounts, updateUiState, updateSocialState],
  );

  const handleAutoConvertToVideo = useCallback(
    (post) => {
      handleAutoConvertToVideoAction(
        post,
        prompt,
        selectedBusiness,
        bussinessTitle,
        availableLocations,
      );
    },
    [
      handleAutoConvertToVideoAction,
      prompt,
      selectedBusiness,
      bussinessTitle,
      availableLocations,
    ],
  );

  const handleEditDescription = useCallback(
    async (id, updates) => {
      const res = await updatePostStatusAction({
        id,
        userId,
        status: "pending",
        ...(typeof updates === "string" ? { description: updates } : updates),
      });
      if (res.success) {
        showToast("Updated!");
        setPosts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, ...res.data } : p)),
        );
        setPreviewData((prev) =>
          prev?._id === id ? { ...prev, ...res.data } : prev,
        );
      }
    },
    [userId, showToast],
  );

  const handleDeleteFromGMB = useCallback(
    (post) => {
      if (!post.locations?.length) return showToast("No locations", "error");

      // Check for GMB Session Expiry before attempting to delete from GMB
      if (
  !session ||
  !session.accessToken ||
  session.error === "RefreshAccessTokenError"
) {
  handleGmbSessionExpired();
  return;
}

      setPostToAction(post);
      updateUiState({ showDeleteLocationModal: true });
    },
    [updateUiState, showToast, session],
  );

  const handleLocationConfirm = useCallback(
    async (selectedIds, checkmark) => {
      updateUiState({ showLocationModal: false });
      if (!selectedIds.length || !postToAction) return;
      const totalCost = selectedIds.length * 20;

      try {
        const userData = await getUserWalletAction(userId);
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

        setPostingPlatform("Google Business");
        setIsPosting(true);

        const walletRes = await deductFromWalletAction(userId, {
          amount: totalCost,
          type: "deduct",
          reason: "Post-on-GMB-Batch",
        });

        const deductOk =
          walletRes?.message === "Wallet updated" ||
          walletRes?.success === true ||
          walletRes?.status === "success" ||
          walletRes?.ok === true;

        if (!deductOk) {
          throw new Error(
            walletRes?.error || walletRes?.message || "Wallet deduction failed",
          );
        }

        emitWalletDeduct(totalCost); 

        const locs = availableLocations.filter((l) => selectedIds.includes(l.id));
        
        let successfulLocs = [];
        let failedLocs = [];

        // Post sequentially to ensure each location is processed and tracked properly
        for (const l of locs) {
           try {
             const payload = {
                account: l.accountId,
                locationData: [{
                  city: l.locationId,
                  cityName: l.locality,
                  bookUrl: l.websiteUrl,
                }],
                output: selectedMediaForAction?.url || postToAction.aiOutput,
                description: postToAction.description,
                accessToken: session?.accessToken,
                checkmark: checkmark || postToAction.checkmark,
              };

              const { ok } = await postToGmbAction(payload);
              
              if (ok) {
                 successfulLocs.push({ ...l, isPosted: true });
              } else {
                 failedLocs.push(l);
              }
           } catch (err) {
             console.error(`Failed to post to location ${l.name}`, err);
             failedLocs.push(l);
           }
        }

        // Refund for failed locations
        if (failedLocs.length > 0) {
           const refundAmount = failedLocs.length * 20;
           await deductFromWalletAction(userId, {
              amount: refundAmount,
              type: "credit",
              reason: "Refund-Post-Failed-Partial",
            });
            setUserWallet((prev) => prev + refundAmount);
            emitWalletCredit(refundAmount);
            showToast(`Posted to ${successfulLocs.length}, Failed: ${failedLocs.length}. Refunded ₹${refundAmount}`, "warning");
        } else if (successfulLocs.length > 0) {
           showToast(`Successfully posted to all ${successfulLocs.length} locations! 🎉`);
           setIsSuccess(true);
        }

        if (successfulLocs.length > 0) {
           // Update post status with successful locations only
           await updatePostStatusAction({
              id: postToAction._id,
              userId,
              locations: successfulLocs, // Override with only successful ones
              status: "posted",
              whenPosted: { ...postToAction.whenPosted, gmb: true },
              mediaStatus: {
                [selectedMediaForAction?.type === "video" ? "video" : "image"]: "posted",
              },
            });
            fetchPosts(1, true);
        } else {
           throw new Error("All GMB posts failed");
        }

      } catch (err) {
        showToast(err.message || "Post failed", "error");
      } finally {
        setTimeout(() => {
          setIsPosting(false);
        }, 1200); 

        setPostToAction(null);
        setSelectedMediaForAction(null);
      }
    },
    [
      availableLocations,
      userId,
      postToAction,
      session?.accessToken,
      selectedMediaForAction,
      updateUiState,
      showToast,
      setIsPosting,
      fetchPosts,
    ],
  );

  const handleGmbSessionExpired = () => {
  setShowGmbExpiredModal(true);
};

  const handlePost = useCallback(
    async (post, media = null) => {
      if (!["approved", "scheduled", "posted", "failed"].includes(post.status))
        return showToast("Approve first", "error");

      // Check for GMB Session Expiry before showing the location modal
      if (
  !session ||
  !session.accessToken ||
  session.error === "RefreshAccessTokenError"
) {
  setShowGmbExpiredModal(true);
  return;
}

      const userData = await getUserWalletAction(userId);
      setUserWallet(userData.wallet || 0);
      setPostToAction(post);
      setSelectedMediaForAction(media);
      updateUiState({ showLocationModal: true });
    },
    [userId, updateUiState, showToast, session],
  );

  const handleDeleteLocationConfirm = useCallback(
    async (selectedIds) => {
      updateUiState({ showDeleteLocationModal: false });
      setIsPosting(true);
      try {
        for (const id of selectedIds) {
          const loc = postToAction.locations.find((l) => l.id === id);
          await deletePostFromGmbAction({
            locationIds: loc.locationId,
            acc_id: loc.accountId,
            access_token: session?.accessToken,
          });
        }
        showToast("Deleted!");
        fetchPosts(1, true);
      } finally {
        setIsPosting(false);
        setPostToAction(null);
      }
    },
    [
      postToAction,
      session?.accessToken,
      updateUiState,
      showToast,
      setIsPosting,
      fetchPosts,
    ],
  );

  const handleReject = useCallback(
    (id) => {
      if (confirm("Reject this post?")) {
        setRejectPostId(id);
        updateUiState({ showRejectModal: true });
      }
    },
    [updateUiState],
  );

  const submitRejection = useCallback(async () => {
    if (!rejectReason.trim()) return showToast("Enter reason", "error");
    const res = await updatePostStatusAction({
      id: rejectPostId,
      userId,
      status: "rejected",
      reason: rejectReason,
    });
    if (res.success) {
      showToast("Rejected! ❌");
      setPosts((prev) =>
        prev.map((p) =>
          p._id === rejectPostId ? { ...p, status: "rejected" } : p,
        ),
      );
      updateUiState({ showRejectModal: false });
    }
  }, [rejectPostId, rejectReason, userId, updateUiState, showToast]);

  const handleDownload = useCallback(
    async (post) => {
      try {
        const res = await fetch(
          `/api/downloadImage?url=${encodeURIComponent(post.aiOutput)}`,
        );
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `post-${Date.now()}.jpg`;
        a.click();
      } catch (e) {
        showToast("Download failed", "error");
      }
    },
    [showToast],
  );

  const handleShare = useCallback(
    (post) => {
      if (navigator.share)
        navigator.share({
          title: "Post",
          text: post.description,
          url: post.aiOutput,
        });
      else {
        navigator.clipboard.writeText(post.aiOutput);
        showToast("Copied! 📋");
      }
    },
    [showToast],
  );

  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetch("/api/user-settings").then((r) => r.json());
      if (res.gmbProjects?.length)
        setSelectedBusiness(res.selectedBusiness || res.gmbProjects[0]);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const stored = getLocalStorage("locationDetails");
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.length) setBussinessTitle(p[0].title);
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const bal = getLocalStorage("walletBalance");
    if (bal) setUserWallet(parseInt(bal, 10));
  }, []);

  const messages = [
    "Please wait...",
    "Posting...",
    "Uploading...",
    "Finalizing...",
  ];
  const MESSAGE_INTERVAL = 1500; // text change (1.5 sec)

  useEffect(() => {
    if (!isPosting) return;

    setTimeLeft(20); // 🔥 start from 20
    setMsgIndex(0);

    // countdown (reverse)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // message rotate
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, MESSAGE_INTERVAL);

    return () => {
      clearInterval(timer);
      clearInterval(msgInterval);
    };
  }, [isPosting]);

  useEffect(() => {
  if (!isSuccess) return;

  const t = setTimeout(() => {
    // agar auto close karna hai to yaha likh
    // setIsSuccess(false);
  }, 2000);

  return () => clearTimeout(t);
}, [isSuccess]);

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
        {uiState.toast && (
          <Toast message={uiState.toast.message} type={uiState.toast.type} />
        )}
        {uiState.showLocationModal && (
          <LocationSelectionModal
            locations={availableLocations}
            onClose={() => updateUiState({ showLocationModal: false })}
            onConfirm={handleLocationConfirm}
            title="Post to Locations"
            walletBalance={userWallet}
            isPostAction={true}
          />
        )}
        {uiState.showDeleteLocationModal && (
          <LocationSelectionModal
            locations={postToAction?.locations || []}
            onClose={() => updateUiState({ showDeleteLocationModal: false })}
            onConfirm={handleDeleteLocationConfirm}
            title="Delete from Locations"
            confirmText="Delete"
          />
        )}
        {uiState.showInsufficientBalance && (
          <InsufficientBalanceModal
            walletBalance={userWallet}
            required={requiredCoins}
            onClose={() => updateUiState({ showInsufficientBalance: false })}
            onRecharge={() => (window.location.href = "/wallet")}
          />
        )}
        {uiState.isScheduleModalOpen && (
          <ScheduleModal
            isOpen={uiState.isScheduleModalOpen}
            onClose={() => updateUiState({ isScheduleModalOpen: false })}
            post={postToSchedule}
            onConfirm={handleScheduleDateConfirmed}
            availableLocations={availableLocations}
            facebookPages={socialState.facebookPages}
            instagramAccounts={socialState.instagramAccounts}
            fetchFacebookPages={fetchFacebookPages}
            fetchInstagramAccounts={fetchInstagramAccounts}
            loadingFb={socialState.loadingFbPages}
            loadingIg={socialState.loadingIgAccounts}
            userWallet={userWallet}
            setShowInsufficientBalance={(val) =>
              updateUiState({ showInsufficientBalance: val })
            }
            setRequiredCoins={setRequiredCoins}
          />
        )}
        {uiState.showScheduleConfirmation && (
          <ScheduleConfirmationModal
            isOpen={uiState.showScheduleConfirmation}
            onClose={() => updateUiState({ showScheduleConfirmation: false })}
            scheduledPlatforms={scheduledPlatforms}
          />
        )}
        {uiState.showRejectModal && (
          <RejectReasonModal
            onClose={() => updateUiState({ showRejectModal: false })}
            onSubmit={submitRejection}
            reason={rejectReason}
            setReason={setRejectReason}
          />
        )}
        {uiState.showFacebookModal && (
          <FacebookShareModal
            isOpen={uiState.showFacebookModal}
            onClose={() => updateUiState({ showFacebookModal: false })}
            onConfirm={(p, pg, c) => {
              updateUiState({ showFacebookModal: false });
              handleFacebookPostAction(p, pg, c, selectedMediaForAction);
              setSelectedMediaForAction(null);
            }}
            post={socialState.postToFacebook}
            pages={socialState.facebookPages}
            loading={socialState.loadingFbPages}
          />
        )}
        {uiState.showInstagramModal && (
          <InstagramShareModal
            isOpen={uiState.showInstagramModal}
            onClose={() => updateUiState({ showInstagramModal: false })}
            onConfirm={(p, a, c, igVideoKind) => {
              updateUiState({ showInstagramModal: false });
              handleInstagramPostAction(
                p,
                a,
                c,
                igVideoKind,
                selectedMediaForAction,
              );
              setSelectedMediaForAction(null);
            }}
            post={socialState.postToInstagram}
            accounts={socialState.instagramAccounts}
            loading={socialState.loadingIgAccounts}
          />
        )}
        <ImageToVideoModal
          isOpen={uiState.imageToVideoOpen}
          onClose={() => updateUiState({ imageToVideoOpen: false })}
          initialPost={imageToVideoInitialPost}
          posts={posts}
          selectedBusiness={selectedBusiness}
          bussinessTitle={bussinessTitle}
          availableLocations={availableLocations}
          postPrompt={prompt}
          showToast={showToast}
          videoGenerationCoins={VIDEO_GENERATION_COINS}
          onVideoChargeApplied={() =>
            setUserWallet((p) => p - VIDEO_GENERATION_COINS)
          }
          onVideoInsufficientBalance={() => {
            setRequiredCoins(VIDEO_GENERATION_COINS);
            updateUiState({ showInsufficientBalance: true });
          }}
          onVideoSaved={(s) => {
            setPosts((prev) => [s, ...prev]);
            setPreviewData(s);
          }}
        />
        {uiState.showFirstPostModal && (
          <FirstPostModal
            onClose={() => updateUiState({ showFirstPostModal: false })}
          />
        )}

        {/* gmb post success modal */}
        {(isPosting || isSuccess) && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center px-4 animate-overlayFade">

    <div className="w-full max-w-lg bg-white rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.25)] p-10 flex flex-col items-center text-center relative overflow-hidden animate-modalPop">

      {/* 🔥 TOP GLOW */}
      <div className="absolute -top-24 w-[350px] h-[350px] bg-[#EAB308]/20 blur-[120px] rounded-full"></div>

      {isSuccess ? (
        <>
          {/* ❌ CLOSE BUTTON */}
          <button
            onClick={() => setIsSuccess(false)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 transition"
          >
            ✕
          </button>

          {/* ✅ SUCCESS ICON (ANIMATED TICK) */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>

            <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-green-100 shadow-inner">

              <svg
                className="w-14 h-14 text-green-600 animate-tick"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="tick-path"
                />
              </svg>

            </div>
          </div>

          {/* TITLE */}
         <h3 className="text-2xl font-extrabold text-yellow-400 mb-2">
   Post Published Successfully!
</h3>

<p className="text-sm text-slate-600 mb-6">
  Your content is now live on {postingPlatform}. Sit back and watch the engagement grow 📈
</p>

          {/* DONE BUTTON */}
          <button
            onClick={() => setIsSuccess(false)}
            className="px-6 py-2.5 bg-[#EAB308] text-white rounded-xl font-semibold hover:scale-105 transition shadow-md animate-fadeUp delay-200"
          >
            Done
          </button>
        </>
      ) : (
        <>
          {/* 🔄 LOADING ICON */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[#EAB308]/30 blur-xl animate-pulse"></div>

            <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-[#EAB308]/10 border border-[#EAB308]/30">
              <Send className="w-12 h-12 text-[#EAB308] animate-bounce" />
            </div>
          </div>

          {/* TITLE */}
          <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
            Publishing to {postingPlatform}
          </h3>

          {/* SUBTEXT */}
          <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
            {messages[msgIndex]}{" "}
            <span className="text-[#EAB308] font-semibold">
              ({String(timeLeft).padStart(2, "0")}s)
            </span>
          </p>

          {/* PROGRESS */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-5 relative">
            <div
              className="h-full bg-[#EAB308] transition-all duration-1000"
              style={{
                width: `${((10 - timeLeft) / 10) * 100}%`,
              }}
            ></div>

            <div className="absolute top-0 left-0 h-full w-1/3 bg-white/30 animate-slide"></div>
          </div>

          {/* STEPS */}
          <div className="flex flex-col gap-3 text-sm w-full max-w-sm text-left">

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-slate-700 font-medium">
                Connecting to {postingPlatform}...
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-slate-700 font-medium">
                Uploading your content...
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse"></div>
              <p className="text-slate-500 font-medium">
                Finalizing post<span className="ml-1">{dots}</span>
              </p>
            </div>

          </div>
        </>
      )}

      {/* ✨ ANIMATIONS */}
      <style>
        {`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tickDraw {
          from { stroke-dashoffset: 50; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tick-path {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: tickDraw 0.6s ease forwards;
        }

        .animate-tick {
          animation: popIn 0.3s ease;
        }

        .animate-overlayFade {
          animation: overlayFade 1s ease;
        }

        .animate-modalPop {
          animation: modalPop 0.35s ease;
        }

        .animate-fadeUp {
          animation: fadeUp 1s ease forwards;
        }

        .animate-fadeUp.delay-100 {
          animation-delay: 0.1s;
        }

        .animate-fadeUp.delay-200 {
          animation-delay: 1s;
        }
        `}
      </style>

    </div>
  </div>
)}

        {uiState.showSuccess && (
          <SuccessOverlay
            onComplete={() => updateUiState({ showSuccess: false })}
            postsCount={posts.length}
          />
        )}

        <PostManagementHeader
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
          previewData={previewData}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <div className="lg:col-span-7">
            <PostInput prompt={prompt} setPrompt={setPrompt} onGenerate={handleGenerateClick} onManualPost={handleManualPost} loading={uiState.isGenerating} logo={logo} setLogo={setLogo} assets={userAssets} setUserAssets={setUserAssets} fetchUserAssets={fetchUserAssets} assetId={assetId} showToast={showToast} selectedAssets={selectedAssets} setSelectedAssets={setSelectedAssets} bussinessTitle={bussinessTitle} availableLocations={availableLocations} keywordError={keywordError} />
            {/* <button type="button" onClick={() => updateUiState({ imageToVideoOpen: true })} className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 py-3 font-bold text-amber-900 shadow-sm"><Video className="w-5 h-5" /> Image to Video</button> */}
          </div>
          <div
            className="lg:col-span-5 sticky top-16 z-10 max-h-[75vh] overflow-y-auto"
            ref={previewRef}
          >
            <PreviewSection
              isGenerating={uiState.isGenerating}
              previewData={previewData}
              onDownload={handleDownload}
              countdown={uiState.countdown}
              onUpdateStatus={handleUpdateStatus}
              onReject={handleReject}
              handlePost={handlePost}
              onToggleCheckmark={handleToggleCheckmark}
              onEditDescription={handleEditDescription}
              isConvertingToVideo={
                !!previewData?._id &&
                String(convertingVideoPostId) === String(previewData._id)
              }
              videoConvertCoins={VIDEO_GENERATION_COINS}
              onAutoConvertToVideo={handleAutoConvertToVideo}
              onRequestImageToVideo={() => {
                if (previewData) {
                  setImageToVideoInitialPost(previewData);
                  updateUiState({ imageToVideoOpen: true });
                }
              }}
              handleFacebookPost={handleFacebookPost}
              handleInstagramPost={handleInstagramPost}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              count={tab.count}
            />
          ))}
        </div>

        {uiState.isLoadingPosts ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Lottie
              animationData={animationData}
              loop={true}
              className="w-32 h-32"
            />
            <p className="text-gray-500 mt-4">Loading your creatives...</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 mt-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  scheduleDates={scheduleDates}
                  onDateChange={handleDateChange}
                  handleDownload={handleDownload}
                  handleShare={handleShare}
                  onUpdateStatus={handleUpdateStatus}
                  onReject={handleReject}
                  handlePost={handlePost}
                  onEditDescription={handleEditDescription}
                  handleDeleteFromGMB={handleDeleteFromGMB}
                  onToggleCheckmark={handleToggleCheckmark}
                  handleFacebookPost={handleFacebookPost}
                  handleInstagramPost={handleInstagramPost}
                  onConvertToVideo={handleAutoConvertToVideo}
                  convertingVideoPostId={convertingVideoPostId}
                  videoGenerationCoins={VIDEO_GENERATION_COINS}
                />
              ))}
            </div>
            <div ref={loaderRef} className="h-10 w-full" />
            {uiState.isLoadingMore && (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
              </div>
            )}

            
    {showGmbExpiredModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center px-4 animate-overlayFade">

    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25)] p-8 text-center overflow-hidden animate-modalPop">

      {/* 🔥 TOP GLOW */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#EAB308]/20 blur-[120px] rounded-full animate-glowPulse"></div>

      {/* ICON */}
      <div className="relative mb-6 animate-bounceIn">
        <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gray-800 border-red-200 shadow-inner">
          <span className="text-4xl">⚠️</span>
        </div>
      </div>

      {/* TITLE */}
      <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight animate-fadeUp">
        Connect Your Business First
      </h3>

      {/* SUBTEXT */}
      <p className="text-sm text-slate-600 mb-3 leading-relaxed px-2 animate-fadeUp delay-100">
        Your Google Business account is not connected. Please reconnect your account to continue posting, scheduling, or managing your content.
      </p>

      {/* ERROR LINE */}
      <p className="text-xs text-red-500 font-medium mb-6 animate-fadeUp delay-200">
        ⚠ Google session expired
      </p>

      {/* BUTTONS */}
      <div className="flex gap-3 justify-center animate-fadeUp delay-300">

        <button
          onClick={() => setShowGmbExpiredModal(false)}
          className="px-5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="px-6 py-2 rounded-xl bg-[#EAB308] text-white font-semibold hover:scale-105 transition"
        >
          Connect Business
        </button>

      </div>

      {/* 🔥 BOTTOM LINE */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#EAB308] to-transparent opacity-40"></div>

      {/* ✨ ANIMATIONS */}
      <style>
        {`
        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(30px);
          }
          60% {
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes glowPulse {
          0% { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1.05); }
        }

        .animate-overlayFade {
          animation: overlayFade 0.25s ease;
        }

        .animate-modalPop {
          animation: modalPop 0.4s ease;
        }

        .animate-fadeUp {
          animation: fadeUp 0.4s ease forwards;
        }

        .animate-fadeUp.delay-100 {
          animation-delay: 0.1s;
        }

        .animate-fadeUp.delay-200 {
          animation-delay: 0.2s;
        }

        .animate-fadeUp.delay-300 {
          animation-delay: 0.3s;
        }

        .animate-bounceIn {
          animation: bounceIn 0.4s ease;
        }

        .animate-glowPulse {
          animation: glowPulse 2s ease-in-out infinite alternate;
        }
        `}
      </style>

    </div>
  </div>
)}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border-3 border-dashed border-slate-200 shadow-xl">
            <div className="text-8xl mb-6">📭</div>
            <h3 className="text-xl font-bold mb-2">No posts found</h3>
            <p className="text-slate-900/70">{`No ${activeTab} posts yet`}</p>
          </div>
        )}
      </div>
      {/* <SupportModal showToast={showToast} /> */}
      <WhatsAppButton />
    </div>
  );
}


