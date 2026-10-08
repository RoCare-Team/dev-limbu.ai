import dbConnect from "@/lib/dbConnect";
import HomeData from "@/models/HomeData";
import {
  expandPricingLandingForApi,
  expandPlanArrayForApi,
  mergePricingLanding,
} from "@/lib/pricingLandingDefaults";
import {
  expandSubscriptionPlansForApi,
  getSubscriptionPlansPayloadForExpand,
} from "@/lib/subscriptionPlansApi";
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
  const forCheckout = searchParams.get("checkout") === "1";

  if (type) {
    if (type === "pricingLanding") {
      const doc = await HomeData.findOne({ type: "pricingLanding" }).lean();
      const merged = mergePricingLanding(doc);
      const data = expandPricingLandingForApi(merged, {
        applyChatbotPriceDiscount: !forCheckout,
      });
      if (!doc) {
        return NextResponse.json({ type: "pricingLanding", data });
      }
      return NextResponse.json({ ...doc, data });
    }

    // Social media plans have no stored doc of their own, unlike seoPlans /
    // webDevelopmentPlans, so a plain lookup returned null. Serve them from the
    // same catalog /checkout uses — with planKey and purchase links — and merge
    // a saved doc over the top if one is ever created.
    if (type === "socialMediaPlans") {
      const doc = await HomeData.findOne({ type: "socialMediaPlans" }).lean();
      const data = expandPlanArrayForApi("socialMediaPlans", doc, {
        applyChatbotPriceDiscount: !forCheckout,
      });
      return NextResponse.json({ ...(doc || {}), type: "socialMediaPlans", data });
    }

    if (type === "subscriptionPlans") {
      const doc = await HomeData.findOne({ type: "subscriptionPlans" }).lean();
      if (!doc) {
        return NextResponse.json(null);
      }
      const payload = getSubscriptionPlansPayloadForExpand(doc);
      const expanded = expandSubscriptionPlansForApi(
        payload ?? doc.data ?? {},
      );
      return NextResponse.json({ ...doc, data: expanded });
    }

    const data = await HomeData.findOne({ type });
    return NextResponse.json(data);
  }

  const allData = await HomeData.find({}).lean();

  const expanded = allData.map((doc) => {
    if (doc.type === "pricingLanding") {
      const merged = mergePricingLanding(doc);
      return { ...doc, data: expandPricingLandingForApi(merged) };
    }
    if (doc.type === "subscriptionPlans") {
      const payload = getSubscriptionPlansPayloadForExpand(doc);
      const expanded = expandSubscriptionPlansForApi(
        payload ?? doc.data ?? {},
      );
      return { ...doc, data: expanded };
    }
    return doc;
  });

  return NextResponse.json(expanded);
}
