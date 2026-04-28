import { NextResponse } from "next/server";
import { updatePostStatusAction } from "@/app/actions/postActions";
import { graphApiFormEncode } from "@/utils/postHelpers";

export const maxDuration = 300;

export async function POST(req) {
  try {
    const { post, pageData, caption, media, userId } = await req.json();

    if (!caption?.trim() && !media?.url) {
      return NextResponse.json(
        { success: false, error: "Post content is empty." },
        { status: 400 }
      );
    }

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
          // Download and upload video to Facebook
          const videoRes = await fetch(media.url.trim(), {
            headers: { Accept: "video/*,*/*" },
          });

          if (videoRes.ok) {
            const arrayBuffer = await videoRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const formData = new FormData();
            const blob = new Blob([buffer], { type: videoRes.headers.get("content-type") || "video/mp4" });
            formData.append("source", blob, "post-video.mp4");
            formData.append("description", caption || "");
            formData.append("access_token", accessToken);

            const fbUrl = `https://graph.facebook.com/v24.0/${encodeURIComponent(pageId)}/videos`;
            const fbRes = await fetch(fbUrl, { method: "POST", body: formData });
            const fbJson = await fbRes.json();

            if (fbRes.ok && fbJson.id) {
              videoId = fbJson.id;
            } else {
              console.error("Facebook Video Proxy Upload Error:", fbJson);
            }
          }
        } catch (error) {
          console.error("Error in server-side video proxy upload:", error);
          /* fall through to file_url approach */
        }
      }

      if (!videoId) {
        const videoRes = await fetch(
          `https://graph.facebook.com/v24.0/${pageId}/videos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: graphApiFormEncode({
              file_url: media.url,
              description: caption || "",
              access_token: accessToken,
            }),
          }
        );
        const videoData = await videoRes.json();
        if (!videoData.id) {
          throw new Error(
            videoData.error?.message || "Failed to publish video to Facebook"
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
          photoData.error?.message || "Failed to upload photo to Facebook"
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
            "Failed to publish post to Facebook Feed"
        );
      }

      facebookPostId = feedData.id;
    } else {
      // Direct call to Facebook Graph API for Feed (Text only)
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

    // Send post published email notification for Facebook
    try {
      const pageName = pageData.pageName || "Facebook Page";
      const origin = req.nextUrl.origin;
      await fetch(`${origin}/api/send-post-published-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          platform: "Facebook",
          businessName: pageName,
          locationName: pageName,
          postUrl: media.url || post.aiOutput,
        }),
      });
    } catch (emailError) {
      console.log(
        "⚠️ Error sending Facebook post published email:",
        emailError.message
      );
    }

    // Update database
    await updatePostStatusAction({
      id: post._id,
      userId: userId,
      facebookPostId: facebookPostId,
      facebookPageAccessToken: accessToken,
      status: "posted",
      whenPosted: { ...(post.whenPosted || {}), facebook: true },
    });

    return NextResponse.json({ success: true, id: facebookPostId });
  } catch (error) {
    console.error("Facebook publish API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
