import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { userId, plan, payment, platform, transactionId, productId, purchaseToken } = body;

    if (platform === "ios") {
      if (!userId || !transactionId || !productId || !purchaseToken) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }

      const appleResponse = await fetch(
        "https://buy.itunes.apple.com/verifyReceipt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "receipt-data": purchaseToken,
            password: "975f34f776394c3ca0ebc58007ba98e4",
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
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid receipt",
            appleStatus: appleData.status,
          },
          { status: 400 }
        );
      }
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payment || {};

    // ✅ Validate required fields
    if (!userId || !plan || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required payment info" }),
        { status: 400 }
      );
    }

    // ✅ Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_SECRET;
    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { status: 400 }
      );
    }

    // ✅ Fetch existing user
    const user = await User.findById(userId);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404 }
      );
    }

    // ✅ Calculate subscription validity
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1); // 1-month validity

    // ✅ Update subscription details
    user.subscription = {
      plan,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      date: startDate,
      expiry: expiryDate,
      status: "active",
      maxAccounts: plan === "premium" ? 10 : 3, // Example rule
    };

    await user.save({ validateBeforeSave: true });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription activated successfully",
        subscription: user.subscription,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
