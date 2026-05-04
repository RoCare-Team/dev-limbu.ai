import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkedinProfile from "@/models/LinkedinProfile";

/**
 * LinkedIn Post API
 * Supports: Text-only, Images, and Videos
 * Endpoint: POST /api/linkedin/post
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, pageId, text, mediaUrl, mediaType } = body;

    if (!userId || !pageId) {
      return NextResponse.json(
        { success: false, error: "Missing userId or pageId" },
        { status: 400 }
      );
    }

    // 1. Find the LinkedIn Profile to get the access token
    const profile = await LinkedinProfile.findOne({ userId, pageId });
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "LinkedIn account not found. Please connect first." },
        { status: 404 }
      );
    }

    const token = profile.pageAccessToken;
    let assetUrn = null;

    // 2. Handle Media (Image or Video)
    if (mediaUrl) {
      try {
        const isVideo = mediaType === "video";
        const recipe = isVideo
          ? "urn:li:digitalmediaRecipe:feedshare-video"
          : "urn:li:digitalmediaRecipe:feedshare-image";

        // Step A: Register Upload
        const registerRes = await axios.post(
          "https://api.linkedin.com/v2/assets?action=registerUpload",
          {
            registerUploadRequest: {
              recipes: [recipe],
              owner: pageId,
              serviceRelationships: [
                {
                  relationshipType: "OWNER",
                  identifier: "urn:li:userGeneratedContent",
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        assetUrn = registerRes.data.value.asset;
        const uploadUrl = registerRes.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;

        // Step B: Download Media from the provided URL
        const mediaResponse = await axios.get(mediaUrl, {
          responseType: "arraybuffer",
        });
        const mediaBuffer = Buffer.from(mediaResponse.data, "binary");

        // Step C: Upload the media binary to LinkedIn
        await axios.put(uploadUrl, mediaBuffer, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": isVideo ? "video/mp4" : "image/jpeg", // Adjust content-type as needed
          },
        });

        // For Videos, LinkedIn recommends waiting/polling status, but for simplicity, 
        // we'll proceed. LinkedIn will process it in the background.
      } catch (mediaError) {
        console.error("LinkedIn Media Upload Error:", mediaError.response?.data || mediaError.message);
        return NextResponse.json(
          { success: false, error: "Failed to upload media to LinkedIn" },
          { status: 500 }
        );
      }
    }

    // 3. Construct UGC Post Data
    const ugcPostData = {
      author: pageId,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: text || "",
          },
          shareMediaCategory: mediaUrl
            ? (mediaType === "video" ? "VIDEO" : "IMAGE")
            : "NONE",
          media: assetUrn ? [
            {
              status: "READY",
              description: { text: "Post Media" },
              media: assetUrn,
              title: { text: "Uploaded Media" },
            }
          ] : [],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // 4. Publish the post
    const publishRes = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      ugcPostData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Post published successfully!",
      postId: publishRes.data.id,
    });

  } catch (error) {
    console.error("LinkedIn API Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || "Internal server error while posting to LinkedIn"
      },
      { status: 500 }
    );
  }
}
