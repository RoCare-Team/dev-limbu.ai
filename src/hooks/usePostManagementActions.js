import { useState } from "react";
import {
  updatePostStatusAction,
  deductFromWalletAction,
  getUserWalletAction,
} from "@/app/actions/postActions";
import { metaPublishMedia, postImageUrl } from "@/lib/postMediaUrls";
import { emitWalletDeduct, emitWalletCredit } from "@/utils/walletEvents";

export function usePostManagementActions({
  userId,
  session,
  fetchPosts,
  setPosts,
  setPreviewData,
  setUserWallet,
  setRequiredCoins,
  setShowInsufficientBalance,
  showToast,
  setIsSuccess,
  setPostingPlatform,
}) {
  const [isPosting, setIsPosting] = useState(false);
  const [convertingVideoPostId, setConvertingVideoPostId] = useState(null);

  const VIDEO_GENERATION_COINS = 200;

  const handleFacebookPost = async (
    post,
    pageData,
    caption,
    forcedMedia = null,
  ) => {
    // If forcedMedia is provided, we use it directly.
    // This allows the user to choose between videoOutput and aiOutput manually.
    const media = forcedMedia || metaPublishMedia(post);
    if (!caption?.trim() && !media.url) {
      showToast("Post content is empty.", "error");
      return;
    }

    try {
      if (setPostingPlatform) setPostingPlatform("Facebook");
      setIsPosting(true);
      showToast("Publishing to Facebook...", "success");

      const res = await fetch("/api/facebook/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post,
          pageData,
          caption,
          media,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish to Facebook");
      }

      if (setIsSuccess) setIsSuccess(true);
      showToast("Post published on Facebook 🎉", "success");
      await fetchPosts(1, true);
    } catch (err) {
      console.error("Facebook post error:", err);
      showToast(
        err.message || "Something went wrong posting to Facebook",
        "error",
      );
    } finally {
      setTimeout(() => {
        setIsPosting(false);
      }, 1000);
    }
  };

  const handleInstagramPost = async (
    post,
    accountData,
    caption,
    instagramVideoMediaType,
    forcedMedia = null,
  ) => {
    // Priority to forcedMedia (user selection), then default detection
    const media = forcedMedia || metaPublishMedia(post);
    if (!media.url) {
      showToast("Post has no media to share.", "error");
      return;
    }

    try {
      if (setPostingPlatform) setPostingPlatform("Instagram");
      setIsPosting(true);
      showToast("Publishing to Instagram...", "success");

      const res = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post,
          accountData,
          caption,
          media,
          userId,
          instagramVideoMediaType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish to Instagram");
      }

      if (setIsSuccess) setIsSuccess(true);
      showToast("Post published on Instagram 🎉", "success");
      await fetchPosts(1, true);
    } catch (err) {
      console.error("Instagram post error:", err);
      showToast(
        err.message || "Something went wrong posting to Instagram",
        "error",
      );
    } finally {
      setTimeout(() => {
        setIsPosting(false);
      }, 1000);
    }
  };

  const handleAutoConvertToVideo = async (post, prompt) => {
    if (!userId || !post?._id) return;

    const source = postImageUrl(post);
    if (!source)
      return showToast("No still image on this post to convert.", "error");

    const promptBase =
      (post.promat && String(post.promat).trim()) ||
      prompt.trim() ||
      (post.description && String(post.description).trim()) ||
      "";
    if (!promptBase)
      return showToast(
        "No saved prompt on this post — use Customize below.",
        "error",
      );

    // ✅ Check wallet upfront
    const userWalletData = await getUserWalletAction(userId);
    const balance = userWalletData?.wallet ?? userWalletData?.data?.wallet ?? 0;
    setUserWallet(balance);
    if (balance < VIDEO_GENERATION_COINS) {
      setRequiredCoins(VIDEO_GENERATION_COINS);
      setShowInsufficientBalance(true);
      return;
    }

    // ✅ Deduct BEFORE generation to prevent free usage
    const walletRes = await deductFromWalletAction(userId, {
      amount: VIDEO_GENERATION_COINS,
      type: "deduct",
      reason: "video_generated",
      metadata: { postId: post._id, source: "image_to_video_auto" },
    });

    // console.log("VIDEO WALLET RESPONSE =>", walletRes);

    const deductOk =
      walletRes?.success === true ||
      walletRes?.status === "success" ||
      walletRes?.ok === true ||
      !!walletRes?.message;

    if (!deductOk || walletRes?.error) {
      showToast(walletRes?.error || "Coin deduction failed", "error");
      return;
    }

    // ✅ Update wallet state immediately after confirmed deduction
    setUserWallet((prev) => Math.max(0, prev - VIDEO_GENERATION_COINS));
    emitWalletDeduct(VIDEO_GENERATION_COINS); // ✅ sidebar sync

    showToast(
      `${VIDEO_GENERATION_COINS} coins deducted for video generation ✅`,
    );

    setConvertingVideoPostId(String(post._id));
    try {
      const prRes = await fetch("/api/ai/image-prompt-to-video-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompt: promptBase }),
      });
      const prData = await prRes.json().catch(() => ({}));
      if (!prRes.ok || !prData.success || !prData.videoPrompt) {
        throw new Error(prData.error || "Could not build video prompt");
      }
      const videoPrompt = String(prData.videoPrompt).trim();

      const body = {
        image_url: source,
        duration: 8,
        quality: "720p",
        ratio: "9:16",
      };

      if (!source.startsWith("http://") && !source.startsWith("https://")) {
        delete body.image_url;
        body.image = source.startsWith("data:")
          ? source
          : `data:image/png;base64,${source}`;
      }

      console.log("Image-to-video request payload:", body);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

      let ivRes;
      try {
        ivRes = await fetch("/api/image-to-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          throw new Error("TIMEOUT_ERROR");
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      const ivData = await ivRes.json().catch(() => ({}));

      if (!ivRes.ok || ivData.success === false) {
        console.error("Image-to-video API error response:", ivData);
      }

      if (!ivRes.ok || (ivData.success === false && !ivData.drive_link)) {
        throw new Error(
          typeof ivData.error === "string"
            ? ivData.error
            : ivData.message || "Video generation failed",
        );
      }

      const ig =
        typeof ivData.instagram_caption === "string"
          ? ivData.instagram_caption.trim()
          : "";
      const fb =
        typeof ivData.facebook_caption === "string"
          ? ivData.facebook_caption.trim()
          : "";

      const upd = await updatePostStatusAction({
        id: post._id,
        userId,
        status: post.status || "pending",
        videoOutput: ivData.drive_link,
        videoPrompt,
        ...(fb ? { fbDescription: fb } : {}),
        ...(ig ? { igDescription: ig } : {}),
      });

      if (!upd.success)
        throw new Error(upd.error || "Could not save video on this post");

      const merged = { ...post, ...upd.data };
      setPosts((prev) => prev.map((p) => (p._id === post._id ? merged : p)));
      setPreviewData((prev) =>
        prev?._id === post._id ? { ...prev, ...upd.data } : prev,
      );
      showToast("Video ready — tap the Video tab", "success");
      await fetchPosts(1, true);
    } catch (e) {
      console.error("Auto image-to-video conversion error:", e);
      // ✅ Refund if video generation failed or timed out
      await deductFromWalletAction(userId, {
        amount: VIDEO_GENERATION_COINS,
        type: "credit",
        reason: "refund_video_failed",
        metadata: { postId: post._id, error: e.message },
      });
      setUserWallet((prev) => prev + VIDEO_GENERATION_COINS);
      emitWalletCredit(VIDEO_GENERATION_COINS); // ✅ sidebar sync

      if (e.message === "TIMEOUT_ERROR") {
        showToast("Video generation timed out — coins refunded", "error");
      } else {
        showToast(
          e.message || "Video conversion failed — coins refunded",
          "error",
        );
      }
    } finally {
      setConvertingVideoPostId(null);
    }
  };

  return {
    isPosting,
    setIsPosting,
    convertingVideoPostId,
    handleFacebookPost,
    handleInstagramPost,
    handleAutoConvertToVideo,
  };
}
