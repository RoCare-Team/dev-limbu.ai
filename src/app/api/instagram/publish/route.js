import { NextResponse } from "next/server";
import { updatePostStatusAction } from "@/app/actions/postActions";

async function waitForInstagramVideoContainer(creationId, accessToken, maxMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const u = new URL(`https://graph.facebook.com/v24.0/${creationId}`);
    u.searchParams.set("fields", "status_code");
    u.searchParams.set("access_token", accessToken);
    const r = await fetch(u.toString());
    const j = await r.json();
    if (j.status_code === "FINISHED") return;
    if (j.status_code === "ERROR" || j.status_code === "EXPIRED") {
      throw new Error(j.error?.message || `Instagram processing: ${j.status_code}`);
    }
    await new Promise((res) => setTimeout(res, 4000));
  }
  throw new Error("Instagram video processing timed out.");
}

export async function POST(req) {
  try {
    const { post, accountData, caption, media, userId } = await req.json();

    if (!media?.url) {
      return NextResponse.json({ success: false, error: "Post has no media to share." }, { status: 400 });
    }

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
      return NextResponse.json({
        success: false,
        error: mediaData.error?.message || "Failed to create Instagram media container."
      }, { status: 500 });
    }

    // Step 2: Wait for processing (longer for video)
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
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publishPayload),
    });
    const publishData = await publishRes.json();

    if (!publishData.id) {
      return NextResponse.json({
        success: false,
        error: publishData.error?.message || "Failed to publish to Instagram."
      }, { status: 500 });
    }

    // Step 4: Email Notification (Internal Fetch)
    try {
      const igUsername = accountData.igUsername || "Instagram Account";
      // Note: Using absolute URL or ensuring the environment handles relative paths. 
      // In Next.js App Router API, it's safer to call the logic directly or use a full URL.
      // For simplicity, we'll try to hit the internal endpoint if possible, or just log.
      const origin = req.nextUrl.origin;
      await fetch(`${origin}/api/send-post-published-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
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
      userId: userId,
      status: "posted",
      whenPosted: { ...post.whenPosted, instagram: true },
    });

    return NextResponse.json({ success: true, id: publishData.id });
  } catch (error) {
    console.error("Instagram publish API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
