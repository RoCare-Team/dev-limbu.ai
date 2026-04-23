import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    console.log("Fetching site with slug:", slug);

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const site = await Site.findOne({ slug });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site, { status: 200 });
  } catch (error) {
    console.error("Get Site Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}