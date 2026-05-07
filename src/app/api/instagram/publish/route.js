import { NextResponse } from "next/server";
import { updatePostStatusAction } from "@/app/actions/postActions";
import { graphApiFormEncode } from "@/utils/postHelpers";

async function waitForInstagramVideoContainer(creationId, accessToken, maxMs = 300000) {
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

      console.log(`[IG Polling] Attempt ${attempts}: Status - ${j.status_code}`);

      if (j.status_code === "FINISHED") return;

      if (j.status_code === "ERROR" || j.status_code === "EXPIRED") {
        console.error("Instagram Processing Detailed Error:", j);
        throw new Error(j.status?.error_message || j.error?.message || `Instagram processing failed: ${j.status_code}`);
      }
    } catch (e) {
      if (e.message.includes("Instagram processing failed")) {
        throw e;
      }
      console.warn(`[IG Polling] Fetch error on attempt ${attempts}:`, e.message);
    }

    await new Promise((res) => setTimeout(res, 5000));
  }
  throw new Error("Instagram video processing timed out after 5 minutes.");
}

export async function POST(req) {
  try {
    const { post, accountData, caption, media, userId } = await req.json();
    const postedMediaType = media?.type === "video" ? "video" : "image";

    // console.log("Received Instagram publish request with payload:", {
    //   post,
    //   accountData,
    //   caption,
    //   media,
    //   userId,
    // });

    if (!media?.url) {
      return NextResponse.json({ success: false, error: "Post has no media to share." }, { status: 400 });
    }

    const igUserId = accountData.igId;

    // console.log("Publishing to Instagram for user ID:", igUserId);
    const accessToken = accountData.pageAccessToken;

    // Step 1: Create Media Container
    const mediaContainerUrl = `https://graph.facebook.com/v24.0/${igUserId}/media`;

    const mediaContainerPayload =
      media.type === "video"
        ? {
          // ✅ Video payload — form-encoded, REELS, share_to_feed true
          video_url: media.url.trim(),
          caption: caption || "",
          media_type: "REELS",
          share_to_feed: true,
          access_token: accessToken,
        }
        : {
          // ✅ Image payload — JSON, no media_type needed
          image_url: media.url,
          caption: caption || "",
          access_token: accessToken,
        };

    // console.log(`[IG] Creating media container for ${media.type}:`, mediaContainerPayload);

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
      return NextResponse.json({
        success: false,
        error: mediaData.error?.message || "Failed to create Instagram media container.",
      }, { status: 500 });
    }

    console.log(`[IG] Media container created: ${mediaData.id}`);

    // Step 2: Wait for processing
    if (media.type === "video") {
      await waitForInstagramVideoContainer(mediaData.id, accessToken);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    // Step 3: Publish
    const publishUrl = `https://graph.facebook.com/v24.0/${igUserId}/media_publish`;
    const publishPayload = {
      creation_id: mediaData.id,
      access_token: accessToken,
    };

    console.log(`[IG] Publishing media container: ${mediaData.id}`);

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
      return NextResponse.json({
        success: false,
        error: publishData.error?.message || "Failed to publish to Instagram.",
      }, { status: 500 });
    }

    console.log(`[IG] Published successfully: ${publishData.id}`);

    // Step 4: Email Notification
    try {
      const igUsername = accountData.igUsername || "Instagram Account";
      const origin = req.nextUrl.origin;
      await fetch(`${origin}/api/send-post-published-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          platform: "Instagram",
          businessName: igUsername,
          locationName: igUsername,
          postUrl: media.url || post.aiOutput,
        }),
      });
    } catch (emailError) {
      console.log("⚠️ Error sending Instagram post published email:", emailError.message);
    }

    // Step 5: Update Database
    await updatePostStatusAction({
      id: post._id,
      userId,
      status: "posted",
      whenPosted: { ...post.whenPosted, instagram: true },
      mediaStatus: { [postedMediaType]: "posted" },
    });

    return NextResponse.json({ success: true, id: publishData.id });
  } catch (error) {
    console.error("Instagram publish API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}