import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";
import { NextResponse } from "next/server";

const normalizeBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

export async function GET() {
  try {
    await dbConnect();
    await CityServicePage.updateMany(
      { allowIndex: { $exists: false } },
      { $set: { allowIndex: true } },
      { strict: false }
    );
    const pages = await CityServicePage.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const page = await CityServicePage.create({
      ...body,
      allowIndex: normalizeBoolean(body.allowIndex, true),
    });
    return NextResponse.json({ success: true, data: page }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
