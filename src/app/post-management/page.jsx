"use client";

import {
  fetchPostsAction,
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
  deleteAssetAction,
  loadAssetsFromServerAction,
} from "@/app/actions/assetActions";
import { normalizePlatformDescriptions } from "@/utils/aiPostDescriptions";
import { resolveBusinessNameForGeneration } from "@/lib/businessNameFromPayload";

import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  Loader2,
  CheckCircle,
  Clock,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Send,
  XCircle,
  Download,
  Share2,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  ChevronDown,
  MapPin,
  Pencil,
  Facebook,
  Instagram,
  ThumbsUp,
  MessageCircle,
  Wallet,
  Video,
  Film,
} from "lucide-react";

import ScheduleModal from "../../components/post-management/ScheduleModal";
import ScheduleConfirmationModal from "../../components/post-management/ScheduleConfirmationModal";
import FacebookShareModal from "../../components/post-management/FacebookShareModal";
import InstagramShareModal from "../../components/post-management/InstagramShareModal";
import PreviewSection from "../../components/post-management/PreviewSection";
import PostCard from "../../components/post-management/PostCard";

import { useSession } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Toast from "../../components/Toast";
import LocationSelectionModal from "../../components/LocationSelectionModal";
import InsufficientBalanceModal from "../../components/InsufficientBalanceModal";
import LoadingOverlay from "../../components/LoadingOverlay";
import SuccessOverlay from "../../components/SuccessOverlay"; // Corrected import path
import SupportModal from "@/components/SupportModal";
import FirstPostModal from "../../components/FirstPostModal";
import PostInput from "@/components/PostInput";
import ImageToVideoModal from "@/components/post-management/ImageToVideoModal";
import TabButton from "@/components/TabButton";
import RejectReasonModal from "../../components/RejectReasonModal";
import {
  postHasVideoAsset,
  metaPublishMedia,
  looksLikeVideoUrl,
  postImageUrl,
} from "@/lib/postMediaUrls";
import "./PostManagement.module.css";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public

/** Wallet cost per AI image generation (Auto Post / assets flow). */
const AI_IMAGE_GENERATION_COINS = 80;
/** Wallet cost per image → video conversion (auto + modal). */
const VIDEO_GENERATION_COINS = 200;

async function waitForInstagramVideoContainer(
  creationId,
  accessToken,
  maxMs = 120000,
) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const u = new URL(`https://graph.facebook.com/v24.0/${creationId}`);
    u.searchParams.set("fields", "status_code");
    u.searchParams.set("access_token", accessToken);
    const r = await fetch(u.toString());
    const j = await r.json();
    if (j.status_code === "FINISHED") return;
    if (j.status_code === "ERROR" || j.status_code === "EXPIRED") {
      throw new Error(
        j.error?.message || `Instagram processing: ${j.status_code}`,
      );
    }
    await new Promise((res) => setTimeout(res, 4000));
  }
  throw new Error("Instagram video processing timed out.");
}

export default function PostManagementPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const searchParams = useSearchParams();
  const pageId = searchParams.get("pageId");
  const [countdown, setCountdown] = useState(0);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userWallet, setUserWallet] = useState(0);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const { slug } = useParams();
  const { data: session } = useSession();

  const [posts, setPosts] = useState([]);
  // console.log("Post in Post Manegement", posts);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("total");
  const [prompt, setPrompt] = useState("");
  const [scheduleDates, setScheduleDates] = useState({});
  const [logo, setLogo] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [postsGeneratedCount, setPostsGeneratedCount] = useState(0);
  const [showFirstPostModal, setShowFirstPostModal] = useState(false);

  const [userAssets, setUserAssets] = useState([]);
  const [rejectPostId, setRejectPostId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [postToAction, setPostToAction] = useState(null);
  const [showDeleteLocationModal, setShowDeleteLocationModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false); // Moved here from PostCard
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState(null);
  const [scheduledDateForLocations, setScheduledDateForLocations] =
    useState(null); // New state for selected date
  const [previewData, setPreviewData] = useState(null);
  const [lastUsedAssetsFlow, setLastUsedAssetsFlow] = useState(false);
  const [showScheduleConfirmation, setShowScheduleConfirmation] =
    useState(false);
  const [scheduledPlatforms, setScheduledPlatforms] = useState({
    gmb: [],
    fb: [],
    ig: [],
  });

  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [facebookPages, setFacebookPages] = useState([]);
  const [loadingFbPages, setLoadingFbPages] = useState(false);
  const [postToFacebook, setPostToFacebook] = useState(null);

  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [loadingIgAccounts, setLoadingIgAccounts] = useState(false);
  const [postToInstagram, setPostToInstagram] = useState(null);

  const [assetId, setAssetId] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const previewRef = useRef(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [availableBusinesses, setAvailableBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [bussinessTitle, setBussinessTitle] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "gmb",
    "fb",
    "ig",
  ]);
  const [keywordError, setKeywordError] = useState("");
  const [imageToVideoOpen, setImageToVideoOpen] = useState(false);
  const [imageToVideoInitialPost, setImageToVideoInitialPost] = useState(null);
  /** Post _id currently running one-click / card video conversion (loading UI). */
  const [convertingVideoPostId, setConvertingVideoPostId] = useState(null);
  const [showVoiceSetupModal, setShowVoiceSetupModal] = useState(false);
  const [voiceSetupPost, setVoiceSetupPost] = useState(null);
  const [voiceUrlInput, setVoiceUrlInput] = useState("");
  const [voiceVideoDuration, setVoiceVideoDuration] = useState(5);
  const [videoCountdown, setVideoCountdown] = useState(0);
  const [useOwnVoice, setUseOwnVoice] = useState(false);

  // Helper to strip base64 prefix
  const stripBase64 = (str) => {
    if (typeof str === "string" && str.includes("base64,")) {
      return str.split("base64,")[1];
    }
    return str;
  };

  // Load locations from localStorage
  const [availableLocations, setAvailableLocations] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("locationDetails");
    if (stored) {
      try {
        const parsedLocations = JSON.parse(stored);
        // Transform the data to match the expected format
        const formattedLocations = parsedLocations.map((loc, index) => ({
          id: loc.id || index + 1,
          name: loc.name || loc.title || `Location ${index + 1}`,
          address:
            loc.address ||
            loc.storefrontAddress?.addressLines?.join(", ") ||
            "Address not available",
          city: loc.city || "",
          ...loc,
        }));
        setAvailableLocations(formattedLocations);
      } catch (err) {
        console.error("Invalid JSON in localStorage:", err);
        // Fallback to empty array if parsing fails
        setAvailableLocations([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!previewData && posts.length > 0 && !isGenerating) {
      setPreviewData(posts[0]);
    }
  }, [posts, previewData, isGenerating]);

  useEffect(() => {
    if (previewData && posts.length > 0) {
      const updatedPost = posts.find((p) => p._id === previewData._id);
      if (updatedPost && updatedPost !== previewData) {
        setPreviewData(updatedPost);
      }
    }
  }, [posts, previewData]);

  const fetchUserAssets = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const result = await loadAssetsFromServerAction(userId);

      if (result.success && result.data.length > 0) {
        const latestAssets = result.data[0];
        setAssetId(latestAssets._id);

        const productImagesArray = Array.isArray(latestAssets.productImage)
          ? latestAssets.productImage
          : latestAssets.productImage
            ? [latestAssets.productImage]
            : [];

        const imageAssets = [
          { name: "Logo", url: latestAssets.logoImage || "" },
          { name: "Character", url: latestAssets.characterImage || "" },
          { name: "Product", url: latestAssets.productImage || "" },
          { name: "Uniform", url: latestAssets.uniformImage || "" },
          { name: "Background", url: latestAssets.backgroundImage || "" },
          { name: "Size", url: latestAssets.size || "" },
          { name: "Color", url: latestAssets.colourPalette || "" },
        ];

        setUserAssets(imageAssets);
      } else {
        // If no assets are found, set default assets for the UI
        setUserAssets([
          { name: "Character", url: "" },
          { name: "Product", url: "" },
          { name: "Uniform", url: "" },
          { name: "Background", url: "" },
          { name: "Logo", url: "" },
          { name: "Size", url: "3:4" }, // Default aspect ratio
          { name: "Color", url: "" }, // Default color palette
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch user assets:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserAssets();
  }, [fetchUserAssets]);

  useEffect(() => {
    const platforms =
      selectedPlatforms.length > 0 ? selectedPlatforms : ["gmb"];
    let size = "16:9";

    if (platforms.includes("fb") || platforms.includes("ig")) {
      size = "3:4";
    }

    setUserAssets((prev) => {
      // Prevent update if size hasn't changed to avoid resetting selection
      const currentSizeAsset = prev.find((a) => a.name === "Size");
      if (currentSizeAsset && currentSizeAsset.url === size) {
        return prev;
      }

      const newAssets = prev.map((a) =>
        a.name === "Size" ? { ...a, url: size } : a,
      );

      // Preserve the user's selection by mapping previous selection to new asset objects
      setSelectedAssets((currentSelected) => {
        const selectedNames = new Set(currentSelected.map((s) => s.name));
        return newAssets.filter((a) => selectedNames.has(a.name));
      });

      return newAssets;
    });
  }, [selectedPlatforms]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [allCounts, setAllCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    scheduled: 0,
    posted: 0,
    rejected: 0,
    videos: 0,
  });

  const tabs = [
    {
      id: "total",
      label: "Total Posts",
      shortLabel: "Total",
      icon: ImageIcon,
      count: allCounts.total,
    },
    {
      id: "pending",
      label: "Pending",
      shortLabel: "Pending",
      icon: Clock,
      count: allCounts.pending,
    },
    {
      id: "approved",
      label: "Approved",
      shortLabel: "Approved",
      icon: CheckCircle,
      count: allCounts.approved,
    }, // Corrected icon
    {
      id: "rejected",
      label: "Rejected",
      shortLabel: "Rejected",
      icon: XCircle,
      count: allCounts.rejected,
    },
    {
      id: "scheduled",
      label: "Scheduled",
      shortLabel: "Scheduled",
      icon: Calendar,
      count: allCounts.scheduled,
    },
    {
      id: "posted",
      label: "Posted",
      shortLabel: "Posted",
      icon: Send,
      count: allCounts.posted,
    },
    {
      id: "videos",
      label: "Videos",
      shortLabel: "Videos",
      icon: Film,
      count: allCounts.videos,
    },
  ];

  const fetchPosts = async (isBackground = false) => {
    if (!isBackground) setIsLoadingPosts(true);
    try {
      const userId = localStorage.getItem("userId");
      const allPostsData = await fetchAllPostsAction(userId);

      if (allPostsData.success) {
        let allPosts = allPostsData.data;

        // Check for stuck processing posts (scheduled date passed by > 1 hour)
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const stuckPosts = allPosts.filter(
          (post) =>
            post.status === "processing" &&
            post.scheduledDate &&
            new Date(post.scheduledDate) < oneHourAgo,
        );

        if (stuckPosts.length > 0) {
          await Promise.all(
            stuckPosts.map((post) =>
              updatePostStatusAction({
                id: post._id,
                userId,
                status: "failed",
                error: "Processing timeout: Schedule time passed by 1 hour",
              }),
            ),
          );

          // Update local state to reflect changes immediately
          allPosts = allPosts.map((post) => {
            if (stuckPosts.find((sp) => sp._id === post._id)) {
              return {
                ...post,
                status: "failed",
                error: "Processing timeout: Schedule time passed by 1 hour",
              };
            }
            return post;
          });
        }

        setPosts(allPosts);

        setAllCounts({
          total: allPosts.filter((p) => p.status !== "rejected").length,
          approved: allPosts.filter((p) => p.status === "approved").length,
          pending: allPosts.filter((p) => p.status === "pending").length,
          scheduled: allPosts.filter((p) => p.status === "scheduled").length,
          posted: allPosts.filter((p) => p.status === "posted").length,
          rejected: allPosts.filter((p) => p.status === "rejected").length,
          videos: allPosts.filter((p) => postHasVideoAsset(p)).length,
        });

        // Show magic modal if no posts exist
        if (allPosts.length === 0) {
          setShowFirstPostModal(true);
        }
      } else {
        throw new Error(allPostsData.error || "Failed to fetch posts");
      }
    } catch (err) {
      showToast(err.message || "Error fetching posts", "error");
    } finally {
      if (!isBackground) setIsLoadingPosts(false);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const handleGenerateClick = async (
    selectedAssets,
    useAssetsFlow,
    businessName,
    keywords,
    generateOptions = {},
  ) => {
    const mode = generateOptions.mode === "manual" ? "manual" : "ai";
    const instructionsRaw =
      typeof generateOptions.instructions === "string"
        ? generateOptions.instructions
        : "";
    const includeInstructionsInPrompt =
      !!generateOptions.includeInstructionsInPrompt;

    const effectivePrompt =
      includeInstructionsInPrompt && instructionsRaw.trim()
        ? `${prompt.trim()}\n\nInstructions:\n${instructionsRaw.trim()}`
        : prompt;

    const resolvedBusinessName = resolveBusinessNameForGeneration({
      fromInput: typeof businessName === "string" ? businessName : "",
      selectedBusinessName: selectedBusiness?.name,
      bussinessTitle,
      availableLocations,
      prompt: effectivePrompt,
    });

    // Auto-scroll to preview section on mobile
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 1024 &&
      previewRef.current
    ) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Validate keywords
    let processedKeywords = "";
    let hasKeywords = false;

    if (Array.isArray(keywords)) {
      if (keywords.length > 0) hasKeywords = true;
      processedKeywords = keywords.join(", ");
    } else if (typeof keywords === "string") {
      if (keywords.trim()) hasKeywords = true;
      processedKeywords = keywords;
    } else if (keywords) {
      hasKeywords = true;
      processedKeywords = String(keywords);
    }

    if (mode !== "manual" && !hasKeywords) {
      setKeywordError("Please fill at least one keyword");
      return;
    }
    setKeywordError("");

    setLastUsedAssetsFlow(useAssetsFlow);
    const genPayload = {
      effectivePrompt,
      mode,
      instructions: instructionsRaw,
    };
    if (useAssetsFlow) {
      await handleImageGenerateWithAssets(
        selectedAssets,
        resolvedBusinessName,
        processedKeywords,
        genPayload,
      );
    } else {
      await handleAiAgent(selectedAssets, genPayload);
    }
  };

  const handleManualPost = async ({ image, description }) => {
    console.log("🛠️ handleManualPost Started", { hasImage: !!image, description });
    const userId = localStorage.getItem("userId");
    try {
      setIsGenerating(true);

      let imageUrl = image;

      if (
        (typeof image === "string" && image.startsWith("data:")) ||
        (typeof image === "object" && image !== null)
      ) {
        console.log("🛠️ Image detected, preparing FormData...");
        const formData = new FormData();

        if (typeof image === "string" && image.startsWith("data:")) {
          // Convert base64 to File object
          const arr = image.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const file = new File([u8arr], "manual_upload.png", { type: mime });
          formData.append("file", file);
          console.log("🛠️ Appended Base64 file to FormData", file.name, file.type);
        } else {
          // It's already a File/Blob object
          formData.append("file", image);
          console.log("🛠️ Appended Object file to FormData");
        }

        console.log("🛠️ Calling uploadToS3Action...");
        const uploadResult = await uploadToS3Action(formData);
        console.log("🛠️ uploadToS3Action Result:", uploadResult);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload image to S3");
        }

        imageUrl = uploadResult.url;
        console.log("🛠️ Upload successful, imageUrl:", imageUrl);
      }

      console.log("🛠️ Calling savePostAction...");
      // Save Post
      const savedPostResponse = await savePostAction({
        userId,
        aiOutput: imageUrl,
        description: description,
        logoUrl: null,
        status: "pending",
        promat: "Manual Upload",
        locations: [],
      });

      console.log("🛠️ savePostAction Result:", savedPostResponse);

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
      }));
      setPreviewData(savedPost);
      showToast("Manual Post Created Successfully! 🎉");
      console.log("🛠️ Manual Post flow completed successfully");
    } catch (error) {
      console.error("🛠️ Manual Post Error:", error);
      showToast(error.message || "Failed to create post!", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAgent = async (selectedAssets = [], genOptions = {}) => {
    const effectivePrompt = genOptions.effectivePrompt ?? prompt;
    const mode = genOptions.mode ?? "ai";
    const instructionsField = genOptions.instructions ?? "";

    if (!effectivePrompt.trim()) {
      showToast("Please enter a prompt before generating!", "error");
      return;
    }

    const userId = localStorage.getItem("userId");

    try {
      const userData = await getUserWalletAction(userId);
      const walletBalance = userData.wallet || 0;
      setUserWallet(walletBalance);

      if (walletBalance < AI_IMAGE_GENERATION_COINS) {
        setRequiredCoins(AI_IMAGE_GENERATION_COINS);
        setShowInsufficientBalance(true);
        return;
      }

      // Start AI generation process
      setIsGenerating(true);
      setAiResponse(null);
      setCountdown(59);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Convert logo to base64 if provided
      let logoBase64 = null;
      if (logo) {
        logoBase64 = await fileToBase64(logo);
      }

      // Prepare assets with stripped base64
      const strippedLogo = stripBase64(logoBase64);
      const strippedAssets = selectedAssets.map((asset) => ({
        ...asset,
        url: stripBase64(asset.url),
      }));

      // Call AI Agent API (single generation, not per location)
      const apiResponse = await generateWithAiAgentAction(
        effectivePrompt,
        strippedLogo,
        strippedAssets,
        { mode, instructions: instructionsField },
      );

      clearInterval(timer);

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || "AI agent failed.");
      }

      const data = apiResponse.data || {};
      console.log("datadatadata", data);

      console.log("datadata", data);

      const {
        gmb_des: gmbDesc,
        fb_des: fbDesc,
        ig_des: igDesc,
      } = normalizePlatformDescriptions(
        Object.assign(
          {},
          typeof apiResponse === "object" && apiResponse ? apiResponse : {},
          data,
        ),
      );

      const walletData = await deductFromWalletAction(userId, {
        amount: AI_IMAGE_GENERATION_COINS,
        type: "deduct",
        reason: "image_generated",
        metadata: {
          aiPrompt: effectivePrompt,
          logoUsed: !!logo,
        },
      });

      if (walletData.error) {
        console.warn("Wallet deduction failed:", walletData.error);
        showToast(walletData.error, "error");
      } else {
        showToast(
          `${AI_IMAGE_GENERATION_COINS} coins deducted for AI image generation ✅`,
          "success",
        );
        setUserWallet((prev) => Math.max(0, prev - AI_IMAGE_GENERATION_COINS));
      }

      let finalDescription = data.description;
      if (!finalDescription) {
        finalDescription = gmbDesc || fbDesc || igDesc || "Generated Content";
      }

      // Save Post Immediately
      const savedPostResponse = await savePostAction({
        userId,
        aiOutput: data.output,
        description: finalDescription,
        gmbDescription: gmbDesc,
        fbDescription: fbDesc,
        igDescription: igDesc,
        logoUrl: data.logoUrl,
        status: "pending",
        promat: data.user_input || effectivePrompt,
        locations: [],
      });

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
      }));
      setPreviewData(savedPost);
      showToast("Post Generated & Saved Successfully! 🎉");

      // Don't clear prompt/logo yet in case user wants to regenerate with tweaks
      setSelectedAssets([]);
      setCountdown(0);
    } catch (error) {
      console.error("Generation Error:", error);
      showToast(error.message || "Failed to generate AI post!", "error");
    } finally {
      setIsGenerating(false);
      setCountdown(0);
    }
  };

  const handleImageGenerateWithAssets = async (
    selectedAssets = [],
    businessName,
    keywords,
    genOptions = {},
  ) => {
    const effectivePrompt = genOptions.effectivePrompt ?? prompt;
    const mode = genOptions.mode ?? "ai";
    const instructionsField = genOptions.instructions ?? "";

    if (!effectivePrompt.trim()) {
      showToast("Please enter a prompt before generating!", "error");
      return;
    }

    const userId = localStorage.getItem("userId");
    try {
      const userData = await getUserWalletAction(userId);
      const walletBalance = userData.wallet || 0;
      setUserWallet(walletBalance);

      if (walletBalance < AI_IMAGE_GENERATION_COINS) {
        setRequiredCoins(AI_IMAGE_GENERATION_COINS);
        setShowInsufficientBalance(true);
        return;
      }

      // Start AI generation process
      setIsGenerating(true);
      setAiResponse(null);
      setCountdown(120);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Convert logo to base64 if provided
      let logoBase64 = null;
      if (logo) {
        logoBase64 = await fileToBase64(logo);
      }

      const effectiveBussinessName = resolveBusinessNameForGeneration({
        fromInput: businessName,
        selectedBusinessName: selectedBusiness?.name,
        bussinessTitle,
        availableLocations,
        prompt: effectivePrompt,
      });

      // Call the asset generation API (bussiness_name must match /api/aiAssetsGenerate)
      const apiResponse = await generateWithAssetsAction({
        topic: effectivePrompt,
        bussiness_name: effectiveBussinessName,
        keywords: keywords || "",
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
        platform:
          selectedPlatforms.length > 0 ? selectedPlatforms.join(",") : "gmb",
        mode,
        instructions: instructionsField,
      });

      console.log("apiResponseapiResponse", apiResponse);


      (timer);

      // The direct response from n8n is now the data we need
      if (apiResponse.status !== "true" && !apiResponse.success) {
        throw new Error(
          apiResponse.error ||
          apiResponse.message ||
          "AI asset generation failed.",
        );
      }

      const data = apiResponse.success ? apiResponse.data : apiResponse;

      const {
        gmb_des: gmbDesc,
        fb_des: fbDesc,
        ig_des: igDesc,
      } = normalizePlatformDescriptions(
        Object.assign(
          {},
          typeof apiResponse === "object" && apiResponse ? apiResponse : {},
          data,
        ),
      );

      const walletData = await deductFromWalletAction(userId, {
        amount: AI_IMAGE_GENERATION_COINS,
        type: "deduct",
        reason: "image_generated",
        metadata: {
          aiPrompt: effectivePrompt,
          logoUsed: !!logo,
        },
      });

      if (walletData.error) {
        console.warn("Wallet deduction failed:", walletData.error);
        showToast(walletData.error, "error");
      } else {
        showToast(
          `${AI_IMAGE_GENERATION_COINS} coins deducted for AI image generation ✅`,
          "success",
        );
        setUserWallet((prev) => Math.max(0, prev - AI_IMAGE_GENERATION_COINS));
      }

      let finalDescription = data.description;
      if (!finalDescription) {
        if (selectedPlatforms.includes("gmb") && gmbDesc)
          finalDescription = gmbDesc;
        else if (selectedPlatforms.includes("fb") && fbDesc)
          finalDescription = fbDesc;
        else if (selectedPlatforms.includes("ig") && igDesc)
          finalDescription = igDesc;
        else
          finalDescription = gmbDesc || fbDesc || igDesc || "Generated Content";
      }

      // Save Post Immediately
      const savedPostResponse = await savePostAction({
        userId,
        aiOutput: data.output || data.output,
        description: finalDescription,
        gmbDescription: gmbDesc,
        fbDescription: fbDesc,
        igDescription: igDesc,
        logoUrl: data.logoUrl,
        status: "pending",
        promat: data.user_input || effectivePrompt,
        locations: [],
      });

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
      }));
      setPreviewData(savedPost);
      showToast("Post Generated & Saved Successfully! 🎉");

      setCountdown(0);
    } catch (error) {
      console.error("Generation Error:", error);
      showToast(error.message || "Failed to generate AI post!", "error");
    } finally {
      setIsGenerating(false);
      setCountdown(0);
    }
  };

  const handleDateChange = (id, value) => {
    setScheduleDates((prev) => ({ ...prev, [id]: value }));
  };

  // Handler for when a date is confirmed in the ScheduleModal
  const handleScheduleDateConfirmed = async (
    postId,
    status,
    selectedDate,
    selectedTargets,
  ) => {
    const post = posts.find((p) => p._id === postId);
    if (!post) {
      showToast("Post not found for scheduling.", "error");
      return;
    }

    // Normalize checkmark payload
    const checkmarkSource = post?.checkmark;
    let checkmarkPayload = "both"; // Default
    if (Array.isArray(checkmarkSource)) {
      if (checkmarkSource.includes("post") && checkmarkSource.includes("photo"))
        checkmarkPayload = "both";
      else if (checkmarkSource.includes("photo")) checkmarkPayload = "photo";
      else if (checkmarkSource.includes("post")) checkmarkPayload = "post";
    } else if (
      typeof checkmarkSource === "string" &&
      checkmarkSource !== "$undefined"
    ) {
      checkmarkPayload = checkmarkSource;
    }

    const sources = [];
    if (selectedTargets.gmb?.length > 0) sources.push("gmb");
    if (selectedTargets.fb?.length > 0) sources.push("fb");
    if (selectedTargets.ig?.length > 0) sources.push("ig");

    const scheduledDateSource = sources; // Keep as array, not joined string

    const selectedGmbLocations =
      selectedTargets.gmb?.length > 0
        ? availableLocations.filter((loc) =>
          selectedTargets.gmb.includes(loc.id),
        )
        : [];

    const selectedFbPages =
      selectedTargets.fb?.length > 0
        ? facebookPages
          .filter((p) => selectedTargets.fb.includes(p.pageId))
          .map((p) => ({
            userId: post.userId,
            pageId: p.pageId,
            pageAccessToken: p.pageAccessToken,
            caption: post.fbDescription || post.description,
            imageUrl: post.aiOutput,
          }))
        : [];

    const selectedIgPages =
      selectedTargets.ig?.length > 0
        ? instagramAccounts
          .filter((a) => selectedTargets.ig.includes(a.igId))
          .map((a) => ({
            userId: post.userId,
            igUserId: a.igId,
            accessToken: a.pageAccessToken,
            caption: post.igDescription || post.description,
            imageUrl: post.aiOutput,
          }))
        : [];

    if (sources.length > 0) {
      // Store platforms for confirmation modal
      setScheduledPlatforms({
        gmb: selectedGmbLocations,
        fb: selectedFbPages,
        ig: selectedIgPages,
      });

      await handleUpdateStatus(
        postId,
        "scheduled",
        selectedDate,
        selectedGmbLocations,
        checkmarkPayload,
        scheduledDateSource,
        selectedFbPages,
        selectedIgPages,
      );

      setIsScheduleModalOpen(false);
      setShowScheduleConfirmation(true);
    } else {
      showToast("Please select at least one platform to schedule.", "error");
      return;
    }
  };

  const handleUpdateStatus = async (
    postOrId,
    newStatus,
    scheduleDate = null,
    locations = [],
    checkmark = undefined,
    scheduledDateSource = null,
    facebookPages = [],
    instagramAccounts = [],
  ) => {
    console.log("📍 Locations:", locations);
    console.log("✅ Checkmark:", checkmark);

    const postId = typeof postOrId === "string" ? postOrId : postOrId._id;

    // 🔹 Open schedule modal
    if (typeof postOrId === "object" && !newStatus) {
      setPostToSchedule(postOrId);
      setIsScheduleModalOpen(true);
      return;
    }

    const userId = localStorage.getItem("userId");

    // When scheduling, we must have a refresh token to pass to the backend.
    if (newStatus === "scheduled" && !session?.refreshToken) {
      showToast(
        "Please connect first Bussiness Account or  log in again to schedule posts.",
        "error",
      );
      return;
    }

    try {
      // Deduplicate locations based on locationId to ensure unique targets
      const uniqueLocations = Array.isArray(locations)
        ? Array.from(
          new Map(locations.map((item) => [item.locationId, item])).values(),
        )
        : [];

      // 🔹 NORMALIZED PAYLOAD
      let payload = {
        id: postId,
        userId,
        status: newStatus,
        scheduledDate: scheduleDate || null,
        checkmark: checkmark,
        refreshToken:
          newStatus === "scheduled" ? session?.refreshToken : undefined,
        locations: uniqueLocations,
        scheduledDateSource: scheduledDateSource,
        fbPages: facebookPages,
        igPages: instagramAccounts,
      };

      if (newStatus === "scheduled") {
        const locationData = uniqueLocations.map((loc) => ({
          city: loc.locationId,
          cityName: loc.locality,
          bookUrl: loc.websiteUrl || "",
        }));

        payload.locationData = locationData;
        payload.account =
          uniqueLocations.length > 0 ? uniqueLocations[0].accountId : "";
      }

      const res = await updatePostStatusAction(payload);
      console.log("resresres", res);

      if (!res?.success) {
        showToast(res?.error || "Failed to update post", "error");
        return;
      }

      showToast("Post Updated Successfully! ✅");

      // 🔹 Update local state correctly
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
              ...p,
              status: newStatus,
              scheduledDate: res.data?.scheduledDate || scheduleDate,
              locations: res.data?.locations || locations,
              checkmark: res.data?.checkmark ?? checkmark,
              scheduledDateSource:
                res.data?.scheduledDateSource || scheduledDateSource,
            }
            : p,
        ),
      );

      await fetchPosts(activeTab);
    } catch (error) {
      console.error("❌ Update Error:", error);
      showToast("Error updating post", "error");
    }
  };

  const handleToggleCheckmark = async (id, type) => {
    const post = posts.find((p) => p._id === id);
    if (!post) return;

    let current = post.checkmark || "post";
    // Handle legacy array case if any
    if (Array.isArray(current)) {
      if (current.includes("post") && current.includes("photo"))
        current = "both";
      else if (current.includes("photo")) current = "photo";
      else current = "post";
    }

    let isPost = current === "both" || current === "post";
    let isPhoto = current === "both" || current === "photo";

    if (type === "post") isPost = !isPost;
    if (type === "photo") isPhoto = !isPhoto;

    // Enforce at least one selected (default to post if both unchecked)
    if (!isPost && !isPhoto) {
      if (type === "post") isPost = true;
      else if (type === "photo") isPhoto = true;
    }

    let newVal = "post";
    if (isPost && isPhoto) newVal = "both";
    else if (isPhoto) newVal = "photo";
    else if (isPost) newVal = "post";

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, checkmark: newVal } : p)),
    );

    try {
      await updatePostStatusAction({
        id,
        userId: localStorage.getItem("userId"),
        checkmark: newVal,
      });
    } catch (e) {
      showToast("Failed to update selection", "error");
    }
  };

  const fetchFacebookPages = async () => {
    if (facebookPages.length > 0) return;
    setLoadingFbPages(true);
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`/api/facebook/pages?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setFacebookPages(data.pages);
      } else {
        showToast("Failed to fetch Facebook pages", "error");
      }
    } catch (err) {
      console.error("Error fetching FB pages:", err);
      showToast("Error fetching Facebook pages", "error");
    } finally {
      setLoadingFbPages(false);
    }
  };

  const handleFacebookPost = (post) => {
    setPostToFacebook(post);
    setShowFacebookModal(true);
    fetchFacebookPages();
  };

  const submitFacebookPost = async (post, pageData, caption) => {
    setShowFacebookModal(false);

    const media = metaPublishMedia(post);
    if (!caption?.trim() && !media.url) {
      showToast("Post content is empty.", "error");
      return;
    }

    try {
      showToast("Publishing to Facebook...", "success");

      const pageId = pageData.pageId;
      const accessToken = pageData.pageAccessToken;

      let facebookPostId;

      if (media.type === "video" && media.url) {
        let videoId = null;
        const isHttpVideo =
          typeof media.url === "string" &&
          /^https?:\/\//i.test(media.url.trim());

        if (isHttpVideo) {
          try {
            const proxyRes = await fetch("/api/facebook/upload-video", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoUrl: media.url.trim(),
                pageId,
                accessToken,
                description: caption || "",
              }),
            });
            const proxyJson = await proxyRes.json().catch(() => ({}));
            if (proxyRes.ok && proxyJson.success && proxyJson.id) {
              videoId = proxyJson.id;
            }
          } catch {
            /* fall through to file_url */
          }
        }

        if (!videoId) {
          const videoRes = await fetch(
            `https://graph.facebook.com/v24.0/${pageId}/videos`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file_url: media.url,
                description: caption || "",
                access_token: accessToken,
              }),
            },
          );
          const videoData = await videoRes.json();
          if (!videoData.id) {
            throw new Error(
              videoData.error?.message || "Failed to publish video to Facebook",
            );
          }
          videoId = videoData.id;
        }
        facebookPostId = videoId;
      } else if (media.type === "image" && media.url) {
        const imageUrl = media.url;
        // 1. Upload photo without publishing (published=false)
        const photoUrl = `https://graph.facebook.com/v24.0/${pageId}/photos`;
        const photoPayload = {
          url: imageUrl,
          published: false,
          access_token: accessToken,
        };

        const photoRes = await fetch(photoUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(photoPayload),
        });

        const photoData = await photoRes.json();

        if (!photoData.id) {
          throw new Error(
            photoData.error?.message || "Failed to upload photo to Facebook",
          );
        }

        const photoId = photoData.id;

        // 2. Publish to Feed with attached photo
        const feedUrl = `https://graph.facebook.com/v24.0/${pageId}/feed`;
        const feedPayload = {
          message: caption || "",
          attached_media: [{ media_fbid: photoId }],
          access_token: accessToken,
        };

        const feedRes = await fetch(feedUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedPayload),
        });

        const feedData = await feedRes.json();

        if (!feedData.id) {
          throw new Error(
            feedData.error?.message ||
            "Failed to publish post to Facebook Feed",
          );
        }

        facebookPostId = feedData.id;
      } else {
        // Direct call to Facebook Graph API for Feed
        const graphUrl = `https://graph.facebook.com/v24.0/${pageId}/feed`;
        const payload = {
          message: caption || "",
          access_token: accessToken,
        };

        const res = await fetch(graphUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!data.id) {
          throw new Error(data.error?.message || "Failed to post to Facebook");
        }
        facebookPostId = data.id;
      }

      showToast("Post published on Facebook 🎉", "success");

      // Send post published email notification for Facebook
      try {
        const pageName = pageData.pageName || "Facebook Page";

        const emailResponse = await fetch("/api/send-post-published-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: localStorage.getItem("userId"),
            platform: "Facebook",
            businessName: pageName,
            locationName: pageName,
            postUrl: metaPublishMedia(post).url || post.aiOutput,
          }),
        });

        const emailResult = await emailResponse.json();
        if (emailResult.success) {
          console.log("📧 Facebook post published email sent successfully");
        }
      } catch (emailError) {
        console.log(
          "⚠️ Error sending Facebook post published email:",
          emailError.message,
        );
      }

      await updatePostStatusAction({
        id: post._id,
        userId: localStorage.getItem("userId"),
        facebookPostId: facebookPostId,
        facebookPageAccessToken: accessToken,
        status: "posted",
        whenPosted: { ...post.whenPosted, facebook: true },
      });
      await fetchPosts(true); // Refresh posts to get the updated data
    } catch (err) {
      console.error("Facebook post error:", err);
      showToast(
        err.message || "Something went wrong posting to Facebook",
        "error",
      );
    }
  };

  const fetchInstagramAccounts = async () => {
    if (instagramAccounts.length > 0) return;

    setLoadingIgAccounts(true);

    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch(`/api/instagram/pages?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setInstagramAccounts(data.pages);
      } else {
        showToast("Failed to fetch Instagram accounts", "error");
      }
    } catch (err) {
      console.error("Error fetching IG accounts:", err);
      showToast("Error fetching Instagram accounts", "error");
    } finally {
      setLoadingIgAccounts(false);
    }
  };

  const handleInstagramPost = (post) => {
    setPostToInstagram(post);
    setShowInstagramModal(true);
    fetchInstagramAccounts();
  };

  const submitInstagramPost = async (post, accountData, caption) => {
    setShowInstagramModal(false);

    const media = metaPublishMedia(post);
    if (!media.url) {
      showToast("Post has no media to share.", "error");
      return;
    }

    try {
      showToast("Publishing to Instagram...", "success");

      const igUserId = accountData.igId;
      const accessToken = accountData.pageAccessToken;

      // Step 1: Create Media Container
      const mediaContainerUrl = `https://graph.facebook.com/v24.0/${igUserId}/media`;
      const mediaContainerPayload =
        media.type === "video"
          ? {
            video_url: media.url,
            caption: caption || "",
            media_type: "REELS",
            access_token: accessToken,
          }
          : {
            image_url: media.url,
            caption: caption || "",
            access_token: accessToken,
          };
      const mediaRes = await fetch(mediaContainerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaContainerPayload),
      });
      const mediaData = await mediaRes.json();

      if (!mediaData.id) {
        console.error("Instagram API Error (Media Container):", mediaData);
        throw new Error(
          mediaData.error?.message ||
          "Failed to create Instagram media container.",
        );
      }

      // Step 2: Wait for processing (longer for video)
      if (media.type === "video") {
        await waitForInstagramVideoContainer(mediaData.id, accessToken);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      const publishUrl = `https://graph.facebook.com/v24.0/${igUserId}/media_publish`;
      const publishPayload = {
        creation_id: mediaData.id,
        access_token: accessToken,
      };
      const publishRes = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishPayload),
      });
      const publishData = await publishRes.json();

      if (publishData.id) {
        showToast("Post published on Instagram 🎉", "success");

        // Send post published email notification for Instagram
        try {
          const igUsername = accountData.igUsername || "Instagram Account";

          const emailResponse = await fetch("/api/send-post-published-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: localStorage.getItem("userId"),
              platform: "Instagram",
              businessName: igUsername,
              locationName: igUsername,
              postUrl: media.url || post.aiOutput,
            }),
          });

          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            console.log("📧 Instagram post published email sent successfully");
          }
        } catch (emailError) {
          console.log(
            "⚠️ Error sending Instagram post published email:",
            emailError.message,
          );
        }

        await updatePostStatusAction({
          id: post._id,
          userId: localStorage.getItem("userId"),
          status: "posted",
          whenPosted: { ...post.whenPosted, instagram: true },
        });
        await fetchPosts(true);
      } else
        throw new Error(
          publishData.error?.message || "Failed to publish to Instagram.",
        );
    } catch (err) {
      console.error("Instagram post error:", err);
      showToast(err.message, "error");
    }
  };

  /** One-click: convert post image to video and attach MP4 on same post. */
  const handleAutoConvertToVideo = async (post, options = {}) => {
    const userId = localStorage.getItem("userId");
    if (!userId || !post?._id) return;

    if (postHasVideoAsset(post)) {
      showToast("This post already has a video.", "info");
      return;
    }

    const source = postImageUrl(post);
    if (!source) {
      showToast("No still image on this post to convert.", "error");
      return;
    }

    const userWalletData = await getUserWalletAction(userId);
    const balance = userWalletData.wallet || 0;
    setUserWallet(balance);
    if (balance < VIDEO_GENERATION_COINS) {
      setRequiredCoins(VIDEO_GENERATION_COINS);
      setShowInsufficientBalance(true);
      return;
    }

    setConvertingVideoPostId(String(post._id));
    const initialCountdown = Math.max(Number(options?.duration || 5) * 6, 20);
    setVideoCountdown(initialCountdown);
    try {
      const businessName =
        resolveBusinessNameForGeneration({
          fromInput: "",
          selectedBusinessName: selectedBusiness?.name,
          bussinessTitle,
          availableLocations,
          prompt: "",
        }) || "Business";

      const motionPrompt =
        (post?.promat && String(post.promat).trim()) ||
        (post?.description && String(post.description).trim()) ||
        "Create an engaging business promotional video.";

      const body = {
        image_url: null,
        image: null,
        prompt: motionPrompt,
        video_prompt: motionPrompt,
        business_name: businessName,
        duration: Number(options?.duration) || 5,
        platform: "both",
        audio_file_url: null,
        audio_folder: null,
        userId,
        postId: String(post._id),
      };
      const trimmedVoiceUrl =
        typeof options?.audioFileUrl === "string"
          ? options.audioFileUrl.trim()
          : "";
      if (trimmedVoiceUrl) {
        body.audio_file_url = trimmedVoiceUrl;
      }
      if (source.startsWith("http://") || source.startsWith("https://")) {
        body.image_url = source;
      } else if (source.startsWith("data:image")) {
        body.image = source;
      } else {
        body.image = `data:image/png;base64,${source}`;
      }

      const ivRes = await fetch("/api/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const ivData = await ivRes.json().catch(() => ({}));
      if (ivRes.status === 402) {
        setRequiredCoins(VIDEO_GENERATION_COINS);
        setShowInsufficientBalance(true);
        showToast(
          typeof ivData.error === "string"
            ? ivData.error
            : "Insufficient balance for video generation.",
          "error",
        );
        return;
      }
      if (!ivRes.ok || (ivData.success === false && !ivData.drive_link)) {
        throw new Error(
          typeof ivData.error === "string"
            ? ivData.error
            : ivData.error?.message ||
            ivData.message ||
            "Video generation failed",
        );
      }
      const videoUrl = String(ivData.drive_link || "").trim();
      if (!videoUrl) {
        throw new Error("No video URL returned from generator");
      }
      if (!ivData.post) {
        throw new Error("Could not save video on this post");
      }

      if (Number(ivData.coinsDeducted) > 0) {
        setUserWallet((prev) => Math.max(0, prev - VIDEO_GENERATION_COINS));
        showToast(
          `${VIDEO_GENERATION_COINS} coins deducted for video generation ✅`,
          "success",
        );
      }

      const merged = { ...post, ...ivData.post };
      setPosts((prev) => prev.map((p) => (p._id === post._id ? merged : p)));
      setPreviewData((prev) =>
        prev?._id === post._id ? { ...prev, ...merged } : prev,
      );
      showToast("Video ready — tap the Video tab");
      await fetchPosts(true);
    } catch (e) {
      showToast(e.message || "Video conversion failed", "error");
    } finally {
      setConvertingVideoPostId(null);
      setVideoCountdown(0);
    }
  };

  const isValidHttpUrl = (value) => {
    if (!value || typeof value !== "string") return false;
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const openVoiceSetupModal = (post) => {
    setVoiceSetupPost(post);
    setUseOwnVoice(false);
    setVoiceUrlInput("");
    setVoiceVideoDuration(5);
    setShowVoiceSetupModal(true);
  };

  const closeVoiceSetupModal = () => {
    setShowVoiceSetupModal(false);
    setVoiceSetupPost(null);
    setUseOwnVoice(false);
    setVoiceUrlInput("");
    setVoiceVideoDuration(5);
  };

  const continueConvertWithVoiceSetup = async () => {
    if (!voiceSetupPost) return;
    const trimmedUrl = voiceUrlInput.trim();
    if (trimmedUrl && !isValidHttpUrl(trimmedUrl)) {
      showToast("Please enter a valid http/https URL.", "error");
      return;
    }

    const selectedPost = voiceSetupPost;
    closeVoiceSetupModal();
    await handleAutoConvertToVideo(selectedPost, {
      audioFileUrl: trimmedUrl || null,
      duration: voiceVideoDuration,
    });
  };

  useEffect(() => {
    if (!convertingVideoPostId || videoCountdown <= 0) return;
    const timer = setInterval(() => {
      setVideoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [convertingVideoPostId, videoCountdown]);

  const handleEditDescription = async (id, updates) => {
    const userId = localStorage.getItem("userId");

    let payloadUpdates = {};
    if (typeof updates === "string") {
      payloadUpdates = { description: updates };
    } else {
      payloadUpdates = updates;
    }

    const payload = { id, userId, status: "pending", ...payloadUpdates };
    const data = await updatePostStatusAction(payload);

    if (data.success) {
      showToast("Description updated!");
      setPosts((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, ...payloadUpdates, status: "pending" } : p,
        ),
      );
      if (previewData?._id === id) {
        setPreviewData((prev) => ({ ...prev, ...payloadUpdates }));
      }
    } else {
      showToast(data.error || "Failed to update description", "error");
    }
  };

  const handleDeleteFromGMB = async (post) => {
    // First, check if the post has been published anywhere.
    if (!post.locations || post.locations.length === 0) {
      showToast(
        "This post hasn't been published to any locations yet.",
        "error",
      );
      return;
    }

    // Set the specific post to be actioned and open the modal for location selection.
    setPostToAction(post);
    setShowDeleteLocationModal(true);
  };

  const handleLocationConfirm = async (selectedLocationIds, checkmark) => {
    setShowLocationModal(false);

    if (selectedLocationIds.length === 0) {
      showToast("Please select at least one location", "error");
      return;
    }

    if (!postToAction) {
      showToast("Post data not found", "error");
      return;
    }

    const userId = localStorage.getItem("userId");
    let selectedLocations = availableLocations
      .filter((loc) => selectedLocationIds.includes(loc.id))
      .map((loc) => ({ ...loc, isPosted: false }));

    // Normalize checkmark payload
    const checkmarkSource = checkmark || postToAction?.checkmark;
    let checkmarkPayload = "both"; // Default
    if (Array.isArray(checkmarkSource)) {
      if (checkmarkSource.includes("post") && checkmarkSource.includes("photo"))
        checkmarkPayload = "both";
      else if (checkmarkSource.includes("photo")) checkmarkPayload = "photo";
      else if (checkmarkSource.includes("post")) checkmarkPayload = "post";
    } else if (
      typeof checkmarkSource === "string" &&
      checkmarkSource !== "$undefined"
    ) {
      checkmarkPayload = checkmarkSource;
    }

    // Determine if this is a "Post Now" or "Schedule Post" action
    if (scheduledDateForLocations && postToSchedule) {
      // This is a "Schedule Post" action
      // No direct cost deduction here for scheduling, as actual posting cost is handled by cron

      await handleUpdateStatus(
        postToSchedule._id,
        "scheduled",
        scheduledDateForLocations,
        selectedLocations,
        checkmarkPayload,
      );
      showToast(
        `Post scheduled for ${selectedLocationIds.length} locations on ${new Date(scheduledDateForLocations).toLocaleDateString()}!`,
        "success",
      );

      // Reset scheduling specific states
      setScheduledDateForLocations(null);
      setPostToSchedule(null);
    } else {
      // This is a "Post Now" action (existing logic)
      // Calculate cost: 20 coins per location for posting
      const totalPostCost = selectedLocationIds.length * 20;
      let deductionSuccessful = false;

      try {
        // Re-check wallet balance
        const userData = await getUserWalletAction(userId);
        const walletBalance = userData.wallet || 0;
        setUserWallet(walletBalance);

        // Check if user has sufficient balance
        if (walletBalance < totalPostCost) {
          showToast(
            `Insufficient wallet balance. Required: ${totalPostCost} coins`,
            "error",
          );
          setRequiredCoins(totalPostCost);
          setShowInsufficientBalance(true);
          return;
        }

        setIsPosting(true);
        setPostsGeneratedCount(selectedLocationIds.length);

        // Deduct coins from wallet (20 per location) BEFORE posting
        const walletRes = await deductFromWalletAction(userId, {
          amount: totalPostCost,
          type: "deduct",
          reason: "Post-on-GMB",
          metadata: {
            aiPrompt: prompt,
            logoUsed: !!logo,
          },
        });

        if (walletRes.message === "Wallet updated") {
          const newBalance = walletBalance - totalPostCost;
          setUserWallet(newBalance);
          localStorage.setItem("walletBalance", newBalance);
          showToast(
            `${totalPostCost} coins deducted (${selectedLocationIds.length} locations × 20 coins)`,
            "info",
          );
          deductionSuccessful = true;
        } else {
          showToast(walletRes.error || "Wallet deduction failed", "error");
          setIsPosting(false);
          return;
        }

        // Prepare location data for webhook
        const locationData = selectedLocations.map((loc) => ({
          city: loc.locationId,
          cityName: loc.locality,
          bookUrl: loc.websiteUrl || "",
          originalLoc: loc,
        }));

        // Batch processing to prevent timeouts
        const BATCH_SIZE = 5;
        const successfulLocations = [];

        for (let i = 0; i < locationData.length; i += BATCH_SIZE) {
          const batch = locationData.slice(i, i + BATCH_SIZE);
          const batchPayload = batch.map((b) => ({
            city: b.city,
            cityName: b.cityName,
            bookUrl: b.bookUrl,
          }));

          try {
            const { ok: batchOk, data: batchData } = await postToGmbAction({
              account: selectedLocations[0]?.accountId || "",
              locationData: batchPayload,
              output: postToAction?.aiOutput || "",
              description: postToAction?.description || "",
              accessToken: session?.accessToken || "",
              checkmark: checkmarkPayload,
            });

            if (batchOk) {
              successfulLocations.push(...batch.map((b) => b.originalLoc));

              // Update isPosted status incrementally for real-time updates
              const batchIds = batch.map((b) => b.originalLoc.locationId);
              selectedLocations = selectedLocations.map((loc) =>
                batchIds.includes(loc.locationId)
                  ? { ...loc, isPosted: true }
                  : loc,
              );

              await updatePostStatusAction({
                id: postToAction._id,
                locations: selectedLocations,
                status: "posted",
                userId: userId,
              });
            } else {
              console.error("Batch failed:", batchData);
            }
          } catch (err) {
            console.error("Batch error:", err);
          }
        }

        // Handle results
        if (successfulLocations.length > 0) {
          if (successfulLocations.length < selectedLocations.length) {
            // Partial success - refund difference
            const refundAmount =
              (selectedLocations.length - successfulLocations.length) * 20;
            await deductFromWalletAction(userId, {
              amount: refundAmount,
              type: "credit",
              reason: "Refund-Partial-Post-Failed",
              metadata: { originalReason: "Post-on-GMB" },
            });

            const userData = await getUserWalletAction(userId);
            setUserWallet(userData.wallet);
            localStorage.setItem("walletBalance", userData.wallet);

            showToast(
              `Posted to ${successfulLocations.length}/${selectedLocations.length} locations. Refunded failed ones.`,
              "warning",
            );
          } else {
            showToast("Post successfully sent to all locations!", "success");
            setShowSuccess(true);

            // Send post published email notification
            try {
              // Get business name from first successful location
              const businessName = successfulLocations[0]?.name || "";
              const locationName = successfulLocations[0]?.name || "";
              const postUrl = successfulLocations[0]?.websiteUrl || "";

              // Send email to user
              const emailResponse = await fetch(
                "/api/send-post-published-email",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: userId,
                    platform: "Google My Business",
                    businessName: businessName,
                    locationName: locationName,
                    postUrl: postUrl,
                  }),
                },
              );

              const emailResult = await emailResponse.json();
              if (emailResult.success) {
                console.log("📧 Post published email sent successfully");
              } else {
                console.log(
                  "⚠️ Failed to send post published email:",
                  emailResult.message,
                );
              }
            } catch (emailError) {
              console.log(
                "⚠️ Error sending post published email:",
                emailError.message,
              );
              // Don't fail the post if email fails
            }
          }

          // Update post with successful locations
          await updatePostStatusAction({
            id: postToAction._id,
            locations: successfulLocations.map((loc) => ({
              ...loc,
              isPosted: true,
            })),
            status: "posted",
            userId: userId,
            whenPosted: { ...postToAction.whenPosted, gmb: true },
          });

          // Refresh posts
          await fetchPosts(activeTab);
        } else {
          throw new Error("All batches failed to post.");
        }
      } catch (error) {
        console.error("Post error:", error);

        // Update post status to failed
        if (postToAction) {
          const errorMsg = error.message || "Post failed";
          await updatePostStatusAction({
            id: postToAction._id,
            userId,
            status: "failed",
            error: errorMsg,
            locations: selectedLocations,
          });

          setPosts((prev) =>
            prev.map((p) =>
              p._id === postToAction._id
                ? {
                  ...p,
                  status: "failed",
                  error: errorMsg,
                  locations: selectedLocations,
                }
                : p,
            ),
          );
        }

        if (deductionSuccessful) {
          showToast(`Failed to send post. Refunding coins...`, "error");
          // Refund coins
          await deductFromWalletAction(userId, {
            amount: totalPostCost,
            type: "credit",
            reason: "Refund-Post-Failed",
            metadata: {
              originalReason: "Post-on-GMB",
            },
          });
          const userData = await getUserWalletAction(userId);
          setUserWallet(userData.wallet);
          localStorage.setItem("walletBalance", userData.wallet);
        } else {
          showToast("Network error: Failed to send post", "error");
        }
      } finally {
        // Reset states related to posting
        setIsPosting(false);
      }
    }
    setPostToAction(null); // Clear postToAction after handling
  };

  const handlePost = async (post) => {
    // First check if user has approved the post
    if (
      post.status !== "approved" &&
      post.status !== "scheduled" &&
      post.status !== "posted" &&
      post.status !== "failed"
    ) {
      showToast("Please approve the post first!", "error");
      return;
    }

    // Set the post to be actioned and open the location modal
    setPostToAction(post);
    setShowLocationModal(true);
  };

  const handleDeleteLocationConfirm = async (selectedLocationIds) => {
    setShowDeleteLocationModal(false);
    if (selectedLocationIds.length === 0) return;

    if (!postToAction || !postToAction.locations) {
      showToast("Post or location data is missing for deletion.", "error");
      return;
    }

    // Find the full location objects based on the selected IDs.
    // The `LocationSelectionModal` passes back the `id` property of the location objects.
    const locationsToDelete = postToAction.locations.filter((loc) =>
      selectedLocationIds.includes(loc.id),
    );

    setIsPosting(true);
    let successCount = 0;

    for (const location of locationsToDelete) {
      const payload = {
        locationIds: location.locationId,
        acc_id: location.accountId,
        access_token: session?.accessToken,
      };
      try {
        const result = await deletePostFromGmbAction(payload);

        if (!result.success) {
          throw new Error(`Failed to delete from ${location.name}.`);
        }
        showToast(`Post deleted from ${location.name}.`, "success");
        successCount++;
      } catch (error) {
        showToast(error.message, "error");
      }
    }

    if (successCount > 0) {
      const remainingLocations = postToAction.locations.filter(
        (loc) => !selectedLocationIds.includes(loc.id),
      );

      const newStatus =
        remainingLocations.length === 0 ? "approved" : postToAction.status;

      await updatePostStatusAction({
        id: postToAction._id,
        userId,
        locations: remainingLocations,
        status: newStatus,
      });
      await fetchPosts(activeTab);
    }

    setIsPosting(false);
    setPostToAction(null);
  };

  const handleReject = async (id) => {
    if (confirm("Are you sure you want to reject this post?")) {
      setRejectPostId(id);
      setShowRejectModal(true);
    }
  };

  const submitRejection = async () => {
    const userId = localStorage.getItem("userId");

    if (!rejectReason.trim()) {
      showToast("Please enter a reason!", "error");
      return;
    }

    try {
      const data = await updatePostStatusAction({
        id: rejectPostId,
        userId,
        status: "rejected",
        reason: rejectReason,
      });
      if (data.success) {
        showToast("Post rejected successfully! ❌");

        // ✅ Update status only (do not delete)
        setPosts((prev) =>
          prev.map((p) =>
            p._id === rejectPostId
              ? { ...p, status: "rejected", rejectReason: rejectReason }
              : p,
          ),
        );

        // ✅ Update counts
        setAllCounts((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1,
        }));
      }

      // Reset modal data
      setRejectReason("");
      setRejectPostId(null);
      setShowRejectModal(false);
    } catch (error) {
      console.error(error);
      showToast("Error rejecting post", "error");
    }
  };

  const handleDownload = async (post) => {
    const mediaUrl = post?.aiOutput;
    if (!mediaUrl) {
      showToast("No media available to download.", "error");
      return;
    }

    try {
      const apiUrl = `/api/downloadImage?url=${encodeURIComponent(mediaUrl)}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        showToast("Failed to download file", "error");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = looksLikeVideoUrl(mediaUrl) ? "mp4" : "jpg";
      link.download = `post-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      showToast(
        looksLikeVideoUrl(mediaUrl)
          ? "Video downloaded! 📥"
          : "Image downloaded successfully! 📥",
      );
    } catch (err) {
      showToast("Failed to download file", "error");
    }
  };
  const handleShare = async (post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post",
          text: post.description || "AI-generated content",
          url: post.aiOutput,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(post.aiOutput || "");
      showToast("Link copied to clipboard! 📋");
    }
  };

  // Load user settings including businesses (no error toast when GMB simply not linked — expected)
  const loadUserSettings = useCallback(async () => {
    try {
      setLoadingBusinesses(true);
      const res = await fetch("/api/user-settings");
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setAvailableBusinesses([]);
        setSelectedBusiness(null);
        return;
      }

      const projects = Array.isArray(data.gmbProjects) ? data.gmbProjects : [];
      setAvailableBusinesses(projects);

      if (projects.length === 0) {
        setSelectedBusiness(null);
      } else if (data.selectedBusiness) {
        setSelectedBusiness(data.selectedBusiness);
      } else {
        setSelectedBusiness((prev) => prev ?? projects[0]);
      }
    } catch (error) {
      console.error("Failed to load businesses:", error);
      setAvailableBusinesses([]);
      setSelectedBusiness(null);
    } finally {
      setLoadingBusinesses(false);
    }
  }, []);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  // Load locations from localStorage (fallback)
  useEffect(() => {
    const locationDetailsData = localStorage.getItem("locationDetails");
    if (locationDetailsData) {
      try {
        const parsedData = JSON.parse(locationDetailsData);
        if (Array.isArray(parsedData)) {
          const uniqueBusinesses = [];
          const seenTitles = new Set();
          parsedData.forEach((item) => {
            if (item?.title && !seenTitles.has(item.title)) {
              seenTitles.add(item.title);
              uniqueBusinesses.push(item);
            }
          });
          if (uniqueBusinesses.length > 0) {
            setBussinessTitle(uniqueBusinesses[0].title);
          }
        }
      } catch (error) {
        console.error("Failed to parse locationDetails:", error);
      }
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Load wallet balance on mount
  useEffect(() => {
    const storedBalance = localStorage.getItem("walletBalance");
    if (storedBalance) {
      setUserWallet(parseInt(storedBalance, 10));
    }
  }, []);

  useEffect(() => {
    if (isScheduleModalOpen) {
      const fetchWallet = async () => {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const data = await getUserWalletAction(userId);
          if (data.wallet !== undefined) {
            setUserWallet(data.wallet);
            localStorage.setItem("walletBalance", data.wallet);
          }
        }
      };
      fetchWallet();
    }
  }, [isScheduleModalOpen]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeTab === "videos") {
      return posts.filter((p) => postHasVideoAsset(p));
    }
    if (activeTab === "total") return posts;
    return posts.filter((post) => post.status === activeTab);
  }, [posts, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50  mt-[-8px]">
      {/* Back button for mobile view */}
      <div className="sm:hidden fixed top-4 left-4 z-50">
        <Link href="/dashboard" passHref>
          <button
            aria-label="Go back to dashboard"
            className="bg-white/80 backdrop-blur-sm p-2.5 rounded-full shadow-lg border border-gray-200 hover:scale-110 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-2 py-2">
        {toast && <Toast message={toast.message} type={toast.type} />}
        {showLocationModal && (
          <LocationSelectionModal
            locations={availableLocations} // Show all available locations for posting
            onClose={() => setShowLocationModal(false)}
            onConfirm={handleLocationConfirm}
            title="Select Locations to Post"
            confirmText="Post"
            walletBalance={userWallet}
            initialSelected={
              postToAction?.locations?.map((l) => {
                const match = availableLocations.find(
                  (al) => al.locationId === l.locationId,
                );
                return match ? match.id : l.id;
              }) || []
            }
          />
        )}
        {showDeleteLocationModal && (
          <LocationSelectionModal
            locations={postToAction?.locations || []} // Show only posted locations for deleting
            onClose={() => setShowDeleteLocationModal(false)}
            onConfirm={handleDeleteLocationConfirm}
            title="Select Locations to Delete From"
            confirmText="Delete"
          />
        )}
        {showInsufficientBalance && (
          <InsufficientBalanceModal
            walletBalance={userWallet}
            required={requiredCoins}
            onClose={() => setShowInsufficientBalance(false)}
            onRecharge={() => {
              setShowInsufficientBalance(false);
              window.location.href = "/wallet";
            }}
          />
        )}
        {isScheduleModalOpen && (
          <ScheduleModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            post={postToSchedule} // Pass the post to the modal
            onConfirm={handleScheduleDateConfirmed} // New handler for date confirmation
            availableLocations={availableLocations}
            facebookPages={facebookPages}
            instagramAccounts={instagramAccounts}
            fetchFacebookPages={fetchFacebookPages}
            fetchInstagramAccounts={fetchInstagramAccounts}
            loadingFb={loadingFbPages}
            loadingIg={loadingIgAccounts}
            userWallet={userWallet}
            setShowInsufficientBalance={setShowInsufficientBalance}
            setRequiredCoins={setRequiredCoins}
          />
        )}
        {showScheduleConfirmation && (
          <ScheduleConfirmationModal
            isOpen={showScheduleConfirmation}
            onClose={() => setShowScheduleConfirmation(false)}
            scheduledPlatforms={scheduledPlatforms}
          />
        )}
        {showVoiceSetupModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-violet-100 bg-white shadow-2xl overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-amber-50 border-b border-violet-100">
                <h3 className="text-base font-bold text-gray-900">
                  Convert to video ({VIDEO_GENERATION_COINS} coins)
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Kya aap khud ka voice use karna chahte hain?
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Do you want to implement your own voice?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUseOwnVoice(true)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${useOwnVoice
                        ? "border-violet-400 bg-violet-50 text-violet-900"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseOwnVoice(false);
                        setVoiceUrlInput("");
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${!useOwnVoice
                        ? "border-amber-400 bg-amber-50 text-amber-900"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      No (Skip)
                    </button>
                  </div>
                </div>

                {useOwnVoice && (
                  <div>
                    <label
                      htmlFor="voice-url-input"
                      className="block text-xs font-semibold text-gray-700 mb-1.5"
                    >
                      Voice URL (only link allowed, optional)
                    </label>
                    <input
                      id="voice-url-input"
                      type="url"
                      value={voiceUrlInput}
                      onChange={(e) => setVoiceUrlInput(e.target.value)}
                      placeholder="https://example.com/voice.mp3"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Link doge to wahi use hoga, warna `null` jayega.
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="voice-video-duration"
                    className="block text-xs font-semibold text-gray-700 mb-1.5"
                  >
                    Duration
                  </label>
                  <select
                    id="voice-video-duration"
                    value={voiceVideoDuration}
                    onChange={(e) => setVoiceVideoDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white"
                  >
                    <option value={5}>5 sec</option>
                    <option value={8}>8 sec</option>
                    <option value={10}>10 sec</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeVoiceSetupModal}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={continueConvertWithVoiceSetup}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-fuchsia-700"
                  >
                    Generate Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showRejectModal && (
          <RejectReasonModal
            onClose={() => setShowRejectModal(false)}
            onSubmit={submitRejection}
            reason={rejectReason}
            setReason={setRejectReason}
          />
        )}
        {showFacebookModal && (
          <FacebookShareModal
            isOpen={showFacebookModal}
            onClose={() => setShowFacebookModal(false)}
            onConfirm={submitFacebookPost}
            post={postToFacebook}
            pages={facebookPages}
            loading={loadingFbPages}
          />
        )}
        {showInstagramModal && (
          <InstagramShareModal
            isOpen={showInstagramModal}
            onClose={() => setShowInstagramModal(false)}
            onConfirm={submitInstagramPost}
            post={postToInstagram}
            accounts={instagramAccounts}
            loading={loadingIgAccounts}
          />
        )}
        <ImageToVideoModal
          isOpen={imageToVideoOpen}
          onClose={() => {
            setImageToVideoOpen(false);
            setImageToVideoInitialPost(null);
          }}
          initialPost={imageToVideoInitialPost}
          posts={posts}
          selectedBusiness={selectedBusiness}
          bussinessTitle={bussinessTitle}
          availableLocations={availableLocations}
          postPrompt={prompt}
          showToast={showToast}
          videoGenerationCoins={VIDEO_GENERATION_COINS}
          onVideoChargeApplied={() =>
            setUserWallet((prev) => Math.max(0, prev - VIDEO_GENERATION_COINS))
          }
          onVideoInsufficientBalance={() => {
            setRequiredCoins(VIDEO_GENERATION_COINS);
            setShowInsufficientBalance(true);
          }}
          onVideoSaved={(saved) => {
            if (!saved) return;
            setPosts((prev) => {
              const exists = prev.some((p) => p._id === saved._id);
              if (exists) {
                return prev.map((p) =>
                  p._id === saved._id ? { ...p, ...saved } : p,
                );
              }
              return [saved, ...prev];
            });
            setPreviewData(saved);
            fetchPosts(true);
          }}
        />
        {showFirstPostModal && (
          <FirstPostModal onClose={() => setShowFirstPostModal(false)} />
        )}
        {isPosting && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center space-y-4 sm:space-y-6 max-w-md w-full border-4 border-white/30">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-300/40 rounded-full blur-2xl animate-pulse"></div>
                <div className="text-6xl sm:text-8xl animate-bounce-slow">
                  🚀
                </div>
              </div>
              <div className="text-center space-y-2 sm:space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Publishing Post...
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm">
                  Sending to Google My Business
                </p>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-300 via-yellow-300 to-green-300 h-full rounded-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}
        {convertingVideoPostId && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[115] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-violet-100 px-7 py-7 max-w-md w-full text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-violet-700 animate-spin" />
              </div>
              <p className="text-base font-semibold text-gray-900">
                Please wait Limbu Ai generating Video Special for you
              </p>
              <p className="mt-2 text-sm font-medium text-violet-700">
                {videoCountdown > 0 ? `${videoCountdown}s remaining` : "Almost done..."}
              </p>
            </div>
          </div>
        )}
        {showSuccess && (
          <SuccessOverlay
            onComplete={() => setShowSuccess(false)}
            postsCount={postsGeneratedCount}
          />
        )}

        <div>
          <div
            className="
    grid grid-cols-2 sm:flex sm:flex-row items-center
    gap-3
  "
          >
            {/* Post Management */}
            <div
              className="
      inline-flex items-center gap-2
      px-3 sm:px-5 py-1
      rounded-xl
      bg-white
      shadow-md
      border border-blue-100
      whitespace-nowrap
    "
            >
              <div className="p-1.5 sm:p-2 rounded-lg bg-neutral-50">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800" />
              </div>
              <span className="text-sm sm:text-xl font-bold text-neutral-800">
                Post Management
              </span>
            </div>

            <div className="flex flex-nowrap overflow-x-auto sm:flex-wrap items-center gap-4 bg-white px-3 py-2 sm:px-5 sm:py-1 rounded-2xl shadow-sm border border-gray-200 col-span-2 order-last sm:order-none w-full sm:w-auto justify-start sm:justify-center sm:ml-4">
              {/* <span className="text-xs fon t-bold text-gray-400 uppercase tracking-wider mr-2 whitespace-nowrap">Image For:</span> */}

              {/* All */}
              <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                <input
                  type="checkbox"
                  checked={["gmb", "fb", "ig"].every((p) =>
                    selectedPlatforms.includes(p),
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlatforms(["gmb", "fb", "ig"]);
                    } else {
                      setSelectedPlatforms([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-yellow-600 accent-yellow-400  focus:ring-yellow-600 transition-all"
                />
                <span className="text-sm font-semibold text-neutral-600  group-hover:text-gray-600">
                  All
                </span>
              </label>

              {/* GMB */}
              <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes("gmb")}
                  onChange={() =>
                    setSelectedPlatforms((prev) =>
                      prev.includes("gmb")
                        ? prev.filter((p) => p !== "gmb")
                        : [...prev, "gmb"],
                    )
                  }
                  className="w-4 h-4 rounded border-gray-300 text-yellow-600 accent-yellow-400  focus:ring-yellow-600 transition-all"
                />

                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${selectedPlatforms.includes("gmb")
                    ? "bg-white border-blue-200 shadow-md scale-105"
                    : "bg-gray-50 border-gray-200 grayscale opacity-70 group-hover:opacity-100"
                    }`}
                >
                  <img
                    src="https://www.gstatic.com/images/branding/product/1x/gsa_48dp.png"
                    alt="Google"
                    className="w-5 h-5 object-contain"
                  />
                </div>
              </label>

              {/* Facebook */}
              <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes("fb")}
                  onChange={() =>
                    setSelectedPlatforms((prev) =>
                      prev.includes("fb")
                        ? prev.filter((p) => p !== "fb")
                        : [...prev, "fb"],
                    )
                  }
                  className="w-4 h-4 rounded border-gray-300 text-yellow-600 accent-yellow-400  focus:ring-yellow-500 transition-all"
                />
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${selectedPlatforms.includes("fb") ? "bg-[#1877F2] border-[#1877F2] text-white shadow-md scale-105" : "bg-gray-50 border-gray-200 text-gray-400 grayscale opacity-70 group-hover:opacity-100"}`}
                >
                  <Facebook className="w-5 h-5 fill-current" />
                </div>
              </label>

              {/* Instagram */}
              <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes("ig")}
                  onChange={() =>
                    setSelectedPlatforms((prev) =>
                      prev.includes("ig")
                        ? prev.filter((p) => p !== "ig")
                        : [...prev, "ig"],
                    )
                  }
                  className="w-4 h-4 rounded border-primary text-dark accent-yellow-400  focus:ring-pink-500 transition-all"
                />
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${selectedPlatforms.includes("ig") ? "bg-gradient-to-tr from-[#FFD600] via-[#FF0169] to-[#D300C5] border-transparent text-white shadow-md scale-105" : "bg-gray-50 border-gray-200 text-gray-400 grayscale opacity-70 group-hover:opacity-100"}`}
                >
                  <Instagram className="w-5 h-5" />
                </div>
              </label>
            </div>

            {/* 5000 > 2 video 2500  > 1 */}

            {/* Preview Button */}
            <a
              href={previewData?.aiOutput}
              target="_blank"
              rel="noopener noreferrer"
              className="
      inline-flex items-center gap-1.5
      px-3 sm:px-5 py-2
      rounded-xl
      bg-primary
      hover:from-neutral-400 hover:to-yellow-600
      text-dark font-semibold
      shadow-md
      transition-all duration-200
      text-sm sm:text-base
      justify-self-end
      whitespace-nowrap
      sm:ml-auto
    "
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              Preview
            </a>
          </div>

          {/* <p className="text-blue/90 text-sm sm:text-sm font-medium text-center">
    Create stunning GMB posts with AI in seconds ✨
  </p> */}
        </div>

        {/* {!loadingBusinesses && availableBusinesses.length === 0 && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              Google Business Profile is not connected. Connect GMB in Settings to load
              locations and post to Google.
            </span>
            <Link
              href="/user-settings"
              className="shrink-0 font-semibold text-amber-900 underline underline-offset-2 hover:no-underline"
            >
              Open Settings
            </Link>
          </div>
        )} */}

        {/* Main Content Area - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start ">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-7">
            <PostInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerateClick}
              onManualPost={handleManualPost}
              loading={isGenerating}
              logo={logo}
              setLogo={setLogo}
              assets={userAssets}
              setUserAssets={setUserAssets}
              fetchUserAssets={fetchUserAssets}
              assetId={assetId}
              showToast={showToast}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              bussinessTitle={bussinessTitle}
              availableLocations={availableLocations}
              keywordError={keywordError}
            />

            <button
              type="button"
              onClick={() => {
                setImageToVideoInitialPost(null);
                setImageToVideoOpen(true);
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 px-4 py-3 text-sm font-bold text-amber-900 shadow-sm transition-all"
            >
              <Video className="w-5 h-5" />
              Image to Video
            </button>
          </div>

          {/* Right Column: Live Preview */}
          <div
            className="lg:col-span-5 sticky top-16 z-10 max-h-[75vh] overflow-y-auto"
            ref={previewRef}
          >
            <PreviewSection
              isGenerating={isGenerating}
              previewData={previewData}
              onDownload={handleDownload}
              countdown={countdown}
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
                  setImageToVideoOpen(true);
                }
              }}
              handleFacebookPost={handleFacebookPost}
              handleInstagramPost={handleInstagramPost}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5 ">
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

        {isLoadingPosts ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Lottie
              animationData={animationData}
              loop={true}
              className="w-32 h-32"
            />
            <p className="text-gray-500 mt-4 font-medium">
              Loading your creatives...
            </p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 mt-6">
            {filteredPosts.map((post) => (
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
                onConvertToVideo={openVoiceSetupModal}
                convertingVideoPostId={convertingVideoPostId}
                videoGenerationCoins={VIDEO_GENERATION_COINS}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-10 sm:p-16 text-center border-3 border-dashed border-gray-300 shadow-xl">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 text-base">
              {activeTab === "total"
                ? "Create your first AI-powered post above!"
                : activeTab === "videos"
                  ? "No videos yet — convert an image in Live Preview (Image → Video) or use Image to Video below."
                  : `No ${activeTab} posts yet`}
            </p>
          </div>
        )}
      </div>

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
          <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z" />
        </svg>
      </a>
    </div>
  );
}
