import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import {
  FEATURES,
  buildFeatureList,
  getFeatureAccessPrice,
  getPlanState,
  isValidFeature,
} from "@/lib/featureAccess";

export const dynamic = "force-dynamic";

/**
 * GET /api/feature-access?userId=USR123
 *
 * What the app needs to paint the GBP tiles: the user's plan, wallet, the
 * per-open charge and, per feature, whether it is locked and affordable.
 * This only REPORTS — nothing is charged here.
 */
export async function GET(req) {
  try {
    await dbConnect();

    const userId = (new URL(req.url).searchParams.get("userId") || "").trim();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ userId })
      .select("userId fullName wallet paidPackage packageExpiryDate")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const price = await getFeatureAccessPrice();
    const plan = getPlanState(user);
    const wallet = Number(user.wallet) || 0;

    return NextResponse.json({
      success: true,
      userId: user.userId,
      wallet,
      plan,
      chargePerAccess: price,
      features: buildFeatureList({ plan, wallet, price }),
    });
  } catch (error) {
    console.error("feature-access GET error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/feature-access   body: { userId, feature }
 *
 * Call this the moment the user opens one of the GBP tools. With a running
 * plan it grants access free; otherwise it deducts the per-open charge and
 * writes a wallet transaction.
 *
 * 402 means the wallet is short — the app should send the user to recharge.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const userId = (body.userId || "").trim();
    const feature = (body.feature || "").trim();

    if (!userId || !feature) {
      return NextResponse.json(
        { success: false, message: "userId and feature are required" },
        { status: 400 },
      );
    }

    if (!isValidFeature(feature)) {
      return NextResponse.json(
        {
          success: false,
          message: `Unknown feature "${feature}"`,
          features: FEATURES.map((f) => f.key),
        },
        { status: 400 },
      );
    }

    const user = await User.findOne({ userId })
      .select("userId wallet paidPackage packageExpiryDate")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const plan = getPlanState(user);

    // Plan holders pay nothing.
    if (plan.active) {
      return NextResponse.json({
        success: true,
        access: "granted",
        via: "plan",
        charged: 0,
        wallet: Number(user.wallet) || 0,
        plan,
      });
    }

    const price = await getFeatureAccessPrice();
    const wallet = Number(user.wallet) || 0;

    if (price > 0 && wallet < price) {
      return NextResponse.json(
        {
          success: false,
          access: "denied",
          message: "Insufficient balance",
          required: price,
          wallet,
          shortBy: price - wallet,
        },
        { status: 402 },
      );
    }

    // Deduct and re-check the balance in one atomic step, so two taps landing
    // together can never spend the same coins twice.
    const updated =
      price > 0
        ? await User.findOneAndUpdate(
            { userId, wallet: { $gte: price } },
            { $inc: { wallet: -price } },
            { new: true, projection: { wallet: 1 } },
          )
        : { wallet };

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          access: "denied",
          message: "Insufficient balance",
          required: price,
          wallet,
        },
        { status: 402 },
      );
    }

    const balanceAfter = Number(updated.wallet) || 0;

    let transactionId = null;
    if (price > 0) {
      const txn = await Transaction.create({
        userId,
        type: "debit",
        amount: price,
        balanceAfter,
        reason: "feature_access",
        metadata: { feature, source: "app_feature_access" },
      });
      transactionId = String(txn._id);
    }

    return NextResponse.json({
      success: true,
      access: "granted",
      via: "coins",
      feature,
      charged: price,
      wallet: balanceAfter,
      transactionId,
      plan,
    });
  } catch (error) {
    console.error("feature-access POST error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
