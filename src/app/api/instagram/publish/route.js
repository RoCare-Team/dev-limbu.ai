import { NextResponse } from "next/server";
import { updatePostStatusAction } from "@/app/actions/postActions";
import { graphApiFormEncode } from "@/utils/postHelpers";

export const maxDuration = 300;

const getInstagramAccountId = (accountData = {}) =>
  accountData.igId || accountData.id;
const getInstagramAccountName = (accountData = {}) =>
  accountData.igUsername || accountData.username || "Instagram Account";
const getInstagramAccessToken = (accountData = {}) =>
  accountData.pageAccessToken || accountData.accessToken;

async function waitForInstagramVideoContainer(
  creationId,
  accessToken,
  maxMs = 300000,
) {
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < maxMs) {
    attempts++;
    const u = new URL(`https://graph.facebook.com/v24.0/${creationId}`);
    u.searchParams.set("fields", "status_code,status");
    u.searchParams.set("access_token", accessToken);

    try {
      const r = await fetch(u.toString());
      const j = await r.json();

      console.log(
        `[IG Polling] Attempt ${attempts}: Status - ${j.status_code}`,
      );

      if (j.status_code === "FINISHED") return;

      if (j.status_code === "ERROR" || j.status_code === "EXPIRED") {
        console.error("Instagram Processing Detailed Error:", j);
        throw new Error(
          j.status?.error_message ||
            j.error?.message ||
            `Instagram processing failed: ${j.status_code}`,
        );
      }
    } catch (e) {
      if (e.message.includes("Instagram processing failed")) {
        throw e;
      }
      console.warn(
        `[IG Polling] Fetch error on attempt ${attempts}:`,
        e.message,
      );
    }

    await new Promise((res) => setTimeout(res, 5000));
  }
  throw new Error("Instagram video processing timed out after 5 minutes.");
}

const publishToInstagramAccount = async ({
  accountData,
  caption,
  media,
  instagramVideoMediaType,
}) => {
  const igUserId = getInstagramAccountId(accountData);
  const accessToken = getInstagramAccessToken(accountData);

  if (!igUserId || !accessToken) {
    throw new Error("Instagram account id or access token is missing.");
  }

  const mediaContainerUrl = `https://graph.facebook.com/v24.0/${igUserId}/media`;
  const videoMediaType =
    instagramVideoMediaType === "VIDEO" ? "VIDEO" : "REELS";

  const mediaContainerPayload =
    media.type === "video"
      ? {
          video_url: media.url.trim(),
          caption: caption || "",
          media_type: videoMediaType,
          ...(videoMediaType === "REELS" ? { share_to_feed: true } : {}),
          access_token: accessToken,
        }
      : {
          image_url: media.url,
          caption: caption || "",
          access_token: accessToken,
        };

  const mediaRes = await fetch(mediaContainerUrl, {
    method: "POST",
    headers:
      media.type === "video"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : { "Content-Type": "application/json" },
    body:
      media.type === "video"
        ? graphApiFormEncode(mediaContainerPayload)
        : JSON.stringify(mediaContainerPayload),
  });

  const mediaData = await mediaRes.json();

  if (!mediaData.id) {
    console.error("Instagram API Error (Media Container):", mediaData);
    throw new Error(
      mediaData.error?.message || "Failed to create Instagram media container.",
    );
  }

  console.log(`[IG] Media container created for ${igUserId}: ${mediaData.id}`);

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

  console.log(
    `[IG] Publishing media container for ${igUserId}: ${mediaData.id}`,
  );

  const publishRes = await fetch(publishUrl, {
    method: "POST",
    headers:
      media.type === "video"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : { "Content-Type": "application/json" },
    body:
      media.type === "video"
        ? graphApiFormEncode(publishPayload)
        : JSON.stringify(publishPayload),
  });

  const publishData = await publishRes.json();

  if (!publishData.id) {
    console.error("Instagram API Error (Publish):", publishData);
    throw new Error(
      publishData.error?.message || "Failed to publish to Instagram.",
    );
  }

  console.log(`[IG] Published successfully for ${igUserId}: ${publishData.id}`);
  return publishData.id;
};

const mergeInstagramAccounts = ({
  existingAccounts = [],
  selectedAccounts,
  results,
  caption,
  media,
  post,
}) => {
  const byAccountId = new Map(
    existingAccounts
      .filter((account) => getInstagramAccountId(account))
      .map((account) => [getInstagramAccountId(account), { ...account }]),
  );

  selectedAccounts.forEach((accountData, index) => {
    const result = results[index];
    const accountId = getInstagramAccountId(accountData);
    const existing = byAccountId.get(accountId) || {};

    byAccountId.set(accountId, {
      ...existing,
      igId: accountId,
      igUsername: getInstagramAccountName(accountData),
      pageAccessToken: getInstagramAccessToken(accountData),
      caption: caption || "",
      imageUrl: media?.url || post?.aiOutput || "",
      isPosted: Boolean(result?.success),
      postedAt: result?.success ? new Date().toISOString() : existing.postedAt,
      postId: result?.id || existing.postId || "",
      error: result?.success ? "" : result?.error || existing.error || "",
    });
  });

  return Array.from(byAccountId.values());
};

export async function POST(req) {
  try {
    const {
      post,
      accountData,
      caption,
      media,
      userId,
      instagramVideoMediaType,
    } = await req.json();
    const postedMediaType = media?.type === "video" ? "video" : "image";
    const selectedAccounts = Array.isArray(accountData)
      ? accountData.filter(Boolean)
      : [accountData].filter(Boolean);

    console.log("Received Instagram publish request with payload:", {
      postId: post?._id,
      accountCount: selectedAccounts.length,
      caption,
      media,
      userId,
    });

    if (!media?.url) {
      return NextResponse.json(
        { success: false, error: "Post has no media to share." },
        { status: 400 },
      );
    }

    if (selectedAccounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No Instagram accounts selected." },
        { status: 400 },
      );
    }

    const publishResults = await Promise.all(
      selectedAccounts.map(async (account) => {
        try {
          const id = await publishToInstagramAccount({
            accountData: account,
            caption,
            media,
            instagramVideoMediaType,
          });

          return {
            success: true,
            id,
            igId: getInstagramAccountId(account),
            igUsername: getInstagramAccountName(account),
          };
        } catch (error) {
          console.error(
            `Instagram publish failed for account ${getInstagramAccountId(account)}:`,
            error,
          );
          return {
            success: false,
            igId: getInstagramAccountId(account),
            igUsername: getInstagramAccountName(account),
            error: error.message || "Failed to publish to Instagram account",
          };
        }
      }),
    );

    const successResults = publishResults.filter((result) => result.success);
    const failedResults = publishResults.filter((result) => !result.success);

    if (successResults.length > 0) {
      await Promise.all(
        successResults.map(async (result) => {
          try {
            const origin = req.nextUrl.origin;
            await fetch(`${origin}/api/send-post-published-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                platform: "Instagram",
                businessName: result.igUsername,
                locationName: result.igUsername,
                postUrl: media.url || post.aiOutput,
              }),
            });
          } catch (emailError) {
            console.log(
              "Error sending Instagram post published email:",
              emailError.message,
            );
          }
        }),
      );

      const instagramPostIds = successResults
        .map((result) => result.id)
        .join(",");
      const igPages = mergeInstagramAccounts({
        existingAccounts: post.igPages || [],
        selectedAccounts,
        results: publishResults,
        caption,
        media,
        post,
      });

      await updatePostStatusAction({
        id: post._id,
        userId,
        status: "posted",
        postedPlatform: "instagram",
        igPages,
        whenPosted: {
          instagram: {
            posted: true,
            postedDate: new Date().toISOString(),
            postId: instagramPostIds,
            error: failedResults.length
              ? `${failedResults.length} Instagram account(s) failed`
              : "",
          },
        },
        mediaStatus: { [postedMediaType]: "posted" },
      });
    }

    if (successResults.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: failedResults[0]?.error || "Failed to publish to Instagram",
          results: publishResults,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: successResults[0]?.id || "",
        ids: successResults.map((result) => result.id),
        results: publishResults,
        successCount: successResults.length,
        failedCount: failedResults.length,
      },
      { status: failedResults.length ? 207 : 200 },
    );
  } catch (error) {
    console.error("Instagram publish API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
