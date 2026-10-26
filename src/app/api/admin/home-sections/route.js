import dbConnect from "@/lib/dbConnect";
import HomeSection from "@/models/HomeSection";
import { validateSection } from "@/lib/homeSections/validation";
import { ok, fail, requireAdmin, readJson, seedIfEmpty } from "@/lib/homeSections/server";

export const dynamic = "force-dynamic";

/** PUBLIC (read-only) — GET /api/admin/home-sections (includes inactive sections/items) */
export async function GET() {
  try {
    await dbConnect();
    await seedIfEmpty();
    const docs = await HomeSection.find().sort({ order: 1 }).lean();
    return ok(docs);
  } catch (err) {
    console.error("GET /api/admin/home-sections error:", err);
    return fail(500, "Unable to fetch home sections");
  }
}

/** ADMIN — POST /api/admin/home-sections (full section body, with items) */
export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await readJson(req);
    const errors = validateSection(body);
    if (errors.length) return fail(400, "Validation failed", errors);

    await dbConnect();
    if (await HomeSection.exists({ key: body.key })) {
      return fail(409, `Section "${body.key}" already exists`);
    }
    const doc = await HomeSection.create(body);
    return ok(doc, "Section created", 201);
  } catch (err) {
    console.error("POST /api/admin/home-sections error:", err);
    return fail(500, "Unable to create home section");
  }
}
