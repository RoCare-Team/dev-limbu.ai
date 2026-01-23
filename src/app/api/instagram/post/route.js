import axios from "axios";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";

/* =====================================================
   InstagramPost SCHEMA
===================================================== */
const InstagramPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    igUserId: {
      type: String,
      required: true,
      index: true,
    },

    instagramPostId: {
      type: String,
    },

    caption: {
      type: String,
    },

    imageUrl: {
      type: String,
      required: true,
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

const InstagramPost =
  mongoose.models.InstagramPost ||
  mongoose.model("InstagramPost", InstagramPostSchema);

/* =====================================================
   POST API
===================================================== */
export async function POST(req) {
  let userId = "";
  let igUserId = "";
  let caption = "";
  let imageUrl = "";

  try {
    await dbConnect();

    const body = await req.json();

    userId = body.userId;
    igUserId = body.igUserId;
    caption = body.caption || "";
    imageUrl = body.imageUrl;
    const accessToken = body.accessToken;

    // ---------------- Validation ----------------
    if (!userId || !igUserId || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "userId, igUserId and accessToken are required",
        },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "imageUrl is required for Instagram post" },
        { status: 400 }
      );
    }

    if (!imageUrl.startsWith("http")) {
      return NextResponse.json(
        { success: false, error: "imageUrl must be a public URL" },
        { status: 400 }
      );
    }

    /* =====================================================
       STEP 1: Create Media Container
    ===================================================== */
    const mediaRes = await axios.post(
      `https://graph.facebook.com/v24.0/${igUserId}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }
    );

    if (!mediaRes.data?.id) {
      throw new Error(
        mediaRes.data?.error?.message ||
          "Failed to create Instagram media container"
      );
    }

    // Instagram needs processing time
    await new Promise((resolve) => setTimeout(resolve, 4000));

    /* =====================================================
       STEP 2: Publish Media Container
    ===================================================== */
    const publishRes = await axios.post(
      `https://graph.facebook.com/v24.0/${igUserId}/media_publish`,
      {
        creation_id: mediaRes.data.id,
        access_token: accessToken,
      }
    );

    if (!publishRes.data?.id) {
      throw new Error(
        publishRes.data?.error?.message ||
          "Failed to publish Instagram post"
      );
    }

    const instagramPostId = publishRes.data.id;

    // ---------------- SAVE POST ----------------
    await InstagramPost.create({
      userId,
      igUserId,
      instagramPostId,
      caption,
      imageUrl,
      status: "posted",
    });

    return NextResponse.json({
      success: true,
      instagramPostId,
    });

  } catch (error) {
    console.error(
      "Instagram API Error:",
      error.response?.data || error.message
    );

    if (userId && igUserId) {
      await InstagramPost.create({
        userId,
        igUserId,
        caption,
        imageUrl,
        status: "failed",
        errorMessage: error.message,
      });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Instagram post failed" },
      { status: 500 }
    );
  }
}
