import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import { upsertPublishSite, slugifyFromBusiness } from "@/lib/saveSiteUpsert";

export async function POST(req) {
  try {
    const body = await req.json();
    const result = await upsertPublishSite(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, site: result.site }, { status: 200 });
  } catch (error) {
    console.error("Save Site Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      id,
      userId,
      business,
      aiContent,
      mediaImages,
      locationId,
      slug,
      customDomain,
      isPublished,
      type,
    } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: "id and userId are required to update a site." },
        { status: 400 }
      );
    }

    const site = await Site.findOne({ _id: id, userId });
    if (!site) {
      return NextResponse.json(
        { error: "Site not found for this user." },
        { status: 404 }
      );
    }

    if (business) {
      if (!business?.phoneNumbers?.primaryPhone && !business?.primaryPhone) {
        return NextResponse.json(
          {
            error:
              "A primary phone number is required in your Google Business Profile to publish a website.",
          },
          { status: 400 }
        );
      }
      site.business = business;
    }

    if (aiContent) {
      site.aiContent = aiContent;
    }

    if (Array.isArray(mediaImages)) {
      site.mediaImages = mediaImages;
    }

    if (typeof locationId === "string") {
      site.locationId = locationId;
    }

    if (typeof customDomain === "string") {
      site.customDomain = customDomain.trim() || undefined;
    }

    if (typeof isPublished === "boolean") {
      site.isPublished = isPublished;
    }

    if (typeof type === "string" && type.trim()) {
      site.type = type.trim();
    }

    if (typeof slug === "string" && slug.trim()) {
      const normalizedSlug = slugifyFromBusiness({ title: slug, locality: "" });
      if (normalizedSlug && normalizedSlug !== site.slug) {
        const conflict = await Site.findOne({ slug: normalizedSlug, _id: { $ne: site._id } });
        if (conflict) {
          return NextResponse.json(
            { error: "Slug is already taken. Please choose a different slug." },
            { status: 409 }
          );
        }
        site.slug = normalizedSlug;
      }
    }

    site.updatedAt = new Date();
    await site.save();

    return NextResponse.json({ success: true, site }, { status: 200 });
  } catch (error) {
    console.error("Update Site Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
