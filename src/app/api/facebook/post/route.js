import axios from "axios";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";

/* =====================================================
   FacebookPost SCHEMA (POST SAVE WITH userId)
===================================================== */
const FacebookPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    pageId: {
      type: String,
      required: true,
      index: true,
    },

    facebookPostId: {
      type: String,
    },

    caption: {
      type: String,
    },

    imageUrl: {
      type: String,
    },

    status: {
      type: String,
      enum: ["posted", "failed"],
      default: "posted",
    },

    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

const FacebookPost =
  mongoose.models.FacebookPost ||
  mongoose.model("FacebookPost", FacebookPostSchema);

/* =====================================================
   POST API
===================================================== */
export async function POST(req) {
  let userId = "";
  let pageId = "";
  let caption = "";
  let imageUrl = "";

  try {
    await dbConnect();

    const body = await req.json();

    userId = body.userId; // ✅ NEW
    pageId = body.pageId;
    caption = body.caption || "";
    imageUrl = body.imageUrl || "";
    const pageAccessToken = body.pageAccessToken;

    // ---------------- Validation ----------------
    if (!userId || !pageId || !pageAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "userId, pageId and pageAccessToken are required",
        },
        { status: 400 }
      );
    }

    if (!caption && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "caption or imageUrl required" },
        { status: 400 }
      );
    }

    if (imageUrl && !imageUrl.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "imageUrl must be a public URL" },
        { status: 400 }
      );
    }

    let facebookPostId;

    /* =====================================================
       IMAGE POST
    ===================================================== */
    if (imageUrl) {
      const photoRes = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/photos`,
        {
          url: imageUrl,
          published: false,
          access_token: pageAccessToken,
        }
      );

      if (!photoRes.data?.id) {
        throw new Error("Photo upload failed");
      }

      const feedRes = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        {
          message: caption,
          attached_media: [{ media_fbid: photoRes.data.id }],
          access_token: pageAccessToken,
        }
      );

      if (!feedRes.data?.id) {
        throw new Error("Feed publish failed");
      }

      facebookPostId = feedRes.data.id;
    }

    /* =====================================================
       TEXT POST
    ===================================================== */
    else {
      const feedRes = await axios.post(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        {
          message: caption,
          access_token: pageAccessToken,
        }
      );

      if (!feedRes.data?.id) {
        throw new Error("Text post failed");
      }

      facebookPostId = feedRes.data.id;
    }

    // ---------------- SAVE POST ----------------
    await FacebookPost.create({
      userId,
      pageId,
      facebookPostId,
      caption,
      imageUrl,
      status: "posted",
    });

    return NextResponse.json({
      success: true,
      facebookPostId,
    });

  } catch (error) {
    console.error("Facebook API Error:", error.response?.data || error.message);

    // save failed attempt
    if (userId && pageId) {
      await FacebookPost.create({
        userId,
        pageId,
        caption,
        imageUrl,
        status: "failed",
        errorMessage: error.message,
      });
    }

    if (error.response?.data?.error?.code === 190) {
      return NextResponse.json(
        { success: false, error: "Facebook token expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to publish Facebook post" },
      { status: 500 }
    );
  }
}
