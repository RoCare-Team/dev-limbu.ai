import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import WebsiteLead from "@/models/WebsiteLead";
import Site from "@/models/Site";

/**
 * POST /api/website-leads
 * Saves a contact-form submission coming from a generated business website.
 * Body: { slug, name, phone, email?, service?, message?, source? }
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      slug,
      name,
      phone,
      email = "",
      service = "",
      message = "",
      source = "website-contact-form",
    } = body ?? {};

    if (!slug || !name || !phone) {
      return NextResponse.json(
        { error: "slug, name and phone are required." },
        { status: 400 }
      );
    }

    // Link the lead to the owning site (best-effort, won't fail if not found)
    let siteId = null;
    let ownerUserId = "";
    let businessName = "";
    try {
      const site = await Site.findOne({ slug }).select("_id userId business");
      if (site) {
        siteId = site._id;
        ownerUserId = site.userId || "";
        businessName = site.business?.title || "";
      }
    } catch {
      /* ignore lookup errors */
    }

    const lead = await WebsiteLead.create({
      slug,
      siteId,
      ownerUserId,
      businessName,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      service: String(service).trim(),
      message: String(message).trim(),
      source,
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error("Save Website Lead Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/website-leads?slug=... | ?userId=...
 * Returns leads for a given site slug or owner user id (newest first).
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const userId = searchParams.get("userId");

    if (!slug && !userId) {
      return NextResponse.json(
        { error: "slug or userId query param is required." },
        { status: 400 }
      );
    }

    const query = {};
    if (slug) query.slug = slug;
    if (userId) query.ownerUserId = userId;

    const leads = await WebsiteLead.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, count: leads.length, leads }, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Website Leads Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
