import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";

/**
 * GET /api/get-site?slug=example
 * Retrieves a published website by slug
 * 
 * Query parameters:
 * - slug (required): The unique slug identifier
 * 
 * Returns: Site data including business, aiContent, and mediaImages
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    // Validate slug parameter
    if (!slug) {
      return NextResponse.json(
        { error: "Missing required parameter: slug" },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug format" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the site and only return if it's published
    const site = await Site.findOne({
      slug: slug.toLowerCase(),
      isPublished: true,
    }).select("-_id slug userId business aiContent mediaImages metadata customDomain createdAt updatedAt");

    if (!site) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 }
      );
    }

    // Update view count asynchronously (non-blocking)
    Site.updateOne(
      { _id: site._id },
      {
        $inc: { "analytics.views": 1 },
        "analytics.lastVisited": new Date(),
      }
    ).catch((err) => console.error("Error updating analytics:", err));

    // Set cache headers for better performance
    // Cache for 5 minutes, but revalidate if stale
    const response = NextResponse.json(site);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { error: "Failed to retrieve website" },
      { status: 500 }
    );
  }
}
