import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import { getServerSession } from "next-auth/next";

/**
 * GET /api/save-site?slug=...
 * Check if a site with the given slug already exists
 */
export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug parameter" },
        { status: 400 }
      );
    }

    const existingSite = await Site.findOne({ slug: slug.toLowerCase() }).lean();

    if (!existingSite) {
      return NextResponse.json({
        success: true,
        exists: false,
        message: "No site found with this slug",
      });
    }

    // Check if user owns this site
    const isOwner = existingSite.userId === session.user.email;

    return NextResponse.json({
      success: true,
      exists: true,
      isOwner,
      site: isOwner ? {
        id: existingSite._id,
        slug: existingSite.slug,
        url: `https://${existingSite.slug}.limbu.ai`,
        createdAt: existingSite.createdAt,
        updatedAt: existingSite.updatedAt,
      } : null,
    });
  } catch (error) {
    console.error("Error checking site:", error);
    return NextResponse.json(
      { error: "Failed to check site. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/save-site
 * Saves a generated website to the database
 * 
 * Request body:
 * {
 *   slug: string (required) - unique identifier for the site
 *   business: object (required) - business data
 *   aiContent: object (required) - AI-generated content
 *   mediaImages: string[] (required) - array of image URLs
 *   locationId?: string - associated location ID
 *   metadata?: object - SEO metadata
 * }
 */
export async function POST(req) {
  try {
    // Verify user is authenticated
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();

    // Validate required fields
    if (!body.slug || !body.business || !body.aiContent) {
      return NextResponse.json(
        {
          error: "Missing required fields: slug, business, aiContent",
        },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json(
        {
          error:
            "Invalid slug format. Use only lowercase letters, numbers, and hyphens.",
        },
        { status: 400 }
      );
    }

    // Check if slug is reserved
    const reservedSlugs = [
      "api",
      "admin",
      "dashboard",
      "live",
      "build-website",
      "auth",
      "login",
      "signup",
      "profile",
      "settings",
      "www",
      "mail",
      "ftp",
    ];

    if (reservedSlugs.includes(body.slug.toLowerCase())) {
      return NextResponse.json(
        { error: "This slug is reserved and cannot be used." },
        { status: 400 }
      );
    }

    // Check if slug already exists for another user
    const existingSite = await Site.findOne({ slug: body.slug });
    if (existingSite && existingSite.userId !== session.user.email) {
      return NextResponse.json(
        { error: "This slug is already taken." },
        { status: 409 }
      );
    }

    // Prepare site data
    const siteData = {
      slug: body.slug.toLowerCase(),
      userId: session.user.email,
      business: body.business,
      aiContent: body.aiContent,
      mediaImages: body.mediaImages || [],
      locationId: body.locationId || null,
      metadata: {
        title: body.metadata?.title || body.business.title,
        description:
          body.metadata?.description ||
          body.aiContent.about?.content,
        ogImage: body.mediaImages?.[0] || null,
        contactEmail:
          body.metadata?.contactEmail ||
          body.business.phoneNumbers?.primaryPhone,
      },
      isPublished: true,
    };

    // Handle customDomain: set if present, unset if missing to avoid unique index issues
    const updateOp = { $set: siteData };
    if (body.customDomain) {
      updateOp.$set.customDomain = body.customDomain.toLowerCase();
    } else {
      updateOp.$unset = { customDomain: 1 };
    }

    // Save or update site
    const site = await Site.findOneAndUpdate(
      { slug: siteData.slug },
      updateOp,
      { upsert: true, new: true, runValidators: true }
    );

    // Check if this was a new creation or update
    const isNewSite = !existingSite;

    if (!site) {
      return NextResponse.json(
        { error: "Failed to save site" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        isNew: isNewSite,
        message: isNewSite ? "Site created successfully" : "Site updated successfully",
        site: {
          id: site._id,
          slug: site.slug,
          url: `https://${site.slug}.limbu.ai`,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
        },
      },
      { status: isNewSite ? 201 : 200 }
    );
  } catch (error) {
    console.error("Error saving site:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `The ${field} is already taken.` },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { error: `Validation error: ${messages}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save site. Please try again." },
      { status: 500 }
    );
  }
}
