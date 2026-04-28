import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { slug } = await params;
  try {
    await dbConnect();
    const page = await CityServicePage.findOne({ citySlug: slug });
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  const { slug } = await params;
  try {
    await dbConnect();
    const body = await req.json();
    const page = await CityServicePage.findOneAndUpdate({ citySlug: slug }, body, {
      new: true,
      runValidators: true,
    });
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const { slug } = await params;
  try {
    await dbConnect();
    const deletedPage = await CityServicePage.findOneAndDelete({ citySlug: slug });
    if (!deletedPage) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
