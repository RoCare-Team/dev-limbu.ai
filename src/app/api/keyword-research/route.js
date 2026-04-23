import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";

/* -------------------- SCHEMA -------------------- */
const KeywordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true, trim: true },
    source: { type: String, default: "google" },
    volume: { type: Number },
    competition: { type: String },
  },
  { timestamps: true }
);

KeywordSchema.index({ userId: 1, keyword: 1 }, { unique: true });

const Keyword =
  mongoose.models.Keyword || mongoose.model("Keyword", KeywordSchema);

/* -------------------- GET -------------------- */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const userId = searchParams.get("userId");

    /* 🔹 USER SAVED KEYWORDS */
    if (userId) {
      const saved = await Keyword.find({ userId }).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, data: saved });
    }

    /* 🔹 FIND RELATED KEYWORDS (n8n) */
    if (query) {
      const res = await fetch(
        "https://n8n.limbutech.in/webhook/4dc0fc39-0e04-4d74-a189-1c4f09bd6894",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: query }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch keywords from n8n");
      }

      const data = await res.json();

      return NextResponse.json({
        success: true,
        source: "n8n",
        keyword: query,
        data,
      });
    }

    return NextResponse.json(
      { error: "query or userId required" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* -------------------- POST -------------------- */
export async function POST(req) {
  try {
    await dbConnect();
    const { userId, keyword, volume, competition } = await req.json();

    if (!userId || !keyword) {
      return NextResponse.json(
        { error: "userId and keyword are required" },
        { status: 400 }
      );
    }

    const saved = await Keyword.create({
      userId,
      keyword,
      source: "google",
      volume,
      competition,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Keyword already added" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* -------------------- DELETE -------------------- */
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "keyword id is required" },
        { status: 400 }
      );
    }

    await Keyword.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Keyword deleted successfully",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
