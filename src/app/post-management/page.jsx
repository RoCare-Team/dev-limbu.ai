"use client";

import {
  fetchPostsAction,
  fetchAllPostsAction,
  getUserWalletAction,
  generateWithAiAgentAction,
  savePostAction,
  deductFromWalletAction,
  generateWithAssetsAction, deletePostFromGmbAction,
  updatePostStatusAction, postToGmbAction,
} from "@/app/actions/postActions";
import { deleteAssetAction, loadAssetsFromServerAction } from "@/app/actions/assetActions";
import { getCloudinarySignatureAction } from "@/app/actions/uploadCloudinary";
import { useCallback, useEffect, useState, useRef } from "react";
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
import TabButton from "@/components/TabButton";
import RejectReasonModal from "../../components/RejectReasonModal";
import "./PostManagement.module.css";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public



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
  const [scheduledDateForLocations, setScheduledDateForLocations] = useState(null); // New state for selected date
  const [previewData, setPreviewData] = useState(null);
  const [lastUsedAssetsFlow, setLastUsedAssetsFlow] = useState(false);
  const [showScheduleConfirmation, setShowScheduleConfirmation] = useState(false);
  const [scheduledPlatforms, setScheduledPlatforms] = useState({ gmb: [], fb: [], ig: [] });

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
  const [bussinessTitle, setBussinessTitle] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState(["gmb",'fb', 'ig']);
  const [keywordError, setKeywordError] = useState("");

  // Helper to strip base64 prefix
  const stripBase64 = (str) => {
    if (typeof str === 'string' && str.includes('base64,')) {
      return str.split('base64,')[1];
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
          address: loc.address || loc.storefrontAddress?.addressLines?.join(", ") || "Address not available",
          city: loc.city || "",
          ...loc
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
      const updatedPost = posts.find(p => p._id === previewData._id);
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



  useEffect(() => { fetchUserAssets(); }, [fetchUserAssets]);

  useEffect(() => {
    const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : ["gmb"];
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
        a.name === "Size" ? { ...a, url: size } : a
      );

      // Preserve the user's selection by mapping previous selection to new asset objects
      setSelectedAssets((currentSelected) => {
        const selectedNames = new Set(currentSelected.map((s) => s.name));
        return newAssets.filter((a) => selectedNames.has(a.name));
      });

      return newAssets;
    });
  }, [selectedPlatforms]);


  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [allCounts, setAllCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    scheduled: 0,
    posted: 0,
    rejected: 0,
  });

  const tabs = [
    { id: "total", label: "Total Posts", shortLabel: "Total", icon: ImageIcon, count: allCounts.total },
    { id: "pending", label: "Pending", shortLabel: "Pending", icon: Clock, count: allCounts.pending },
    { id: "approved", label: "Approved", shortLabel: "Approved", icon: CheckCircle, count: allCounts.approved }, // Corrected icon
    { id: "rejected", label: "Rejected", shortLabel: "Rejected", icon: XCircle, count: allCounts.rejected },
    { id: "scheduled", label: "Scheduled", shortLabel: "Scheduled", icon: Calendar, count: allCounts.scheduled },
    { id: "posted", label: "Posted", shortLabel: "Posted", icon: Send, count: allCounts.posted },
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
        
        const stuckPosts = allPosts.filter(post => 
          post.status === 'processing' && 
          post.scheduledDate && 
          new Date(post.scheduledDate) < oneHourAgo
        );

        if (stuckPosts.length > 0) {
             await Promise.all(stuckPosts.map(post => 
                updatePostStatusAction({
                    id: post._id,
                    userId,
                    status: 'failed',
                    error: 'Processing timeout: Schedule time passed by 1 hour'
                })
             ));
             
             // Update local state to reflect changes immediately
             allPosts = allPosts.map(post => {
                 if (stuckPosts.find(sp => sp._id === post._id)) {
                     return { ...post, status: 'failed', error: 'Processing timeout: Schedule time passed by 1 hour' };
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

  const handleGenerateClick = async (selectedAssets, useAssetsFlow, businessName, keywords) => {
    // Auto-scroll to preview section on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && previewRef.current) {
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

    if (!hasKeywords) {
      setKeywordError("Please fill at least one keyword");
      return;
    }
    setKeywordError("");

    if (useAssetsFlow === "manual") {
      await handleManualPost(selectedAssets);
      return;
    }

    setLastUsedAssetsFlow(useAssetsFlow);
    if (useAssetsFlow) {
      await handleImageGenerateWithAssets(selectedAssets, businessName, processedKeywords);
    } else {
      await handleAiAgent(selectedAssets);
    }
  };

  const handleManualPost = async ({ image, description }) => {
    const userId = localStorage.getItem("userId");
    try {
      setIsGenerating(true);

      let imageUrl = image;

      if ((typeof image === "string" && image.startsWith("data:")) || (typeof image === "object" && image !== null)) {
        // 1. Get Secure Signature from Server
        const sigData = await getCloudinarySignatureAction();
        if (!sigData.success) {
          throw new Error(sigData.error || "Failed to get upload signature");
        }

        // 2. Upload directly to Cloudinary using the signature
        const formData = new FormData();
        formData.append("file", image);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp);
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
        }

        const data = await res.json();
        imageUrl = data.secure_url;
      }

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

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
      setPreviewData(savedPost);
      showToast("Manual Post Created Successfully! 🎉");

    } catch (error) {
      console.error("Manual Post Error:", error);
      showToast(error.message || "Failed to create post!", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAgent = async (selectedAssets = []) => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt before generating!", "error");
      return;
    }

    const userId = localStorage.getItem("userId");

    try {
      // Check wallet balance for AI generation (150 coins)
      const userData = await getUserWalletAction(userId);
      const walletBalance = userData.wallet || 0;
      setUserWallet(walletBalance);

      // Check if user has sufficient balance for AI generation (80 coins)
      if (walletBalance < 80) {
        setRequiredCoins(80);
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
      const strippedAssets = selectedAssets.map(asset => ({
        ...asset,
        url: stripBase64(asset.url)
      }));

      // Call AI Agent API (single generation, not per location)
      const apiResponse = await generateWithAiAgentAction(prompt, strippedLogo, strippedAssets);

      clearInterval(timer);

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || "AI agent failed.");
      }

      const data = apiResponse.data || {};
      console.log("datadatadata", data);


      console.log("datadata", data);


      const gmbDesc = data.gmb_des;
      const fbDesc = data.fb_des;
      const igDesc = data.ig_des;


      // Deduct 80 coins for AI generation
      const walletData = await deductFromWalletAction(userId, {
        amount: 80,
        type: "deduct",
        reason: "image_generated",
        metadata: {
          aiPrompt: prompt,
          logoUsed: !!logo,
        }
      });

      if (walletData.error) {
        console.warn("Wallet deduction failed:", walletData.error);
        showToast(walletData.error, "error");
      } else {
        showToast("80 coins deducted for AI generation ✅", "success");
        setUserWallet((prev) => Math.max(0, prev - 80));
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
        promat: data.user_input || prompt,
        locations: [],
      });

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
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



  const handleImageGenerateWithAssets = async (selectedAssets = [], businessName, keywords) => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt before generating!", "error");
      return;
    }



    const userId = localStorage.getItem("userId");



    try {
      // Check wallet balance for AI generation (150 coins)
      const userData = await getUserWalletAction(userId);
      const walletBalance = userData.wallet || 0;
      setUserWallet(walletBalance);

      // Check if user has sufficient balance for AI generation (80 coins)
      if (walletBalance < 80) {
        setRequiredCoins(80);
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

      // Call the asset generation API
      const apiResponse = await generateWithAssetsAction({
        topic: prompt,
        bussines_name: businessName || "",
        keywords: keywords || "",
        colourPalette: userAssets.find(a => a.name === 'Color')?.url || "none",
        size: userAssets.find(a => a.name === 'Size')?.url || "1:1",
        characterImage: stripBase64(selectedAssets.find(a => a.name === 'Character')?.url || ""),
        uniformImage: stripBase64(selectedAssets.find(a => a.name === 'Uniform')?.url || ""),
        productImage: stripBase64(selectedAssets.find(a => a.name.startsWith('Product'))?.url || ""),
        backgroundImage: stripBase64(selectedAssets.find(a => a.name === 'Background')?.url || ""),
        logoImage: stripBase64(selectedAssets.find(a => a.name === 'Logo')?.url || logoBase64 || ""),
        platform: selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : "gmb"
      });

      clearInterval(timer);




      // The direct response from n8n is now the data we need
      if (apiResponse.status !== "true" && !apiResponse.success) {
        throw new Error(apiResponse.error || apiResponse.message || "AI asset generation failed.");
      }

      const data = apiResponse.success ? apiResponse.data : apiResponse;

      const gmbDesc = data.gmb_des;
      const fbDesc = data.fb_des;
      const igDesc = data.ig_des;

      // Deduct 80 coins for AI generation
      const walletData = await deductFromWalletAction(userId, {
        amount: 80,
        type: "deduct",
        reason: "image_generated",
        metadata: {
          aiPrompt: prompt,
          logoUsed: !!logo,
        }
      });

      if (walletData.error) {
        console.warn("Wallet deduction failed:", walletData.error);
        showToast(walletData.error, "error");
      } else {
        showToast("80 coins deducted for AI generation ✅", "success");
        setUserWallet((prev) => Math.max(0, prev - 80));
      }

      let finalDescription = data.description;
      if (!finalDescription) {
        if (selectedPlatforms.includes('gmb') && gmbDesc) finalDescription = gmbDesc;
        else if (selectedPlatforms.includes('fb') && fbDesc) finalDescription = fbDesc;
        else if (selectedPlatforms.includes('ig') && igDesc) finalDescription = igDesc;
        else finalDescription = gmbDesc || fbDesc || igDesc || "Generated Content";
      }

      // Save Post Immediately
      const savedPostResponse = await savePostAction({
        userId,
        aiOutput: data.image || data.output,
        description: finalDescription,
        gmbDescription: gmbDesc,
        fbDescription: fbDesc,
        igDescription: igDesc,
        logoUrl: data.logoUrl,
        status: "pending",
        promat: data.user_input || prompt,
        locations: [],
      });

      if (!savedPostResponse.success) {
        throw new Error(savedPostResponse.error || "Failed to save post.");
      }

      const savedPost = savedPostResponse.data;
      setPosts((prev) => [savedPost, ...prev]);
      setAllCounts((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
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
  //   if (!previewData) return;

  //   const userId = localStorage.getItem("userId");
  //   try {
  //     const postData = await savePostAction({
  //       userId,
  //       aiOutput: previewData.aiOutput,
  //       description: previewData.description,
  //       logoUrl: previewData.logoUrl,
  //       status: "pending",
  //       promat: previewData.user_input,
  //       locations: [],
  //     });

  //     if (!postData.success) {
  //       throw new Error(postData.error || "Failed to save post.");
  //     }

  //     setPosts((prev) => [postData.data, ...prev]);
  //     setAllCounts((prev) => ({
  //       ...prev,
  //       total: prev.total + 1,
  //       pending: prev.pending + 1,
  //     }));

  //     showToast("Post Saved Successfully! 💾");
  //     setPreviewData(postData.data);
  //     setPrompt("");
  //     setLogo(null);
  //   } catch (error) {
  //     showToast(error.message, "error");
  //   }
  // };

  const handleDateChange = (id, value) => {
    setScheduleDates((prev) => ({ ...prev, [id]: value }));
  };

  // Handler for when a date is confirmed in the ScheduleModal
  const handleScheduleDateConfirmed = async (postId, status, selectedDate, selectedTargets) => {
    const post = posts.find(p => p._id === postId);
    if (!post) {
      showToast("Post not found for scheduling.", "error");
      return;
    }

    // Normalize checkmark payload
    const checkmarkSource = post?.checkmark;
    let checkmarkPayload = "both"; // Default
    if (Array.isArray(checkmarkSource)) {
      if (checkmarkSource.includes("post") && checkmarkSource.includes("photo")) checkmarkPayload = "both";
      else if (checkmarkSource.includes("photo")) checkmarkPayload = "photo";
      else if (checkmarkSource.includes("post")) checkmarkPayload = "post";
    } else if (typeof checkmarkSource === "string" && checkmarkSource !== "$undefined") {
      checkmarkPayload = checkmarkSource;
    }

    const sources = [];
    if (selectedTargets.gmb?.length > 0) sources.push("gmb");
    if (selectedTargets.fb?.length > 0) sources.push("fb");
    if (selectedTargets.ig?.length > 0) sources.push("ig");
    
    const scheduledDateSource = sources; // Keep as array, not joined string

    const selectedGmbLocations = selectedTargets.gmb?.length > 0 
        ? availableLocations.filter(loc => selectedTargets.gmb.includes(loc.id))
        : [];

    const selectedFbPages = selectedTargets.fb?.length > 0
        ? facebookPages.filter(p => selectedTargets.fb.includes(p.pageId)).map(p => ({
            userId: post.userId,
            pageId: p.pageId,
            pageAccessToken: p.pageAccessToken,
            caption: post.fbDescription || post.description,
            imageUrl: post.aiOutput
        }))
        : [];
    
    const selectedIgPages = selectedTargets.ig?.length > 0
        ? instagramAccounts.filter(a => selectedTargets.ig.includes(a.igId)).map(a => ({
            userId: post.userId,
            igUserId: a.igId,
            accessToken: a.pageAccessToken,
            caption: post.igDescription || post.description,
            imageUrl: post.aiOutput
        }))
        : [];

    if (sources.length > 0) {
        // Store platforms for confirmation modal
        setScheduledPlatforms({
            gmb: selectedGmbLocations,
            fb: selectedFbPages,
            ig: selectedIgPages
        });
        
        await handleUpdateStatus(
            postId,
            "scheduled",
            selectedDate,
            selectedGmbLocations,
            checkmarkPayload,
            scheduledDateSource,
            selectedFbPages,
            selectedIgPages
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
    instagramAccounts = []
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
      showToast("Please connect first Bussiness Account or  log in again to schedule posts.", "error");
      return;
    }


    try {
      // Deduplicate locations based on locationId to ensure unique targets
      const uniqueLocations = Array.isArray(locations)
        ? Array.from(new Map(locations.map(item => [item.locationId, item])).values())
        : [];

      // 🔹 NORMALIZED PAYLOAD
      let payload = {
        id: postId,
        userId,
        status: newStatus,
        scheduledDate: scheduleDate || null,
        checkmark: checkmark,
        refreshToken: newStatus === "scheduled" ? session?.refreshToken : undefined,
        locations: uniqueLocations,
        scheduledDateSource: scheduledDateSource,
        fbPages: facebookPages,
        igPages: instagramAccounts
      };

      if (newStatus === "scheduled") {
        const locationData = uniqueLocations.map((loc) => ({
          city: loc.locationId,
          cityName: loc.locality,
          bookUrl: loc.websiteUrl || "",
        }));

        payload.locationData = locationData;
        payload.account = uniqueLocations.length > 0 ? uniqueLocations[0].accountId : "";
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
              scheduledDateSource: res.data?.scheduledDateSource || scheduledDateSource,
            }
            : p
        )
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
      if (current.includes("post") && current.includes("photo")) current = "both";
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
    setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, checkmark: newVal } : p)));

    try {
      await updatePostStatusAction({ id, userId: localStorage.getItem("userId"), checkmark: newVal });
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

    if (!caption && !post.aiOutput) {
      showToast("Post content is empty.", "error");
      return;
    }

    try {
      showToast("Publishing to Facebook...", "success");

      const imageUrl = post.aiOutput;
      const pageId = pageData.pageId;
      const accessToken = pageData.pageAccessToken;

      let facebookPostId;

      if (imageUrl) {
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
          throw new Error(photoData.error?.message || "Failed to upload photo to Facebook");
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
          throw new Error(feedData.error?.message || "Failed to publish post to Facebook Feed");
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
        
        const emailResponse = await fetch('/api/send-post-published-email', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: localStorage.getItem("userId"),
            platform: "Facebook",
            businessName: pageName,
            locationName: pageName,
            postUrl: post.aiOutput,
          }),
        });
        
        const emailResult = await emailResponse.json();
        if (emailResult.success) {
          console.log("📧 Facebook post published email sent successfully");
        }
      } catch (emailError) {
        console.log("⚠️ Error sending Facebook post published email:", emailError.message);
      }

      await updatePostStatusAction({
        id: post._id,
        userId: localStorage.getItem("userId"),
        facebookPostId: facebookPostId,
        facebookPageAccessToken: accessToken,
        status: "posted",
        whenPosted: { ...post.whenPosted, facebook: true }
      });
      await fetchPosts(true); // Refresh posts to get the updated data

    } catch (err) {
      console.error("Facebook post error:", err);
      showToast(err.message || "Something went wrong posting to Facebook", "error");
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

    if (!post.aiOutput) {
      showToast("Post has no image to share.", "error");
      return;
    }

    try {
      showToast("Publishing to Instagram...", "success");

      const imageUrl = post.aiOutput;
      const igUserId = accountData.igId;
      const accessToken = accountData.pageAccessToken;

      // Step 1: Create Media Container
      const mediaContainerUrl = `https://graph.facebook.com/v24.0/${igUserId}/media`;
      const mediaContainerPayload = { image_url: imageUrl, caption: caption || "", access_token: accessToken };
      const mediaRes = await fetch(mediaContainerUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mediaContainerPayload) });
      const mediaData = await mediaRes.json();

      if (!mediaData.id) {
        console.error("Instagram API Error (Media Container):", mediaData);
        throw new Error(mediaData.error?.message || "Failed to create Instagram media container.");
      }

      // Step 2: Publish Media Container
      await new Promise(resolve => setTimeout(resolve, 4000)); // Delay for processing

      const publishUrl = `https://graph.facebook.com/v24.0/${igUserId}/media_publish`;
      const publishPayload = { creation_id: mediaData.id, access_token: accessToken };
      const publishRes = await fetch(publishUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(publishPayload) });
      const publishData = await publishRes.json();

      if (publishData.id) {
        showToast("Post published on Instagram 🎉", "success");

        // Send post published email notification for Instagram
        try {
          const igUsername = accountData.igUsername || "Instagram Account";
          
          const emailResponse = await fetch('/api/send-post-published-email', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: localStorage.getItem("userId"),
              platform: "Instagram",
              businessName: igUsername,
              locationName: igUsername,
            postUrl: post.aiOutput,
            }),
          });
          
          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            console.log("📧 Instagram post published email sent successfully");
          }
        } catch (emailError) {
          console.log("⚠️ Error sending Instagram post published email:", emailError.message);
        }

        await updatePostStatusAction({
          id: post._id,
          userId: localStorage.getItem("userId"),
          status: "posted",
          whenPosted: { ...post.whenPosted, instagram: true }
        });
        await fetchPosts(true);
      }
      else throw new Error(publishData.error?.message || "Failed to publish to Instagram.");

    } catch (err) {
      console.error("Instagram post error:", err);
      showToast(err.message, "error");
    }
  };

  const handleEditDescription = async (id, updates) => {
    const userId = localStorage.getItem("userId");

    let payloadUpdates = {};
    if (typeof updates === 'string') {
      payloadUpdates = { description: updates };
    } else {
      payloadUpdates = updates;
    }

    const payload = { id, userId, status: "pending", ...payloadUpdates };
    const data = await updatePostStatusAction(payload);

    if (data.success) {
      showToast("Description updated!");
      setPosts(prev => prev.map(p => (p._id === id ? { ...p, ...payloadUpdates, status: 'pending' } : p)));
      if (previewData?._id === id) {
        setPreviewData(prev => ({...prev, ...payloadUpdates}));
      }
    } else {
      showToast(data.error || "Failed to update description", "error");
    }
  };



  const handleDeleteFromGMB = async (post) => {
    // First, check if the post has been published anywhere.
    if (!post.locations || post.locations.length === 0) {
      showToast("This post hasn't been published to any locations yet.", "error");
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
    let selectedLocations = availableLocations.filter(loc =>
      selectedLocationIds.includes(loc.id)
    ).map(loc => ({ ...loc, isPosted: false }));

    // Normalize checkmark payload
    const checkmarkSource = checkmark || postToAction?.checkmark;
    let checkmarkPayload = "both"; // Default
    if (Array.isArray(checkmarkSource)) {
      if (checkmarkSource.includes("post") && checkmarkSource.includes("photo")) checkmarkPayload = "both";
      else if (checkmarkSource.includes("photo")) checkmarkPayload = "photo";
      else if (checkmarkSource.includes("post")) checkmarkPayload = "post";
    } else if (typeof checkmarkSource === "string" && checkmarkSource !== "$undefined") {
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
        checkmarkPayload
      );
      showToast(`Post scheduled for ${selectedLocationIds.length} locations on ${new Date(scheduledDateForLocations).toLocaleDateString()}!`, "success");

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
          showToast(`Insufficient wallet balance. Required: ${totalPostCost} coins`, "error");
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
          }
        });


        if (walletRes.message === "Wallet updated") {
          const newBalance = walletBalance - totalPostCost;
          setUserWallet(newBalance);
          localStorage.setItem("walletBalance", newBalance);
          showToast(`${totalPostCost} coins deducted (${selectedLocationIds.length} locations × 20 coins)`, "info");
          deductionSuccessful = true;
        } else {
          showToast(walletRes.error || "Wallet deduction failed", "error");
          setIsPosting(false);
          return;
        }

        // Prepare location data for webhook
        const locationData = selectedLocations.map(loc => ({
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
          const batchPayload = batch.map(b => ({
            city: b.city,
            cityName: b.cityName,
            bookUrl: b.bookUrl
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
              successfulLocations.push(...batch.map(b => b.originalLoc));

              // Update isPosted status incrementally for real-time updates
              const batchIds = batch.map(b => b.originalLoc.locationId);
              selectedLocations = selectedLocations.map(loc =>
                batchIds.includes(loc.locationId) ? { ...loc, isPosted: true } : loc
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
            const refundAmount = (selectedLocations.length - successfulLocations.length) * 20;
            await deductFromWalletAction(userId, {
              amount: refundAmount,
              type: "credit",
              reason: "Refund-Partial-Post-Failed",
              metadata: { originalReason: "Post-on-GMB" }
            });

            const userData = await getUserWalletAction(userId);
            setUserWallet(userData.wallet);
            localStorage.setItem("walletBalance", userData.wallet);

            showToast(`Posted to ${successfulLocations.length}/${selectedLocations.length} locations. Refunded failed ones.`, "warning");
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
              const emailResponse = await fetch('/api/send-post-published-email', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: userId,
                  platform: "Google My Business",
                  businessName: businessName,
                  locationName: locationName,
                  postUrl: postUrl,
                }),
              });
              
              const emailResult = await emailResponse.json();
              if (emailResult.success) {
                console.log("📧 Post published email sent successfully");
              } else {
                console.log("⚠️ Failed to send post published email:", emailResult.message);
              }
            } catch (emailError) {
              console.log("⚠️ Error sending post published email:", emailError.message);
              // Don't fail the post if email fails
            }
          }

          // Update post with successful locations
          await updatePostStatusAction({
            id: postToAction._id,
            locations: successfulLocations.map(loc => ({ ...loc, isPosted: true })),
            status: "posted",
            userId: userId,
            whenPosted: { ...postToAction.whenPosted, gmb: true }
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
            locations: selectedLocations
          });

          setPosts(prev => prev.map(p => p._id === postToAction._id ? {
            ...p,
            status: "failed",
            error: errorMsg,
            locations: selectedLocations
          } : p));
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
            }
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
    if (post.status !== "approved" && post.status !== "scheduled" && post.status !== "posted" && post.status !== "failed") {
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
    const locationsToDelete = postToAction.locations.filter(loc =>
      selectedLocationIds.includes(loc.id)
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
        (loc) => !selectedLocationIds.includes(loc.id)
      );

      const newStatus = remainingLocations.length === 0 ? 'approved' : postToAction.status;

      await updatePostStatusAction({
        id: postToAction._id,
        userId,
        locations: remainingLocations,
        status: newStatus
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
              : p
          )
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
    if (!post.aiOutput) {
      showToast("No image available to download.", "error");
      return
    }

    try {
      const apiUrl = `/api/downloadImage?url=${encodeURIComponent(post.aiOutput)}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        showToast("Failed to download image", "error");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `post-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      showToast("Image downloaded successfully! 📥");
    } catch (err) {
      showToast("Failed to download image", "error");
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


  useEffect(() => {
    const locationDetailsData = localStorage.getItem("locationDetails");

    if (!locationDetailsData) return;

    try {
      const parsedData = JSON.parse(locationDetailsData);

      if (!Array.isArray(parsedData)) return;

      // Get unique business titles
      const uniqueBusinesses = [];
      const seenTitles = new Set();

      parsedData.forEach((item) => {
        if (item?.title && !seenTitles.has(item.title)) {
          seenTitles.add(item.title);
          uniqueBusinesses.push(item);
        }
      });

      // Use first unique business title
      if (uniqueBusinesses.length > 0) {
        setBussinessTitle(uniqueBusinesses[0].title);
      }
    } catch (error) {
      console.error("Failed to parse locationDetails:", error);
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
  const filteredPosts = activeTab === "total" ? posts : posts.filter((post) => post.status === activeTab);

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
                const match = availableLocations.find((al) => al.locationId === l.locationId);
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
        {showFirstPostModal && (
          <FirstPostModal onClose={() => setShowFirstPostModal(false)} />
        )}
        {isPosting && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center space-y-4 sm:space-y-6 max-w-md w-full border-4 border-white/30">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-300/40 rounded-full blur-2xl animate-pulse"></div>
                <div className="text-6xl sm:text-8xl animate-bounce-slow">🚀</div>
              </div>
              <div className="text-center space-y-2 sm:space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black text-white">Publishing Post...</h3>
                <p className="text-blue-100 text-xs sm:text-sm">Sending to Google My Business</p>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-300 via-yellow-300 to-green-300 h-full rounded-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}
        {showSuccess && <SuccessOverlay onComplete={() => setShowSuccess(false)} postsCount={postsGeneratedCount} />}

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
                  checked={['gmb', 'fb', 'ig'].every(p => selectedPlatforms.includes(p))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlatforms(['gmb', 'fb', 'ig']);
                    } else {
                      setSelectedPlatforms([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-yellow-600 accent-yellow-400  focus:ring-yellow-600 transition-all"
                />
                <span className="text-sm font-semibold text-neutral-600  group-hover:text-gray-600">All</span>
              </label>

              {/* GMB */}
              <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
  <input
    type="checkbox"
    checked={selectedPlatforms.includes('gmb')}
    onChange={() =>
      setSelectedPlatforms(prev =>
        prev.includes('gmb')
          ? prev.filter(p => p !== 'gmb')
          : [...prev, 'gmb']
      )
    }
    className="w-4 h-4 rounded border-gray-300 text-yellow-600 accent-yellow-400  focus:ring-yellow-600 transition-all"
  />

  <div
    className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${
      selectedPlatforms.includes('gmb')
        ? 'bg-white border-blue-200 shadow-md scale-105'
        : 'bg-gray-50 border-gray-200 grayscale opacity-70 group-hover:opacity-100'
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
                  checked={selectedPlatforms.includes('fb')}
                  onChange={() => setSelectedPlatforms(prev => prev.includes('fb') ? prev.filter(p => p !== 'fb') : [...prev, 'fb'])}
                  className="w-4 h-4 rounded border-gray-300 text-yellow-600 accent-yellow-400  focus:ring-yellow-500 transition-all"
                />
                <div className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${selectedPlatforms.includes('fb') ? 'bg-[#1877F2] border-[#1877F2] text-white shadow-md scale-105' : 'bg-gray-50 border-gray-200 text-gray-400 grayscale opacity-70 group-hover:opacity-100'}`}>
                  <Facebook className="w-5 h-5 fill-current" />
                </div>
              </label>

              {/* Instagram */}
              <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes('ig')}
                  onChange={() => setSelectedPlatforms(prev => prev.includes('ig') ? prev.filter(p => p !== 'ig') : [...prev, 'ig'])}
                  className="w-4 h-4 rounded border-primary text-dark accent-yellow-400  focus:ring-pink-500 transition-all"
                />
                <div className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${selectedPlatforms.includes('ig') ? 'bg-gradient-to-tr from-[#FFD600] via-[#FF0169] to-[#D300C5] border-transparent text-white shadow-md scale-105' : 'bg-gray-50 border-gray-200 text-gray-400 grayscale opacity-70 group-hover:opacity-100'}`}>
                  <Instagram className="w-5 h-5" />
                </div>
              </label>
            </div>

            {/* 5000 > 2 video 2500  > 1 */}

            {/* Preview Button */}
            <a href={previewData?.aiOutput} target="_blank" rel="noopener noreferrer"
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

        {/* Main Content Area - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start ">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-7">
            <PostInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerateClick}
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
            />
          </div>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 ">
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
            <Lottie animationData={animationData} loop={true} className="w-32 h-32" />
            <p className="text-gray-500 mt-4 font-medium">Loading your creatives...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-10 sm:p-16 text-center border-3 border-dashed border-gray-300 shadow-xl">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No posts found</h3>
            <p className="text-gray-600 text-base">
              {activeTab === "total"
                ? "Create your first AI-powered post above!"
                : `No ${activeTab} posts yet`}
            </p>
          </div>
        )}
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
          <path d="M16 .667C7.64.667.667 7.64.667 16c0 2.77.72 5.47 2.08 7.87L.667 31.333 7.2 29.28c2.31 1.26 4.93 1.92 7.6 1.92 8.36 0 15.333-6.973 15.333-15.333S24.36.667 16 .667zm0 27.2c-2.42 0-4.78-.64-6.85-1.87l-.49-.29-4.07 1.07 1.09-3.97-.32-.51c-1.24-1.94-1.9-4.18-1.9-6.6 0-6.91 5.61-12.533 12.533-12.533 6.91 0 12.533 5.623 12.533 12.533S22.91 27.867 16 27.867zm7.15-9.63c-.39-.2-2.31-1.14-2.67-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.46.29-.85.1-.39-.2-1.64-.6-3.12-1.91-1.15-1.03-1.93-2.31-2.15-2.7-.23-.39-.02-.6.17-.79.17-.17.39-.46.59-.69.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.69-.1-.2-.88-2.12-1.21-2.9-.32-.78-.65-.67-.88-.68h-.76c-.26 0-.69.1-1.05.49-.36.39-1.37 1.34-1.37 3.27 0 1.93 1.41 3.79 1.61 4.05.2.26 2.78 4.24 6.73 5.95 3.95 1.72 3.95 1.15 4.66 1.08.72-.07 2.31-.94 2.64-1.85.33-.92.33-1.71.23-1.85-.1-.13-.36-.23-.75-.39z" />
        </svg>
      </a>
    </div>
  );
}  