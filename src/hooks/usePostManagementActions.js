import { useState } from "react";
import {
  updatePostStatusAction,
  deductFromWalletAction,
  getUserWalletAction
} from "@/app/actions/postActions";
import {
  metaPublishMedia,
  postImageUrl
} from "@/lib/postMediaUrls";
import { waitForInstagramVideoContainer } from "@/utils/postHelpers";
import { resolveBusinessNameForGeneration } from "@/lib/businessNameFromPayload";
import { emitWalletDeduct, emitWalletCredit } from "@/utils/walletEvents";

export function usePostManagementActions({
  userId,
  fetchPosts,
  setPosts,
  setPreviewData,
  setUserWallet,
  setRequiredCoins,
  setShowInsufficientBalance,
  showToast
}) {
  const [isPosting, setIsPosting] = useState(false);
  const [convertingVideoPostId, setConvertingVideoPostId] = useState(null);

  const VIDEO_GENERATION_COINS = 200;

  const handleFacebookPost = async (post, pageData, caption) => {
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
        const isHttpVideo = typeof media.url === "string" && /^https?:\/\//i.test(media.url.trim());

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
          } catch (e) {
            console.error("Proxy upload failed", e);
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
            throw new Error(videoData.error?.message || "Failed to publish video to Facebook");
          }
          videoId = videoData.id;
        }
        facebookPostId = videoId;
      } else if (media.type === "image" && media.url) {
        const imageUrl = media.url;
        const photoUrl = `https://graph.facebook.com/v24.0/${pageId}/photos`;
        const photoRes = await fetch(photoUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrl,
            published: false,
            access_token: accessToken,
          }),
        });

        const photoData = await photoRes.json();
        if (!photoData.id) {
          throw new Error(photoData.error?.message || "Failed to upload photo to Facebook");
        }

        const feedUrl = `https://graph.facebook.com/v24.0/${pageId}/feed`;
        const feedRes = await fetch(feedUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: caption || "",
            attached_media: [{ media_fbid: photoData.id }],
            access_token: accessToken,
          }),
        });

        const feedData = await feedRes.json();
        if (!feedData.id) {
          throw new Error(feedData.error?.message || "Failed to publish post to Facebook Feed");
        }
        facebookPostId = feedData.id;
      } else {
        const graphUrl = `https://graph.facebook.com/v24.0/${pageId}/feed`;
        const res = await fetch(graphUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: caption || "",
            access_token: accessToken,
          }),
        });

        const data = await res.json();
        if (!data.id) {
          throw new Error(data.error?.message || "Failed to post to Facebook");
        }
        facebookPostId = data.id;
      }

      showToast("Post published on Facebook 🎉", "success");

      // Email notification
      try {
        await fetch("/api/send-post-published-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            platform: "Facebook",
            businessName: pageData.pageName || "Facebook Page",
            locationName: pageData.pageName || "Facebook Page",
            postUrl: metaPublishMedia(post).url || post.aiOutput,
          }),
        });
      } catch (e) {
        console.error("Email failed", e);
      }

      await updatePostStatusAction({
        id: post._id,
        userId,
        facebookPostId,
        facebookPageAccessToken: accessToken,
        status: "posted",
        whenPosted: { ...post.whenPosted, facebook: true },
      });
      await fetchPosts(1, true);
    } catch (err) {
      console.error("Facebook post error:", err);
      showToast(err.message || "Something went wrong posting to Facebook", "error");
    }
  };

  const handleInstagramPost = async (post, accountData, caption) => {
    const media = metaPublishMedia(post);
    if (!media.url) {
      showToast("Post has no media to share.", "error");
      return;
    }

    try {
      showToast("Publishing to Instagram...", "success");

      const igUserId = accountData.igId;
      const accessToken = accountData.pageAccessToken;

      const mediaContainerUrl = `https://graph.facebook.com/v24.0/${igUserId}/media`;
      const mediaContainerPayload = media.type === "video"
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
        throw new Error(mediaData.error?.message || "Failed to create Instagram media container.");
      }

      if (media.type === "video") {
        await waitForInstagramVideoContainer(mediaData.id, accessToken);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      const publishUrl = `https://graph.facebook.com/v24.0/${igUserId}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: mediaData.id,
          access_token: accessToken,
        }),
      });
      const publishData = await publishRes.json();

      if (publishData.id) {
        showToast("Post published on Instagram 🎉", "success");

        try {
          await fetch("/api/send-post-published-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              platform: "Instagram",
              businessName: accountData.igUsername || "Instagram Account",
              locationName: accountData.igUsername || "Instagram Account",
              postUrl: media.url || post.aiOutput,
            }),
          });
        } catch (e) {
          console.error("Email failed", e);
        }

        await updatePostStatusAction({
          id: post._id,
          userId,
          status: "posted",
          whenPosted: { ...post.whenPosted, instagram: true },
        });
        await fetchPosts(1, true);
      } else {
        throw new Error(publishData.error?.message || "Failed to publish to Instagram.");
      }
    } catch (err) {
      console.error("Instagram post error:", err);
      showToast(err.message, "error");
    }
  };

  const handleAutoConvertToVideo = async (post, prompt, selectedBusiness, bussinessTitle, availableLocations) => {
    if (!userId || !post?._id) return;

    const source = postImageUrl(post);
    if (!source) return showToast("No still image on this post to convert.", "error");

    const promptBase = (post.promat && String(post.promat).trim()) ||
      prompt.trim() ||
      (post.description && String(post.description).trim()) || "";
    if (!promptBase) return showToast("No saved prompt on this post — use Customize below.", "error");

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

    const deductOk =
      walletRes?.message === "Wallet updated" ||
      walletRes?.success === true ||
      walletRes?.status === "success";

    if (!deductOk || walletRes?.error) {
      showToast(walletRes?.error || "Coin deduction failed", "error");
      return;
    }

    // ✅ Update wallet state immediately after confirmed deduction
    setUserWallet(prev => Math.max(0, prev - VIDEO_GENERATION_COINS));
    emitWalletDeduct(VIDEO_GENERATION_COINS); // ✅ sidebar sync

    showToast(`${VIDEO_GENERATION_COINS} coins deducted for video generation ✅`);



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

      const businessName = resolveBusinessNameForGeneration({
        fromInput: "",
        selectedBusinessName: selectedBusiness?.name,
        bussinessTitle,
        availableLocations,
        prompt: promptBase,
      }) || "Business";

      const body = {
        prompt: videoPrompt,
        business_name: businessName,
        duration: 8,
        audio_folder: "basic",
        platform: "both",
      };

      if (source.startsWith("http://") || source.startsWith("https://")) {
        body.image_url = source;
      } else {
        body.image = source.startsWith("data:") ? source : `data:image/png;base64,${source}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

      let ivRes;
      try {
        ivRes = await fetch("/api/image-to-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error("TIMEOUT_ERROR");
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
      
      const ivData = await ivRes.json().catch(() => ({}));

      if (!ivRes.ok || (ivData.success === false && !ivData.drive_link)) {
        throw new Error(typeof ivData.error === "string" ? ivData.error : ivData.message || "Video generation failed");
      }

      const ig = typeof ivData.instagram_caption === "string" ? ivData.instagram_caption.trim() : "";
      const fb = typeof ivData.facebook_caption === "string" ? ivData.facebook_caption.trim() : "";

      const upd = await updatePostStatusAction({
        id: post._id, userId,
        status: post.status || "pending",
        videoOutput: ivData.drive_link,
        videoPrompt,
        ...(fb ? { fbDescription: fb } : {}),
        ...(ig ? { igDescription: ig } : {}),
      });

      if (!upd.success) throw new Error(upd.error || "Could not save video on this post");

      const merged = { ...post, ...upd.data };
      setPosts(prev => prev.map(p => p._id === post._id ? merged : p));
      setPreviewData(prev => prev?._id === post._id ? { ...prev, ...upd.data } : prev);
      showToast("Video ready — tap the Video tab", "success");
      await fetchPosts(1, true);

    } catch (e) {
      // ✅ Refund if video generation failed or timed out
      await deductFromWalletAction(userId, {
        amount: VIDEO_GENERATION_COINS,
        type: "credit",
        reason: "refund_video_failed",
        metadata: { postId: post._id, error: e.message },
      });
      setUserWallet(prev => prev + VIDEO_GENERATION_COINS);
      emitWalletCredit(VIDEO_GENERATION_COINS); // ✅ sidebar sync
      
      if (e.message === "TIMEOUT_ERROR") {
        showToast("Video generation timed out — coins refunded", "error");
      } else {
        showToast(e.message || "Video conversion failed — coins refunded", "error");
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
