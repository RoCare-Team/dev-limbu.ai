import dbConnect from "@/lib/dbConnect";
import HomeSection from "@/models/HomeSection";
import { ok, fail, requireAdmin, readJson } from "@/lib/homeSections/server";

/** ADMIN — PATCH /api/admin/home-sections/:key/status  body: { isActive: boolean } */
export async function PATCH(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { key } = await params;
    const isActive = (await readJson(req))?.isActive;
    if (typeof isActive !== "boolean") {
      return fail(400, "isActive (boolean) is required");
    }
    await dbConnect();
    const doc = await HomeSection.findOneAndUpdate({ key }, { isActive }, { new: true });
    if (!doc) return fail(404, "Section not found");
    return ok(doc, "Section status updated");
  } catch (err) {
    console.error("PATCH /api/admin/home-sections/:key/status error:", err);
    return fail(500, "Unable to update section status");
  }
}
