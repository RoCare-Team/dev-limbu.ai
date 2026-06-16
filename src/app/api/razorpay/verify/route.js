// app/api/razorpay/verify/route.js

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();

    // ── iOS in-app purchase (unchanged) ───────────────────────────────────
    if (body.platform === "ios") {
      const { userId, transactionId, productId, purchaseToken } = body;

      if (!userId || !transactionId || !productId || !purchaseToken) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }

      const appleResponse = await fetch(
        "https://buy.itunes.apple.com/verifyReceipt",
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "receipt-data": purchaseToken,
            password: process.env.APPLE_IAP_SHARED_SECRET,
          }),
        }
      );

      const appleData = await appleResponse.json();

      if (appleData.status === 0) {
        return NextResponse.json({
          success: true,
          message: "Wallet credited successfully",
          appleData,
        });
      }

      return NextResponse.json(
        { success: false, message: "Invalid receipt", appleStatus: appleData.status },
        { status: 400 }
      );
    }

    // ── Razorpay web payment ──────────────────────────────────────────────
    const { userId, plan, payment } = body;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payment || {};

    // Validate required fields
    if (!userId || !plan || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment info" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Find user — supports both ObjectId (_id) and custom userId field
    const user =
      (await User.findById(userId).catch(() => null)) ||
      (await User.findOne({ userId }));

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Map plan name → maxAccounts
    const maxAccountsMap = {
      "Basic Plan":        3,
      "Professional Plan": 6,
      "Premium Plan":      10,
    };

    // Calculate validity (1 month per billing cycle by default)
    const startDate  = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Activate subscription
    user.subscription = {
      plan,
      paymentId:   razorpay_payment_id,
      orderId:     razorpay_order_id,
      date:        startDate,
      expiry:      expiryDate,
      status:      "active",
      accounts:    user.subscription?.accounts ?? [],
      maxAccounts: maxAccountsMap[plan] ?? 3,
    };

    await user.save({ validateBeforeSave: true });

    return NextResponse.json(
      {
        success:      true,
        message:      "Subscription activated successfully",
        subscription: user.subscription,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}