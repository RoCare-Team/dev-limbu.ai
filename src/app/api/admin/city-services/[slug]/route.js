import dbConnect from "@/lib/dbConnect";
import CityServicePage from "@/models/CityServicePage";
import { NextResponse } from "next/server";

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const normalizeBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

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
    const update = { ...body };

    if (hasOwn(update, "allowIndex")) {
      update.allowIndex = normalizeBoolean(update.allowIndex, true);
    }

    if (hasOwn(update, "isActive")) {
      update.isActive = normalizeBoolean(update.isActive, true);
    }

    const page = await CityServicePage.findOneAndUpdate({ citySlug: slug }, { $set: update }, {
      new: true,
      runValidators: true,
      strict: false,
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
