import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import ImageToVideo from "@/models/ImageToVideo";
import Post from "@/models/PostStatus";

// -----------------------------
// SAVE A GENERATED IMAGE→VIDEO (POST)
// Idempotent per (userId, videoUrl): a reload or second tab that saves the same
// render again gets the existing row back instead of creating a duplicate.
// -----------------------------
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, videoUrl, sourceImageUrl, prompt, postId, cost } = body;

    if (!userId || !videoUrl) {
      return NextResponse.json(
        { success: false, error: "userId and videoUrl are required." },
        { status: 400 }
      );
    }

    const existing = await ImageToVideo.findOne({ userId, videoUrl });
    if (existing) {
      return NextResponse.json({ success: true, created: false, data: existing });
    }

    try {
      const record = await ImageToVideo.create({
        userId,
        videoUrl,
        sourceImageUrl: sourceImageUrl || "",
        prompt: prompt || "",
        postId: postId ? String(postId) : null,
        cost: typeof cost === "number" ? cost : 200,
      });
      return NextResponse.json({ success: true, created: true, data: record });
    } catch (err) {
      // Lost a race with a concurrent save of the same video.
      if (err?.code === 11000) {
        const record = await ImageToVideo.findOne({ userId, videoUrl });
        return NextResponse.json({ success: true, created: false, data: record });
      }
      throw err;
    }
  } catch (err) {
    console.error("IMAGE TO VIDEO SAVE ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// -----------------------------
// LIST A USER'S IMAGE→VIDEO RENDERS (GET)
// Each row carries its linked Post (`post`, or null if it was deleted) so the
// page can run the same approve → publish flow as /post-management.
// -----------------------------
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query param is required." },
        { status: 400 }
      );
    }

    const videos = await ImageToVideo.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

    const postIds = videos
      .map((v) => v.postId)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    const posts = postIds.length
      ? await Post.find({ _id: { $in: postIds }, userId }).lean()
      : [];
    const postsById = new Map(posts.map((p) => [String(p._id), p]));

    const data = videos.map((v) => ({
      ...v,
      post: v.postId ? postsById.get(String(v.postId)) || null : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("IMAGE TO VIDEO LIST ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
