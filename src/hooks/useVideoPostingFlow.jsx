"use client";

/**
 * Approve → publish flow for AI-video pages (Image To Video, Text To Video).
 *
 * The handlers and modals are copied from /post-management/page.jsx so a video
 * Post behaves exactly like it does there: Approve / Reject, then Post to GMB
 * (location picker, 20 coins per location, refunds on failure), FB Pages,
 * Instagram, Pinterest (incl. the inhouse flow), LinkedIn, YouTube and Schedule.
 * /post-management keeps its own copy — a posting fix there must be mirrored here.
 *
 * Usage:
 *   const { cardProps, modals } = useVideoPostingFlow({ userId, posts, setPosts, fetchPosts, showToast });
 *   ...
 *   {modals}
 *   <PostCard post={post} {...cardProps} />
 *
 * The calling page must sit under a <Suspense> boundary (useYouTube reads search params).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  updatePostStatusAction,
  deductFromWalletAction,
  getUserWalletAction,
} from "@/app/actions/postActions";
import { emitWalletDeduct, emitWalletCredit } from "@/utils/walletEvents";
import { useSession } from "@/hooks/useAppSession";
import { getLocalStorage, getSessionStorage } from "@/utils/storage";
import { metaPublishMedia, postVideoUrl } from "@/lib/postMediaUrls";
import { usePostManagementActions } from "@/hooks/usePostManagementActions";
import { usePinterest } from "@/hooks/usePinterest";
import { useLinkedin } from "@/hooks/useLinkedin";
import { useYouTube } from "@/hooks/useYouTube";

import ScheduleModal from "@/components/post-management/ScheduleModal";
import ScheduleConfirmationModal from "@/components/post-management/ScheduleConfirmationModal";
import FacebookShareModal from "@/components/post-management/FacebookShareModal";
import InstagramShareModal from "@/components/post-management/InstagramShareModal";
import PinterestShareModal from "@/components/post-management/PinterestShareModal";
import InhousePinterestShareModal from "@/components/post-management/InhousePinterestShareModal";
import YouTubeShareModal from "@/components/post-management/YouTubeShareModal";
import LinkedinShareModal from "@/components/post-management/LinkedinShareModal";
import PostResultModal from "@/components/post-management/PostResultModal";
import GMBModal from "@/components/post-management/component-modal/GmbModall";
import PostPublishModal from "@/components/post-management/component-modal/PostPublishModal";
import LocationSelectionModal from "@/components/LocationSelectionModal";
import InsufficientBalanceModal from "@/components/InsufficientBalanceModal";
import RejectReasonModal from "@/components/RejectReasonModal";

const VIDEO_GENERATION_COINS = 200;
const INHOUSE_PINTEREST_EMAIL = "rocare7@gmail.com";
const POSTING_MESSAGES = ["Please wait...", "Posting...", "Uploading...", "Finalizing..."];
const MESSAGE_INTERVAL = 1500;

const buildWhenPostedUpdate = (platform, postId = "") => ({
  [platform]: {
    posted: true,
    postedDate: new Date().toISOString(),
    ...(postId ? { postId } : {}),
  },
});

export function useVideoPostingFlow({ userId, posts, setPosts, fetchPosts, showToast }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [uiState, setUiState] = useState({
    showInsufficientBalance: false,
    isScheduleModalOpen: false,
    showScheduleConfirmation: false,
    showRejectModal: false,
    showLocationModal: false,
    showFacebookModal: false,
    showInstagramModal: false,
    showPinterestModal: false,
    showInhousePinterestModal: false,
    showLinkedinModal: false,
    showPostResultModal: false,
    showYouTubeModal: false,
  });
  const updateUiState = useCallback((updates) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  }, []);

  const [userWallet, setUserWallet] = useState(0);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const [showGmbExpiredModal, setShowGmbExpiredModal] = useState(false);
  const [bussinessTitle, setBussinessTitle] = useState("");
  const [availableLocations, setAvailableLocations] = useState([]);

  const [postResultData, setPostResultData] = useState({ successLocs: [], failedLocs: [] });
  const [lastPostMeta, setLastPostMeta] = useState(null);
  const [isReposting, setIsReposting] = useState(false);

  const [postToAction, setPostToAction] = useState(null);
  const [postToSchedule, setPostToSchedule] = useState(null);
  const [scheduledPlatforms, setScheduledPlatforms] = useState({ gmb: [], fb: [], ig: [] });
  const [rejectPostId, setRejectPostId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedMediaForAction, setSelectedMediaForAction] = useState(null);

  const [socialState, setSocialState] = useState({
    facebookPages: [],
    loadingFbPages: false,
    postToFacebook: null,
    instagramAccounts: [],
    loadingIgAccounts: false,
    postToInstagram: null,
    postToYouTube: null,
  });
  const updateSocialState = useCallback((updates) => {
    setSocialState((prev) => ({ ...prev, ...updates }));
  }, []);

  const [inhousePinterestContent, setInhousePinterestContent] = useState(null);
  const [isGeneratingInhousePinterest, setIsGeneratingInhousePinterest] = useState(false);

  const [dots, setDots] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [postingPlatform, setPostingPlatform] = useState("Google Business");
  const [msgIndex, setMsgIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

  const {
    youtubeChannels,
    loading: loadingYoutubeChannels,
    fetchYouTubeChannels,
  } = useYouTube(router, searchParams);

  const {
    pinterestProfiles,
    publishPin,
    createPinterestBoard,
    inhouseMappings,
    fetchInhouseMappings,
    fetchPinterestProfiles,
    generateInhousePinterestContent,
    publishInhousePins,
  } = usePinterest(null, null);

  const { linkedinPages, publishLinkedinPost } = useLinkedin(null, null);

  const activeUserEmail = useMemo(() => {
    const impersonatedEmail =
      getLocalStorage("impersonatedEmail") || getSessionStorage("impersonatedEmail");
    const email =
      getLocalStorage("email") ||
      getLocalStorage("userEmail") ||
      getSessionStorage("email") ||
      getSessionStorage("userEmail");
    return String(impersonatedEmail || email || session?.user?.email || "")
      .trim()
      .toLowerCase();
  }, [session?.user?.email]);

  const isInhousePinterestUser = activeUserEmail === INHOUSE_PINTEREST_EMAIL;

  const {
    isPosting,
    setIsPosting,
    convertingVideoPostId,
    handleFacebookPost: handleFacebookPostAction,
    handleInstagramPost: handleInstagramPostAction,
  } = usePostManagementActions({
    userId,
    session,
    fetchPosts,
    setPosts,
    // Video pages have no single preview pane — every video is its own PostCard.
    setPreviewData: () => {},
    setUserWallet,
    setRequiredCoins,
    setShowInsufficientBalance: (val) => updateUiState({ showInsufficientBalance: val }),
    showToast,
    setIsSuccess,
    setPostingPlatform,
  });

  /* -------------------- Init: locations + cached wallet -------------------- */
  useEffect(() => {
    const stored = getLocalStorage("locationDetails");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAvailableLocations(
          parsed.map((loc, index) => ({
            id: loc.id || index + 1,
            name: loc.name || loc.title || `Location ${index + 1}`,
            address:
              loc.address ||
              loc.storefrontAddress?.addressLines?.join(", ") ||
              "Address not available",
            city: loc.city || "",
            ...loc,
          }))
        );
        if (parsed.length) setBussinessTitle(parsed[0].title);
      } catch {
        setAvailableLocations([]);
      }
    }
    const bal = getLocalStorage("walletBalance");
    if (bal) setUserWallet(parseInt(bal, 10));
  }, []);

  useEffect(() => {
    if (!isInhousePinterestUser) return;
    fetchInhouseMappings();
    fetchPinterestProfiles();
  }, [isInhousePinterestUser, fetchInhouseMappings, fetchPinterestProfiles]);

  /* -------------------- Posting progress modal timers -------------------- */
  useEffect(() => {
    if (!isPosting) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [isPosting]);

  useEffect(() => {
    if (!isPosting) return;
    setTimeLeft(20);
    setMsgIndex(0);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % POSTING_MESSAGES.length);
    }, MESSAGE_INTERVAL);
    return () => {
      clearInterval(timer);
      clearInterval(msgInterval);
    };
  }, [isPosting]);

  /* ====================================================================
     HANDLERS — copied from /post-management/page.jsx
     ==================================================================== */
  const handleGmbSessionExpired = useCallback(() => {
    setShowGmbExpiredModal(true);
  }, []);

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
      meta = null
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
        const payload = {
          id: postId,
          userId,
          status: newStatus,
          scheduledDate: scheduleDate,
          locations,
          checkmark,
          scheduledDateSource: sources,
          mediaType: checkmark === "video" ? "video" : undefined,
          fbPages,
          igPages,
          refreshToken: newStatus === "scheduled" ? session?.refreshToken : undefined,
        };
        if (meta) payload.meta = meta;

        const res = await updatePostStatusAction(payload);
        if (res.success) {
          showToast("Updated! ✅");
          setPosts((prev) =>
            prev.map((p) => (p._id === postId ? { ...p, ...res.data, status: newStatus } : p))
          );
        }
      } catch (e) {
        showToast("Error", "error");
      }
    },
    [userId, session?.refreshToken, updateUiState, showToast, setPosts]
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
        if (
          sources.includes("gmb") &&
          (!session || !session.accessToken || session.error === "RefreshAccessTokenError")
        ) {
          handleGmbSessionExpired();
          return;
        }

        const gmbLocs = availableLocations.filter((loc) => selectedTargets.gmb.includes(loc.id));
        const selectedCheckmark = selectedTargets.checkmark || post.checkmark;
        const selectedMediaType = selectedTargets.mediaType || "image";

        const hasValidVideoOutput =
          typeof post.videoOutput === "string" && post.videoOutput.trim().length > 0;
        const isVideoIntent = selectedMediaType === "video" || selectedCheckmark === "video";
        const isVideoSchedule = isVideoIntent && hasValidVideoOutput;

        const scheduleImageUrl = post.aiOutput || "";
        const scheduleVideoUrl = isVideoSchedule ? post.videoOutput : "";
        const scheduleMediaType = isVideoSchedule ? "video" : "image";
        const getInstagramId = (account = {}) => account.igId || account.igUserId || account.id;

        const fbPages = socialState.facebookPages
          .filter((p) => selectedTargets.fb.includes(p.pageId))
          .map((p) => ({
            pageId: p.pageId,
            pageAccessToken: p.pageAccessToken,
            pageName: p.pageName,
            caption: post.fbDescription || post.description || "",
            imageUrl: scheduleImageUrl,
            videoUrl: scheduleVideoUrl,
            mediaType: scheduleMediaType,
            isPosted: false,
            error: "",
          }));
        const igPages = socialState.instagramAccounts
          .filter((a) => selectedTargets.ig.includes(getInstagramId(a)))
          .map((a) => ({
            igUserId: getInstagramId(a),
            pageId: a.pageId,
            accessToken: a.pageAccessToken || a.accessToken,
            igUsername: a.igUsername,
            caption: post.igDescription || post.description || "",
            imageUrl: scheduleImageUrl,
            videoUrl: scheduleVideoUrl,
            mediaType: scheduleMediaType,
            isPosted: false,
            error: "",
          }));

        setScheduledPlatforms({ gmb: gmbLocs, fb: fbPages, ig: igPages });
        await handleUpdateStatus(
          postId,
          "scheduled",
          selectedDate,
          gmbLocs,
          selectedTargets.checkmark || post.checkmark,
          sources,
          fbPages,
          igPages,
          selectedTargets.meta
        );
        updateUiState({ isScheduleModalOpen: false, showScheduleConfirmation: true });
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
      handleGmbSessionExpired,
      session,
    ]
  );

  const fetchFacebookPages = useCallback(async () => {
    if (socialState.facebookPages.length > 0) return;
    updateSocialState({ loadingFbPages: true });
    try {
      const res = await fetch(`/api/facebook/pages?userId=${userId}`).then((r) => r.json());
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
    [fetchFacebookPages, updateUiState, updateSocialState]
  );

  const fetchInstagramAccounts = useCallback(async () => {
    if (socialState.instagramAccounts.length > 0) return;
    updateSocialState({ loadingIgAccounts: true });
    try {
      const res = await fetch(`/api/instagram/pages?userId=${userId}`).then((r) => r.json());
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
    [fetchInstagramAccounts, updateUiState, updateSocialState]
  );

  const handlePinterestPost = useCallback(
    async (post, media = null) => {
      let mediaWithCover = media;
      if (!mediaWithCover && post) {
        const vidUrl = postVideoUrl(post);
        if (vidUrl) {
          mediaWithCover = { type: "video", url: vidUrl, coverImageUrl: post.aiOutput };
        }
      }

      setSelectedMediaForAction(mediaWithCover);
      updateSocialState({ postToPinterest: post });

      if (isInhousePinterestUser) {
        updateUiState({ showInhousePinterestModal: true });
        setInhousePinterestContent(null);
        setIsGeneratingInhousePinterest(true);

        const coverUrl = mediaWithCover?.coverImageUrl || post.aiOutput;
        const result = await generateInhousePinterestContent(coverUrl);
        if (result?.success) setInhousePinterestContent(result.content || {});

        setIsGeneratingInhousePinterest(false);
        fetchInhouseMappings();
        return;
      }

      updateUiState({ showPinterestModal: true });
    },
    [
      fetchInhouseMappings,
      generateInhousePinterestContent,
      isInhousePinterestUser,
      updateUiState,
      updateSocialState,
    ]
  );

  const handlePublishInhousePins = useCallback(
    async ({ post, boards, title, description, hashtags, media_url }) => {
      const resolvedMediaUrl =
        selectedMediaForAction?.coverImageUrl || post.aiOutput || media_url;

      const result = await publishInhousePins({
        boards,
        title,
        description,
        hashtags,
        media_url: resolvedMediaUrl,
      });

      if (result?.success) {
        updateUiState({ showInhousePinterestModal: false });
        setSelectedMediaForAction(null);
        setPostingPlatform("Pinterest");
        setIsSuccess(true);

        await updatePostStatusAction({
          id: post._id,
          userId,
          status: "posted",
          postedPlatform: "pinterest",
          whenPosted: buildWhenPostedUpdate(
            "pinterest",
            result.results?.find((item) => item.success)?.pin?.id || ""
          ),
        });
        fetchPosts(1, true);
      }

      return result;
    },
    [fetchPosts, publishInhousePins, selectedMediaForAction, updateUiState, userId]
  );

  const handleLinkedinPost = useCallback(
    (post, media = null) => {
      setSelectedMediaForAction(media);
      updateSocialState({ postToLinkedin: post });
      updateUiState({ showLinkedinModal: true });
    },
    [updateUiState, updateSocialState]
  );

  const handleYoutubePost = useCallback(
    (post, media = null) => {
      setSelectedMediaForAction(media);
      updateSocialState({ postToYouTube: post });
      updateUiState({ showYouTubeModal: true });
      fetchYouTubeChannels();
    },
    [fetchYouTubeChannels, updateUiState, updateSocialState]
  );

  const handleYouTubePostAction = useCallback(
    async (post, channel, caption, media = null) => {
      if (!post) return;
      const publishMedia = media || metaPublishMedia(post);
      if (!publishMedia?.url) {
        showToast("Post has no video to upload to YouTube", "error");
        return;
      }

      try {
        setPostingPlatform("YouTube");
        setIsPosting(true);
        showToast("Uploading to YouTube...", "success");

        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("channelId", channel.channelId || channel.id);
        formData.append("title", post.title || post.description?.slice(0, 80) || "YouTube Shorts");
        formData.append("description", (caption || post.description || "") + "\n#shorts");
        formData.append("mediaUrl", publishMedia.url);
        formData.append("privacyStatus", "public");
        formData.append("isShort", "true");

        const res = await fetch("/api/youtube/publish", { method: "POST", body: formData });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`YouTube API error (${res.status}): ${errorText}`);
        }

        let data;
        try {
          data = await res.json();
        } catch {
          throw new Error("Invalid JSON response from server");
        }
        if (!data.success) throw new Error(data.error || "Upload failed");

        setIsSuccess(true);
        showToast("Video uploaded to YouTube 🎉", "success");

        const youtubePostId = data.data?.id || data.id || "";
        await updatePostStatusAction({
          id: post._id,
          userId,
          status: "posted",
          postedPlatform: "youtube",
          whenPosted: buildWhenPostedUpdate("youtube", youtubePostId),
          mediaStatus: { video: "posted" },
        });

        await fetchPosts(1, true);
      } catch (err) {
        console.error("YouTube upload error:", err);
        showToast(err.message || "Failed to upload to YouTube", "error");
      } finally {
        setTimeout(() => setIsPosting(false), 1000);
      }
    },
    [fetchPosts, setIsPosting, showToast, userId]
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
        setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, ...res.data } : p)));
      }
    },
    [userId, showToast, setPosts]
  );

  const handleLocationConfirm = useCallback(
    async (selectedIds, checkmark, meta = {}) => {
      updateUiState({ showLocationModal: false });
      if (!selectedIds.length || !postToAction) return;
      const totalCost = selectedIds.length * 20;

      try {
        const userData = await getUserWalletAction(userId);
        const balance =
          userData?.wallet ??
          userData?.data?.wallet ??
          userData?.user?.wallet ??
          userData?.coins ??
          0;
        setUserWallet(balance);

        if (balance < totalCost) {
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
          walletRes?.message === "Wallet debited" ||
          walletRes?.success === true ||
          walletRes?.status === "success" ||
          walletRes?.ok === true;

        if (!deductOk) {
          throw new Error(walletRes?.error || walletRes?.message || "Wallet deduction failed");
        }

        emitWalletDeduct(totalCost);

        const locs = availableLocations.filter((l) => selectedIds.includes(l.id));

        const formatDate = (dateStr) => {
          if (!dateStr) return "";
          const [year, month, day] = dateStr.split("-");
          return `${day}-${month}-${year}`;
        };

        const isVideoSelection = checkmark === "video" || selectedMediaForAction?.type === "video";
        let mediaUrl = "";

        if (isVideoSelection) {
          if (checkmark === "video") {
            mediaUrl = postToAction.videoOutput || selectedMediaForAction?.url || "";
          } else {
            mediaUrl = selectedMediaForAction?.url || postToAction.videoOutput || "";
          }
        } else if (
          checkmark === "post" ||
          checkmark === "photo" ||
          checkmark === "both" ||
          !checkmark
        ) {
          mediaUrl = postToAction.aiOutput || selectedMediaForAction?.url || "";
        } else {
          mediaUrl = selectedMediaForAction?.url || postToAction.aiOutput || "";
        }

        const customUrl = (meta.customUrl || "").trim();

        const locationDataBatch = locs.map((l) => ({
          city: l.locationId,
          cityName: l.locality,
          bookUrl:
            !isVideoSelection && meta.ctaType === "call_now"
              ? l.primaryPhone || ""
              : customUrl || l.websiteUrl || "",
          account: l.accountId,
        }));

        const payload = {
          postId: postToAction._id,
          userId,
          account: locs[0].accountId,
          locationData: locationDataBatch,
          output: isVideoSelection ? "" : mediaUrl,
          video_url: isVideoSelection ? mediaUrl : "",
          description: postToAction.description,
          accessToken: session?.accessToken,
          checkmark: checkmark || "post",
          post_type: isVideoSelection ? "standard" : meta.postType || "standard",
          cta: isVideoSelection ? "learn_more" : meta.ctaType || "book",
          startDate: isVideoSelection ? "" : formatDate(meta.startDate),
          endDate: isVideoSelection ? "" : formatDate(meta.endDate),
          tittle: isVideoSelection ? "" : meta.eventTitle || "",
          wait_video: false,
        };

        const gmbResponse = await fetch("/api/gmb/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const gmbData = await gmbResponse.json().catch(() => ({}));
        const postres = {
          ok: gmbResponse.ok && gmbData?.ok !== false,
          data: gmbData?.data ?? gmbData,
        };

        let successfulLocs = [];
        let failedLocs = [];

        const responseData = postres.data?.data || postres.data || {};
        const successList = responseData.success || [];
        const failList = responseData.fail || [];
        const postedDate = new Date().toISOString();

        if (postres.ok && (successList.length > 0 || failList.length > 0)) {
          successList.forEach((s) => {
            const loc = locs.find((l) => l.locationId === s.location_id);
            if (loc) successfulLocs.push({ ...loc, isPosted: true, postedAt: postedDate });
          });
          failList.forEach((f) => {
            const loc = locs.find((l) => l.locationId === f.location_id);
            if (loc) failedLocs.push(loc);
          });
          if (successfulLocs.length + failedLocs.length < locs.length) {
            locs.forEach((l) => {
              if (
                !successfulLocs.find((s) => s.id === l.id) &&
                !failedLocs.find((f) => f.id === l.id)
              ) {
                failedLocs.push(l);
              }
            });
          }
        } else if (postres.ok && successList.length === 0 && failList.length === 0) {
          successfulLocs = locs.map((l) => ({ ...l, isPosted: true, postedAt: postedDate }));
        } else {
          failedLocs = [...locs];
        }

        if (failedLocs.length > 0) {
          const refundAmount = failedLocs.length * 20;
          await deductFromWalletAction(userId, {
            amount: refundAmount,
            type: "credit",
            reason: "Refund-Post-Failed-Partial",
          });
          setUserWallet((prev) => prev + refundAmount);
          emitWalletCredit(refundAmount);
          showToast(
            `Posted to ${successfulLocs.length}, Failed: ${failedLocs.length}. Refunded ₹${refundAmount}`,
            "warning"
          );
        } else if (successfulLocs.length > 0) {
          showToast(`Successfully posted to all ${successfulLocs.length} locations! 🎉`);
        }

        if (successfulLocs.length > 0) {
          const locMap = new Map();
          [...(postToAction.locations || []), ...successfulLocs].forEach((loc) => {
            const key = loc.id || loc.locationId;
            if (key) locMap.set(key, loc);
          });

          await updatePostStatusAction({
            id: postToAction._id,
            userId,
            locations: Array.from(locMap.values()),
            status: "posted",
            postedPlatform: "gmb",
            whenPosted: { gmb: { posted: true, postedDate } },
            mediaStatus: {
              [selectedMediaForAction?.type === "video" ? "video" : "image"]: "posted",
            },
          });
          fetchPosts(1, true);
        }

        setPostResultData({ successLocs: successfulLocs, failedLocs });
        setLastPostMeta({ checkmark, meta, postToAction, selectedMediaForAction });
        updateUiState({ showPostResultModal: true });
      } catch (err) {
        showToast(err.message || "Post failed", "error");
      } finally {
        setTimeout(() => setIsPosting(false), 1200);
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
    ]
  );

  const closeResultModal = useCallback(() => {
    updateUiState({ showPostResultModal: false });
    setPostToAction(null);
    setSelectedMediaForAction(null);
    setLastPostMeta(null);
  }, [updateUiState]);

  const handleRepostFailed = useCallback(async () => {
    if (!lastPostMeta || postResultData.failedLocs.length === 0) return;
    setIsReposting(true);
    await handleLocationConfirm(
      postResultData.failedLocs.map((l) => l.id),
      lastPostMeta.checkmark,
      lastPostMeta.meta
    );
    setIsReposting(false);
  }, [lastPostMeta, postResultData.failedLocs, handleLocationConfirm]);

  const handlePost = useCallback(
    async (post, media = null) => {
      if (!["approved", "scheduled", "posted", "partial_failed", "failed"].includes(post.status)) {
        return showToast("Approve first", "error");
      }
      if (!session || !session.accessToken || session.error === "RefreshAccessTokenError") {
        setShowGmbExpiredModal(true);
        return;
      }

      const userData = await getUserWalletAction(userId);
      setUserWallet(userData.wallet || 0);
      setPostToAction(post);
      setSelectedMediaForAction(media);
      updateUiState({ showLocationModal: true });
    },
    [userId, updateUiState, showToast, session]
  );

  const handleReject = useCallback(
    (id) => {
      if (confirm("Reject this post?")) {
        setRejectPostId(id);
        updateUiState({ showRejectModal: true });
      }
    },
    [updateUiState]
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
        prev.map((p) => (p._id === rejectPostId ? { ...p, status: "rejected" } : p))
      );
      updateUiState({ showRejectModal: false });
    }
  }, [rejectPostId, rejectReason, userId, updateUiState, showToast, setPosts]);

  // Videos live on S3, which blocks cross-origin blob reads — go through our own proxy.
  const handleDownload = useCallback(
    async (post) => {
      const url = postVideoUrl(post) || post.aiOutput;
      const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url || "") || post.mediaType === "video";
      const filename = `limbu-ai-video-${Date.now()}.${isVideo ? "mp4" : "jpg"}`;
      try {
        const res = await fetch(
          `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`
        );
        if (!res.ok) throw new Error(`Download failed (${res.status}).`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 200);
      } catch (err) {
        showToast(err.message || "Download failed", "error");
      }
    },
    [showToast]
  );

  const handleShare = useCallback(
    (post) => {
      const url = postVideoUrl(post) || post.aiOutput;
      if (navigator.share) {
        navigator.share({ title: "Video", text: post.description, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        showToast("Copied! 📋");
      }
    },
    [showToast]
  );

  /* ---------------------------- PostCard props ---------------------------- */
  const cardProps = {
    handleDownload,
    handleShare,
    onUpdateStatus: handleUpdateStatus,
    onReject: handleReject,
    handlePost,
    onEditDescription: handleEditDescription,
    handleFacebookPost,
    handleInstagramPost,
    handlePinterestPost,
    handleLinkedinPost,
    handleYoutubePost,
    // These posts are already videos; PostCard only shows this CTA for image-only posts.
    onConvertToVideo: () => showToast("Ye post pehle se video hai.", "info"),
    convertingVideoPostId,
    videoGenerationCoins: VIDEO_GENERATION_COINS,
  };

  /* ---------------------------- Modals ---------------------------- */
  const modals = (
    <>
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
          setShowInsufficientBalance={(val) => updateUiState({ showInsufficientBalance: val })}
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
          onConfirm={async (p, selectedPages, c) => {
            updateUiState({ showFacebookModal: false });
            const pagesToPost = Array.isArray(selectedPages)
              ? selectedPages
              : [selectedPages].filter(Boolean);
            await handleFacebookPostAction(p, pagesToPost, c, selectedMediaForAction);
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
          onClose={() => {
            updateUiState({ showInstagramModal: false });
            setSelectedMediaForAction(null);
          }}
          onConfirm={(p, selectedAccounts, c, igVideoKind) => {
            updateUiState({ showInstagramModal: false });
            const accountsToPost = Array.isArray(selectedAccounts)
              ? selectedAccounts
              : [selectedAccounts].filter(Boolean);
            handleInstagramPostAction(p, accountsToPost, c, igVideoKind, selectedMediaForAction);
            setSelectedMediaForAction(null);
          }}
          post={socialState.postToInstagram}
          selectedMedia={selectedMediaForAction}
          accounts={socialState.instagramAccounts}
          loading={socialState.loadingIgAccounts}
        />
      )}
      {uiState.showPinterestModal && (
        <PinterestShareModal
          isOpen={uiState.showPinterestModal}
          onClose={() => updateUiState({ showPinterestModal: false })}
          post={socialState.postToPinterest}
          pinterestProfiles={pinterestProfiles}
          onCreateBoard={createPinterestBoard}
          coverImageUrl={
            selectedMediaForAction?.coverImageUrl || socialState.postToPinterest?.aiOutput
          }
          defaultTitle={bussinessTitle || "Pinterest Post"}
          defaultLink={availableLocations[0]?.websiteUrl || ""}
          onPost={async (post, boardId, coverImageUrl, edited = {}) => {
            const mediaUrl = selectedMediaForAction?.url || post.aiOutput;

            let description =
              edited.description ||
              post.piDescription ||
              post.pinterestDescription ||
              post.description ||
              post.fbDescription ||
              "";
            if (description.length > 800) description = description.substring(0, 797) + "...";

            const finalCoverImageUrl = post.aiOutput || coverImageUrl;

            const result = await publishPin({
              title: edited.title || bussinessTitle || "Pinterest Post",
              description,
              boardId,
              mediaUrl,
              link: edited.link || availableLocations[0]?.websiteUrl || "",
              coverImageUrl: finalCoverImageUrl,
            });

            if (result && result.success) {
              updateUiState({ showPinterestModal: false });
              setSelectedMediaForAction(null);
              setPostingPlatform("Pinterest");
              setIsSuccess(true);

              await updatePostStatusAction({
                id: post._id,
                userId,
                status: "posted",
                postedPlatform: "pinterest",
                whenPosted: buildWhenPostedUpdate("pinterest", result.data?.id || result.id || ""),
              });
              fetchPosts(1, true);
            }

            return result;
          }}
        />
      )}
      {uiState.showInhousePinterestModal && (
        <InhousePinterestShareModal
          isOpen={uiState.showInhousePinterestModal}
          onClose={() => {
            updateUiState({ showInhousePinterestModal: false });
            setSelectedMediaForAction(null);
          }}
          post={socialState.postToPinterest}
          pinterestProfiles={pinterestProfiles}
          mappings={inhouseMappings}
          aiContent={inhousePinterestContent}
          isGeneratingContent={isGeneratingInhousePinterest}
          onCreateBoard={createPinterestBoard}
          onPublish={handlePublishInhousePins}
        />
      )}
      {uiState.showYouTubeModal && (
        <YouTubeShareModal
          isOpen={uiState.showYouTubeModal}
          onClose={() => updateUiState({ showYouTubeModal: false })}
          post={socialState.postToYouTube}
          channels={youtubeChannels}
          loading={loadingYoutubeChannels}
          onConfirm={(post, channel, caption) => {
            updateUiState({ showYouTubeModal: false });
            handleYouTubePostAction(post, channel, caption, selectedMediaForAction);
            setSelectedMediaForAction(null);
          }}
        />
      )}

      <LinkedinShareModal
        isOpen={uiState.showLinkedinModal}
        onClose={() => updateUiState({ showLinkedinModal: false })}
        post={socialState.postToLinkedin}
        linkedinPages={linkedinPages}
        onPost={async (post, pageId) => {
          const mediaUrl = selectedMediaForAction?.url || post.aiOutput;
          const isVideo =
            selectedMediaForAction?.type === "video" ||
            (!selectedMediaForAction && post.videoOutput && mediaUrl === post.videoOutput) ||
            (mediaUrl && mediaUrl.includes(".mp4"));
          const mediaType = isVideo ? "video" : "image";
          const text = post.linkedinDescription || post.liDescription || "";
          const selectedPage = linkedinPages.find((p) => p.pageId === pageId);

          const result = await publishLinkedinPost({
            text,
            mediaUrl,
            mediaType,
            pageId,
            pageName: selectedPage?.pageName || "",
          });

          if (result && result.success) {
            updateUiState({ showLinkedinModal: false });
            setSelectedMediaForAction(null);
            setPostingPlatform("LinkedIn");
            setIsSuccess(true);

            await updatePostStatusAction({
              id: post._id,
              userId,
              status: "posted",
              postedPlatform: "linkedin",
              whenPosted: buildWhenPostedUpdate("linkedin", result.data?.id || result.id || ""),
            });
            fetchPosts(1, true);
          }

          return result;
        }}
      />

      <PostResultModal
        isOpen={uiState.showPostResultModal}
        onClose={closeResultModal}
        successLocs={postResultData.successLocs}
        failedLocs={postResultData.failedLocs}
        onRepost={handleRepostFailed}
        isReposting={isReposting}
        isVideo={
          lastPostMeta?.checkmark === "video" ||
          lastPostMeta?.selectedMediaForAction?.type === "video"
        }
      />

      <PostPublishModal
        isPosting={isPosting}
        isSuccess={isSuccess}
        setIsSuccess={setIsSuccess}
        postingPlatform={postingPlatform}
        messages={POSTING_MESSAGES}
        msgIndex={msgIndex}
        timeLeft={timeLeft}
        dots={dots}
      />

      <GMBModal
        showGmbExpiredModal={showGmbExpiredModal}
        setShowGmbExpiredModal={setShowGmbExpiredModal}
      />
    </>
  );

  return { cardProps, modals };
}
