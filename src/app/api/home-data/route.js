import dbConnect from "@/lib/dbConnect";
import HomeData from "@/models/HomeData";
import {
  expandPricingLandingForApi,
  mergePricingLanding,
} from "@/lib/pricingLandingDefaults";
import { NextResponse } from "next/server";

/* ===== SAVE / UPDATE DATA ===== */
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "type and data are required" },
        { status: 400 }
      );
    }

    const saved = await HomeData.findOneAndUpdate(
      { type },
      { data },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `${type} saved successfully`,
      saved,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

/* ===== GET DATA ===== */
export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type) {
    if (type === "pricingLanding") {
      const doc = await HomeData.findOne({ type: "pricingLanding" }).lean();
      const merged = mergePricingLanding(doc);
      const data = expandPricingLandingForApi(merged);
      if (!doc) {
        return NextResponse.json({ type: "pricingLanding", data });
      }
      return NextResponse.json({ ...doc, data });
    }

    const data = await HomeData.findOne({ type });
    return NextResponse.json(data);
  }

  const allData = await HomeData.find({});
  return NextResponse.json(allData);
}
