import { NextResponse } from "next/server";
import { updatePostStatusAction } from "@/app/actions/postActions";
import { graphApiFormEncode } from "@/utils/postHelpers";

async function waitForInstagramVideoContainer(creationId, accessToken, maxMs = 300000) { // 5 minutes timeout
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < maxMs) {
    attempts++;
    const u = new URL(`https://graph.facebook.com/v24.0/${creationId}`);
    // Removed "error_message" as it is an invalid field for this endpoint
    u.searchParams.set("fields", "status_code,status");
    u.searchParams.set("access_token", accessToken);

    try {
      const r = await fetch(u.toString());
      const j = await r.json();

      console.log(`[IG Polling] Attempt ${attempts}: Status - ${j.status_code}`);

      if (j.status_code === "FINISHED") return;

      if (j.status_code === "ERROR" || j.status_code === "EXPIRED") {
        console.error("Instagram Processing Detailed Error:", j);
        // The error details might be nested inside the 'status' object if it exists
        throw new Error(j.status?.error_message || j.error?.message || `Instagram processing failed: ${j.status_code}`);
      }
    } catch (e) {
      // If the fetch fails completely or we throw an error based on status, bubble it up
      if (e.message.includes("Instagram processing failed")) {
        throw e;
      }
      console.warn(`[IG Polling] Fetch error on attempt ${attempts}:`, e.message);
    }

    await new Promise((res) => setTimeout(res, 5000)); // Wait 5s between checks
  }
  throw new Error("Instagram video processing timed out after 5 minutes.");
}

function encodeSpacesInUrl(url) {
  try {
    const u = new URL(url);
    u.pathname = u.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
    return u.toString();
  } catch {
    return url.replace(/ /g, '%20');
  }
}

export async function POST(req) {
  try {
    const { post, accountData, caption, media, userId, instagramVideoMediaType } =
      await req.json();

    console.log("Received Instagram publish request with payload:", {
      post,
      accountData,
      caption,
      media,
      userId,
      instagramVideoMediaType
    });

    if (!media?.url) {
      return NextResponse.json({ success: false, error: "Post has no media to share." }, { status: 400 });
    }

    const igUserId = accountData.igId;
    const accessToken = accountData.pageAccessToken;

    // Instagram has deprecated "VIDEO" media_type. All videos must be published as "REELS".
    const videoKind = "REELS";

    // Step 1: Create Media Container (images: JSON; video: form — matches Graph behavior in practice)
    const mediaContainerUrl = `https://graph.facebook.com/v24.0/${igUserId}/media`;
    const mediaContainerPayload =
      media.type === "video"
        ? {
video_url: media.url.trim(),

          caption: caption || "",
          media_type: videoKind,
          access_token: accessToken,
        }
        : {
          image_url: new URL(media.url.trim()).href,
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
