import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";

/* -------------------- SCHEMA (INLINE) -------------------- */
const KeywordSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: "google",
    },
  },
  { timestamps: true }
);

// Prevent duplicate keyword per user
KeywordSchema.index({ userId: 1, keyword: 1 }, { unique: true });

const Keyword =
  mongoose.models.Keyword || mongoose.model("Keyword", KeywordSchema);

/* -------------------- GET --------------------
   ?query=RO Care   → Google related keywords
   ?userId=xxxx     → Fetch user keywords
------------------------------------------------ */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const userId = searchParams.get("userId");

    /* -------- FETCH USER SAVED KEYWORDS -------- */
    if (userId) {
      const saved = await Keyword.find({ userId }).sort({
        createdAt: -1,
      });

      return NextResponse.json({
        success: true,
        data: saved,
      });
    }

    return NextResponse.json(
      { error: "query or userId required" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* -------------------- POST --------------------
   Add keyword (user-wise)
------------------------------------------------ */
export async function POST(req) {
  try {
    await dbConnect();
    const { userId, keyword } = await req.json();

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
    });

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Keyword already added" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/* -------------------- DELETE --------------------
   Delete keyword by _id
   ?id=KEYWORD_ID
------------------------------------------------ */
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
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
