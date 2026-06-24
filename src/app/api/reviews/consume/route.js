import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ReviewPool from "@/models/ReviewPool";
import { generateReviews } from "@/lib/reviewGenerationApi";

/* -------------------- POST: rotate a copied review so it never repeats -------------------- */
export async function POST(req) {
  try {
    await dbConnect();

    const { slug, key } = await req.json();

    if (!slug || !key) {
      return NextResponse.json(
        { error: "slug and key are required" },
        { status: 400 }
      );
    }

    // Only keyword-based reviews are persisted. Generic (review_1/review_2)
    // reviews aren't saved — they regenerate on every load — so there is
    // nothing to rotate here. No-op success.
    const pool = await ReviewPool.findOne({ slug: slug.trim() });
    if (!pool) {
      return NextResponse.json({ success: true, rotated: false });
    }

    const idx = pool.reviews.findIndex((r) => r.key === key);
    if (idx === -1) {
      return NextResponse.json({ success: true, rotated: false });
    }

    // Re-generate this single keyword and replace its text so it never repeats.
    const { reviews } = await generateReviews({
      businessName: pool.business_name,
      keywords: [key],
    });

    const replacement = reviews.find((r) => r.key === key) || reviews[0];

    if (replacement?.text) {
      pool.reviews[idx].text = replacement.text;
      pool.lastSyncedAt = new Date();
      await pool.save();
    }

    return NextResponse.json({ success: true, rotated: Boolean(replacement?.text) });
  } catch (err) {
    console.error("Review consume error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
