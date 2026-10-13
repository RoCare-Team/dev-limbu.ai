import dbConnect from "@/lib/dbConnect";
import HomeSection from "@/models/HomeSection";
import { ok, fail, requireAdmin, readJson } from "@/lib/homeSections/server";

/** ADMIN — PUT /api/admin/home-sections/reorder  body: { keys: ["gbp", "social_media", ...] } */
export async function PUT(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const keys = (await readJson(req))?.keys;
    if (!Array.isArray(keys) || keys.length === 0) {
      return fail(400, "keys (array of section keys) is required");
    }
    await dbConnect();
    await HomeSection.bulkWrite(
      keys.map((key, index) => ({
        updateOne: { filter: { key }, update: { order: index + 1 } },
      }))
    );
    const docs = await HomeSection.find().sort({ order: 1 }).lean();
    return ok(docs, "Sections reordered");
  } catch (err) {
    console.error("PUT /api/admin/home-sections/reorder error:", err);
    return fail(500, "Unable to reorder sections");
  }
}
