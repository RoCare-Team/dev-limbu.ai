import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { slug } = await params;
  try {
    await dbConnect();
    const page = await CityServicePage.findOne({ citySlug: slug, isActive: true });
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
