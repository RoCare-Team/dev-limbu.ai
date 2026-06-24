import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import ReviewPool from "@/models/ReviewPool";
import { generateReviews } from "@/lib/reviewGenerationApi";

/* Re-declare the Keyword model so this route can read saved keywords by slug.
   Guarded by mongoose.models so it reuses the model registered elsewhere. */
const KeywordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    source: { type: String, default: "google" },
    volume: { type: Number },
    competition: { type: String },
  },
  { timestamps: true }
);

const Keyword =
  mongoose.models.Keyword || mongoose.model("Keyword", KeywordSchema);

/* -------------------- GET: fetch (and lazily generate) the review pool -------------------- */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get("slug") || "").trim();
    const businessName = (searchParams.get("business_name") || "").trim();

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    // Gather all real keywords saved for this business slug
    const keywordDocs = await Keyword.find({ slug }).select("keyword").lean();
    const keywords = keywordDocs
      .map((k) => (k.keyword || "").trim())
      .filter(Boolean);

    /* CASE 1 — NO real keywords:
       Always call the webhook (generic review_1/review_2) and DO NOT persist.
       These stay fresh on every load, so nothing to rotate. */
    if (!keywords.length) {
      const { businessName: bn, reviews } = await generateReviews({
        businessName,
        keywords: [],
      });

      if (!reviews.length) {
        return NextResponse.json(
          { error: "No reviews were generated" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        business_name: businessName || bn,
        reviews,
        persisted: false,
      });
    }

    /* CASE 2 — REAL keywords exist:
       Persist in DB. Reuse the saved pool ONLY if its keys exactly match the
       current keyword set (so a stale/generic pool gets regenerated). */
    const existing = await ReviewPool.findOne({ slug });
    const keywordSet = new Set(keywords);
    const existingKeys = Array.isArray(existing?.reviews)
      ? existing.reviews.map((r) => r.key)
      : [];
    const keysMatch =
      existing &&
      existingKeys.length === keywordSet.size &&
      existingKeys.every((k) => keywordSet.has(k));

    if (keysMatch && existing.reviews.length) {
      return NextResponse.json({
        success: true,
        business_name: existing.business_name,
        reviews: existing.reviews,
        persisted: true,
      });
    }

    const resolvedBusinessName = businessName || existing?.business_name || "";

    const { businessName: bn, reviews } = await generateReviews({
      businessName: resolvedBusinessName,
      keywords,
    });

    if (!reviews.length) {
      return NextResponse.json(
        { error: "No reviews were generated" },
        { status: 502 }
      );
    }

    const saved = await ReviewPool.findOneAndUpdate(
      { slug },
      {
        slug,
        business_name: resolvedBusinessName || bn,
        reviews,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      business_name: saved.business_name,
      reviews: saved.reviews,
      persisted: true,
    });
  } catch (err) {
    console.error("Review pool error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
