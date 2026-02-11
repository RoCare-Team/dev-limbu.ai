import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import { getServerSession } from "next-auth/next";

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

    // Save or update site
    const site = await Site.findOneAndUpdate(
      { slug: siteData.slug },
      siteData,
      { upsert: true, new: true, runValidators: true }
    );

    if (!site) {
      return NextResponse.json(
        { error: "Failed to save site" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        site: {
          id: site._id,
          slug: site.slug,
          url: `https://${site.slug}.limbu.ai`,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
        },
      },
      { status: 201 }
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
