import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";

export async function POST(req) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { slug, business, aiContent, mediaImages, userId, locationId } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Upsert: Update if exists, Create if not
    const site = await Site.findOneAndUpdate(
      { slug },
      {
        slug,
        business,
        aiContent,
        mediaImages,
        userId: userId || "anonymous", // Fallback if session is missing
        locationId,
        isPublished: true,
        updatedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, site }, { status: 200 });
  } catch (error) {
    console.error("Save Site Error:", error);
    // Handle duplicate key error specifically if needed
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}