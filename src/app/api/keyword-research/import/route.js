import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { generateUniversalSlug } from "@/utils/slugify";

export const dynamic = "force-dynamic";

/* -------------------- SCHEMA (same as keyword-research route) -------------------- */
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

KeywordSchema.index({ userId: 1, keyword: 1 }, { unique: true });

const Keyword =
  mongoose.models.Keyword || mongoose.model("Keyword", KeywordSchema);

const normalizeCompetition = (val) => {
  if (val === undefined || val === null || val === "") return undefined;
  const s = String(val).trim().toUpperCase();
  if (["LOW", "MEDIUM", "HIGH"].includes(s)) return s;
  return undefined;
};

const toNumber = (val) => {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseInt(String(val).replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(n) ? undefined : n;
};

/* -------------------- POST: bulk import from Excel/CSV -------------------- */
export async function POST(req) {
  try {
    await dbConnect();
    const { userId, slug: clientSlug, keywords } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: "No keywords found in the file" },
        { status: 400 }
      );
    }

    // Clean + dedup rows within the uploaded file itself
    const seen = new Set();
    const cleaned = [];
    for (const row of keywords) {
      const kw = (row?.keyword ?? "").toString().trim();
      if (!kw) continue;
      const key = kw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      cleaned.push({
        keyword: kw,
        slug: clientSlug || generateUniversalSlug({ title: kw }),
        volume: toNumber(row?.volume),
        competition: normalizeCompetition(row?.competition),
      });
    }

    if (cleaned.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid keywords in the file" },
        { status: 400 }
      );
    }

    // Upsert so existing keywords are skipped (no duplicate-key errors)
    const ops = cleaned.map((k) => ({
      updateOne: {
        filter: { userId, keyword: k.keyword },
        update: {
          $setOnInsert: {
            userId,
            keyword: k.keyword,
            slug: k.slug,
            source: "import",
            volume: k.volume,
            competition: k.competition,
          },
        },
        upsert: true,
      },
    }));

    const result = await Keyword.bulkWrite(ops, { ordered: false });
    const insertedCount = result.upsertedCount || 0;
    const skippedCount = cleaned.length - insertedCount;

    const saved = await Keyword.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: saved,
      imported: insertedCount,
      skipped: skippedCount,
      total: cleaned.length,
    });
  } catch (err) {
    console.error("[keyword-import]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Import failed" },
      { status: 500 }
    );
  }
}
