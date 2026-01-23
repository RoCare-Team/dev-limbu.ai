import axios from "axios";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";

/* =====================================================
   FacebookPage SCHEMA (INLINE)
===================================================== */
const FacebookPageSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      index: true,
    },
    pageName: {
      type: String,
    },
    pageAccessToken: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent model overwrite in Next.js
const FacebookPage =
  mongoose.models.FacebookPage ||
  mongoose.model("FacebookPage", FacebookPageSchema);

/* =====================================================
   POST API
===================================================== */
export async function POST(req) {
  try {
    await dbConnect();

    const { pageId, caption = "", imageUrl = "" } = await req.json();

    // ---------------- Validation ----------------
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: "pageId is required" },
        { status: 400 }
      );
    }

    if (!caption && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Post content is empty" },
        { status: 400 }
      );
    }

    if (imageUrl && !imageUrl.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "imageUrl must be a public URL" },
        { status: 400 }
      );
    }

    // ---------------- Get Page ----------------
    const page = await FacebookPage.findOne({
      pageId,
      isActive: true,
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: "Facebook page not found" },
        { status: 404 }
      );
    }

    const accessToken = page.pageAccessToken;
    let facebookPostId;

    /* =====================================================
       IMAGE POST FLOW
    ===================================================== */
    if (imageUrl) {
      // 1️⃣ Upload photo (unpublished)
      const photoRes = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/photos`,
        {
          url: imageUrl,
          published: false,
          access_token: accessToken,
        }
      );

      if (!photoRes.data?.id) {
        throw new Error("Photo upload failed");
      }

      const photoId = photoRes.data.id;

      // 2️⃣ Publish feed with attached image
      const feedRes = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        {
          message: caption,
          attached_media: [{ media_fbid: photoId }],
          access_token: accessToken,
        }
      );

      if (!feedRes.data?.id) {
        throw new Error("Feed publish failed");
      }

      facebookPostId = feedRes.data.id;
    }

    /* =====================================================
       TEXT ONLY POST
    ===================================================== */
    else {
      const feedRes = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        {
          message: caption,
          access_token: accessToken,
        }
      );

      if (!feedRes.data?.id) {
        throw new Error("Text post failed");
      }

      facebookPostId = feedRes.data.id;
    }

    // ---------------- Success ----------------
    return NextResponse.json({
      success: true,
      facebookPostId,
    });

  } catch (error) {
    console.error(
      "Facebook API Error:",
      error.response?.data || error.message
    );

    // Token expired
    if (error.response?.data?.error?.code === 190) {
      return NextResponse.json(
        {
          success: false,
          error: "Facebook token expired. Reconnect account.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to publish Facebook post" },
      { status: 500 }
    );
  }
}
