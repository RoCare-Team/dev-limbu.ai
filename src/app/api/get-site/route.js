import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const checkOnly = searchParams.get("checkOnly"); // New parameter to just check existence

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const site = await Site.findOne({ slug });

    // If checking for existence only (used during website creation)
    if (checkOnly === "true") {
      if (site) {
        return NextResponse.json({ 
          exists: true, 
          message: "Slug already exists in database. A new unique slug will be generated automatically.",
          existingSite: {
            slug: site.slug,
            businessTitle: site.business?.title || "Unknown"
          }
        }, { status: 200 });
      } else {
        return NextResponse.json({ 
          exists: false, 
          message: "Slug is available" 
        }, { status: 200 });
      }
    }

    // Normal get operation
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site, { status: 200 });
  } catch (error) {
    console.error("Get Site Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
