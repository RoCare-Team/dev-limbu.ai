import dbConnect from "@/lib/dbConnect";
import HomeSection from "@/models/HomeSection";
import { validateSection } from "@/lib/homeSections/validation";
import { ok, fail, requireAdmin, readJson } from "@/lib/homeSections/server";

/** ADMIN — GET /api/admin/home-sections/:key */
export async function GET(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { key } = await params;
    await dbConnect();
    const doc = await HomeSection.findOne({ key }).lean();
    if (!doc) return fail(404, "Section not found");
    return ok(doc);
  } catch (err) {
    console.error("GET /api/admin/home-sections/:key error:", err);
    return fail(500, "Unable to fetch home section");
  }
}

/** ADMIN — PUT /api/admin/home-sections/:key (replace whole section incl. items) */
export async function PUT(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { key } = await params;
    const body = { ...((await readJson(req)) || {}), key };
    const errors = validateSection(body);
    if (errors.length) return fail(400, "Validation failed", errors);

    await dbConnect();
    const doc = await HomeSection.findOneAndUpdate({ key }, body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return fail(404, "Section not found");
    return ok(doc, "Section updated");
  } catch (err) {
    console.error("PUT /api/admin/home-sections/:key error:", err);
    return fail(500, "Unable to update home section");
  }
}

/** ADMIN — DELETE /api/admin/home-sections/:key */
export async function DELETE(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { key } = await params;
    await dbConnect();
    const doc = await HomeSection.findOneAndDelete({ key });
    if (!doc) return fail(404, "Section not found");
    return ok({ key: doc.key }, "Section deleted");
  } catch (err) {
    console.error("DELETE /api/admin/home-sections/:key error:", err);
    return fail(500, "Unable to delete home section");
  }
}
