import { NextResponse } from "next/server";
import { updatePostStatusAction } from "@/app/actions/postActions";
import { graphApiFormEncode } from "@/utils/postHelpers";

export const maxDuration = 300;

const getFacebookPageName = (pageData = {}) =>
  pageData.pageName || pageData.name || "Facebook Page";

const publishToFacebookPage = async ({ pageData, caption, media }) => {
  const pageId = pageData?.pageId;
  const accessToken = pageData?.pageAccessToken;

  if (!pageId || !accessToken) {
    throw new Error("Facebook page id or access token is missing.");
  }

  if (media?.type === "video" && media.url) {
    const encodedVideoUrl = new URL(media.url.trim()).href;
    const videoRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/videos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: graphApiFormEncode({
          file_url: encodedVideoUrl,
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

    return videoData.id;
  }

  if (media?.type === "image" && media.url) {
    const photoRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: media.url,
          published: false,
          access_token: accessToken,
        }),
      },
    );

    const photoData = await photoRes.json();
    if (!photoData.id) {
      throw new Error(
        photoData.error?.message || "Failed to upload photo to Facebook",
      );
    }

    const feedRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: caption || "",
          attached_media: [{ media_fbid: photoData.id }],
          access_token: accessToken,
        }),
      },
    );

    const feedData = await feedRes.json();
    if (!feedData.id) {
      throw new Error(
        feedData.error?.message || "Failed to publish post to Facebook Feed",
      );
    }

    return feedData.id;
  }

  const res = await fetch(`https://graph.facebook.com/v24.0/${pageId}/feed`, {
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

  return data.id;
};

const mergeFacebookPages = ({
  existingPages = [],
  selectedPages,
  results,
  caption,
  media,
  post,
}) => {
  const byPageId = new Map(
    existingPages
      .filter((page) => page?.pageId)
      .map((page) => [page.pageId, { ...page }]),
  );

  selectedPages.forEach((pageData, index) => {
    const result = results[index];
    const existing = byPageId.get(pageData.pageId) || {};

    byPageId.set(pageData.pageId, {
      ...existing,
      pageId: pageData.pageId,
      pageAccessToken: pageData.pageAccessToken,
      pageName: getFacebookPageName(pageData),
      caption: caption || "",
      imageUrl: media?.url || post?.aiOutput || "",
      isPosted: Boolean(result?.success),
      postedAt: result?.success ? new Date().toISOString() : existing.postedAt,
      postId: result?.id || existing.postId || "",
      error: result?.success ? "" : result?.error || existing.error || "",
    });
  });

  return Array.from(byPageId.values());
};

export async function POST(req) {
  try {
    const { post, pageData, caption, media, userId } = await req.json();
    const postedMediaType = media?.type === "video" ? "video" : "image";
    const selectedPages = Array.isArray(pageData)
      ? pageData.filter(Boolean)
      : [pageData].filter(Boolean);

    console.log("Received Facebook publish request with payload:", {
      postId: post?._id,
      pageCount: selectedPages.length,
      caption,
      media,
      userId,
    });

    if (!caption?.trim() && !media?.url) {
      return NextResponse.json(
        { success: false, error: "Post content is empty." },
        { status: 400 },
      );
    }

    if (selectedPages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No Facebook pages selected." },
        { status: 400 },
      );
    }

    const publishResults = await Promise.all(
      selectedPages.map(async (page) => {
        try {
          const id = await publishToFacebookPage({
            pageData: page,
            caption,
            media,
          });

          return {
            success: true,
            id,
            pageId: page.pageId,
            pageName: getFacebookPageName(page),
          };
        } catch (error) {
          console.error(
            `Facebook publish failed for page ${page?.pageId}:`,
            error,
          );
          return {
            success: false,
            pageId: page?.pageId,
            pageName: getFacebookPageName(page),
            error: error.message || "Failed to publish to Facebook page",
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
                platform: "Facebook",
                businessName: result.pageName,
                locationName: result.pageName,
                postUrl: media?.url || post.aiOutput,
              }),
            });
          } catch (emailError) {
            console.log(
              "Error sending Facebook post published email:",
              emailError.message,
            );
          }
        }),
      );

      const facebookPostIds = successResults
        .map((result) => result.id)
        .join(",");
      const fbPages = mergeFacebookPages({
        existingPages: post.fbPages || [],
        selectedPages,
        results: publishResults,
        caption,
        media,
        post,
      });

      await updatePostStatusAction({
        id: post._id,
        userId,
        facebookPostId: facebookPostIds,
        facebookPageAccessToken:
          selectedPages.find(
            (page) => page.pageId === successResults[0]?.pageId,
          )?.pageAccessToken || "",
        status: "posted",
        postedPlatform: "facebook",
        fbPages,
        whenPosted: {
          facebook: {
            posted: true,
            postedDate: new Date().toISOString(),
            postId: facebookPostIds,
            error: failedResults.length
              ? `${failedResults.length} Facebook page(s) failed`
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
          error: failedResults[0]?.error || "Failed to publish to Facebook",
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
    console.error("Facebook publish API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
