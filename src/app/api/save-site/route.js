import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import User from "@/models/User";

function slugifyFromBusiness(business) {
  const title = business?.title || "";
  const locality = business?.locality || "";

  return [title, locality]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { slug, business, aiContent, mediaImages, userId, locationId } = body;

    if (!business || !aiContent) {
      return NextResponse.json(
        { error: "Business and AI content are required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to publish a website." },
        { status: 400 }
      );
    }

    // Always derive base slug from business name + locality (ignore address)
    const baseSlug = slugifyFromBusiness(business);
    if (!baseSlug) {
      return NextResponse.json(
        { error: "Unable to generate slug from business name and locality." },
        { status: 400 }
      );
    }

    // Check if this is an update of an existing site (same location or same slug for this user)
    let existingSite = null;
    if (locationId) {
      existingSite = await Site.findOne({ userId, locationId });
    }
    if (!existingSite) {
      existingSite = await Site.findOne({ userId, slug: baseSlug });
    }

    // If updating an existing site, just overwrite it (no website count check)
    if (existingSite) {
      existingSite.business = business;
      existingSite.aiContent = aiContent;
      existingSite.mediaImages = mediaImages || [];
      existingSite.isPublished = true;
      existingSite.updatedAt = new Date();
      if (locationId) {
        existingSite.locationId = locationId;
      }
      await existingSite.save();

      return NextResponse.json(
        { success: true, site: existingSite },
        { status: 200 }
      );
    }

    // New site: enforce plan-based website limits
    const user = await User.findOne({ userId }).select(
      "paidPackage packageExpiryDate"
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 404 }
      );
    }

    const hasPaidPackage = !!user.paidPackage;
    const maxWebsites = hasPaidPackage ? 5 : 2;

    const currentSiteCount = await Site.countDocuments({ userId });
    if (currentSiteCount >= maxWebsites) {
      const message = hasPaidPackage
        ? "You have reached your website limit for this plan (maximum 5 sites). Please upgrade your plan to create more websites."
        : "Aapke free plan mein sirf 2 websites allowed hain. Nayi website publish karne ke liye pehle apna plan upgrade karein.";

      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Ensure unique slug — append -1, -2, ... if needed
    let finalSlug = baseSlug;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const conflict = await Site.findOne({ slug: finalSlug });
      if (!conflict) break;
      finalSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const site = await Site.create({
      slug: finalSlug,
      business,
      aiContent,
      mediaImages: mediaImages || [],
      userId,
      locationId,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, site }, { status: 200 });
  } catch (error) {
    console.error("Save Site Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}