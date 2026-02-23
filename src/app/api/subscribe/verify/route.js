// app/api/subscribe/verify/route.js

import crypto from "crypto";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

function generateAppleJWT() {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: process.env.APPLE_ISSUER_ID,
      iat: now,
      exp: now + 60 * 20,
      aud: "appstoreconnect-v1",
      bid: process.env.APPLE_BUNDLE_ID,
    },
    process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    {
      algorithm: "ES256",
      header: { kid: process.env.APPLE_KEY_ID },
    }
  );
}

export async function POST(req) {
  await dbConnect();

  try {
    const { userId, plan, payment, platform, transactionId } =
      await req.json();

    if (!userId || !plan) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing fields" }),
        { status: 400 }
      );
    }

    // 🔥 Default Android if platform not sent
    const platformType = platform || "android";

    // =========================================================
    // 🍏 iOS VERIFICATION
    // =========================================================
    if (platformType === "ios") {
      if (!transactionId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing transactionId" }),
          { status: 400 }
        );
      }

      const appleJWT = generateAppleJWT();

      let response = await fetch(
        `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${appleJWT}` },
        }
      );

      if (!response.ok) {
        response = await fetch(
          `https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/${transactionId}`,
          {
            headers: { Authorization: `Bearer ${appleJWT}` },
          }
        );
      }

      const appleData = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid Apple transaction" }),
          { status: 400 }
        );
      }

      if (
        appleData.bundleId?.trim() !==
        process.env.APPLE_BUNDLE_ID?.trim()
      ) {
        return new Response(
          JSON.stringify({ success: false, error: "Bundle ID mismatch" }),
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 💳 ANDROID Razorpay (Default Flow — unchanged)
    // =========================================================
    if (platformType === "android") {
      if (!payment) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing payment data" }),
          { status: 400 }
        );
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        payment;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing payment info" }),
          { status: 400 }
        );
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid signature" }),
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 🔥 COMMON SUBSCRIPTION UPDATE (Same as before)
    // =========================================================

    const user = await User.findOne({ userId });

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404 }
      );
    }

    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + 3);

    user.subscription = {
      plan,
      paymentId:
        platformType === "ios"
          ? transactionId
          : payment?.razorpay_payment_id,
      orderId:
        platformType === "ios"
          ? transactionId
          : payment?.razorpay_order_id,
      date: purchaseDate,
      expiry: expiryDate,
      status: "active",
    };

    await user.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and plan activated",
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Verification failed",
      }),
      { status: 500 }
    );
  }
}